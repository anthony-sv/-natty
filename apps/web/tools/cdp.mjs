/**
 * A minimal Chrome DevTools Protocol driver.
 *
 * **Why not Playwright.** This exists to check layout at phone widths, and the
 * one thing it needs is a viewport the tooling can actually set. The Chrome
 * extension can't resize a maximised window (it reports success and
 * `innerWidth` stays put), which is how a page that scrolled sideways on every
 * screen of a route got signed off as fine. `Emulation.setDeviceMetricsOverride`
 * is what DevTools' own device mode uses, so media queries evaluate at the
 * emulated width and `sm:` means what it means on the phone.
 *
 * No dependencies: Node 22 ships a global `WebSocket`, and CDP is a URL and
 * some JSON. A browser-automation library here would be ~300MB of download to
 * do what a hundred lines already do.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

/** Where Chrome tends to live. `CHROME` overrides all of it. */
const CANDIDATES = [
  process.env.CHROME,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter((path) => path !== undefined);

function chromePath() {
  const found = CANDIDATES.find((path) => existsSync(path));
  if (found === undefined) {
    throw new Error(
      `No Chrome found. Tried:\n  ${CANDIDATES.join("\n  ")}\nSet CHROME=/path/to/chrome.`,
    );
  }
  return found;
}

/**
 * Launch a headless Chrome and attach to its first page.
 *
 * The profile goes to a temp directory rather than the repo: it's a few MB of
 * browser state per run and nothing here wants it kept.
 */
export async function launch({ port = 9333 } = {}) {
  const profile = join(tmpdir(), `natty-audit-${port}`);
  mkdirSync(profile, { recursive: true });

  const chrome = spawn(
    chromePath(),
    [
      `--remote-debugging-port=${port}`,
      "--headless=new",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  chrome.on("error", (error) => {
    console.error("chrome failed to start:", error.message);
    process.exit(1);
  });

  let endpoint;
  for (let attempt = 0; attempt < 60 && endpoint === undefined; attempt++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      endpoint = targets.find((t) => t.type === "page")?.webSocketDebuggerUrl;
    } catch {
      // Not listening yet.
    }
    if (endpoint === undefined) await sleep(250);
  }
  if (endpoint === undefined) throw new Error("Chrome never exposed a page target");

  const socket = new WebSocket(endpoint);
  await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));

  let nextId = 1;
  const pending = new Map();
  /** Page-side errors, cleared per navigation — a blank route usually threw. */
  let problems = [];

  socket.addEventListener("message", (message) => {
    const frame = JSON.parse(message.data);
    if (frame.id !== undefined) {
      const waiter = pending.get(frame.id);
      pending.delete(frame.id);
      if (frame.error) waiter.reject(new Error(JSON.stringify(frame.error)));
      else waiter.resolve(frame.result);
    } else if (frame.method === "Runtime.exceptionThrown") {
      const details = frame.params.exceptionDetails;
      problems.push(`EXC ${String(details.exception?.description ?? details.text).slice(0, 200)}`);
    } else if (frame.method === "Runtime.consoleAPICalled" && frame.params.type === "error") {
      const text = frame.params.args.map((a) => a.value ?? a.description).join(" ");
      problems.push(`ERR ${text.slice(0, 200)}`);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) {
      throw new Error(
        `${exceptionDetails.text} ${exceptionDetails.exception?.description ?? ""}`,
      );
    }
    return result.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");

  return {
    send,
    evaluate,
    problems: () => [...problems],

    setViewport: ({ width, height, scale = 2 }) =>
      send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: scale,
        mobile: width < 700,
      }),

    /**
     * Run `source` before the app's first import on every navigation — which is
     * the only moment localStorage seeding is any use, since the locale store
     * and every collection read at import time.
     */
    seed: (source) => send("Page.addScriptToEvaluateOnNewDocument", { source }),

    /**
     * Navigate and wait for the route to actually paint.
     *
     * A fixed sleep once reported eleven routes as clean that were simply
     * blank, and a blank page overflows nothing. This waits for the *main*
     * element's text to stop growing — the shell's sidebar alone would clear
     * any global character count. Returns 0 if it never rendered.
     */
    async goto(url, { settleMs = 400 } = {}) {
      problems = [];
      await send("Page.navigate", { url });
      // Evaluating straight after navigate can answer from the outgoing page's
      // context, which reads as a permanently blank route.
      await sleep(900);
      let previous = -1;
      for (let attempt = 0; attempt < 40; attempt++) {
        const size = await evaluate(
          `(document.querySelector("main") ?? document.body).innerText.replace(/\\s+/g," ").trim().length`,
        );
        if (size > 60 && size === previous) {
          await sleep(settleMs);
          return size;
        }
        previous = size;
        await sleep(300);
      }
      return previous > 60 ? previous : 0;
    },

    /** Click the first button whose text matches — for panels behind a tab. */
    async clickText(label) {
      const hit = await evaluate(`(() => {
        const wanted = ${JSON.stringify(label)}.toLowerCase();
        const el = [...document.querySelectorAll("button,a")]
          .find((n) => (n.textContent || "").trim().toLowerCase().includes(wanted));
        if (!el) return false;
        el.click();
        return true;
      })()`);
      if (hit) await sleep(700);
      return hit;
    },

    async screenshot(path) {
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
      });
      writeFileSync(path, Buffer.from(shot.data, "base64"));
    },

    close() {
      socket.close();
      chrome.kill();
    },
  };
}

/** Fail early and readably rather than auditing twenty blank pages. */
export async function requireServer(base) {
  try {
    const response = await fetch(base, { signal: AbortSignal.timeout(4000) });
    if (response.ok) return;
  } catch {
    // Falls through to the message below.
  }
  console.error(
    `Nothing serving ${base}.\n\n` +
      `  pnpm --filter web build\n` +
      `  pnpm --filter web preview --port 5300 &\n\n` +
      `Audit the production build, not the dev server: the devtools badge is a ` +
      `56px fixed element that reports as an overflow on every page.`,
  );
  process.exit(1);
}
