import type { ExerciseEntry, TrainingDay } from "@/data/routines";
import { formatDuration, formatRange } from "./format";

/**
 * One step of a guided workout. A day is flattened into an alternating run of
 * `work` and `rest` steps, so the player only ever has to know "which index am
 * I on" — all the structure lives here.
 */
export type SessionStep = WorkStep | RestStep;

export interface WorkStep {
  type: "work";
  id: string;
  exerciseIndex: number;
  exerciseName: string;
  kind: ExerciseEntry["kind"];
  isFinisher: boolean;
  /** 1-based, counted across *all* of the exercise's prescriptions. */
  setNumber: number;
  setsInExercise: number;
  reps?: number | [number, number];
  /** Present for cardio/holds — the step runs its own countdown. */
  durationSeconds?: number;
  perSide?: boolean;
  cue?: string;
  notes?: string;
}

export interface RestStep {
  type: "rest";
  id: string;
  seconds: number;
  /** The exercise this rest belongs to, for highlighting the day list. */
  exerciseIndex: number;
  /** "Machine dips — set 1 of 2"; empty if nothing follows. */
  nextLabel: string;
}

/** A duration may be authored as a range; the countdown uses the upper bound. */
function countdownSeconds(value: number | [number, number]): number {
  return Array.isArray(value) ? value[1] : value;
}

function workLabel(step: WorkStep): string {
  return `${step.exerciseName} — set ${step.setNumber} of ${step.setsInExercise}`;
}

/**
 * Flatten a training day into ordered player steps.
 *
 * Multiple prescriptions on one exercise are a ramp (e.g. 2 sets @10-12/90s
 * then 2 more @8-12/120s), not alternatives — so set numbering runs
 * continuously across them and the total is the sum. Rest steps come from each
 * set's own prescription, which is what lets rest change partway through.
 */
export function buildSteps(day: TrainingDay): SessionStep[] {
  const steps: SessionStep[] = [];

  day.exercises.forEach((exercise, exerciseIndex) => {
    const setsInExercise = exercise.prescriptions.reduce(
      (total, p) => total + p.sets,
      0,
    );
    let setNumber = 0;

    for (const p of exercise.prescriptions) {
      for (let i = 0; i < p.sets; i++) {
        setNumber++;
        steps.push({
          type: "work",
          id: `${exerciseIndex}-${setNumber}-work`,
          exerciseIndex,
          exerciseName: exercise.name,
          kind: exercise.kind,
          isFinisher: exercise.isFinisher,
          setNumber,
          setsInExercise,
          reps: p.reps,
          durationSeconds:
            p.durationSeconds === undefined
              ? undefined
              : countdownSeconds(p.durationSeconds),
          perSide: p.perSide,
          cue: p.cue,
          notes: exercise.notes,
        });

        if (p.restSeconds !== undefined && p.restSeconds > 0) {
          steps.push({
            type: "rest",
            id: `${exerciseIndex}-${setNumber}-rest`,
            seconds: p.restSeconds,
            exerciseIndex,
            nextLabel: "",
          });
        }
      }
    }
  });

  // A rest step that ended up last has nothing to rest *for* — drop it.
  while (steps.length > 0 && steps[steps.length - 1].type === "rest") {
    steps.pop();
  }

  // Second pass: a rest step announces the work step that follows it.
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.type !== "rest") continue;
    const next = steps[i + 1];
    if (next?.type === "work") step.nextLabel = workLabel(next);
  }

  return steps;
}

/**
 * The target line for a single set, e.g. "10-15 reps" or "20 min".
 *
 * Deliberately not `formatPrescription` — that formats a whole prescription
 * ("2×10-15"), and inside the player the set count is already shown as
 * "set 1 of 2", so repeating it would read as "1×10-15".
 */
export function describeStep(step: WorkStep): string {
  if (step.reps !== undefined) {
    return `${formatRange(step.reps)} reps${step.perSide ? " per side" : ""}`;
  }
  if (step.durationSeconds !== undefined) {
    return formatDuration(step.durationSeconds);
  }
  return "1 set";
}

/** Total work sets in the day, for a "12 sets" style summary. */
export function countWorkSteps(steps: SessionStep[]): number {
  return steps.filter((s) => s.type === "work").length;
}
