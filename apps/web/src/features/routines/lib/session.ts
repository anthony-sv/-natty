import type {
  ExerciseEntry,
  PoseCue,
  SetModifiers,
  SetSegment,
  TrainingDay,
} from "@/data/routines";
import {
  exerciseDisplayName,
  formatAlternatives,
  formatDuration,
  formatRange,
  formatSegment,
  type Formatting,
} from "./format";

/**
 * One step of a guided workout. A day is flattened into an alternating run of
 * `work` and `rest` steps, so the player only ever has to know "which index am
 * I on" — all the structure lives here.
 */
export type SessionStep = WorkStep | PoseStep | RestStep;

export interface WorkStep {
  type: "work";
  id: string;
  exerciseIndex: number;
  /** Library key, for looking up this exercise's logged sets and records. */
  exerciseId: string;
  exerciseName: string;
  kind: ExerciseEntry["kind"];
  isFinisher: boolean;
  /**
   * 1-based, counted across the exercise's prescriptions — **warmups and
   * working sets counted separately**, so a warmup reads "warmup 1 of 2" and
   * the first real set is still "set 1 of 4". Numbering them together would
   * make every routine that adds a warmup look like it grew two sets.
   */
  setNumber: number;
  setsInExercise: number;
  /**
   * A ramp-up set, not a working one. Not loggable, and excluded from the day's
   * working-set count — but it still takes time and still draws a dot, because
   * you do actually perform it.
   */
  isWarmup: boolean;
  reps?: number | [number, number];
  /** Present for cardio/holds — the step runs its own countdown. */
  durationSeconds?: number;
  perSide?: boolean;
  /** Posing hold closing this set, on finishers. */
  pose?: PoseCue;
  notes?: string;
  /** Intensity techniques for this set, from its own prescription phase. */
  modifiers?: SetModifiers;
  /** "or Hack squat" — equally acceptable substitutes, rendered for reading. */
  alternatives?: string;
  /**
   * The same substitutes as ids, so the player can offer them as a swap.
   *
   * Separate from `alternatives` because that one is a sentence and this one is
   * data — deriving ids back out of a rendered, translated string is the kind
   * of thing that works until someone's exercise name contains the word "or".
   */
  alternativeIds: string[];
  /**
   * This step is one leg of a set that runs as a sequence.
   *
   * Present only on segmented sets. Every segment of one set carries the *same*
   * `setNumber`, so "set 2 of 4" keeps counting sets rather than suddenly
   * counting segments, and `StepRef` still matches all of a set's segments to
   * the same logged entries.
   */
  segment?: {
    /** 1-based within the set. */
    index: number;
    total: number;
    detail: SetSegment;
    /** Only the last leg offers logging — see `buildSteps`. */
    isLast: boolean;
  };
}

/**
 * The posing hold closing a finisher set — its own step so it gets a real
 * countdown, the same way rest does, rather than being a line of text on the
 * set you've already finished.
 */
export interface PoseStep {
  type: "pose";
  id: string;
  exerciseIndex: number;
  seconds: number;
  pose: PoseCue;
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

function workLabel(step: WorkStep, { t }: Formatting): string {
  return `${step.exerciseName} — ${t(
    step.isWarmup ? "routines.warmupSetOf" : "routines.setOf",
    { number: step.setNumber, total: step.setsInExercise },
  )}`;
}

/**
 * Flatten a training day into ordered player steps.
 *
 * Multiple prescriptions on one exercise are a ramp (e.g. 2 sets @10-12/90s
 * then 2 more @8-12/120s), not alternatives — so set numbering runs
 * continuously across them and the total is the sum. Rest steps come from each
 * set's own prescription, which is what lets rest change partway through.
 *
 * Naming is injected rather than resolved here, so the steps a player runs on
 * carry names in the reader's language without this module importing a store.
 */
export function buildSteps(day: TrainingDay, f: Formatting): SessionStep[] {
  const steps: SessionStep[] = [];

  day.exercises.forEach((exercise, exerciseIndex) => {
    // Two totals, two counters: a warmup is "warmup 1 of 2" and the working
    // sets still run 1..n. Sharing one counter would renumber every set of
    // every routine that gained a warmup.
    const totals = { warmup: 0, work: 0 };
    for (const p of exercise.prescriptions) {
      totals[p.isWarmup === true ? "warmup" : "work"] += p.sets;
    }
    const counters = { warmup: 0, work: 0 };

    for (const p of exercise.prescriptions) {
      const bucket = p.isWarmup === true ? "warmup" : "work";
      for (let i = 0; i < p.sets; i++) {
        counters[bucket]++;
        const setNumber = counters[bucket];

        const base = {
          type: "work",
          exerciseIndex,
          exerciseId: exercise.exerciseId,
          exerciseName: exerciseDisplayName(exercise, f),
          kind: exercise.kind,
          isFinisher: exercise.isFinisher,
          setNumber,
          setsInExercise: totals[bucket],
          isWarmup: bucket === "warmup",
          perSide: p.perSide,
          notes: exercise.notes,
          modifiers: p.modifiers,
          alternatives: formatAlternatives(exercise, f),
          alternativeIds: exercise.orAlternatives,
        } as const;

        if (p.segments !== undefined) {
          // A segmented set becomes one work step per leg. They're work steps
          // rather than a new type because a hold is already expressible —
          // `durationSeconds` on a work step is what runs cardio's countdown —
          // and a new type would mean a new branch in every consumer.
          p.segments.forEach((detail, segmentIndex) => {
            const isLast = segmentIndex === p.segments!.length - 1;
            steps.push({
              ...base,
              // The bucket is in the id because the two counters both start at
              // 1 — without it a warmup's first set and a working first set
              // would share a key, and React would reuse one for the other.
              id: `${exerciseIndex}-${bucket}${setNumber}-seg${segmentIndex + 1}`,
              reps: detail.kind === "reps" ? detail.count : undefined,
              durationSeconds:
                detail.kind === "hold" ? detail.seconds : undefined,
              // The pose closes the whole set, not each leg of it.
              pose: isLast ? p.pose : undefined,
              segment: {
                index: segmentIndex + 1,
                total: p.segments!.length,
                detail,
                isLast,
              },
            });
          });
        } else {
          steps.push({
            ...base,
            id: `${exerciseIndex}-${bucket}${setNumber}-work`,
            reps: p.reps,
            durationSeconds:
              p.durationSeconds === undefined
                ? undefined
                : countdownSeconds(p.durationSeconds),
            pose: p.pose,
          });
        }

        // The hold belongs between the set and its rest: you finish the reps,
        // hold the pose, then rest. A pose with no `holdSeconds` is a cue to
        // strike rather than something to time, so it stays on the work step.
        if (p.pose?.holdSeconds !== undefined) {
          steps.push({
            type: "pose",
            id: `${exerciseIndex}-${bucket}${setNumber}-pose`,
            exerciseIndex,
            seconds: p.pose.holdSeconds,
            pose: p.pose,
          });
        }

        if (p.restSeconds !== undefined && p.restSeconds > 0) {
          steps.push({
            type: "rest",
            id: `${exerciseIndex}-${bucket}${setNumber}-rest`,
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
    if (next?.type === "work") step.nextLabel = workLabel(next, f);
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
export function describeStep(step: WorkStep, f: Formatting): string {
  // A segment describes itself more precisely than "12 reps" would — pulses and
  // reps are both counts, and only the wording separates them.
  if (step.segment !== undefined) {
    return formatSegment(step.segment.detail, f);
  }
  if (step.reps !== undefined) {
    const range = formatRange(step.reps);
    return step.perSide
      ? f.t("format.repsPerSide", { range })
      : f.t("format.repsOnly", { range });
  }
  if (step.durationSeconds !== undefined) {
    return formatDuration(step.durationSeconds, f);
  }
  return f.t.plural("format.setCount", 1);
}

/**
 * Seconds to auto-start when arriving at `step`, or undefined to wait for an
 * explicit Start. Rest and pose holds begin the moment you tap done — a cardio
 * block doesn't, since you have to get on the machine first.
 *
 * A hold *inside* a set is the one work step that auto-starts, and it's the
 * exact opposite case from cardio: you're already loaded and in position, so
 * making you tap Start after tapping Done is a tap you can't spare mid-set.
 */
export function autoStartSecondsFor(step: SessionStep | undefined): number | undefined {
  if (step?.type === "rest" || step?.type === "pose") return step.seconds;
  if (
    step?.type === "work" &&
    step.segment?.detail.kind === "hold" &&
    step.durationSeconds !== undefined
  ) {
    return step.durationSeconds;
  }
  return undefined;
}

/**
 * Whether this step is where a set gets logged.
 *
 * Every leg of a segmented set is a work step, but the set is one thing you
 * did — offering a log control on all five would read as five separate
 * opportunities and produce five entries for one set. Log at the end, when you
 * know what the whole sequence actually took.
 *
 * **Warmups are never logged, and that is the whole reason `LoggedSet` needed
 * no change.** Two ramp-up sets at half your working weight are not a record,
 * are not volume, and are not a data point about anything — they're how you
 * get ready. Storing them and then teaching the PR frontier, the volume
 * buckets and the heatmap to each exclude them would be three places to get it
 * wrong; not storing them is none.
 */
export function isLoggableStep(step: SessionStep): boolean {
  return (
    step.type === "work" &&
    step.kind !== "cardio" &&
    !step.isWarmup &&
    (step.segment === undefined || step.segment.isLast)
  );
}

/** Total work sets in the day, for a "12 sets" style summary. */
export function countWorkSteps(steps: SessionStep[]): number {
  return steps.filter((s) => s.type === "work").length;
}
