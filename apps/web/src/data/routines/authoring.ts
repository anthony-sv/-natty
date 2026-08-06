import { warmupRefsFor } from "./warmup-refs";
import type { ExerciseEntry, Prescription, TrainingDay } from "./schema";

type NumOrRange = number | [number, number];

/** A regular working exercise with a single prescription phase. */
export function ex(
  name: string,
  reps: NumOrRange,
  sets: number,
  restSeconds: number,
  opts: Partial<Prescription> = {},
): ExerciseEntry {
  return {
    name,
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
    name,
    kind: "resistance",
    isFinisher: false,
    prescriptions: phases,
  };
}

/**
 * A high-rep "finisher" set done at the end of a muscle group's work: a
 * fixed 7-set count (implied by convention in every source doc — none of
 * them spell out "7 sets" explicitly), always short 30s rest, and a
 * posing/flex cue instead of a plain rest note.
 */
export function finisher(
  name: string,
  cue: string,
  reps: NumOrRange = [15, 20],
): ExerciseEntry {
  return {
    name,
    kind: "resistance",
    isFinisher: true,
    prescriptions: [{ sets: 7, reps, restSeconds: 30, cue }],
  };
}

export function cardio(
  name: string,
  durationSeconds: NumOrRange,
): ExerciseEntry {
  return {
    name,
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
