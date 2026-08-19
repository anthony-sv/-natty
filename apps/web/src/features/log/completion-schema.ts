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
});
export type WorkoutCompletion = z.infer<typeof workoutCompletionSchema>;
export type WorkoutCompletionInput = Omit<WorkoutCompletion, "id">;
