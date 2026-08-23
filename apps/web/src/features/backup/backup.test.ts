import { describe, expect, it } from "vitest";
import { diets } from "@/data/diets";
import { routines } from "@/data/routines";
import { userDietPlanSchema } from "@/features/nutrition/collection";
import { userRoutineSchema } from "@/features/routines/collection";
import {
  BACKUP_VERSION,
  backupDataSchema,
  backupFilename,
  backupSchema,
  buildBackup,
  compareCounts,
  readBackup,
  scopeMatchesIntent,
  summarise,
  type Backup,
  type BackupData,
} from "./backup";
import { rekey, type IdSource } from "./rekey";

const AT = Date.UTC(2026, 7, 11, 12);

/** Every scope that is a share rather than a whole-machine backup. */
const SHARE_SCOPES = [
  "routine",
  "diet",
  "recipe",
  "food",
  "exercise",
] as const satisfies readonly Backup["scope"][];

function emptyData(): BackupData {
  return {
    sets: [],
    cardio: [],
    bodyEntries: [],
    measurements: [],
    exercises: [],
    routines: [],
    supplements: [],
    extras: [],
    foods: [],
    recipes: [],
    diets: [],
    intake: [],
  };
}

/** One of each, for counting. Reused rather than re-typed per assertion. */
const FOOD = sharedData().foods[0]!;
const ROUTINE = { ...routines[0]!, createdAt: AT, updatedAt: AT };

/** A pantry that shares one food between a recipe and a plan. */
function sharedData(): BackupData {
  return {
    ...emptyData(),
    foods: [
      {
        id: "food:theirs",
        name: "Their yogurt",
        unit: "g",
        macros: { protein: 10, fat: 0.4, carbs: 3.6 },
        createdAt: 0,
      },
    ],
    recipes: [
      {
        id: "recipe:theirs",
        name: "Their bowl",
        ingredients: [
          { foodId: "food:theirs", amount: 200 },
          // A built-in, which must keep the id it has.
          { foodId: "whole-egg", amount: 2 },
        ],
        portioning: { kind: "servings", servings: 1 },
        createdAt: 0,
      },
    ],
    diets: [
      {
        slug: "their-cut",
        name: "Their cut",
        goal: "cutting",
        targets: {},
        meals: [
          {
            name: "Meal 1",
            variants: [
              {
                options: [
                  {
                    items: [
                      { foodId: "food:theirs", amount: 200 },
                      { foodId: "recipe:theirs", amount: 1 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        supplements: [],
        notes: [],
        createdAt: 0,
        updatedAt: 0,
        isDraft: false,
      },
    ],
  };
}

/** Deterministic, so the assertions are about the rewiring, not the randomness. */
function counter(): IdSource {
  let n = 0;
  const slug = (name: string) =>
    `${name.toLowerCase().replace(/\s+/g, "-")}-${++n}`;
  return { routineSlug: slug, dietSlug: slug, id: (prefix) => `${prefix}:new${++n}` };
}

describe("the envelope", () => {
  it("round-trips losslessly", () => {
    // Reading *normalises* — the schemas fill in their defaults, so a parsed
    // backup is richer than the object handed in rather than identical to it.
    // Losslessness is therefore that a second pass changes nothing: whatever
    // survives the first read survives every read after it.
    const backup = buildBackup(sharedData(), "full", AT);
    const once = readBackup(JSON.parse(JSON.stringify(backup)));
    expect(once.ok).toBe(true);
    if (!once.ok) return;

    const twice = readBackup(JSON.parse(JSON.stringify(once.backup)));
    expect(twice.ok).toBe(true);
    if (twice.ok) expect(twice.backup).toEqual(once.backup);
  });

  it("keeps the data it was given", () => {
    const data = sharedData();
    const result = readBackup(
      JSON.parse(JSON.stringify(buildBackup(data, "full", AT))),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.data.foods[0]!.name).toBe("Their yogurt");
    expect(result.backup.data.recipes[0]!.ingredients).toHaveLength(2);
    expect(result.backup.data.diets[0]!.slug).toBe("their-cut");
    expect(result.backup.scope).toBe("full");
  });

  it("refuses a file that isn't ours", () => {
    // Import hands the app an arbitrary file, so every failure is a value.
    expect(readBackup({ hello: "world" })).toEqual({ ok: false, reason: "not-natty" });
    expect(readBackup(null)).toEqual({ ok: false, reason: "not-natty" });
    expect(readBackup("nope")).toEqual({ ok: false, reason: "not-natty" });
  });

  it("refuses a version it doesn't know, before looking at the shape", () => {
    const future = { ...buildBackup(emptyData(), "full", AT), version: 99 };
    const result = readBackup(future);
    expect(result).toEqual({ ok: false, reason: "wrong-version", detail: "99" });
  });

  it("rejects a mangled payload with what failed, rather than importing it", () => {
    const backup = buildBackup(emptyData(), "full", AT) as unknown as {
      data: { foods: unknown };
    };
    backup.data.foods = [{ id: "food:x", name: "", unit: "g" }];
    const result = readBackup(backup);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid");
      // Names the field, so the message can say more than "invalid file".
      expect(result.detail).toBeTruthy();
    }
  });

  it("never throws, whatever it is handed", () => {
    for (const input of [undefined, 0, [], { app: "natty" }, { app: "natty", version: 1 }]) {
      expect(() => readBackup(input)).not.toThrow();
    }
  });

  it("summarises only what's actually in the file", () => {
    expect(summarise(sharedData()).map((row) => row.key)).toEqual([
      "foods",
      "recipes",
      "diets",
    ]);
  });

  it("counts a profile, so a file carrying one never previews as empty", () => {
    // It was omitted while every array was listed, which put "there's nothing
    // in it" above a button that replaces everything.
    expect(summarise(emptyData())).toEqual([]);
    expect(
      summarise({ ...emptyData(), profile: { heightCm: 179 } }).map((r) => r.key),
    ).toEqual(["profile"]);
  });

  describe("compareCounts", () => {
    it("keeps a row the file has nothing for, which is the point", () => {
      // The dialog's job is to say what a restore *removes*. A file with one
      // routine and no sets must not render as "1 routine" while a year of
      // logged sets goes quietly.
      const current: BackupData = {
        ...emptyData(),
        routines: [ROUTINE],
        profile: { heightCm: 179 },
      };
      const incoming: BackupData = { ...emptyData(), foods: [FOOD] };

      expect(compareCounts(current, incoming)).toEqual([
        { key: "routines", from: 1, to: 0 },
        { key: "foods", from: 0, to: 1 },
        { key: "profile", from: 1, to: 0 },
      ]);
    });

    it("drops rows that are zero on both sides", () => {
      expect(compareCounts(emptyData(), emptyData())).toEqual([]);
      // ...and says nothing about collections neither side has.
      const rows = compareCounts({ ...emptyData(), foods: [FOOD] }, emptyData());
      expect(rows.map((r) => r.key)).toEqual(["foods"]);
    });
  });

  describe("scopeMatchesIntent", () => {
    it("lets a full backup restore and a share merge", () => {
      expect(scopeMatchesIntent("full", "restore")).toBe(true);
      for (const scope of SHARE_SCOPES) {
        expect(scopeMatchesIntent(scope, "merge")).toBe(true);
      }
    });

    it("refuses a share down the restore path, and a backup down the share path", () => {
      // The whole point: a file must not be able to route itself to
      // `restoreEverything`, which clears every collection.
      for (const scope of SHARE_SCOPES) {
        expect(scopeMatchesIntent(scope, "restore")).toBe(false);
      }
      expect(scopeMatchesIntent("full", "merge")).toBe(false);
    });

    it("covers every scope the envelope allows", () => {
      // A new scope has to be classified deliberately rather than defaulting
      // into whichever branch the ternary happens to take.
      const all = backupSchema.shape.scope.options;
      expect([...all].sort()).toEqual([...SHARE_SCOPES, "full"].sort());
    });
  });

  it("names the file by date and scope", () => {
    expect(backupFilename(AT, "full")).toMatch(/^natty-backup-2026-08-\d\d\.json$/);
    expect(backupFilename(AT, "recipe")).toMatch(/^natty-recipe-2026-08-\d\d\.json$/);
  });

  it("writes the current version", () => {
    expect(buildBackup(emptyData(), "full", AT).version).toBe(BACKUP_VERSION);
  });
});

/**
 * Sharing was offered only on a routine or plan you'd written, because the
 * export looked in the collection and the compiled-in ones aren't in it.
 * `exportRoutine`/`exportDiet` now fall back to the built-in lists and stamp
 * the two timestamps the user schemas add.
 *
 * Those functions touch collections, so they aren't unit-testable — but the
 * one thing that could silently break is: a built-in has to *satisfy* the user
 * schema once stamped. If `routineSchema` grows a field that
 * `userRoutineSchema` narrows, sharing a built-in would write a file that
 * `readBackup` then refuses, and nothing else would notice.
 */
describe("sharing a built-in", () => {
  it("stamps every built-in routine into something a backup can carry", () => {
    for (const routine of routines) {
      const stamped = { ...routine, createdAt: AT, updatedAt: AT };
      expect(() => userRoutineSchema.parse(stamped)).not.toThrow();
    }
  });

  it("stamps every built-in plan into something a backup can carry", () => {
    for (const plan of diets) {
      const stamped = { ...plan, createdAt: AT, updatedAt: AT, isDraft: false };
      expect(() => userDietPlanSchema.parse(stamped)).not.toThrow();
    }
  });

  it("round-trips a built-in routine and re-keys it away from its own slug", () => {
    const routine = { ...routines[0], createdAt: AT, updatedAt: AT };
    const file = JSON.parse(
      JSON.stringify(buildBackup({ ...emptyData(), routines: [routine] }, "routine", AT)),
    ) as unknown;

    const read = readBackup(file);
    expect(read.ok).toBe(true);
    if (!read.ok) return;

    // A built-in's slug is provenance in `LoggedSet.routineSlug` on the
    // recipient's machine too, so the copy must not adopt it — otherwise their
    // history against the real built-in would merge into the shared copy.
    const out = rekey(read.backup.data, counter());
    expect(out.routines[0].slug).not.toBe(routines[0].slug);
    expect(out.routines[0].name).toBe(routines[0].name);
  });

  it("names a lone food and a lone exercise by their own scope", () => {
    expect(backupFilename(AT, "food")).toMatch(/^natty-food-2026-08-\d\d\.json$/);
    expect(backupFilename(AT, "exercise")).toMatch(
      /^natty-exercise-2026-08-\d\d\.json$/,
    );
  });
});

/**
 * TanStack DB attaches `$synced`, `$origin`, `$key` and `$collectionId` to every
 * row `collection.values()` hands back, and all four rode into every exported
 * file. None of it is secret — `$key` repeats the row's `id` — but a backup is
 * a document people send each other, and its shape shouldn't be "our schema
 * plus whatever the storage layer attached".
 */
describe("what an export actually writes", () => {
  it("leaves the storage layer's bookkeeping behind", () => {
    const dirty = {
      ...emptyData(),
      measurements: [
        {
          id: "m1",
          measuredAt: AT,
          site: "upperArm" as const,
          value: 40,
          unit: "cm" as const,
          // What the collection really hands back.
          $synced: true,
          $origin: "remote",
          $key: "m1",
          $collectionId: "local-collection:natty.measurements.v1",
        },
      ],
    } as unknown as BackupData;

    const written = buildBackup(dirty, "full", AT);

    expect(Object.keys(written.data.measurements[0])).toEqual([
      "id",
      "measuredAt",
      "site",
      "value",
      "unit",
    ]);
  });

  it("keeps every field that is actually ours", () => {
    const row = {
      id: "m1",
      measuredAt: AT,
      site: "thigh" as const,
      side: "left" as const,
      value: 60,
      unit: "cm" as const,
      notes: "morning, relaxed",
    };

    const written = buildBackup(
      { ...emptyData(), measurements: [row] },
      "full",
      AT,
    );

    expect(written.data.measurements[0]).toEqual(row);
  });

  it("strips the profile too, without inventing one", () => {
    expect(buildBackup(emptyData(), "full", AT).data.profile).toBeUndefined();
  });

  /**
   * The strip is by `$` prefix rather than by naming the four fields, since the
   * set is the library's to change. This is what makes that safe: if any schema
   * of ours ever declared a `$`-prefixed field, the export would silently drop
   * it, and nothing else in the suite would notice.
   */
  it("never strips a field one of our own schemas declares", () => {
    /**
     * Peel the wrappers off until an object schema falls out. The collections
     * are `z.array(x).default([])`; `profile` is `x.optional()`.
     */
    const unwrap = (schema: unknown): Record<string, unknown> | undefined => {
      let current = schema;
      for (let depth = 0; depth < 5; depth++) {
        const node = current as {
          shape?: Record<string, unknown>;
          def?: { type?: string; innerType?: unknown; element?: unknown };
        };
        if (node.shape !== undefined) return node.shape;
        const next = node.def?.innerType ?? node.def?.element;
        if (next === undefined) return undefined;
        current = next;
      }
      return undefined;
    };

    const shapes = Object.entries(backupDataSchema.shape).map(
      ([key, schema]) => [key, unwrap(schema)] as const,
    );

    // Fails loudly if the unwrapping ever stops working, rather than passing
    // vacuously over schemas it couldn't read.
    expect(shapes.every(([, shape]) => shape !== undefined)).toBe(true);
    expect(shapes.length).toBe(Object.keys(backupDataSchema.shape).length);

    const dollarFields = shapes.flatMap(([key, shape]) =>
      Object.keys(shape ?? {})
        .filter((field) => field.startsWith("$"))
        .map((field) => `${key}.${field}`),
    );
    expect(dollarFields).toEqual([]);
  });
});

describe("re-keying an import", () => {
  it("gives a shared routine a fresh slug", () => {
    // The one that matters. A slug is provenance in `LoggedSet.routineSlug`, so
    // adopting theirs would file your sets under their routine — or merge two
    // different routines that happen to share a slug.
    const data: BackupData = {
      ...emptyData(),
      routines: [
        {
          slug: "their-push-day",
          name: "Push day",
          weeks: [{ weekNumber: 1, days: [] }],
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    };
    const out = rekey(data, counter());
    expect(out.routines[0]!.slug).not.toBe("their-push-day");
    expect(out.routines[0]!.name).toBe("Push day");
  });

  it("follows an imported food to its new id inside a recipe", () => {
    // The subtle half: a recipe that keeps pointing at the *old* food id
    // silently loses its ingredients and reads as zero macros.
    const out = rekey(sharedData(), counter());
    const newFoodId = out.foods[0]!.id;

    expect(newFoodId).not.toBe("food:theirs");
    expect(out.recipes[0]!.ingredients[0]!.foodId).toBe(newFoodId);
  });

  it("leaves built-in ids alone", () => {
    // Only what came in the file is rewritten; `whole-egg` is the same food on
    // both machines.
    const out = rekey(sharedData(), counter());
    expect(out.recipes[0]!.ingredients[1]!.foodId).toBe("whole-egg");
  });

  it("follows a plan slug and a food into the intake that references them", () => {
    // Intake rides along on a merged full backup. Without this the day you
    // logged points at the plan slug it had on the other machine.
    const data: BackupData = {
      ...sharedData(),
      intake: [
        {
          id: "i1",
          day: 0,
          source: {
            kind: "meal",
            planSlug: "their-cut",
            mealName: "Lunch",
            optionIndex: 0,
          },
          loggedAt: 1,
        },
        {
          id: "i2",
          day: 0,
          source: { kind: "item", foodId: "food:theirs", amount: 100 },
          loggedAt: 2,
        },
      ],
    };
    const out = rekey(data, counter());

    expect(out.intake[0]!.source).toMatchObject({
      planSlug: out.diets[0]!.slug,
    });
    expect(out.intake[1]!.source).toMatchObject({ foodId: out.foods[0]!.id });
    // Fresh row ids too, so importing the same file twice is two days of
    // intake rather than one silently overwritten.
    expect(out.intake.map((e) => e.id)).not.toContain("i1");
  });

  it("follows both foods and recipes into a plan's items", () => {
    const out = rekey(sharedData(), counter());
    const items = out.diets[0]!.meals[0]!.variants[0]!.options[0]!.items;
    expect(items[0]!.foodId).toBe(out.foods[0]!.id);
    expect(items[1]!.foodId).toBe(out.recipes[0]!.id);
  });

  it("follows a custom exercise into a routine's entries", () => {
    const data: BackupData = {
      ...emptyData(),
      exercises: [
        {
          id: "user:theirs",
          name: "Their lift",
          aliases: [],
          pattern: "squat",
          primaryMuscles: ["quads"],
          secondaryMuscles: [],
          createdAt: 0,
        },
      ],
      routines: [
        {
          slug: "theirs",
          name: "Theirs",
          weeks: [
            {
              weekNumber: 1,
              days: [
                {
                  dayNumber: 1,
                  label: "Legs",
                  isRest: false,
                  warmupRefs: [],
                  exercises: [
                    {
                      exerciseId: "user:theirs",
                      orAlternatives: ["user:theirs"],
                      kind: "resistance",
                      isFinisher: false,
                      prescriptions: [{ sets: 3, reps: 10 }],
                    },
                  ],
                },
              ],
            },
          ],
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    };
    const out = rekey(data, counter());
    const entry = out.routines[0]!.weeks[0]!.days[0]!.exercises[0]!;
    expect(entry.exerciseId).toBe(out.exercises[0]!.id);
    // Alternatives point at exercises too and would dangle otherwise.
    expect(entry.orAlternatives).toEqual([out.exercises[0]!.id]);
  });

  it("leaves a girth alone — it references nothing and nothing references it", () => {
    const data: BackupData = {
      ...emptyData(),
      measurements: [
        { id: "m1", measuredAt: AT, site: "upperArm", value: 40, unit: "cm" },
      ],
    };

    expect(rekey(data, counter()).measurements).toEqual(data.measurements);
  });

  it("leaves logged sets and weigh-ins untouched", () => {
    // A restore puts your own data back; re-keying it would orphan every set
    // whose provenance already names the routine it came from.
    const data: BackupData = {
      ...emptyData(),
      sets: [
        {
          id: "s1",
          exerciseId: "flat-barbell-bench-press",
          reps: 8,
          unit: "kg",
          performedAt: AT,
        },
      ],
    };
    expect(rekey(data, counter()).sets).toEqual(data.sets);
  });

  it("follows a shared routine's fresh slug and exercise ids into its extras", () => {
    // An extra travels with the routine it's on (see `exportRoutine`), and
    // has to follow both the routine's fresh slug and its own exercise's
    // fresh id — otherwise the copy's extra points at a routine day and a
    // lift that no longer exist on the recipient's machine.
    const data: BackupData = {
      ...emptyData(),
      exercises: [
        {
          id: "user:theirs",
          name: "Their lift",
          aliases: [],
          pattern: "squat",
          primaryMuscles: ["quads"],
          secondaryMuscles: [],
          createdAt: 0,
        },
      ],
      routines: [
        {
          slug: "theirs",
          name: "Theirs",
          weeks: [{ weekNumber: 1, days: [] }],
          createdAt: 0,
          updatedAt: 0,
        },
      ],
      extras: [
        {
          id: "extra:theirs",
          createdAt: 0,
          routineSlug: "theirs",
          weekNumber: 1,
          dayNumber: 1,
          entry: {
            exerciseId: "user:theirs",
            orAlternatives: ["user:theirs"],
            kind: "resistance",
            isFinisher: false,
            prescriptions: [{ sets: 3, reps: 15 }],
          },
        },
      ],
    };
    const out = rekey(data, counter());

    expect(out.extras[0]!.id).not.toBe("extra:theirs");
    expect(out.extras[0]!.routineSlug).toBe(out.routines[0]!.slug);
    expect(out.extras[0]!.entry.exerciseId).toBe(out.exercises[0]!.id);
    expect(out.extras[0]!.entry.orAlternatives).toEqual([out.exercises[0]!.id]);
  });

  it("gives two imports of the same file different ids", () => {
    // Importing a friend's recipe twice should leave you with two recipes, not
    // one overwritten — that's what "additive" means. One source across both
    // calls, since the real one is uuid-backed and never repeats.
    const source = counter();
    const first = rekey(sharedData(), source);
    const second = rekey(sharedData(), source);
    expect(first.recipes[0]!.id).not.toBe(second.recipes[0]!.id);
    expect(first.diets[0]!.slug).not.toBe(second.diets[0]!.slug);
  });
});
