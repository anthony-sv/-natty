import { addDays, DAYS_IN_WEEK, startOfDay, startOfWeek } from "./week";

/**
 * The geometry of a commit-graph grid, with nothing in the cells.
 *
 * Pulled out of `features/log/heatmap.ts` when a second thing needed the same
 * shape: the training grid counts sets, the nutrition ones count meals ticked
 * and calories missed by, and all three want whole Monday-to-Sunday weeks
 * ending in the current one. What differs is what fills a cell, which is the
 * caller's business.
 *
 * `now` is a parameter rather than `Date.now()` so a window is pinnable in a
 * test and nothing reads the clock during a render.
 */

export interface GridDay {
  /** Local midnight. Identifies the day and is what the cell keys on. */
  date: number;
  /**
   * Outside the requested window — a real date in the current week that simply
   * hasn't happened. Drawn blank, because an empty cell would read as a day
   * you skipped.
   */
  isPadding: boolean;
}

/**
 * Whole weeks, oldest first, each running Monday to Sunday.
 *
 * Always seven days long even at the ends, so the grid is rectangular and the
 * weekday rows line up.
 */
export function calendarWeeks(
  { weeks: weekCount, now }: { weeks: number; now: number },
): GridDay[][] {
  const today = startOfDay(now);
  // Whole weeks ending with the one `now` falls in, so the last column is the
  // current week and the grid always has seven complete rows.
  const firstMonday = addDays(startOfWeek(now), -(weekCount - 1) * DAYS_IN_WEEK);

  const weeks: GridDay[][] = [];
  for (let week = 0; week < weekCount; week++) {
    const days: GridDay[] = [];
    for (let offset = 0; offset < DAYS_IN_WEEK; offset++) {
      const date = addDays(firstMonday, week * DAYS_IN_WEEK + offset);
      days.push({ date, isPadding: date > today });
    }
    weeks.push(days);
  }
  return weeks;
}

/** Every real day in the window, oldest first — the grid without its shape. */
export function calendarDays(window: {
  weeks: number;
  now: number;
}): number[] {
  return calendarWeeks(window)
    .flat()
    .filter((day) => !day.isPadding)
    .map((day) => day.date);
}
