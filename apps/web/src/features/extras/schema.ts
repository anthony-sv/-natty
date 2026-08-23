import { z } from "zod";
import { exerciseEntrySchema } from "@/data/routines";

/**
 * Gym work done against a specific routine day, but not in the routine
 * itself — ad-hoc forearms/abs, or topping up volume on a day cut short.
 *
 * `entry` wraps an `ExerciseEntry` verbatim, which is the whole trick: it's
 * entirely self-contained (nothing in it references the day or a position),
 * so appending one to `day.exercises` is plain concatenation and everything
 * downstream — `buildSteps`, `summariseDay`, `DayExerciseList`,
 * `SessionPlayer`, the log's provenance — works untouched. Same move as
 * `userRoutineSchema` being `routineSchema` verbatim: "a user routine *is* a
 * `Routine`" here becomes "an extra *is* an `ExerciseEntry`". See
 * `composeDay` in `extras.ts` for how it's appended, and why `group` is
 * always stripped on the way in.
 *
 * **Deliberately no expiry field.** A routine that repeats has no calendar
 * pointer for "which lap you're on" — `nextTrainingDay` derives "what's
 * next" from the log rather than tracking one, specifically so it can't
 * drift, and an extra follows the same rule. `createdAt` plus the target
 * day's most recent `WorkoutCompletion` is enough to derive "has this
 * occurrence already happened" without storing a second, competing pointer.
 * See `lastCompletionFor`/`composeDay`.
 */
export const extraWorkSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  /** Which routine day this attaches to — required, including a rest day. */
  routineSlug: z.string(),
  weekNumber: z.number().int().positive(),
  dayNumber: z.number().int().positive(),
  entry: exerciseEntrySchema,
});
export type ExtraWork = z.infer<typeof extraWorkSchema>;

/** What the form supplies; `id`/`createdAt` are minted at insert time. */
export const extraWorkInputSchema = extraWorkSchema.omit({
  id: true,
  createdAt: true,
});
export type ExtraWorkInput = z.infer<typeof extraWorkInputSchema>;
