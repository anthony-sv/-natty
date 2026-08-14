# !natty

A training log that does the arithmetic — sets, weigh-ins, measurements and
meals in, records and volume and macros out. Works entirely offline with no
account; sign in and the same data follows you to your phone.

**[not-natty.vercel.app](https://not-natty.vercel.app)**

---

## What it does

- **Programs and a session player.** Six transcribed programs plus any you
  write. The player runs a day set by set with rest timers, technique cues and
  audio prompts, because the premise of a guided session is that you are not
  looking at the phone.
- **Set logging with real PRs.** A personal record is the *Pareto frontier* of
  (reps, weight) — every set nothing else beat on both axes — so `120×1` and
  `90×8` are both records and neither hides the other. Records are recomputed
  on every read and never stored, which is why correcting a mistyped set fixes
  the whole history at once.
- **Volume that means something.** Sets per muscle per week, split across
  push/pull/legs/core, plus total tonnage with a per-muscle breakdown. Direct
  and indirect work are counted separately and never fused at a coefficient.
- **Nutrition.** Diet plans with swappable meals, a macro calculator, a pantry
  of your own foods and recipes, and a daily intake log that resolves through
  the plan rather than freezing a copy of it.
- **Body composition.** Weigh-ins, girth measurements, FFMI against population
  bands, and a natural-potential model from published anthropometric formulas.
- **Calculators.** One-rep max across five formulas (shown together, because
  they disagree by 5 kg once reps climb), RPE, hydration, creatine dosing, and
  a plate loader that solves the bar as bounded subset-sum rather than greedily
  — so it still works when the gym is out of 10s.
- **English and Spanish**, with the dictionary typed so a missing translation
  fails the build rather than rendering a raw key.

## Stack

React 19 + TypeScript on **TanStack Start** in SPA mode, deployed to Vercel as
a Nitro server. Data is TanStack DB collections that fork on your session:
localStorage signed out, server-backed through Start server functions signed
in, behind one interface — which is how the whole derivation layer moved to a
server without a single pure function changing.

Accounts are Supabase (cookie sessions, Google or email), storage is Postgres
via Drizzle. UI is shadcn/ui on Base UI with Tailwind v4.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

That is the whole setup. Without a Supabase project the app still runs — it
just has no accounts to offer, and every collection reads its local backing.

To enable accounts, copy `apps/web/.env.example` to `apps/web/.env` and fill in
a Supabase URL, publishable key and pooled connection string. Schema lives in
`apps/web/drizzle/manual/`.

```bash
pnpm build        # production build
pnpm test         # 599 tests, data layer only
pnpm typecheck
pnpm lint
```

There are also two layout checks that drive a headless Chrome at a phone
viewport and fail on anything that doesn't fit — see `apps/web/tools/README.md`.
They run in Spanish with a year of seeded data on purpose: English is the
shortest language the app speaks, and empty states are the one version of every
screen that was never going to break.

## Repo layout

```
apps/web/            the app; the only one that exists
  src/data/          compiled-in exercises, programs and diet plans
  src/features/      one directory per feature, pure logic beside its UI
  src/server/        server functions, Drizzle schema, auth middleware
  src/routes/        file-based routes
  tools/             layout audits and the seed-data generator
CLAUDE.md            the long-form why: every decision worth not relitigating
```

`CLAUDE.md` is the real documentation. It exists because most of what matters
here is a *decision* — why a PR is a frontier, why tonnage rows don't sum to
their total, why the app never enables SSR — and a decision needs a paragraph,
not a comment.

## Status

A personal project, used daily by its author. It works, it is deployed, and it
is not a product: there is no uptime guarantee and no support. Issues and pull
requests are welcome but may sit.

Your data is yours and portable — everything exports to one JSON file that
imports anywhere, which is also the honest answer to "what if this stops
existing".

## Licence

[MIT](LICENSE) © Anthony Steiner
