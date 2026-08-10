import { convertWeight, type WeightUnit } from "@/lib/units";
import type { BodyEntry } from "./schema";

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

/** Days in a full week, and the divisor for "3 of 7 days". */
export const DAYS_IN_WEEK = 7;

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

/**
 * Local midnight on the Monday of `ms`'s week.
 *
 * Built from year/month/day rather than by subtracting `days * 86_400_000`:
 * a day is not always 86,400,000 ms (the clocks change twice a year), and a
 * UTC-based boundary would file a Sunday-night weigh-in under the wrong week
 * for anyone west of Greenwich. `Date` normalises an out-of-range day-of-month,
 * so no month-boundary arithmetic is needed.
 */
export function startOfWeek(ms: number): number {
  const date = new Date(ms);
  // getDay() is 0 for Sunday; the week starts Monday, so Sunday is 6 days in.
  const daysSinceMonday = (date.getDay() + 6) % DAYS_IN_WEEK;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - daysSinceMonday,
  ).getTime();
}

/** Local midnight `days` after `weekStart`, in calendar days rather than ms. */
function addDays(ms: number, days: number): number {
  const date = new Date(ms);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  ).getTime();
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
