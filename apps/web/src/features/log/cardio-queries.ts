import { useMemo } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { cardioEntriesFork } from "./cardio-collection";

/** Every cardio entry logged for one exercise, with the most recent one — the cardio equivalent of `useExerciseLog`. */
export function useCardioLog(exerciseId: string | undefined) {
  const cardioEntries = cardioEntriesFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) =>
      exerciseId === undefined
        ? undefined
        : q
            .from({ entry: cardioEntries })
            .where(({ entry }) => eq(entry.exerciseId, exerciseId)),
    [exerciseId, cardioEntries],
  );

  const entries = useMemo(() => data ?? [], [data]);

  return useMemo(() => {
    const last = [...entries].sort((a, b) => b.performedAt - a.performedAt)[0];
    return { entries, last, isLoading };
  }, [entries, isLoading]);
}
