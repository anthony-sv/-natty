import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { getRoutineBySlug, routines, type Routine } from "@/data/routines";
import { userRoutines } from "./collection";

/**
 * Every program: the six built-in ones and anything you wrote.
 *
 * This replaces `routinesQueryOptions` at the call sites that need to see user
 * routines. It stays a live query rather than a TanStack Query fetch because
 * editing a routine has to update the list underneath you — a cached query
 * would need invalidating from every mutation, which is the kind of bookkeeping
 * that gets forgotten in exactly one place.
 */
export function useRoutines(): { routines: Routine[]; isLoading: boolean } {
  const { data, isLoading } = useLiveQuery((q) => q.from({ r: userRoutines }));

  return useMemo(
    () => ({
      // Yours first: the built-ins are reference material you read once, and
      // the one you wrote is the one you open every session.
      routines: [...(data ?? []), ...routines],
      isLoading,
    }),
    [data, isLoading],
  );
}

/**
 * One program by slug, built-in or your own.
 *
 * **Why this isn't a route loader.** `routineQueryOptions` threw `notFound()`
 * from inside the loader for any slug the compiled-in list didn't know — which
 * is every user routine, and the collection may not have loaded when a loader
 * runs anyway. That would 404 a routine that exists, on a hard refresh, some of
 * the time. `isLoading` is what lets the *component* decide, once the answer is
 * actually knowable.
 */
export function useRoutine(slug: string): {
  routine: Routine | undefined;
  /** True while the answer is still unknown — not the same as "not found". */
  isLoading: boolean;
  isCustom: boolean;
} {
  const { data, isLoading } = useLiveQuery((q) => q.from({ r: userRoutines }));

  return useMemo(() => {
    const builtIn = getRoutineBySlug(slug);
    if (builtIn !== undefined) {
      return { routine: builtIn, isLoading: false, isCustom: false };
    }
    const own = (data ?? []).find((routine) => routine.slug === slug);
    return { routine: own, isLoading, isCustom: own !== undefined };
  }, [slug, data, isLoading]);
}
