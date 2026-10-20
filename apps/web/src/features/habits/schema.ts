import { z } from "zod";

/**
 * What a habit asks of a day: a number of times, or a number of minutes.
 *
 * Two kinds and no more. "Brush teeth 3×" and "read 15 minutes" are the two
 * shapes every habit people actually keep turns out to be; a yes/no habit is
 * simply a count of one. Both carry `perDay` so the checker is one comparison.
 */
export const habitTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("count"), perDay: z.number().int().min(1).max(24) }),
  z.object({
    kind: z.literal("minutes"),
    perDay: z.number().int().min(1).max(1440),
  }),
]);
export type HabitTarget = z.infer<typeof habitTargetSchema>;

/**
 * Which days a habit is due.
 *
 * `weekdays` counts Monday as 0, matching `startOfWeek` and every weekly
 * figure in the app. `weekly` is "any N days this week" — yoga three times a
 * week has no fixed days, and pinning it to some would make a Thursday class
 * read as a miss on Wednesday.
 */
export const habitScheduleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("daily") }),
  z.object({
    kind: z.literal("weekdays"),
    days: z.array(z.number().int().min(0).max(6)).min(1),
  }),
  z.object({
    kind: z.literal("weekly"),
    timesPerWeek: z.number().int().min(1).max(7),
  }),
]);
export type HabitSchedule = z.infer<typeof habitScheduleSchema>;

export const habitSchema = z.object({
  /** `habit:<uuid>`, prefixed like `supplement:` so a log row says what it is. */
  id: z.string().startsWith("habit:"),
  /** Your words, in your language — not a translation target. */
  name: z.string().min(1),
  target: habitTargetSchema,
  schedule: habitScheduleSchema,
  /** "Morning", "after lunch" — a note to yourself, also not translated. */
  timing: z.string().optional(),
  /**
   * Off the checklist, still counted on the days you did it — the archive
   * rule custom exercises and supplements follow, for the same reason.
   */
  archivedAt: z.number().optional(),
  createdAt: z.number(),
});
export type Habit = z.infer<typeof habitSchema>;
export type HabitInput = Omit<Habit, "id" | "createdAt">;

/**
 * How much of a habit got done on one local day.
 *
 * **One row per habit per day, not one per tick.** Three brushes a day for a
 * year is a thousand rows the other way, and every one would be read whole
 * on sign-in — the `user_documents` table holds these, and it fetches a kind
 * at a time. A count fits in one number.
 *
 * The id is derived (`habitId@day`) rather than random, which is what makes
 * two devices ticking the same day converge on one row instead of two that
 * both count.
 */
export const habitLogSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  /** Local midnight, via `startOfDay` — the bucket every daily figure uses. */
  day: z.number(),
  /** Times done for a count habit, minutes for a minutes one. */
  amount: z.number().nonnegative(),
  updatedAt: z.number(),
});
export type HabitLog = z.infer<typeof habitLogSchema>;

export function habitLogId(habitId: string, day: number): string {
  return `${habitId}@${day}`;
}
