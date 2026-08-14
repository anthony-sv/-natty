import { resolveExerciseName } from "@/data/exercises";
import { resolvePoseName } from "@/data/poses";
import { warmupRefsFor } from "./warmup-refs";
import type {
  ExerciseEntry,
  Prescription,
  SetModifiers,
  TrainingDay,
} from "./schema";

type NumOrRange = number | [number, number];

/**
 * Resolve a source-doc spelling to a library id.
 *
 * Throws rather than falling back, so a name the library doesn't know fails at
 * import time — a typo or a genuinely new lift can't slip through as an entry
 * that renders blank. `exercises.test.ts` covers the same ground ahead of time;
 * this is the backstop for anything added later.
 */
function idFor(sourceName: string): string {
  const exercise = resolveExerciseName(sourceName);
  if (!exercise) {
    throw new Error(
      `Unknown exercise "${sourceName}" — add it (or an alias) to src/data/exercises/exercises.ts.`,
    );
  }
  return exercise.id;
}

/**
 * Apply intensity techniques to every phase of an entry.
 *
 * Wraps rather than being an argument because the per-program shorthands
 * (`acc`, `heavyRamp`, `rampDefault`) don't take prescription options, and the
 * source docs attach these to the whole exercise anyway. For a technique on
 * only some sets, give the exercise its own phases and set `modifiers` on the
 * one that needs it.
 */
export function withModifiers(
  entry: ExerciseEntry,
  modifiers: SetModifiers,
): ExerciseEntry {
  return {
    ...entry,
    prescriptions: entry.prescriptions.map((p) => ({
      ...p,
      modifiers: { ...p.modifiers, ...modifiers },
    })),
  };
}

/**
 * Record equally acceptable substitutes — the docs' "Db shoulder press/machine".
 * Takes source spellings, like everything else in the program files.
 */
export function orElse(
  entry: ExerciseEntry,
  ...alternatives: string[]
): ExerciseEntry {
  return { ...entry, orAlternatives: alternatives.map(idFor) };
}

/** A regular working exercise with a single prescription phase. */
export function ex(
  name: string,
  reps: NumOrRange,
  sets: number,
  restSeconds: number,
  opts: Partial<Prescription> = {},
): ExerciseEntry {
  return {
    exerciseId: idFor(name),
    orAlternatives: [],
    kind: "resistance",
    isFinisher: false,
    prescriptions: [{ sets, reps, restSeconds, ...opts }],
  };
}

/** A ramping/pyramid exercise: multiple prescription phases in order. */
export function ramp(
  name: string,
  phases: Array<{ sets: number; reps: NumOrRange; restSeconds: number }>,
): ExerciseEntry {
  return {
    exerciseId: idFor(name),
    orAlternatives: [],
    kind: "resistance",
    isFinisher: false,
    prescriptions: phases,
  };
}

/**
 * What a finisher is, as numbers.
 *
 * Every finisher closes on a 10-second hold. The Bulking and Cutting
 * docs spell this out on all 86 of their finisher lines ("Most muscular flex
 * 10 secs"); the four per-muscle program docs omit it the same way they omit the
 * 7-set count, so the convention fills both in.
 *
 * Exported because the routine builder seeds the same shape when you flip an
 * exercise to a finisher. Two copies of "7 sets, 30s rest, a 10s hold" would
 * drift, and the one that drifted would be the one nobody reads — a routine you
 * wrote yourself, sitting beside six transcribed ones that disagree with it.
 */
export const FINISHER_CONVENTION = {
  sets: 7,
  reps: [15, 20] as [number, number],
  restSeconds: 30,
  holdSeconds: 10,
} as const;

/**
 * A high-rep "finisher" set done at the end of a muscle group's work: a
 * fixed 7-set count (implied by convention in every source doc — none of
 * them spell out "7 sets" explicitly), always short 30s rest, and a posing
 * hold instead of a plain rest note.
 *
 * `holdSeconds` is overridable for a finisher that breaks the convention.
 */
export function finisher(
  name: string,
  poseName: string,
  reps: NumOrRange = FINISHER_CONVENTION.reps,
  holdSeconds: number = FINISHER_CONVENTION.holdSeconds,
): ExerciseEntry {
  const pose = resolvePoseName(poseName);
  if (!pose) {
    throw new Error(
      `Unknown pose "${poseName}" — add it (or an alias) to src/data/poses.ts.`,
    );
  }
  return {
    exerciseId: idFor(name),
    orAlternatives: [],
    kind: "resistance",
    isFinisher: true,
    prescriptions: [
      {
        sets: FINISHER_CONVENTION.sets,
        reps,
        restSeconds: FINISHER_CONVENTION.restSeconds,
        pose: { poseId: pose.id, holdSeconds },
      },
    ],
  };
}

export function cardio(
  name: string,
  durationSeconds: NumOrRange,
): ExerciseEntry {
  return {
    exerciseId: idFor(name),
    orAlternatives: [],
    kind: "cardio",
    isFinisher: false,
    prescriptions: [{ sets: 1, durationSeconds }],
  };
}

export function day(
  dayNumber: number,
  label: string,
  exercises: ExerciseEntry[],
): TrainingDay {
  return {
    dayNumber,
    label,
    isRest: false,
    exercises,
    warmupRefs: warmupRefsFor(label),
  };
}

export function restDay(dayNumber: number): TrainingDay {
  return { dayNumber, label: "Rest", isRest: true, exercises: [], warmupRefs: [] };
}
