import {
  createCollection,
  localStorageCollectionOptions,
  useLiveQuery,
} from "@tanstack/react-db";
import { useMemo } from "react";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteWorkoutCompletions,
  fetchWorkoutCompletions,
  upsertWorkoutCompletions,
} from "@/server/completions";
import {
  workoutCompletionSchema,
  type WorkoutCompletion,
  type WorkoutCompletionInput,
} from "./completion-schema";

/**
 * One row per workout run all the way to "Finish" — see `completion-schema.ts`
 * for why this exists as its own collection rather than a flag on `LoggedSet`.
 *
 * Forked the same way `cardio-collection.ts` is: local by default, a synced
 * query collection over `server/completions.ts` once signed in.
 */
const localWorkoutCompletions = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.completions.v1",
    getKey: (row) => row.id,
    schema: workoutCompletionSchema,
  }),
);

export const workoutCompletionsFork = forkCollection({
  queryKey: "workout-completions",
  local: localWorkoutCompletions,
  getKey: (row) => row.id,
  fetch: () => fetchWorkoutCompletions(),
  upsert: (rows) => upsertWorkoutCompletions({ data: rows }),
  remove: (ids) => deleteWorkoutCompletions({ data: ids }),
});

const workoutCompletions = () => workoutCompletionsFork.active();

export { localWorkoutCompletions, workoutCompletions };

/** Record that a workout was finished. */
export function logCompletion(input: WorkoutCompletionInput) {
  const completion: WorkoutCompletion = { ...input, id: crypto.randomUUID() };
  const transaction = workoutCompletions().insert(completion);
  return { completion, transaction };
}

/** Every completion, live — re-subscribes when sign-in swaps the backing. */
export function useCompletions(): WorkoutCompletion[] {
  const collection = workoutCompletionsFork.useActive();
  const { data } = useLiveQuery(
    (q) => q.from({ c: collection }),
    [collection],
  );
  return useMemo(() => data ?? [], [data]);
}
