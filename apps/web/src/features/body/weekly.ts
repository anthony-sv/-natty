import { convertWeight, type WeightUnit } from "@/lib/units";
import { addDays, DAYS_IN_WEEK, startOfDay, startOfWeek } from "@/lib/week";
import type { BodyEntry } from "./schema";

// Re-exported because callers of this module already import them from here,
// and because "how long is a week" belongs with the weekly figures that use it.
export { DAYS_IN_WEEK, startOfWeek };

/**
 * Whether today already has a weigh-in.
 *
 * Local day, the same as the heatmap and the weekly averages: a late weigh-in
 * logged at 23:50 belongs to that evening, and a UTC bucket would file it under
 * tomorrow for anyone west of Greenwich.
 */
export function hasLoggedToday(entries: BodyEntry[], now: number): boolean {
  const today = startOfDay(now);
  return entries.some((entry) => startOfDay(entry.measuredAt) === today);
}

/**
 * Weigh-ins collapsed to one number a week.
 *
 * A single morning's weight is mostly water, sleep and what you ate the night
 * before — the swing between two consecutive days routinely exceeds a month of
 * real change. The week is the unit that actually moves, so the comparison
 * worth making is this week's mean against last week's, not today against
 * yesterday.
 *
 * Pure and directly tested, like `ffmi.ts`: no React, no collection.
 */

export interface WeeklyAverage {
  /** Local midnight on the week's Monday. Identifies the week. */
  weekStart: number;
  /**
   * Where the point is drawn: local midnight on the Thursday.
   *
   * A mean belongs at the centre of what it averages. Anchoring at Monday
   * instead would make the line lag the data it summarises by half a week,
   * which reads as a delay that isn't in the measurements.
   */
  midpoint: number;
  /** Mean weight, in the unit the caller asked for. */
  weight: number;
  /** Mean of whichever entries carried a reading; absent if none did. */
  bodyFatPercent?: number;
  /** How many weigh-ins went into it. */
  count: number;
  /**
   * True for the week still running.
   *
   * A Monday-to-Wednesday mean isn't comparable to a full week — you weigh less
   * midweek than at the weekend — so differencing them quietly reports a drop
   * that hasn't happened. Callers say so rather than hiding it.
   */
  isPartial: boolean;
}

function mean(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * One average per week that has at least one weigh-in, oldest first.
 *
 * Weeks with nothing logged are skipped rather than interpolated — a gap in the
 * data is a fact about the data, and drawing through it would invent a
 * measurement.
 *
 * Everything is converted to `unit` before averaging, the same reason the chart
 * does it: a week mixing 82kg and 181lb has no mean until the two agree on what
 * they measure.
 *
 * `now` is a parameter rather than `Date.now()` so "the current week" is
 * pinnable in a test, and so nothing reads the clock during a render.
 */
export function weeklyAverages(
  entries: BodyEntry[],
  unit: WeightUnit,
  now: number,
): WeeklyAverage[] {
  const byWeek = new Map<number, BodyEntry[]>();
  for (const entry of entries) {
    const weekStart = startOfWeek(entry.measuredAt);
    const existing = byWeek.get(weekStart);
    if (existing) existing.push(entry);
    else byWeek.set(weekStart, [entry]);
  }

  const currentWeekStart = startOfWeek(now);

  return [...byWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekStart, weekEntries]) => {
      const bodyFats = weekEntries
        .map((entry) => entry.bodyFatPercent)
        .filter((value) => value !== undefined);

      return {
        weekStart,
        midpoint: addDays(weekStart, 3),
        weight: mean(
          weekEntries.map((entry) =>
            convertWeight(entry.weight, entry.unit, unit),
          ),
        ),
        bodyFatPercent: bodyFats.length === 0 ? undefined : mean(bodyFats),
        count: weekEntries.length,
        // Only the week containing `now` can still gain weigh-ins. An older
        // week with three entries is complete — you just didn't step on the
        // scale the other four days.
        isPartial: weekStart === currentWeekStart,
      };
    });
}

export interface WeekOverWeek {
  latest: WeeklyAverage;
  previous: WeeklyAverage | undefined;
  /** Latest minus previous, in the same unit. Negative means you lost weight. */
  deltaWeight: number | undefined;
  /** The same change as a share of the previous week. */
  deltaPercent: number | undefined;
}

/**
 * The most recent week and how it compares to the one before it.
 *
 * "The one before it" is the previous *entry in the list*, not the previous
 * calendar week — if you skipped a week entirely, comparing against the last
 * week you actually weighed in is the honest comparison, and the two weeks'
 * `weekStart` values say how far apart they are.
 */
export function weekOverWeek(
  averages: WeeklyAverage[],
): WeekOverWeek | undefined {
  const latest = averages[averages.length - 1];
  if (latest === undefined) return undefined;

  const previous = averages[averages.length - 2];
  if (previous === undefined) {
    return { latest, previous: undefined, deltaWeight: undefined, deltaPercent: undefined };
  }

  const deltaWeight = latest.weight - previous.weight;
  return {
    latest,
    previous,
    deltaWeight,
    deltaPercent: (deltaWeight / previous.weight) * 100,
  };
}
