import type { MovementPattern, MuscleId } from "@/data/exercises";
import { startOfWeek } from "@/lib/week";
import type { WorkoutCompletion } from "./completion-schema";
import type { LoggedSet } from "./schema";

/**
 * How much work each muscle actually got, week by week.
 *
 * The library has carried primary and secondary muscles on every movement since
 * it was written and nothing has ever read them. This is what reads them: sets
 * per muscle per week is the figure hypertrophy programming runs on, and the
 * app already logs everything needed to derive it.
 *
 * Pure and injected, like `pr.ts` and `records.ts` — no exercise library, no
 * collection, so it tests against fixtures rather than against 113 real
 * exercises.
 */

/**
 * `core` is a fourth resistance bucket, not a fold-in.
 *
 * Direct ab work is genuinely none of push, pull or legs, and putting a
 * hanging leg raise in "legs" would quietly stop the legs number meaning what
 * it says. It arrived with the first exercises that make abs primary — before
 * those, nothing in the library could have counted toward it.
 */
export type TrainingSplit = "push" | "pull" | "legs" | "core" | "cardio";

/**
 * The four that make up a lifting week.
 *
 * Its own type rather than a filtered array, so the chart and the tiles that
 * only ever render resistance work can't be handed `"cardio"` — that's a real
 * measurement, but it isn't resistance volume and doesn't belong in the same
 * stack.
 */
export type ResistanceSplit = Exclude<TrainingSplit, "cardio">;

/**
 * Which half of a push/pull/legs week a movement belongs to.
 *
 * Keyed on the movement's mechanical *pattern* rather than on its muscles,
 * because a lift with several primaries would otherwise land in two places at
 * once — a squat is legs even though it also loads the spinal erectors.
 *
 * Two calls worth naming:
 *
 * - **Raises are push.** Lateral and front raises train delts, and delts are
 *   push day in every version of this split.
 * - **`spinal-extension` is pull.** A hyperextension is posterior-chain work
 *   and sits on back day far more often than leg day. Genuinely arguable; it's
 *   one movement in the whole library, so it moves the number very little
 *   either way.
 *
 * Declared as a total `Record`, so adding a pattern to the schema fails the
 * build here rather than silently landing in no bucket.
 */
export const SPLIT_FOR_PATTERN: Record<MovementPattern, TrainingSplit> = {
  "horizontal-press": "push",
  "incline-press": "push",
  "overhead-press": "push",
  "chest-fly": "push",
  "lateral-raise": "push",
  "front-raise": "push",
  "elbow-extension": "push",
  // Same call as `elbow-extension` just above: an extensor works the back of
  // the forearm, the same side of the limb as the triceps it sits next to.
  "wrist-extension": "push",

  "vertical-pull": "pull",
  "horizontal-pull": "pull",
  pullover: "pull",
  "rear-delt": "pull",
  shrug: "pull",
  "elbow-flexion": "pull",
  // And a flexor pairs with the biceps beside it, the same way
  // `elbow-flexion` does.
  "wrist-flexion": "pull",
  "spinal-extension": "pull",
  "spinal-flexion": "core",

  squat: "legs",
  hinge: "legs",
  lunge: "legs",
  "knee-extension": "legs",
  "knee-flexion": "legs",
  "hip-extension": "legs",
  "hip-abduction": "legs",
  "hip-adduction": "legs",
  "calf-raise": "legs",

  cardio: "cardio",
};

export const RESISTANCE_SPLITS: readonly ResistanceSplit[] = [
  "push",
  "pull",
  "legs",
  "core",
];

/**
 * What an exercise trains, injected rather than looked up.
 *
 * Same shape and same reason as `ExerciseNaming` in `records.ts`: the caller
 * wires it to the real library, the test wires it to three fixtures.
 */
export interface ExerciseAnatomy {
  muscles: (exerciseId: string) => {
    primary: MuscleId[];
    secondary: MuscleId[];
  };
  pattern: (exerciseId: string) => MovementPattern | undefined;
}

/** One exercise as a finished-but-unlogged day actually prescribed it. */
export interface RoutineDayExercise {
  exerciseId: string;
  /** Prescribed sets summed across the exercise's prescriptions. */
  sets: number;
}

/**
 * Resolves what a day's exercises actually were, for crediting a
 * `WorkoutCompletion` — which carries no exercises of its own, deliberately
 * (see `completion-schema.ts`): it's proof a session was run, not a record of
 * what was done in it. Injected the same way `ExerciseAnatomy` is: the real
 * implementation reads `useRoutines()`, a test reads a fixture.
 *
 * `throughExerciseIndex` bounds the result to what a partial completion
 * actually reached (see `WorkoutCompletion.throughExerciseIndex`) — omitted
 * or `undefined` means the whole day, which is what a full "Finish" means.
 */
export interface RoutineDayExercises {
  exercisesFor: (
    routineSlug: string,
    weekNumber: number,
    dayNumber: number,
    throughExerciseIndex?: number,
  ) => RoutineDayExercise[] | undefined;
}

export interface MuscleVolume {
  muscle: MuscleId;
  /** Sets where this muscle was the point of the exercise. */
  directSets: number;
  /** Sets where it was along for the ride. */
  indirectSets: number;
}

export interface WeekVolume {
  /** Local midnight on the week's Monday. */
  weekStart: number;
  /** The week `now` falls in, which can still gain sets. */
  isPartial: boolean;
  /** Every muscle worked that week, most direct sets first. */
  muscles: MuscleVolume[];
  /** Set counts per split. Cardio is here but excluded from `totalSets`. */
  split: Record<TrainingSplit, number>;
  /** Resistance sets — everything that isn't cardio. */
  totalSets: number;
}

const emptySplit = (): Record<TrainingSplit, number> => ({
  push: 0,
  pull: 0,
  legs: 0,
  core: 0,
  cardio: 0,
});

interface WeekAccumulator {
  direct: Map<MuscleId, number>;
  indirect: Map<MuscleId, number>;
  split: Record<TrainingSplit, number>;
}

function bucketFor(
  byWeek: Map<number, WeekAccumulator>,
  weekStart: number,
): WeekAccumulator {
  let bucket = byWeek.get(weekStart);
  if (bucket === undefined) {
    bucket = { direct: new Map(), indirect: new Map(), split: emptySplit() };
    byWeek.set(weekStart, bucket);
  }
  return bucket;
}

/**
 * Credits `count` sets of one exercise to a week — `count` is 1 for a real
 * logged set, or a completion's prescribed set total (see `weeklyVolume`).
 *
 * **Direct and indirect sets are counted separately and never fused.** A set of
 * squats gives quads a direct set and glutes an indirect one; collapsing them
 * with the conventional half-a-set coefficient would invent a precision the
 * data doesn't have, and — more to the point — it would bury the finding that
 * some muscles only ever get the indirect kind.
 *
 * A muscle listed as both primary and secondary on one exercise counts once, as
 * direct: the stronger claim wins.
 */
function registerSets(
  bucket: WeekAccumulator,
  exerciseId: string,
  count: number,
  anatomy: ExerciseAnatomy,
): void {
  const pattern = anatomy.pattern(exerciseId);
  const split = pattern === undefined ? undefined : SPLIT_FOR_PATTERN[pattern];
  if (split) bucket.split[split] += count;

  const { primary, secondary } = anatomy.muscles(exerciseId);
  const counted = new Set(primary);
  for (const muscle of counted) {
    bucket.direct.set(muscle, (bucket.direct.get(muscle) ?? 0) + count);
  }
  for (const muscle of new Set(secondary)) {
    if (counted.has(muscle)) continue;
    bucket.indirect.set(muscle, (bucket.indirect.get(muscle) ?? 0) + count);
  }
}

/**
 * Sets grouped into Monday-to-Sunday weeks, counted per muscle and per split.
 *
 * **A finished-but-unlogged day counts too, at its prescribed sets.** Pressing
 * "Finish" (or "End workout") already counts a day as trained for the streak
 * and the heatmap whether or not you typed any sets in by hand — see
 * `SessionPlayer`'s `finishIfLast`. Reading only `LoggedSet[]` here would
 * silently disagree: a day run entirely through the player would show every
 * muscle it worked as untouched. So each `WorkoutCompletion` is resolved back
 * to its day's exercises via `dayLookup`, bounded to `throughExerciseIndex`
 * for a day ended early, and credited at the routine's own prescribed set
 * count for each — the best honest estimate of "what you did" without
 * inventing a weight nobody entered.
 *
 * **An exercise this exact session already has real logged sets for is never
 * also credited from the completion** — otherwise a day you partly logged by
 * hand would double-count the part you did log. Only the exercises you
 * reached but never typed a set for fall back to the prescription.
 *
 * `now` is a parameter rather than `Date.now()`, so "the current week" is
 * pinnable in a test and nothing reads the clock during a render.
 */
export function weeklyVolume(
  sets: LoggedSet[],
  completions: WorkoutCompletion[],
  anatomy: ExerciseAnatomy,
  dayLookup: RoutineDayExercises,
  now: number,
): WeekVolume[] {
  const byWeek = new Map<number, WeekAccumulator>();

  for (const set of sets) {
    registerSets(bucketFor(byWeek, startOfWeek(set.performedAt)), set.exerciseId, 1, anatomy);
  }

  for (const completion of completions) {
    const exercises = dayLookup.exercisesFor(
      completion.routineSlug,
      completion.weekNumber,
      completion.dayNumber,
      completion.throughExerciseIndex,
    );
    if (exercises === undefined) continue;

    const loggedThisSession = new Set(
      sets
        .filter(
          (set) =>
            set.routineSlug === completion.routineSlug &&
            set.weekNumber === completion.weekNumber &&
            set.dayNumber === completion.dayNumber,
        )
        .map((set) => set.exerciseId),
    );

    const bucket = bucketFor(byWeek, startOfWeek(completion.performedAt));
    for (const { exerciseId, sets: prescribedSets } of exercises) {
      if (loggedThisSession.has(exerciseId)) continue;
      registerSets(bucket, exerciseId, prescribedSets, anatomy);
    }
  }

  const currentWeekStart = startOfWeek(now);

  return [...byWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekStart, { direct, indirect, split }]) => {
      const muscles = [...new Set([...direct.keys(), ...indirect.keys()])]
        .map((muscle) => ({
          muscle,
          directSets: direct.get(muscle) ?? 0,
          indirectSets: indirect.get(muscle) ?? 0,
        }))
        // Direct work is what the ranking is about; indirect only breaks ties.
        .sort(
          (a, b) =>
            b.directSets - a.directSets ||
            b.indirectSets - a.indirectSets ||
            a.muscle.localeCompare(b.muscle),
        );

      return {
        weekStart,
        isPartial: weekStart === currentWeekStart,
        muscles,
        split,
        // Summed over `RESISTANCE_SPLITS` rather than named one by one, so a
        // fifth bucket can't be added to the type and silently left out of the
        // total — which is exactly what happened when `core` arrived.
        totalSets: RESISTANCE_SPLITS.reduce(
          (total, bucket) => total + split[bucket],
          0,
        ),
      };
    });
}

/**
 * Why a muscle isn't getting direct work.
 *
 * Three different facts, deliberately not merged — the honest answer to "am I
 * neglecting my glutes" depends on which one it is.
 */
export type MuscleGapReason =
  /** No exercise in the library makes it primary. Nothing you log can fix it. */
  | "never-direct"
  /** You've worked it, but only ever as a secondary. */
  | "indirect-only"
  /** The library could train it directly; you haven't in this window. */
  | "not-trained";

export interface MuscleGap {
  muscle: MuscleId;
  reason: MuscleGapReason;
  /** Indirect sets across the window, so "never" and "constantly" differ. */
  indirectSets: number;
}

/**
 * Muscles going without direct work across a run of weeks.
 *
 * `trainableDirectly` is the set of muscles some exercise in the library lists
 * as primary. Anything outside it can't be trained directly no matter what you
 * log, which is a fact about the catalog rather than about you — and it's the
 * case that actually applies to glutes here.
 */
export function muscleGaps(
  weeks: WeekVolume[],
  allMuscles: readonly MuscleId[],
  trainableDirectly: ReadonlySet<MuscleId>,
): MuscleGap[] {
  const direct = new Map<MuscleId, number>();
  const indirect = new Map<MuscleId, number>();

  for (const week of weeks) {
    for (const entry of week.muscles) {
      direct.set(entry.muscle, (direct.get(entry.muscle) ?? 0) + entry.directSets);
      indirect.set(
        entry.muscle,
        (indirect.get(entry.muscle) ?? 0) + entry.indirectSets,
      );
    }
  }

  return allMuscles
    .filter((muscle) => (direct.get(muscle) ?? 0) === 0)
    .map((muscle) => {
      const indirectSets = indirect.get(muscle) ?? 0;
      const reason: MuscleGapReason = !trainableDirectly.has(muscle)
        ? "never-direct"
        : indirectSets > 0
          ? "indirect-only"
          : "not-trained";
      return { muscle, reason, indirectSets };
    })
    // Most-worked-indirectly first: a muscle taking constant incidental load
    // with no direct work is a more interesting gap than one you simply skip.
    .sort(
      (a, b) => b.indirectSets - a.indirectSets || a.muscle.localeCompare(b.muscle),
    );
}

/** Totals across a run of weeks, for the headline figures. */
export function totalsFor(weeks: WeekVolume[]): {
  split: Record<TrainingSplit, number>;
  totalSets: number;
} {
  const split = emptySplit();
  for (const week of weeks) {
    for (const key of Object.keys(split) as TrainingSplit[]) {
      split[key] += week.split[key];
    }
  }
  return { split, totalSets: split.push + split.pull + split.legs };
}
