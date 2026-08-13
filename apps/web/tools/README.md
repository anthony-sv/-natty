# Layout checks

Two scripts that drive a headless Chrome at a real phone viewport and report
what doesn't fit. They exist because the app is used on a phone and every bug
listed below shipped.

```bash
pnpm --filter web build
pnpm --filter web preview &   # serves the Nitro build on :5300 (PORT to change)

pnpm --filter web audit:responsive   # overflow across every route
pnpm --filter web audit:tabs         # every tab strip spans its container
```

Both exit non-zero on a finding, take `BASE`, `LOCALE` and (for the audit)
`OUT` and `NOISE_PX` from the environment, and find Chrome themselves — set
`CHROME=/path/to/chrome` if they can't.

## Filling the app with data

```bash
node tools/seed-backup.mjs          # writes natty-seed.json (gitignored)
```

A year of training, weigh-ins, measurements, meals and a couple of things
you'd have written yourself, as a **backup file** — import it at /progress →
Data → Import → Restore everything. It replaces what's there, so export first
if you have real data.

A file rather than localStorage writes (which is what the audit does above),
because it goes in through the app's own import and therefore proves the same
path a real user takes. `seed-backup.test.ts` parses it with `readBackup` and
checks every id resolves, so a seed that the app would refuse fails the build
instead of wasting your afternoon.

## Five things to know before changing them

**Audit a production build, not the dev server.** The TanStack devtools badge is
a 56px fixed element that reports as an overflow on every page, and since the
Start migration the app renders straight into `<body>` — there is no `#root`
div for the probe to scope to, so the badge would be measured like anything
else. A production build has no badge, and is the honest environment anyway.

**Audit in Spanish.** English is the shortest language the app speaks, and a
layout tested only in it is untested. `/routines` was clean in English and
overflowed its cards by 60px in Spanish: "8 weeks · 5 training days · 2 rest"
fits where "ciclo de 7 días · 5 días de entrenamiento · 2 de descanso" does not.

**Audit with data in it.** Empty states are short and wrap beautifully. Tables,
charts, heatmaps and logged-set rows only exist once there is something to
render, so a fresh install shows the one version of each screen that was never
going to break. The audit seeds ~400 sets and a year of weigh-ins straight into
the localStorage keys the collections use.

**Wait for the route to paint.** A fixed sleep once reported eleven routes as
clean that were simply blank, and a blank page overflows nothing. `goto` waits
for the `main` element's text to stop growing and reports `NEVER RENDERED`
rather than passing.

**List every route, including parameterised ones and panels behind a tab.** An
eight-week program's week strip is the widest thing in the app and pushed its
whole page sideways while the list only had `/routines` and a day page; the
plate picker's ragged grid sat behind a tab nothing ever clicked. Route entries
take an optional third element — a control to click after loading.

## What the audit distinguishes

Three failures that look identical in a screenshot and have opposite fixes:

| | what it means | usual fix |
|---|---|---|
| `SPILL` | past the right edge of the screen | stop the page being wider than the device |
| `CLIP` | cut off inside a box with no way to see the rest | give it room, or a scroll container |
| `ESCAPE` | wider than its own parent, nothing clipping it | `min-w-0`, or let it wrap |

`ESCAPE` is the one you cannot find by measuring the page — it's inside the
viewport and nothing is scrolling, it just prints over its neighbour. That's
what put a routine's meta line through its card border.

Findings at or below `NOISE_PX` (12) are printed but don't fail: Base UI's
switch thumb and checkbox indicator sit a few px outside their own box by
design, and a month abbreviation is wider than the 11px heatmap column it's
centred over. Raising the threshold to silence a real finding is the wrong fix.

## Why not Playwright

The only thing these need is a viewport the tooling can actually set. Chrome
extensions can't resize a maximised window — the resize call reports success and
`innerWidth` stays put, which is how a page that scrolled sideways on every
screen of a route got signed off as fine. `Emulation.setDeviceMetricsOverride`
is what DevTools' own device mode uses, so media queries evaluate at the
emulated width. Node 22 ships a global `WebSocket` and CDP is a URL and some
JSON, so `cdp.mjs` is a hundred lines and no download.
