/**
 * Walk every route at a phone width and report anything that doesn't fit.
 *
 * Run it against a *production* build (see `requireServer`), and read
 * `tools/README.md` before changing what it measures — most of the rules here
 * exist because a run without them declared a broken page clean.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, requireServer } from "./cdp.mjs";

const BASE = process.env.BASE ?? "http://localhost:5300";
const OUT = process.env.OUT ?? ".audit";
/**
 * The locale to audit in — **es-MX by default, and that is the point.**
 * English is the shortest language the app speaks. `/routines` was clean in
 * English and overflowed its cards by 60px in Spanish, because "8 weeks · 5
 * training days · 2 rest" fits where "ciclo de 7 días · 5 días de
 * entrenamiento · 2 de descanso" does not.
 */
const LOCALE = process.env.LOCALE ?? "es-MX";
/**
 * Findings at or below this are reported and don't fail the run: Base UI's
 * switch thumb and checkbox indicator sit a few px outside their own box by
 * design, and a month abbreviation is wider than the 11px heatmap column it is
 * centred over. Raising this to silence a real finding is the wrong fix.
 */
const NOISE_PX = Number(process.env.NOISE_PX ?? 12);

const VIEWPORTS = [
  { name: "phone", width: 393, height: 852 },
  { name: "desktop", width: 1280, height: 900 },
];

/**
 * Every route, including the parameterised ones and the panels behind a tab.
 *
 * Both of those have already cost a bug. An eight-week program's week strip is
 * the widest thing in the app and pushed its whole page sideways, while the
 * list only had `/routines` and a day page; and the plate picker's ragged grid
 * sat behind a tab the audit never clicked.
 */
const ROUTES = [
  ["index", "/"],
  ["routines", "/routines"],
  ["routines-new", "/routines/new"],
  ["program-8wk", "/routines/cutting-program"],
  ["program-cycle", "/routines/arms-program"],
  ["day", "/routines/bulking-program/week/1/day/1"],
  ["progress-records", "/progress?tab=records"],
  ["progress-volume", "/progress?tab=volume"],
  ["progress-history", "/progress?tab=history"],
  ["progress-library", "/progress?tab=library"],
  ["progress-body", "/progress?tab=body"],
  ["progress-measurements", "/progress?tab=measurements"],
  ["progress-data", "/progress?tab=data"],
  ["nutrition-today", "/nutrition?tab=today"],
  ["nutrition-trends", "/nutrition?tab=trends"],
  ["nutrition-plan", "/nutrition?tab=plan"],
  ["nutrition-macros", "/nutrition?tab=macros"],
  ["nutrition-pantry", "/nutrition?tab=pantry"],
  ["nutrition-new", "/nutrition/new"],
  ["calculator", "/calculator"],
  ["calculator-rpe", "/calculator", "RPE"],
  ["calculator-potential", "/calculator", "potencial"],
  ["plates", "/plates"],
  ["plates-add", "/plates", "Sumar discos"],
  ["about", "/about"],
];

/**
 * A populated app, not an empty one.
 *
 * Empty states are short and wrap beautifully. Tables, charts, heatmaps and
 * logged-set rows only exist once there is data in them, so auditing a fresh
 * install audits the one version of each screen that was never going to break.
 *
 * Written straight to the localStorage keys the collections use, in their
 * `{ [key]: { versionKey, data } }` envelope, because seeding through the UI
 * would be a hundred interactions per run.
 */
function seedScript() {
  const NOW = Date.parse("2026-08-12T18:00:00Z");
  const DAY = 86_400_000;
  const exercises = [
    "flat-barbell-bench-press",
    "lat-pulldown-wide",
    "machine-hip-abduction",
    "barbell-hip-thrust",
    "cable-crossover-mid",
  ];

  const sets = {};
  let n = 0;
  for (let day = 0; day < 40; day++) {
    if (day % 3 === 1) continue; // rest days, so the heatmap has gaps to draw
    exercises.forEach((exerciseId, index) => {
      for (let setNumber = 1; setNumber <= 3; setNumber++) {
        const key = `s${n++}`;
        sets[key] = {
          versionKey: String(n),
          data: {
            id: key,
            performedAt: NOW - day * DAY + setNumber * 60_000,
            exerciseId,
            weight: 40 + index * 15 + ((day * 7 + setNumber) % 5) * 2.5,
            // One lift in pounds, because the app stores units as entered.
            unit: index === 4 ? "lb" : "kg",
            reps: 6 + ((day + setNumber) % 7),
            routineSlug: "bulking-program",
            weekNumber: 1,
            dayNumber: 1,
            setNumber,
          },
        };
      }
    });
  }

  const body = {};
  for (let week = 0; week < 12; week++) {
    const key = `b${week}`;
    body[key] = {
      versionKey: String(week),
      data: {
        id: key,
        measuredAt: NOW - week * 7 * DAY,
        weight: 84.2 - week * 0.3,
        unit: "kg",
        bodyFatPercent: 14 + week * 0.2,
      },
    };
  }

  const seed = {
    "natty.locale.v1": LOCALE,
    "natty.log.v1": JSON.stringify(sets),
    "natty.body.v1": JSON.stringify(body),
    "natty.profile.v1": JSON.stringify({
      heightCm: 179,
      sex: "male",
      wristCm: 18,
      ankleCm: 23,
    }),
  };

  return `try { const seed = ${JSON.stringify(seed)};
    for (const key in seed) localStorage.setItem(key, seed[key]); } catch {}`;
}

/**
 * Three different failures, deliberately kept apart: they look identical in a
 * screenshot and have opposite fixes.
 *
 * - **spill** — past the right edge of the screen. The page is wider than the
 *   device and every screen on the route scrolls sideways.
 * - **clip** — cut off inside a box that offers no way to see the rest.
 * - **escape** — wider than its own parent with nothing clipping it, so it
 *   prints over the neighbour. This is the one you cannot see by measuring the
 *   page, and it is what put a routine's meta line through its card border.
 *
 * Only the innermost offender is reported: an overflowing leaf drags every
 * ancestor over the line, and thirty parents of one bad chip is not a finding.
 */
const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className : "";
    return el.tagName.toLowerCase()
      + (el.dataset.slot ? "[" + el.dataset.slot + "]" : "")
      + (cls ? "." + cls.split(/\\s+/).slice(0, 4).join(".") : "")
      + " :: " + (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 44);
  };

  // Screen-reader-only text is *meant* to be a 1px box with its content hanging
  // out, a closed dialog still measures, and the dev-only devtools badge lives
  // in a bare id-less div appended to body — outside #root and outside the id'd
  // divs Base UI portals into. Together they were most of the first run.
  const appRoots = [...document.body.children].filter((c) => c.id !== "");
  const real = (el, rect) => {
    if (rect.width <= 2 || rect.height <= 2) return false;
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    if (el.closest("[aria-hidden=true],[inert],.sr-only")) return false;
    return appRoots.some((root) => root.contains(el));
  };
  const scrollerAbove = (el) => {
    let node = el.parentElement;
    while (node && node !== document.body) {
      const overflow = getComputedStyle(node).overflowX;
      if (overflow === "auto" || overflow === "scroll") return true;
      node = node.parentElement;
    }
    return false;
  };

  const spills = [], clips = [], escapes = [];
  for (const el of document.querySelectorAll("body *")) {
    const rect = el.getBoundingClientRect();
    if (!real(el, rect)) continue;
    const style = getComputedStyle(el);
    const kids = [...el.children];

    const over = rect.right - vw;
    if (over > 1 && !scrollerAbove(el)
        && !kids.some((c) => c.getBoundingClientRect().right - vw > 1)) {
      spills.push({ px: Math.round(over), el: describe(el) });
    }

    // \`truncate\` and \`line-clamp\` are clips on purpose, and they come with an
    // ellipsis saying so. Flagging them buries the accidental clips — the ones
    // that just stop mid-word — under every deliberately shortened name.
    const truncated =
      style.textOverflow === "ellipsis" || style.webkitLineClamp !== "none";
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && !truncated
        && style.overflowX !== "auto" && style.overflowX !== "scroll"
        && !kids.some((c) => c.scrollWidth > c.clientWidth + 1)) {
      clips.push({ px: Math.round(el.scrollWidth - el.clientWidth), el: describe(el) });
    }

    const parent = el.parentElement;
    if (parent && parent !== document.body
        && style.position !== "absolute" && style.position !== "fixed"
        && getComputedStyle(parent).overflowX === "visible") {
      const pr = parent.getBoundingClientRect();
      const out = Math.max(rect.right - pr.right, pr.left - rect.left);
      const kidWorse = kids.some((c) => {
        const cr = c.getBoundingClientRect();
        return cr.right - rect.right > 1 || rect.left - cr.left > 1;
      });
      if (out > 1 && !kidWorse) escapes.push({ px: Math.round(out), el: describe(el) });
    }
  }

  const worst = (list) => list.sort((a, b) => b.px - a.px).slice(0, 10);
  return {
    vw,
    pageScrollsSideways: Math.round(document.documentElement.scrollWidth - vw),
    spills: worst(spills),
    clips: worst(clips),
    escapes: worst(escapes),
  };
})()`;

await requireServer(BASE);
mkdirSync(OUT, { recursive: true });

const browser = await launch();
await browser.seed(seedScript());

let failures = 0;
const report = {};

for (const viewport of VIEWPORTS) {
  await browser.setViewport(viewport);
  console.log(`\n═══ ${viewport.name} — ${viewport.width}×${viewport.height}, ${LOCALE} ═══`);

  for (const [name, path, click] of ROUTES) {
    const chars = await browser.goto(BASE + path);
    if (chars === 0) {
      console.log(`\n## ${name}  NEVER RENDERED`);
      for (const problem of browser.problems().slice(0, 3)) console.log(`   ${problem}`);
      failures++;
      continue;
    }
    if (click !== undefined && !(await browser.clickText(click))) {
      console.log(`\n## ${name}  no control matching "${click}"`);
      failures++;
      continue;
    }

    const found = await browser.evaluate(PROBE);
    report[`${viewport.name}/${name}`] = found;
    await browser.screenshot(join(OUT, `${viewport.name}-${name}.png`));

    const notable = [
      ...found.spills.map((f) => ({ ...f, kind: "SPILL " })),
      ...found.clips.map((f) => ({ ...f, kind: "CLIP  " })),
      ...found.escapes.map((f) => ({ ...f, kind: "ESCAPE" })),
    ].filter((f) => f.px > NOISE_PX);

    if (found.pageScrollsSideways > 1) failures++;
    failures += notable.length;
    if (notable.length === 0 && found.pageScrollsSideways <= 1) continue;

    console.log(`\n## ${name}   page scrolls sideways by ${found.pageScrollsSideways}px`);
    for (const f of notable) console.log(`   ${f.kind} +${f.px}px  ${f.el}`);
  }
}

writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 1));
browser.close();

console.log(
  failures === 0
    ? `\nNothing over ${NOISE_PX}px. Screenshots in ${OUT}/.`
    : `\n${failures} finding(s) over ${NOISE_PX}px. Screenshots in ${OUT}/.`,
);
process.exit(failures === 0 ? 0 : 1);
