import { useMemo } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getExercise, getMovement } from "@/data/exercises";
import { loggedSets } from "./collection";
import { lastSetFor, prFrontier } from "./pr";
import { toRecordRows, type RecordRow } from "./records";

/**
 * Everything logged for one exercise, with its records and most recent set.
 *
 * The live query narrows to the exercise; the frontier is derived in a memo
 * rather than in the query because it's an ordering problem across the whole
 * result, not something the query builder expresses.
 */
export function useExerciseLog(exerciseId: string | undefined) {
  const { data, isLoading } = useLiveQuery(
    (q) =>
      exerciseId === undefined
        ? undefined
        : q
            .from({ set: loggedSets })
            .where(({ set }) => eq(set.exerciseId, exerciseId)),
    [exerciseId],
  );

  const sets = useMemo(() => data ?? [], [data]);

  return useMemo(
    () => ({
      sets,
      frontier: prFrontier(sets),
      last: lastSetFor(sets),
      isLoading,
    }),
    [sets, isLoading],
  );
}

/**
 * Every record across every exercise, one row each — what /progress shows.
 *
 * The naming is resolved here rather than in the column definitions so the
 * exercise name is part of the row, and therefore part of what the table's
 * global filter searches.
 */
export function useAllRecords(): {
  rows: RecordRow[];
  isLoading: boolean;
  loggedSetCount: number;
} {
  const { data, isLoading } = useLiveQuery((q) => q.from({ set: loggedSets }));

  const rows = useMemo(
    () =>
      toRecordRows(data ?? [], {
        exerciseName: (id) => getExercise(id)?.name ?? id,
        movementName: (id) => {
          const exercise = getExercise(id);
          return exercise ? getMovement(exercise.movementId)?.name : undefined;
        },
      }),
    [data],
  );

  return { rows, isLoading, loggedSetCount: data?.length ?? 0 };
}
