import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { getRoutineBySlug, routines, type Routine } from "@/data/routines";
import { userRoutinesFork } from "./collection";

/**
 * Every program: the six built-in ones and anything you wrote.
 *
 * This replaces `routinesQueryOptions` at the call sites that need to see user
 * routines. It stays a live query rather than a TanStack Query fetch because
 * editing a routine has to update the list underneath you — a cached query
 * would need invalidating from every mutation, which is the kind of bookkeeping
 * that gets forgotten in exactly one place.
 */
/**
 * A user routine saved at a *built-in's* slug replaces it everywhere.
 *
 * That's what makes the built-ins editable without cluttering the list: an
 * edit stores your version at the same slug, and the compiled-in original
 * drops out of every list and picker rather than sitting beside it under
 * nearly the same name. The file is still there, so "reset to the original" is
 * just deleting your override.
 *
 * Exported because `useRoutine` has to agree with this — two places deciding
 * which version wins is two places to disagree.
 */
export function overrides(userRoutines: Routine[]): Set<string> {
  const mine = new Set(userRoutines.map((routine) => routine.slug));
  return new Set(routines.map((r) => r.slug).filter((slug) => mine.has(slug)));
}

export function useRoutines(): { routines: Routine[]; isLoading: boolean } {
  const userRoutines = userRoutinesFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ r: userRoutines }),
    [userRoutines],
  );

  return useMemo(() => {
    const mine = data ?? [];
    const replaced = overrides(mine);
    return {
      // Yours first: the built-ins are reference material you read once, and
      // the one you wrote is the one you open every session.
      routines: [...mine, ...routines.filter((r) => !replaced.has(r.slug))],
      isLoading,
    };
  }, [data, isLoading]);
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
  /**
   * This slug names a built-in that you've edited, so `routine` is your
   * version and the shipped one is recoverable by deleting it.
   */
  isOverridden: boolean;
} {
  const userRoutines = userRoutinesFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ r: userRoutines }),
    [userRoutines],
  );

  return useMemo(() => {
    // **Yours is checked first**, which is the whole override mechanism. The
    // built-in used to win, so an edit saved at its slug would have been
    // written and then never shown.
    const own = (data ?? []).find((routine) => routine.slug === slug);
    const builtIn = getRoutineBySlug(slug);

    if (own !== undefined) {
      return {
        routine: own,
        isLoading: false,
        isCustom: true,
        isOverridden: builtIn !== undefined,
      };
    }
    if (builtIn !== undefined) {
      return {
        routine: builtIn,
        isLoading: false,
        isCustom: false,
        isOverridden: false,
      };
    }
    // Not yours and not built-in: genuinely missing, but only once the
    // collection has actually loaded.
    return { routine: undefined, isLoading, isCustom: false, isOverridden: false };
  }, [slug, data, isLoading]);
}
