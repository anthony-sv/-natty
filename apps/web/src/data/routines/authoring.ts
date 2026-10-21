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

/**
 * Two ramp-up sets ahead of an entry's working sets — about half the working
 * load for 8, then about three-quarters for a few. Never logged and never
 * counted as volume (`isWarmup`); they exist so the first heavy set of the
 * day isn't also the first time the joint has moved under load.
 *
 * The percentages live in the routine notes rather than on the phase: the
 * model has no load figure, on purpose, and the reps falling 8 → 3-5 is what
 * makes `buildSteps` cue "heavier" between them.
 */
export function withWarmup(entry: ExerciseEntry): ExerciseEntry {
  const side = entry.prescriptions[0]?.perSide ? { perSide: true } : {};
  return {
    ...entry,
    prescriptions: [
      { sets: 1, reps: 8, restSeconds: 60, isWarmup: true, ...side },
      { sets: 1, reps: [3, 5], restSeconds: 90, isWarmup: true, ...side },
      ...entry.prescriptions,
    ],
  };
}

/**
 * Turn an entry's last working set into a drop set by splitting it into its
 * own phase — the "technique on the last set only" shape. Drop sets match
 * straight sets for growth at equal volume; what they buy is time, which is
 * why the evidence-based programs put them on isolation lifts only.
 */
export function dropLastSet(entry: ExerciseEntry): ExerciseEntry {
  const last = entry.prescriptions.at(-1);
  if (!last) return entry;
  const rest = entry.prescriptions.slice(0, -1);
  const dropped = { ...last, sets: 1, modifiers: { ...last.modifiers, dropSet: true } };
  return {
    ...entry,
    prescriptions:
      last.sets > 1 ? [...rest, { ...last, sets: last.sets - 1 }, dropped] : [...rest, dropped],
  };
}
