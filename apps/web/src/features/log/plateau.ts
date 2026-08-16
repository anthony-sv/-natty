import { daysBetween, startOfDay } from "@/lib/week";
import { effectiveWeight, isNewRecord } from "./pr";
import type { LoggedSet } from "./schema";

/**
 * Plateau and deload detection. Pure and injected, like `pr.ts` — no React,
 * no collection, so both are directly unit-tested.
 */

/** Sessions in a row with no new record before an exercise reads as stalled. */
const PLATEAU_SESSIONS = 3;

/** How far back "regularly trained" reaches. */
const RECENT_WINDOW_DAYS = 14;

/** Distinct training days an exercise needs before a plateau verdict means anything. */
const MIN_TRAINING_DAYS = 3;

/**
 * The deload trigger: "enough lifts, not one stalled lift" — both a floor
 * and a share, so two plateaued exercises out of two still counts, but one
 * out of eight doesn't.
 */
const MIN_PLATEAUED = 2;
const PLATEAUED_SHARE = 0.5;

/**
 * The heaviest-then-longest set on one day — the same dominance rule
 * `prFrontier` sorts by, applied to a single day rather than a whole
 * history. One representative per day, not the day's whole frontier: a
 * plateau reads off the day's headline lift, the same figure a records
 * table would call that day's best.
 */
function topSetFor(daySets: LoggedSet[]): LoggedSet {
  return [...daySets].sort(
    (a, b) => effectiveWeight(b) - effectiveWeight(a) || b.reps - a.reps,
  )[0];
}

/** One exercise's training days, oldest first, each reduced to its top set. */
function dailyTopSets(sets: LoggedSet[]): LoggedSet[] {
  const byDay = new Map<number, LoggedSet[]>();
  for (const set of sets) {
    const day = startOfDay(set.performedAt);
    const existing = byDay.get(day);
    if (existing) existing.push(set);
    else byDay.set(day, [set]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, daySets]) => topSetFor(daySets));
}

/**
 * Has this exercise's top set stopped setting new records?
 *
 * Fewer than `PLATEAU_SESSIONS` training days is "not enough signal," not a
 * plateau — a lift you've only just started can't have stalled yet. Each of
 * the last three is judged with `isNewRecord` against every top set before
 * it, the same function the records table itself uses to decide a PR, so
 * this can't disagree with what `/progress` shows as a record.
 */
export function isPlateaued(sets: LoggedSet[]): boolean {
  const daily = dailyTopSets(sets);
  if (daily.length < PLATEAU_SESSIONS) return false;

  const firstRecentIndex = daily.length - PLATEAU_SESSIONS;
  return daily.slice(firstRecentIndex).every((top, i) => {
    const before = daily.slice(0, firstRecentIndex + i);
    return !isNewRecord(before, top);
  });
}

export interface DeloadStatus {
  suggested: boolean;
  plateauedExerciseIds: string[];
}

/**
 * Whether enough of what you're regularly training has stalled to suggest
 * backing off for a week.
 *
 * "Regularly trained" = logged within the last two weeks *and* has enough
 * history (`MIN_TRAINING_DAYS`) for a plateau verdict to mean anything — a
 * lift you tried once doesn't count either way. Never automatic: this is a
 * number for a banner to read, not something that touches your program.
 */
export function deloadStatus(allSets: LoggedSet[], now: number): DeloadStatus {
  const byExercise = new Map<string, LoggedSet[]>();
  for (const set of allSets) {
    const existing = byExercise.get(set.exerciseId);
    if (existing) existing.push(set);
    else byExercise.set(set.exerciseId, [set]);
  }

  const recentlyActive = [...byExercise.entries()].filter(([, sets]) => {
    const trainingDays = new Set(sets.map((set) => startOfDay(set.performedAt)))
      .size;
    const hasRecentSet = sets.some(
      (set) => daysBetween(set.performedAt, now) <= RECENT_WINDOW_DAYS,
    );
    return hasRecentSet && trainingDays >= MIN_TRAINING_DAYS;
  });

  const plateauedExerciseIds = recentlyActive
    .filter(([, sets]) => isPlateaued(sets))
    .map(([exerciseId]) => exerciseId);

  const suggested =
    plateauedExerciseIds.length >= MIN_PLATEAUED &&
    plateauedExerciseIds.length / recentlyActive.length >= PLATEAUED_SHARE;

  return { suggested, plateauedExerciseIds };
}
