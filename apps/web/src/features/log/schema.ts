import { z } from "zod";
import { weightUnitSchema } from "@/lib/units";

/**
 * One set you actually performed.
 *
 * Keyed on `exerciseId` from the library, which is the whole reason the library
 * exists — a wide-grip and a close-grip pulldown are separate lifts with
 * separate loads, and only a stable id keeps their histories apart.
 *
 * Weight is optional rather than defaulted to 0 so "bodyweight dips" and
 * "dips with 0kg added" stay the same thing. `effectiveWeight()` in `pr.ts` is
 * the single place that decides how an absent weight compares.
 */
export const loggedSetSchema = z.object({
  id: z.string(),
  /** Epoch ms. Editable, so a backfilled set can be dated to when it happened. */
  performedAt: z.number(),
  exerciseId: z.string(),
  /** Absent means bodyweight; a number here is total or added load. */
  weight: z.number().nonnegative().optional(),
  /**
   * The unit the plates or the stack were actually marked in — stored as
   * entered rather than converted, because a pec deck marked in pounds should
   * read back as pounds, not as 45.4kg. Comparison normalises instead; see
   * `effectiveWeight()` in `pr.ts`.
   *
   * Defaults to kg so sets logged before units existed still parse.
   */
  unit: weightUnitSchema.default("kg"),
  reps: z.number().int().positive(),

  /**
   * Where this came from, when it came from a live session. Absent on sets
   * logged by hand from /progress, which is also how the two are told apart.
   */
  routineSlug: z.string().optional(),
  weekNumber: z.number().int().positive().optional(),
  dayNumber: z.number().int().positive().optional(),
  setNumber: z.number().int().positive().optional(),
});
export type LoggedSet = z.infer<typeof loggedSetSchema>;

/** What a form supplies; `id` is minted at insert time. */
export const loggedSetInputSchema = loggedSetSchema.omit({ id: true });
export type LoggedSetInput = z.infer<typeof loggedSetInputSchema>;
