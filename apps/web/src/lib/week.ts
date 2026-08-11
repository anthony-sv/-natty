/**
 * Calendar arithmetic, in the reader's own timezone.
 *
 * Lives in `lib/` rather than inside a feature because three of them need it —
 * body measurements bucket weigh-ins into weeks, training volume buckets sets
 * into weeks, and the heatmap buckets them into days — and a feature importing
 * another feature's helper is coupling worth avoiding. Same reasoning as
 * `lib/units.ts`.
 *
 * **Everything here is built from year/month/day, never from milliseconds.**
 * A day is not always 86,400,000ms: the clocks change twice a year, so
 * `time - 7 * 86_400_000` lands an hour off in the weeks around a transition
 * and eventually crosses a midnight. `Date` normalises an out-of-range
 * day-of-month, so month and year boundaries need no special case.
 */

/** Days in a week, and the divisor for "3 of 7 days". */
export const DAYS_IN_WEEK = 7;

/** Local midnight on the day `ms` falls in. */
export function startOfDay(ms: number): number {
  const date = new Date(ms);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Local midnight on the Monday of `ms`'s week.
 *
 * Monday, not Sunday: the training programs run Monday-to-Sunday and so does
 * every weekly figure the app reports. A UTC-based boundary would file a
 * Sunday-night weigh-in under the wrong week for anyone west of Greenwich.
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

/** Local midnight `days` after `ms`, counted in calendar days. */
export function addDays(ms: number, days: number): number {
  const date = new Date(ms);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  ).getTime();
}

/** Whole calendar days from `from` to `to`, ignoring the time of day. */
export function daysBetween(from: number, to: number): number {
  const start = startOfDay(from);
  const end = startOfDay(to);
  // Rounded, not truncated: the span in milliseconds is an hour short or long
  // across a clock change, and the answer is still a whole number of days.
  return Math.round((end - start) / 86_400_000);
}
