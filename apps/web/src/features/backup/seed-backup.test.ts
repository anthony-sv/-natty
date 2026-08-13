import { describe, expect, it } from "vitest";
// @ts-expect-error — tools/ is plain JS outside the app's tsconfig include.
import { buildSeedBackup } from "../../../tools/seed-backup.mjs";
import { exercises } from "@/data/exercises";
import { readBackup } from "./backup";

/**
 * The seed file has to be importable, or it's worse than useless — you'd find
 * out by having the app refuse it, with a Zod path and no idea which of ten
 * collections you hand-wrote wrong.
 *
 * `readBackup` rather than the raw schema: that's the function the import
 * button actually calls, so this fails for the same reasons a real import
 * would, including the envelope checks around the data.
 */
describe("the seed backup", () => {
  // Round-tripped through JSON so this sees exactly what the file contains,
  // not the in-memory object that produced it.
  const result = readBackup(JSON.parse(JSON.stringify(buildSeedBackup())));

  it("is a file the app would accept", () => {
    // Surfaces which field failed rather than just `false` when this breaks.
    expect(result.ok ? "ok" : `${result.reason}: ${result.detail}`).toBe("ok");
  });

  it("fills every collection", () => {
    if (!result.ok) throw new Error("unreadable");
    const { data } = result.backup;
    // A seed with an empty collection in it silently tests nothing on that
    // screen, which is the failure this whole file exists to avoid.
    expect(data.sets.length).toBeGreaterThan(500);
    expect(data.bodyEntries.length).toBeGreaterThan(20);
    expect(data.measurements.length).toBeGreaterThan(20);
    expect(data.exercises.length).toBeGreaterThan(0);
    expect(data.routines.length).toBeGreaterThan(0);
    expect(data.foods.length).toBeGreaterThan(0);
    expect(data.recipes.length).toBeGreaterThan(0);
    expect(data.diets.length).toBeGreaterThan(0);
    expect(data.intake.length).toBeGreaterThan(0);
    expect(data.profile?.heightCm).toBeGreaterThan(0);
  });

  it("names exercises that actually exist, in sets and in routines", () => {
    if (!result.ok) throw new Error("unreadable");
    const known = new Set<string>(exercises.map((exercise) => exercise.id));
    for (const row of result.backup.data.exercises) known.add(row.id);

    // A set against an id nothing resolves renders as a raw slug in the
    // records table, and a routine entry renders blank — the seed would look
    // broken rather than full. Nothing validates a *user* routine's ids
    // against the library the way `authoring.ts` does for the built-in six,
    // so this is the only thing that would catch it.
    const referenced = [
      ...result.backup.data.sets.map((set) => set.exerciseId),
      ...result.backup.data.routines.flatMap((routine) =>
        routine.weeks.flatMap((week) =>
          week.days.flatMap((day) =>
            day.exercises.flatMap((entry) => [
              entry.exerciseId,
              ...entry.orAlternatives,
            ]),
          ),
        ),
      ),
    ];
    expect([...new Set(referenced.filter((id) => !known.has(id)))]).toEqual([]);
  });

  it("points its meals at foods and recipes it carries", () => {
    if (!result.ok) throw new Error("unreadable");
    const { foods, recipes, diets } = result.backup.data;
    const known = new Set([
      ...foods.map((food) => food.id),
      ...recipes.map((recipe) => recipe.id),
    ]);

    const referenced = diets.flatMap((plan) =>
      plan.meals.flatMap((meal) =>
        meal.variants.flatMap((variant) =>
          variant.options.flatMap((option) =>
            option.items.map((item) => item.foodId),
          ),
        ),
      ),
    );
    // An unresolvable id contributes zero rather than throwing, so a plan
    // full of them reads as a real plan with wrong macros.
    expect(referenced.filter((id) => !known.has(id))).toEqual([]);
  });
});
