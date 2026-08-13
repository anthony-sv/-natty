import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { userExercisesFork } from "./collection";
import { mergeLibrary, type MergedLibrary } from "./merged";

/**
 * The exercise library, built-ins and your own together.
 *
 * Memoised on the collection's rows because several callers put the result —
 * or its `anatomy` — in a `useMemo` dependency list, where a fresh object each
 * render would rebuild a year of volume on every unrelated change. Same reason
 * `useNames` memoises on the locale.
 */
export function useLibrary(): MergedLibrary & { isLoading: boolean } {
  const userExercises = userExercisesFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ e: userExercises }),
    [userExercises],
  );

  const merged = useMemo(() => mergeLibrary(data ?? []), [data]);

  return { ...merged, isLoading };
}
