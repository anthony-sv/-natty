import { useMemo } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
  exercises,
  getExercise,
  movementOf,
  muscleSchema,
  musclesForExercise,
  type MuscleId,
} from "@/data/exercises";
import { useNames } from "@/i18n/names";
import { loggedSets } from "./collection";
import { lastSetFor, prFrontier } from "./pr";
import { toRecordRows, type RecordRow } from "./records";
import {
  muscleGaps,
  weeklyVolume,
  type ExerciseAnatomy,
  type MuscleGap,
  type WeekVolume,
} from "./volume";

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

/**
 * The library's anatomy, as the shape `volume.ts` takes.
 *
 * Built once at module scope: it reads nothing but the compiled-in exercise
 * data, so there is no reason to rebuild it per render, and `weeklyVolume` puts
 * it in a `useMemo` dependency list where a fresh object would defeat the memo.
 */
const ANATOMY: ExerciseAnatomy = {
  muscles: (exerciseId) => {
    const exercise = getExercise(exerciseId);
    if (exercise === undefined) return { primary: [], secondary: [] };
    const { primaryMuscles, secondaryMuscles } = musclesForExercise(exercise);
    return { primary: primaryMuscles, secondary: secondaryMuscles };
  },
  pattern: (exerciseId) => {
    const exercise = getExercise(exerciseId);
    return exercise ? movementOf(exercise).pattern : undefined;
  },
};

/**
 * Every muscle some exercise in the library lists as primary.
 *
 * Resolved through `musclesForExercise` rather than off `movements`, because an
 * exercise can override its movement — no movement makes forearms primary, but
 * the reverse curl does, so forearms *are* directly trainable and glutes are
 * not. That distinction is the whole point of the gaps card.
 */
const TRAINABLE_DIRECTLY: ReadonlySet<MuscleId> = new Set(
  exercises.flatMap((exercise) => musclesForExercise(exercise).primaryMuscles),
);

/** Training volume by week, with the muscles going without direct work. */
export function useVolume(
  /** Read once by the caller, so nothing reads the clock during render. */
  now: number,
): {
  weeks: WeekVolume[];
  gaps: MuscleGap[];
  isLoading: boolean;
  loggedSetCount: number;
} {
  const { data, isLoading } = useLiveQuery((q) => q.from({ set: loggedSets }));

  const weeks = useMemo(
    () => weeklyVolume(data ?? [], ANATOMY, now),
    [data, now],
  );
  const gaps = useMemo(
    () => muscleGaps(weeks, muscleSchema.options, TRAINABLE_DIRECTLY),
    [weeks],
  );

  return { weeks, gaps, isLoading, loggedSetCount: data?.length ?? 0 };
}
