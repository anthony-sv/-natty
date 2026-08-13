/**
 * Does every tab strip span its container, and does the page stay put?
 *
 * Separate from the overflow audit because this is the failure that audit
 * cannot see. A `w-fit` `TabsList` parked at the left of a wide page sticks out
 * of nothing and gets cut off by nothing — it passes every numeric check and
 * still reads as a stray pill. It shipped that way on five pages.
 *
 * The rule it enforces is `ScrollingTabsList`'s `w-max min-w-full`: the strip
 * matches its container where the tabs fit, and keeps its natural width and
 * scrolls where they don't. A plain `TabsList` fails here, which is the point —
 * one label translation is all it takes to overflow.
 */
import { launch, requireServer } from "./cdp.mjs";

const BASE = process.env.BASE ?? "http://localhost:5300";
const LOCALE = process.env.LOCALE ?? "es-MX";

const ROUTES = [
  ["progress", "/progress"],
  ["nutrition", "/nutrition"],
  ["calculator", "/calculator"],
  ["plates", "/plates"],
  // Eight weeks: the widest strip in the app, and the one that pushed its own
  // page sideways.
  ["program-8wk", "/routines/cutting-program"],
];

const PROBE = `(() => {
  const list = document.querySelector("[data-slot=tabs-list]");
  if (!list) return { missing: true };
  const box = list.parentElement;
  const strip = Math.round(list.getBoundingClientRect().width);
  const container = Math.round(box.getBoundingClientRect().width);
  return {
    strip,
    container,
    spans: strip >= container - 1,
    scrolls: box.scrollWidth > box.clientWidth + 1,
    pageOverflow:
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
})()`;

await requireServer(BASE);
const browser = await launch({ port: 9336 });
await browser.seed(
  `try { localStorage.setItem("natty.locale.v1", ${JSON.stringify(LOCALE)}); } catch {}`,
);

let failures = 0;

for (const viewport of [
  { name: "phone  ", width: 393, height: 852 },
  { name: "desktop", width: 1280, height: 900 },
]) {
  await browser.setViewport({ ...viewport, scale: 1 });
  for (const [name, path] of ROUTES) {
    await browser.goto(BASE + path);
    const r = await browser.evaluate(PROBE);

    if (r.missing) {
      console.log(`${viewport.name} ${name.padEnd(13)} NO TAB STRIP FOUND`);
      failures++;
      continue;
    }
    const ok = r.spans && r.pageOverflow <= 1;
    if (!ok) failures++;
    const note = r.scrolls ? "scrolls" : "fits";
    console.log(
      `${viewport.name} ${name.padEnd(13)} ${ok ? "ok " : "BAD"}  ` +
        `strip ${String(r.strip).padStart(4)}px / container ${String(r.container).padStart(4)}px  ` +
        `${note}, page +${r.pageOverflow}px`,
    );
  }
}

browser.close();
console.log(failures === 0 ? "\nEvery strip spans its container." : `\n${failures} bad strip(s).`);
process.exit(failures === 0 ? 0 : 1);
