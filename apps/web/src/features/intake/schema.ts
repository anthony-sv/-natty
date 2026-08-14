import { z } from "zod";

/**
 * Something you ate, on one calendar day.
 *
 * Modelled on `loggedSetSchema`, which is the closest prior art and works: a
 * flat row per thing, a local-day bucket, and provenance rather than a copy of
 * what it points at.
 *
 * **A ticked meal stores provenance, not its foods.** Same reasoning as
 * `LoggedSet.routineSlug`: freezing the resolved items would keep showing the
 * old chicken portion after you edited the plan, and the plan is the document
 * you'd expect to be the authority. It resolves through `resolveDay` and the
 * pantry at read time, exactly as the plan page already does.
 *
 * The cost is real and worth naming: edit a plan and *yesterday's* logged meal
 * changes too. That's the right trade for a plan you follow — it's a recipe you
 * cook, not a receipt — and an off-plan meal has `item` entries, which do
 * freeze what you typed.
 */
export const intakeEntrySchema = z.object({
  id: z.string(),
  /**
   * Local midnight of the day this belongs to, via `startOfDay`.
   *
   * Local rather than UTC for the reason the heatmap and the weekly averages
   * are: a UTC bucket files a late dinner under tomorrow.
   */
  day: z.number(),
  source: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("meal"),
      planSlug: z.string(),
      /**
       * Meals are identified by name, which is also how `SwapChoices` keys
       * them and how the plan model itself distinguishes them — there is no
       * meal id. Renaming a meal orphans the entry, which the panel shows as a
       * struck-through row rather than dropping silently.
       */
      mealName: z.string(),
      /** Which swap you actually ate. */
      optionIndex: z.number().int().nonnegative(),
    }),
    z.object({
      kind: z.literal("item"),
      /** A built-in food, one of yours, or a recipe — all the same here. */
      foodId: z.string(),
      amount: z.number().positive(),
    }),
    /**
     * A supplement you took.
     *
     * Here rather than in a table of its own, because it is the same question
     * the other two answer — what went in, on which local day — and it
     * inherits the day bucketing, the sync, the undo and the
     * nothing-auto-logs rule for free. What it does *not* inherit is macros:
     * a supplement contributes zero, which is why `resolveIntake` counts it
     * in neither list. Three fish-oil capsules have calories on paper and
     * nobody tracks them; what you want to know is whether you took them.
     *
     * Provenance, not a copy — the same call `meal` makes: editing the dose
     * on your stack corrects what every past day says you took, which is
     * right for a standing instruction you follow.
     */
    z.object({
      kind: z.literal("supplement"),
      supplementId: z.string(),
    }),
  ]),
  loggedAt: z.number(),
});
export type IntakeEntry = z.infer<typeof intakeEntrySchema>;
export type IntakeSource = IntakeEntry["source"];
