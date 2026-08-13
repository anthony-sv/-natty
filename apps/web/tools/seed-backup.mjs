/**
 * Write a full backup file with a year of plausible data in it.
 *
 * For trying the app — and especially the account sync — against something
 * that looks like real use. A fresh install shows the one version of every
 * screen that was never going to break: empty states are short, and tables,
 * charts, heatmaps and PR frontiers only exist once there is something to
 * render. The same reasoning as the layout checks' own seeding, except this
 * produces a *file*, so it goes in through the app's own import rather than
 * being written into localStorage behind its back.
 *
 *   node tools/seed-backup.mjs [output.json]
 *
 * Then: /progress → Data → Import → Restore everything.
 *
 * **This replaces everything.** Export your own data first if you have any.
 */
import { writeFileSync } from "node:fs";

/**
 * A fixed clock, so two runs produce the same file and a diff means a real
 * change. Ends "today" relative to the data, not to when you run it.
 */
const NOW = Date.parse("2026-08-13T18:00:00Z");
const DAY = 86_400_000;

/** Built-in exercise ids — real ones, so every row resolves to a name. */
const LIFTS = [
  { id: "flat-barbell-bench-press", base: 80, unit: "kg" },
  { id: "lat-pulldown-wide", base: 65, unit: "kg" },
  { id: "back-squat", base: 100, unit: "kg" },
  { id: "dumbbell-stiff-leg-deadlift", base: 40, unit: "kg" },
  { id: "low-cable-row-v-bar", base: 60, unit: "kg" },
  { id: "dumbbell-shoulder-press", base: 22, unit: "kg" },
  { id: "standing-ez-bar-curl", base: 30, unit: "kg" },
  { id: "rope-pushdown", base: 25, unit: "lb" },
  { id: "leg-extension", base: 55, unit: "kg" },
  { id: "standing-calf-raise", base: 70, unit: "kg" },
];

/** A four-day split, repeating — so the heatmap has a real shape. */
const SPLIT = [
  { day: 1, lifts: [0, 4, 5] },
  { day: 2, lifts: [2, 3, 8] },
  { day: 3, lifts: [1, 6, 7] },
  { day: 4, lifts: [9, 0, 6] },
];

/** Deterministic jitter — no Math.random, so the file is reproducible. */
function wobble(n, spread) {
  return ((Math.sin(n * 12.9898) * 43758.5453) % 1) * spread;
}

function sets() {
  const rows = [];
  let n = 0;
  // 40 weeks of training, four sessions a week, with a two-week layoff in the
  // middle so the heatmap and the streak have something honest to show.
  for (let week = 39; week >= 0; week--) {
    if (week === 21 || week === 22) continue;
    for (const session of SPLIT) {
      const dayOffset = week * 7 + (7 - session.day * 1.5);
      const performedAt = NOW - dayOffset * DAY;
      for (const liftIndex of session.lifts) {
        const lift = LIFTS[liftIndex];
        // Load creeps up over the year, ~12% from first session to last.
        const progress = 1 + (39 - week) * 0.003;
        for (let setNumber = 1; setNumber <= 4; setNumber++) {
          const weight =
            Math.round(
              (lift.base * progress + wobble(n, 5) - setNumber * 1.25) / 1.25,
            ) * 1.25;
          rows.push({
            id: `seed-set-${n}`,
            performedAt: performedAt + setNumber * 150_000,
            exerciseId: lift.id,
            weight,
            unit: lift.unit,
            reps: 6 + Math.floor(Math.abs(wobble(n + 7, 6))),
            routineSlug: "bulking-program",
            weekNumber: ((39 - week) % 8) + 1,
            dayNumber: session.day,
            setNumber,
          });
          n++;
        }
      }
    }
  }
  return rows;
}

function bodyEntries() {
  // A cut, then a slow bulk — so the weight chart bends rather than sloping.
  return Array.from({ length: 40 }, (_, week) => {
    const weeksAgo = 39 - week;
    const weight =
      weeksAgo > 20 ? 88 - (39 - weeksAgo) * 0.35 : 81.5 + (20 - weeksAgo) * 0.2;
    return {
      id: `seed-body-${week}`,
      measuredAt: NOW - weeksAgo * 7 * DAY,
      weight: Math.round((weight + wobble(week, 0.6)) * 10) / 10,
      unit: "kg",
      bodyFatPercent:
        Math.round((weeksAgo > 20 ? 18 - (39 - weeksAgo) * 0.15 : 12.5 + (20 - weeksAgo) * 0.08) * 10) / 10,
    };
  });
}

function measurements() {
  const sites = [
    { site: "upperArm", base: 38, side: "left" },
    { site: "upperArm", base: 38.4, side: "right" },
    { site: "chest", base: 104 },
    { site: "waist", base: 84 },
    { site: "thigh", base: 59, side: "left" },
    { site: "thigh", base: 59.2, side: "right" },
  ];
  const rows = [];
  // Monthly, not weekly — a tape comes out far less often than a scale.
  for (let month = 0; month < 10; month++) {
    const monthsAgo = 9 - month;
    sites.forEach((entry, index) => {
      rows.push({
        id: `seed-measure-${month}-${index}`,
        measuredAt: NOW - monthsAgo * 30 * DAY,
        site: entry.site,
        ...(entry.side ? { side: entry.side } : {}),
        value:
          Math.round(
            (entry.base +
              (entry.site === "waist" ? -monthsAgo * 0.25 : (9 - monthsAgo) * 0.12) +
              wobble(month * 10 + index, 0.4)) * 10,
          ) / 10,
        unit: "cm",
      });
    });
  }
  return rows;
}

const exercises = [
  {
    id: "user:seed-trap-bar-deadlift",
    name: "Trap bar deadlift",
    aliases: ["hex bar deadlift"],
    pattern: "hinge",
    primaryMuscles: ["glutes", "hamstrings"],
    secondaryMuscles: ["quads", "traps", "forearms"],
    createdAt: NOW - 200 * DAY,
    notes: "The gym got one — easier on my lower back than a straight bar.",
  },
  {
    id: "user:seed-landmine-press",
    name: "Landmine press",
    aliases: [],
    pattern: "overhead-press",
    primaryMuscles: ["front-delts"],
    secondaryMuscles: ["triceps", "upper-chest"],
    createdAt: NOW - 120 * DAY,
  },
];

const routines = [
  {
    slug: "seed-upper-lower-a1b2",
    name: "Upper/Lower, four days",
    goal: "bulking",
    style: "Upper/lower split",
    createdAt: NOW - 180 * DAY,
    updatedAt: NOW - 20 * DAY,
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayNumber: 1,
            label: "Upper — push focus",
            isRest: false,
            warmupRefs: [],
            exercises: [
              {
                exerciseId: "flat-barbell-bench-press",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                prescriptions: [
                  { sets: 1, reps: [10, 12], restSeconds: 60, isWarmup: true },
                  { sets: 4, reps: [6, 8], restSeconds: 150, load: "heavier" },
                ],
              },
              {
                exerciseId: "dumbbell-shoulder-press",
                orAlternatives: ["machine-shoulder-press-neutral"],
                kind: "resistance",
                isFinisher: false,
                prescriptions: [{ sets: 3, reps: [8, 12], restSeconds: 90 }],
              },
              {
                exerciseId: "rope-pushdown",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                prescriptions: [
                  { sets: 2, reps: [10, 15], restSeconds: 60 },
                  {
                    sets: 1,
                    reps: [10, 15],
                    restSeconds: 60,
                    modifiers: { dropSet: true },
                  },
                ],
              },
            ],
          },
          {
            dayNumber: 2,
            label: "Lower",
            isRest: false,
            warmupRefs: [],
            exercises: [
              {
                exerciseId: "back-squat",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                prescriptions: [
                  { sets: 1, reps: [10, 10], restSeconds: 90, isWarmup: true },
                  { sets: 4, reps: [5, 8], restSeconds: 180, load: "heavier" },
                ],
              },
              {
                exerciseId: "dumbbell-stiff-leg-deadlift",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                prescriptions: [{ sets: 3, reps: [8, 10], restSeconds: 120 }],
              },
              {
                exerciseId: "standing-calf-raise",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                prescriptions: [{ sets: 4, reps: [12, 15], restSeconds: 60 }],
              },
            ],
          },
          { dayNumber: 3, label: "Rest", isRest: true, exercises: [], warmupRefs: [] },
          {
            dayNumber: 4,
            label: "Upper — pull focus",
            isRest: false,
            warmupRefs: [],
            exercises: [
              {
                exerciseId: "lat-pulldown-wide",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                prescriptions: [{ sets: 4, reps: [8, 12], restSeconds: 90 }],
              },
              {
                exerciseId: "low-cable-row-v-bar",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                prescriptions: [{ sets: 3, reps: [10, 12], restSeconds: 90 }],
              },
              {
                exerciseId: "standing-ez-bar-curl",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                prescriptions: [
                  {
                    sets: 3,
                    reps: [10, 12],
                    restSeconds: 60,
                    modifiers: { partials: true },
                  },
                ],
              },
            ],
          },
          { dayNumber: 5, label: "Rest", isRest: true, exercises: [], warmupRefs: [] },
        ],
      },
    ],
  },
];

const foods = [
  {
    id: "food:seed-carne-asada",
    name: "Carne asada, raw",
    unit: "g",
    macros: { protein: 21.5, fat: 8.2, carbs: 0 },
    state: "raw",
    category: "meat-fish",
    createdAt: NOW - 300 * DAY,
  },
  {
    id: "food:seed-corn-tortilla",
    name: "Corn tortilla",
    unit: "unit",
    macros: { protein: 1.4, fat: 0.7, carbs: 10.7 },
    category: "grains",
    unitNote: "One 26g tortilla",
    createdAt: NOW - 300 * DAY,
  },
  {
    id: "food:seed-whey",
    name: "Whey isolate",
    unit: "g",
    macros: { protein: 82, fat: 3.5, carbs: 6 },
    category: "supplements",
    createdAt: NOW - 260 * DAY,
  },
  {
    id: "food:seed-white-rice-cooked",
    name: "White rice, cooked",
    unit: "g",
    macros: { protein: 2.7, fat: 0.3, carbs: 28 },
    state: "cooked",
    category: "grains",
    createdAt: NOW - 260 * DAY,
  },
];

const recipes = [
  {
    id: "recipe:seed-asada-bowl",
    name: "Asada rice bowl",
    ingredients: [
      { foodId: "food:seed-carne-asada", amount: 200 },
      { foodId: "food:seed-white-rice-cooked", amount: 250 },
    ],
    method: "grill",
    // Measured on the scale after cooking, never derived — water leaves and
    // how much depends on the method.
    portioning: { kind: "weight", cookedGrams: 400 },
    createdAt: NOW - 150 * DAY,
    notes: "Weighed cooked, straight off the comal.",
  },
];

const diets = [
  {
    slug: "seed-lean-bulk-2900",
    name: "Lean bulk — 2,900 kcal",
    goal: "bulking",
    tdeeKcal: 2600,
    targetKcal: 2900,
    targets: { protein: 180, carbs: 330, fat: 85 },
    isDraft: false,
    createdAt: NOW - 100 * DAY,
    updatedAt: NOW - 10 * DAY,
    supplements: [],
    notes: ["Creatine 5g daily, whenever."],
    meals: [
      {
        name: "Breakfast",
        variants: [
          {
            options: [
              {
                items: [
                  { foodId: "food:seed-whey", amount: 40 },
                  { foodId: "food:seed-corn-tortilla", amount: 3 },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Lunch",
        variants: [
          {
            options: [
              { label: "Asada bowl", items: [{ foodId: "recipe:seed-asada-bowl", amount: 400 }] },
              {
                label: "Tacos",
                items: [
                  { foodId: "food:seed-carne-asada", amount: 180 },
                  { foodId: "food:seed-corn-tortilla", amount: 4 },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Dinner",
        variants: [
          {
            options: [
              {
                items: [
                  { foodId: "food:seed-carne-asada", amount: 200 },
                  { foodId: "food:seed-white-rice-cooked", amount: 200 },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

function intake() {
  const rows = [];
  // The last three weeks of eating, so the Today tab and the trends have
  // something to draw. Local midnight, like the app buckets by.
  for (let daysAgo = 20; daysAgo >= 0; daysAgo--) {
    const day = new Date(NOW - daysAgo * DAY);
    day.setHours(0, 0, 0, 0);
    const dayMs = day.getTime();
    ["Breakfast", "Lunch", "Dinner"].forEach((mealName, index) => {
      // A couple of skipped meals, because nobody is perfect.
      if ((daysAgo + index) % 11 === 0) return;
      rows.push({
        id: `seed-intake-${daysAgo}-${index}`,
        day: dayMs,
        source: {
          kind: "meal",
          planSlug: "seed-lean-bulk-2900",
          mealName,
          optionIndex: mealName === "Lunch" && daysAgo % 3 === 0 ? 1 : 0,
        },
        loggedAt: dayMs + (8 + index * 5) * 3_600_000,
      });
    });
  }
  return rows;
}

export function buildSeedBackup() {
  return {
  app: "natty",
  version: 1,
  exportedAt: NOW,
  scope: "full",
  data: {
    sets: sets(),
    bodyEntries: bodyEntries(),
    measurements: measurements(),
    exercises,
    routines,
    foods,
    recipes,
    diets,
    intake: intake(),
    profile: { heightCm: 179, sex: "male", wristCm: 18, ankleCm: 23 },
  },
  };
}

// Run directly to write the file; imported by `seed-backup.test.ts`, which
// parses the result with the app's own schemas — so a drift between this and
// a collection's shape fails the build rather than a confusing import error
// months later.
if (process.argv[1]?.endsWith("seed-backup.mjs")) {
  const out = process.argv[2] ?? "natty-seed.json";
  const backup = buildSeedBackup();
  writeFileSync(out, JSON.stringify(backup, null, 2));
  const counts = Object.entries(backup.data)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.length : 1}`)
    .join(", ");
  console.log(`Wrote ${out}
${counts}`);
}
