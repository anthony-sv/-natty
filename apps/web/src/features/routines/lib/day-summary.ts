import type { TrainingDay } from "@/data/routines";
import type { Formatting } from "./format";
import { buildSteps, type SessionStep } from "./session";

/**
 * How much work a day is, at a glance.
 *
 * Derived from the same `buildSteps` the player runs on, rather than counted
 * off the prescriptions separately — two counts of the same thing drift, and
 * the step list already resolves finishers, pose holds and trailing rests.
 */
export interface DaySummary {
  exercises: number;
  /** Every set you perform, across every phase of every exercise. */
  workingSets: number;
  finishers: number;
  /** Rough wall-clock, in seconds. See `WORK_SET_SECONDS`. */
  estimatedSeconds: number;
}

/**
 * Assumed time under the bar for a set with no clock on it.
 *
 * A guess, and the only guess in the estimate — everything else (rest, pose
 * holds, cardio) carries its own duration. Deliberately generous: it covers
 * walking to the rack and loading it, which is most of what makes a real
 * session run longer than the arithmetic says.
 */
const WORK_SET_SECONDS = 45;

export function summariseDay(day: TrainingDay, f: Formatting): DaySummary {
  // Only the counts and the estimate are used here, so the naming `buildSteps`
  // needs is passed straight through rather than mattering to the result.
  const steps = buildSteps(day, f);

  return {
    exercises: day.exercises.length,
    workingSets: steps.filter((step) => step.type === "work").length,
    finishers: day.exercises.filter((exercise) => exercise.isFinisher).length,
    estimatedSeconds: steps.reduce(secondsForStep, 0),
  };
}

function secondsForStep(total: number, step: SessionStep): number {
  if (step.type === "rest" || step.type === "pose") return total + step.seconds;
  // Cardio and timed holds carry a real duration; everything else is the guess.
  return total + (step.durationSeconds ?? WORK_SET_SECONDS);
}

/** "1h 05m" or "48m" — minutes only, since the estimate isn't finer than that. */
export function formatEstimate(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
}

/**
 * How many sets each exercise contributes, in day order.
 *
 * Separate from the totals because the row-level dots need it per exercise and
 * recomputing `buildSteps` per row would rebuild the whole day each time.
 */
export function setsPerExercise(day: TrainingDay): number[] {
  return day.exercises.map((exercise) =>
    exercise.prescriptions.reduce((sets, p) => sets + p.sets, 0),
  );
}
