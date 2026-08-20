import { z } from "zod";

/**
 * Proof a workout was run all the way to the end, kept apart from
 * `LoggedSet` on purpose: it carries no weight or reps, so it can never
 * register as a PR the way a logged set can. This is what lets pressing
 * "Finish" count a day as trained without inventing a set nobody actually
 * entered — see `SessionPlayer`'s `finishIfLast`.
 */
export const workoutCompletionSchema = z.object({
  id: z.string(),
  routineSlug: z.string(),
  weekNumber: z.number().int().positive(),
  dayNumber: z.number().int().positive(),
  performedAt: z.number(),
  /**
   * The last exercise of the day you'd actually reached — a position in
   * `day.exercises`, the same index every `SessionStep` carries. Absent on
   * completions written before this field existed, which is read as "the
   * whole day" (they only ever came from reaching the last step anyway).
   *
   * Optional rather than required for a second reason too: ending a session
   * before it reaches a single work step (closing it from the day page with
   * nothing started) has no exercise to point at.
   */
  throughExerciseIndex: z.number().int().nonnegative().optional(),
});
export type WorkoutCompletion = z.infer<typeof workoutCompletionSchema>;
export type WorkoutCompletionInput = Omit<WorkoutCompletion, "id">;
