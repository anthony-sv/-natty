import type { MuscleId } from "@/data/exercises";
import type { WorkoutCompletion } from "./completion-schema";
import type { LoggedSet } from "./schema";
import type { ExerciseAnatomy, RoutineDayExercises } from "./volume";

/**
 * How long each muscle takes to recover, in hours.
 *
 * Coarse on purpose and captioned as a rule of thumb wherever it's shown — the
 * same call `REFERENCE_MIN`/`REFERENCE_MAX` (`MuscleVolumeBars.tsx`) and
 * `describeFfmi` already make. Published recovery figures vary between sources
 * and none of them knows what *you* recover from; finer tiers would imply a
 * precision nobody has.
 *
 * A **total `Record`**, the same device `SPLIT_FOR_PATTERN` (`volume.ts`) uses:
 * adding a muscle to `muscleSchema` without a tier here fails the build rather
 * than silently defaulting.
 */
export const RECOVERY_HOURS: Record<MuscleId, number> = {
  // Small, high-frequency-tolerant muscles.
  "front-delts": 48,
  "side-delts": 48,
  "rear-delts": 48,
  biceps: 48,
  triceps: 48,
  forearms: 48,
  calves: 48,
  abs: 48,

  // Larger muscle groups.
  chest: 72,
  "upper-chest": 72,
  lats: 72,
  "upper-back": 72,
  traps: 72,
  quads: 72,
  hamstrings: 72,
  glutes: 72,
  adductors: 72,
  "spinal-erectors": 72,
};

/**
 * The "+/-3" from the request: sessions drift by hours, so a muscle 71h out
 * and one 73h out are the same muscle. Without this the state would flip
 * between them, which reads as more precision than the app actually has.
 */
export const READY_TOLERANCE_HOURS = 3;

const HOUR_MS = 60 * 60 * 1000;

/**
 * Four states, not two — the tolerance band around the recovery window is its
 * own state (`nearly`) rather than a coin flip between the other two.
 */
export type FatigueState = "recovering" | "nearly" | "ready" | "untrained";

export interface MuscleFatigue {
  muscle: MuscleId;
  state: FatigueState;
  /** Most recent set where this muscle was the point of the exercise. */
  lastDirectAt?: number;
  /** Most recent set where it was along for the ride — reported, never fused. */
  lastIndirectAt?: number;
  hoursSinceDirect?: number;
  /** The window `state` was computed against, so the UI can explain itself. */
  recoveryHours: number;
  /** `clamp(1 - hoursSinceDirect / recoveryHours, 0, 1)` — what the ramp reads. */
  fatigue: number;
}

function stateFor(
  hoursSinceDirect: number | undefined,
  recoveryHours: number,
): FatigueState {
  if (hoursSinceDirect === undefined) return "untrained";
  if (hoursSinceDirect < recoveryHours - READY_TOLERANCE_HOURS) return "recovering";
  if (hoursSinceDirect <= recoveryHours + READY_TOLERANCE_HOURS) return "nearly";
  return "ready";
}

function registerHit(
  exerciseId: string,
  timestamp: number,
  anatomy: ExerciseAnatomy,
  lastDirect: Map<MuscleId, number>,
  lastIndirect: Map<MuscleId, number>,
): void {
  const { primary, secondary } = anatomy.muscles(exerciseId);
  const primarySet = new Set(primary);

  for (const muscle of primarySet) {
    const existing = lastDirect.get(muscle);
    if (existing === undefined || timestamp > existing) {
      lastDirect.set(muscle, timestamp);
    }
  }
  for (const muscle of new Set(secondary)) {
    // Consistent with `weeklyVolume`: a muscle that's primary here doesn't
    // also register an indirect hit for the same work.
    if (primarySet.has(muscle)) continue;
    const existing = lastIndirect.get(muscle);
    if (existing === undefined || timestamp > existing) {
      lastIndirect.set(muscle, timestamp);
    }
  }
}

/**
 * How recovered each muscle is right now.
 *
 * Pure and injected, like `weeklyVolume` and `tonnageFor` — no library import,
 * no collection, so it tests against fixtures rather than 113 real exercises.
 *
 * **The clock runs on direct work, and a finished-but-unlogged day counts as
 * direct work too.** Pressing "Finish" with nothing logged already counts a
 * day as trained everywhere else in the app — the streak, the heatmap (see
 * `heatmap.ts`'s `CalendarDay.trained`) — and reading only `LoggedSet[]` here
 * would silently disagree with both of them: a day run entirely through the
 * player, with no set typed in by hand, would show every muscle it worked as
 * untouched. So each `WorkoutCompletion` is resolved back to the day's
 * prescribed exercises via `dayLookup` and registers exactly the same kind of
 * hit a logged set would, at the completion's `performedAt`. The two sources
 * merge by simple recency — whichever is more recent wins — so a day that's
 * partly logged and partly not still reads as one coherent session.
 *
 * `volume.ts` refuses a 0.5 indirect coefficient outright ("a convention, not
 * a measurement"); fusing indirect work into this clock would invent exactly
 * that kind of unmeasured number in the same feature folder. So
 * `lastIndirectAt` rides along on the row for display, and never moves `state`
 * or `fatigue`.
 *
 * `allMuscles` is a parameter rather than read off `muscleSchema` here, the
 * same way `muscleGaps` takes it — so a fixture-driven test doesn't also
 * exercise the real 18-muscle schema.
 */
export function muscleFatigue(
  sets: LoggedSet[],
  completions: WorkoutCompletion[],
  anatomy: ExerciseAnatomy,
  dayLookup: RoutineDayExercises,
  allMuscles: readonly MuscleId[],
  now: number,
): MuscleFatigue[] {
  const lastDirect = new Map<MuscleId, number>();
  const lastIndirect = new Map<MuscleId, number>();

  for (const set of sets) {
    registerHit(set.exerciseId, set.performedAt, anatomy, lastDirect, lastIndirect);
  }

  for (const completion of completions) {
    const exercises = dayLookup.exercisesFor(
      completion.routineSlug,
      completion.weekNumber,
      completion.dayNumber,
      completion.throughExerciseIndex,
    );
    for (const { exerciseId } of exercises ?? []) {
      registerHit(
        exerciseId,
        completion.performedAt,
        anatomy,
        lastDirect,
        lastIndirect,
      );
    }
  }

  return allMuscles.map((muscle) => {
    const recoveryHours = RECOVERY_HOURS[muscle];
    const lastDirectAt = lastDirect.get(muscle);
    const lastIndirectAt = lastIndirect.get(muscle);
    const hoursSinceDirect =
      lastDirectAt === undefined ? undefined : (now - lastDirectAt) / HOUR_MS;
    const fatigue =
      hoursSinceDirect === undefined
        ? 0
        : Math.max(0, Math.min(1, 1 - hoursSinceDirect / recoveryHours));

    return {
      muscle,
      state: stateFor(hoursSinceDirect, recoveryHours),
      lastDirectAt,
      lastIndirectAt,
      hoursSinceDirect,
      recoveryHours,
      fatigue,
    };
  });
}

/**
 * Which of four ramp steps a muscle paints, or 0 for `--muted`.
 *
 * The same quartile device `intensityStep` (`heatmap.ts`) uses for the
 * training heatmap's cells — `fatigue` is already clamped to [0, 1], so this
 * is purely which quarter it falls in. `ready`/`untrained` are forced to 0
 * rather than left to the arithmetic: a muscle just past its window has a
 * `fatigue` near 0 anyway, but the state is the authority on "go", not a
 * number close to a boundary.
 */
export function fatigueStep(entry: MuscleFatigue): 0 | 1 | 2 | 3 | 4 {
  if (entry.state === "ready" || entry.state === "untrained") return 0;
  if (entry.fatigue > 0.75) return 4;
  if (entry.fatigue > 0.5) return 3;
  if (entry.fatigue > 0.25) return 2;
  return 1;
}
