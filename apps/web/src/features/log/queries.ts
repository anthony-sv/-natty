import { useMemo } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { muscleSchema } from "@/data/exercises";
import type { Routine } from "@/data/routines";
import { useLibrary } from "@/features/library/use-library";
import { useRoutines } from "@/features/routines/use-routines";
import { useNames } from "@/i18n/names";
import { loggedSetsFork } from "./collection";
import { useCompletions } from "./completion-collection";
import { muscleFatigue, type MuscleFatigue, type RoutineDayExercises } from "./fatigue";
import { lastSetFor, prFrontier } from "./pr";
import { toRecordRows, type RecordRow } from "./records";
import {
  tonnageFor,
  type TonnageScope,
  type TonnageTotals,
} from "./tonnage";
import {
  muscleGaps,
  weeklyVolume,
  type MuscleGap,
  type WeekVolume,
} from "./volume";

/**
 * Resolves a `WorkoutCompletion`'s exercises against the real routine list —
 * the concrete `RoutineDayExercises` `fatigue.ts` asks for.
 */
function dayLookupFor(routines: Routine[]): RoutineDayExercises {
  return {
    exercisesFor: (routineSlug, weekNumber, dayNumber) => {
      const routine = routines.find((r) => r.slug === routineSlug);
      const week = routine?.weeks.find((w) => w.weekNumber === weekNumber);
      const day = week?.days.find((d) => d.dayNumber === dayNumber);
      return day?.exercises.map((entry) => entry.exerciseId);
    },
  };
}

/**
 * Everything logged for one exercise, with its records and most recent set.
 *
 * The live query narrows to the exercise; the frontier is derived in a memo
 * rather than in the query because it's an ordering problem across the whole
 * result, not something the query builder expresses.
 */
export function useExerciseLog(exerciseId: string | undefined) {
  const loggedSets = loggedSetsFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) =>
      exerciseId === undefined
        ? undefined
        : q
            .from({ set: loggedSets })
            .where(({ set }) => eq(set.exerciseId, exerciseId)),
    [exerciseId, loggedSets],
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
  const loggedSets = loggedSetsFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ set: loggedSets }),
    [loggedSets],
  );
  // Names in the reader's language, not the library's English — the table's
  // headings, its cells and the text its search runs over are all this.
  const names = useNames();
  const library = useLibrary();

  const rows = useMemo(
    () =>
      toRecordRows(data ?? [], {
        exerciseName: (id) => names.exercise(id),
        movementName: (id) => names.movement(id),
        // Aliases stay as authored: they're the spellings you'd *type*, and
        // they're searched rather than shown. Read off the merged library so a
        // custom exercise's aliases are searchable too.
        aliases: (id) => library.byId(id)?.aliases ?? [],
      }),
    [data, names, library],
  );

  return { rows, isLoading, loggedSetCount: data?.length ?? 0 };
}

/**
 * Training volume by week, with the muscles going without direct work.
 *
 * The anatomy and the directly-trainable set both come from `useLibrary` rather
 * than from the compiled-in data, so a lift you added yourself counts toward
 * its muscles and its split like any other. They used to be module-scope
 * constants; they can't be, now that half the library arrives at runtime.
 */
export function useVolume(
  /** Read once by the caller, so nothing reads the clock during render. */
  now: number,
): {
  weeks: WeekVolume[];
  gaps: MuscleGap[];
  isLoading: boolean;
  loggedSetCount: number;
} {
  const loggedSets = loggedSetsFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ set: loggedSets }),
    [loggedSets],
  );
  const { anatomy, trainableDirectly } = useLibrary();

  const weeks = useMemo(
    () => weeklyVolume(data ?? [], anatomy, now),
    [data, anatomy, now],
  );
  const gaps = useMemo(
    () => muscleGaps(weeks, muscleSchema.options, trainableDirectly),
    [weeks, trainableDirectly],
  );

  return { weeks, gaps, isLoading, loggedSetCount: data?.length ?? 0 };
}

/**
 * How recovered each muscle is right now, off the same anatomy `useVolume`
 * reads — `useLibrary().anatomy` already is the `ExerciseAnatomy` this needs,
 * so nothing new is threaded through the library layer for it.
 *
 * Also reads completions and routines, because a day finished with nothing
 * logged is direct work too — see `fatigue.ts` for why the clock has to know
 * that, or it silently disagrees with the streak and the heatmap about what
 * "trained" means.
 */
export function useFatigue(
  /** Read once by the caller, so nothing reads the clock during render. */
  now: number,
): { muscles: MuscleFatigue[]; isLoading: boolean; loggedSetCount: number } {
  const loggedSets = loggedSetsFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ set: loggedSets }),
    [loggedSets],
  );
  const { anatomy } = useLibrary();
  const completions = useCompletions();
  const { routines, isLoading: routinesLoading } = useRoutines();
  const dayLookup = useMemo(() => dayLookupFor(routines), [routines]);

  const muscles = useMemo(
    () =>
      muscleFatigue(
        data ?? [],
        completions,
        anatomy,
        dayLookup,
        muscleSchema.options,
        now,
      ),
    [data, completions, anatomy, dayLookup, now],
  );

  return {
    muscles,
    isLoading: isLoading || routinesLoading,
    loggedSetCount: data?.length ?? 0,
  };
}

/**
 * Total tonnage over a window, per muscle.
 *
 * Its own hook rather than a field on `useVolume`: that one buckets every set
 * into weeks whatever you asked for, and re-running it because a scope select
 * changed would redo a year of grouping to answer a question about one month.
 */
export function useTonnage(
  scope: TonnageScope,
  /** Read once by the caller, so nothing reads the clock during render. */
  now: number,
): { totals: TonnageTotals; isLoading: boolean } {
  const loggedSets = loggedSetsFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ set: loggedSets }),
    [loggedSets],
  );
  const { anatomy } = useLibrary();

  const totals = useMemo(
    () => tonnageFor(data ?? [], anatomy, scope, now),
    [data, anatomy, scope, now],
  );

  return { totals, isLoading };
}
