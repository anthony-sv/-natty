import { useMemo } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { loggedSets } from "./collection";
import { lastSetFor, prFrontier } from "./pr";
import type { LoggedSet } from "./schema";

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

/** Every logged set, grouped by exercise — the /progress overview. */
export interface ExerciseLogGroup {
  exerciseId: string;
  sets: LoggedSet[];
  frontier: LoggedSet[];
  lastPerformedAt: number;
}

export function useLogByExercise(): {
  groups: ExerciseLogGroup[];
  isLoading: boolean;
} {
  const { data, isLoading } = useLiveQuery((q) => q.from({ set: loggedSets }));

  const groups = useMemo(() => {
    const byExercise = new Map<string, LoggedSet[]>();
    for (const set of data ?? []) {
      const existing = byExercise.get(set.exerciseId);
      if (existing) existing.push(set);
      else byExercise.set(set.exerciseId, [set]);
    }
    return [...byExercise.entries()]
      .map(([exerciseId, sets]) => ({
        exerciseId,
        sets,
        frontier: prFrontier(sets),
        lastPerformedAt: Math.max(...sets.map((s) => s.performedAt)),
      }))
      // Most recently trained first — what you did today is what you want to see.
      .sort((a, b) => b.lastPerformedAt - a.lastPerformedAt);
  }, [data]);

  return { groups, isLoading };
}
