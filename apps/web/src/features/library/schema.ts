import { z } from "zod";
import { movementPatternSchema, muscleSchema } from "@/data/exercises";

/**
 * A lift you added yourself.
 *
 * **It names its muscles and pattern directly rather than pointing at a
 * movement.** Asking someone to pick from 42 movements to add one exercise is a
 * worse question than "what does it work", and the two fields it does carry are
 * `muscleSchema` and `movementPatternSchema` verbatim — which is exactly what
 * lets per-muscle volume, the push/pull/legs split and the gaps card read a
 * custom exercise with no change to any of them.
 *
 * The cost is that a custom exercise has no movement to roll up to, so it
 * doesn't appear in an exercise's "movement" column and can't be substituted by
 * facet distance. Both are worth losing: a movement is a claim that two
 * variants are the same lift, and only the built-in library has the curation to
 * make that claim.
 */
export const userExerciseSchema = z.object({
  /**
   * `user:<uuid>`. The prefix guarantees no collision with a kebab-case
   * built-in id, survives a built-in of the same name landing later, and makes
   * it obvious in a stored log row which sets are against a custom lift.
   */
  id: z.string().startsWith("user:"),
  name: z.string().min(1),
  /** Other spellings that should resolve here, matched like built-in aliases. */
  aliases: z.array(z.string()).default([]),
  /** Drives the push/pull/legs split. */
  pattern: movementPatternSchema,
  primaryMuscles: z.array(muscleSchema).min(1),
  secondaryMuscles: z.array(muscleSchema).default([]),
  /**
   * Hidden from every picker, but still resolving everywhere.
   *
   * Deleting a lift you have history against would orphan those sets and leave
   * a raw id in the records table, the charts and the heatmap. Archiving stops
   * you logging against it again while keeping every set you already logged
   * readable — and it's reversible, which deleting isn't.
   */
  archivedAt: z.number().optional(),
  createdAt: z.number(),
  notes: z.string().optional(),
});
export type UserExercise = z.infer<typeof userExerciseSchema>;

/** What the create/edit form produces; the collection adds `id` and `createdAt`. */
export type UserExerciseInput = Omit<UserExercise, "id" | "createdAt">;
