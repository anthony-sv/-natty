import { z } from "zod";
import { distanceUnitSchema } from "@/lib/units";

/**
 * One cardio session you actually did.
 *
 * A parallel shape to `loggedSetSchema`, not an extension of it: cardio is
 * never fed into `prFrontier`/`effectiveWeight`, never counted as resistance
 * volume, and nothing cross-queries weight+reps against distance — the same
 * reasoning `bodyEntries` and `measurements` stay separate tables despite
 * both being "a number on a date."
 */
export const cardioEntrySchema = z.object({
  id: z.string(),
  /** Epoch ms. Editable, so a backfilled session can be dated to when it happened. */
  performedAt: z.number(),
  exerciseId: z.string(),
  distance: z.number().positive(),
  /** Stored as entered — a run logged in miles reads back in miles. */
  unit: distanceUnitSchema.default("km"),
  /** How long it actually took, if you tracked it. */
  durationSeconds: z.number().int().positive().optional(),

  /**
   * Where this came from, when it came from a live session. Absent on
   * entries backfilled from `/progress` — same as `loggedSetSchema`.
   */
  routineSlug: z.string().optional(),
  weekNumber: z.number().int().positive().optional(),
  dayNumber: z.number().int().positive().optional(),
  setNumber: z.number().int().positive().optional(),
});
export type CardioEntry = z.infer<typeof cardioEntrySchema>;

/** What a form supplies; `id` is minted at insert time. */
export const cardioEntryInputSchema = cardioEntrySchema.omit({ id: true });
export type CardioEntryInput = z.infer<typeof cardioEntryInputSchema>;
