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
  /**
   * Working sets only. A warmup is excluded here and counted in `warmupSets`,
   * because "18 sets" should mean eighteen sets that count — a day whose
   * number jumps because you wrote your ramp-ups down is a number that stopped
   * being comparable to last week's.
   */
  workingSets: number;
  /** Ramp-up sets. They cost time, so the estimate still charges for them. */
  warmupSets: number;
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
    // Sets, not steps. A set that runs as a sequence is several work steps and
    // still one set — counting steps reported a three-set exercise as fifteen.
    workingSets: steps.filter((s) => isSetEnd(s) && !isWarmupStep(s)).length,
    warmupSets: steps.filter((s) => isSetEnd(s) && isWarmupStep(s)).length,
    finishers: day.exercises.filter((exercise) => exercise.isFinisher).length,
    // Warmups are charged here even though they're not counted above: they
    // take just as long as a working set, and an estimate that skipped them
    // would send you home early.
    estimatedSeconds: steps.reduce(secondsForStep, 0),
  };
}

/** The step that completes a set: an unsegmented one, or a sequence's last leg. */
function isSetEnd(step: SessionStep): boolean {
  return step.type === "work" && (step.segment?.isLast ?? true);
}

function isWarmupStep(step: SessionStep): boolean {
  return step.type === "work" && step.isWarmup;
}

function secondsForStep(total: number, step: SessionStep): number {
  if (step.type === "rest" || step.type === "pose") return total + step.seconds;
  // Timed things carry a real duration — cardio blocks and holds inside a set.
  if (step.durationSeconds !== undefined) return total + step.durationSeconds;
  // The guess is per *set*, so a sequence's untimed legs don't each charge it
  // again. Multiplying the one guess in the estimate by five would be a worse
  // error than under-counting the pulses.
  return total + (isSetEnd(step) ? WORK_SET_SECONDS : 0);
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
 *
 * Warmups are counted here, unlike in `workingSets`: the dots are a picture of
 * what you'll actually do, and a row whose marks didn't include the ramp-ups
 * would under-draw the exercise you spend longest on.
 */
export function setsPerExercise(day: TrainingDay): number[] {
  return day.exercises.map((exercise) =>
    exercise.prescriptions.reduce((sets, p) => sets + p.sets, 0),
  );
}

/** Of those sets, how many are warmups — so the dots can draw them differently. */
export function warmupSetsPerExercise(day: TrainingDay): number[] {
  return day.exercises.map((exercise) =>
    exercise.prescriptions.reduce(
      (sets, p) => sets + (p.isWarmup === true ? p.sets : 0),
      0,
    ),
  );
}
