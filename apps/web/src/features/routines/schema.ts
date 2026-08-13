import { z } from "zod";
import { routineSchema } from "@/data/routines";

/**
 * A routine you wrote yourself.
 *
 * `routineSchema` verbatim plus two timestamps, which is the whole trick: a
 * user routine **is** a `Routine`, so `buildSteps`, `summariseRoutine`,
 * `summariseDay`, the day page, the player and the log's provenance all work on
 * it with no change at all. Anything less faithful would have meant a second
 * renderer for every one of those.
 *
 * Kept out of `collection.ts` so the server can validate a synced routine
 * without importing a module that builds a localStorage collection at import
 * time — the same reason every other feature keeps its schema in its own file.
 */
export const userRoutineSchema = routineSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type UserRoutine = z.infer<typeof userRoutineSchema>;
