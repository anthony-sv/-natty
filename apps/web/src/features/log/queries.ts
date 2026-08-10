import { useMemo } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { getExercise } from "@/data/exercises";
import { useNames } from "@/i18n/names";
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
  // Names in the reader's language, not the library's English — the table's
  // headings, its cells and the text its search runs over are all this.
  const names = useNames();

  const rows = useMemo(
    () =>
      toRecordRows(data ?? [], {
        exerciseName: (id) => names.exercise(id),
        movementName: (id) => names.movement(id),
        // Aliases stay as authored: they're the spellings you'd *type*, and
        // they're searched rather than shown.
        aliases: (id) => getExercise(id)?.aliases ?? [],
      }),
    [data, names],
  );

  return { rows, isLoading, loggedSetCount: data?.length ?? 0 };
}
