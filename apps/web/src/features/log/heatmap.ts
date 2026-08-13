import { calendarWeeks } from "@/lib/calendar";
import { addDays, daysBetween, startOfDay } from "@/lib/week";
import type { LoggedSet } from "./schema";

/**
 * Training days as a calendar, the way a commit graph reads.
 *
 * A records table says what your bests are and the volume panel says what a
 * week added up to; neither answers "have I actually been going". A year of
 * days at a glance does, and consistency is the thing that most obviously
 * shows up as a shape rather than a number.
 *
 * Pure and directly tested, like `pr.ts` and `volume.ts` — no collection, no
 * clock of its own.
 */

export interface CalendarDay {
  /** Local midnight. Identifies the day and is what the cell keys on. */
  date: number;
  /** Sets logged that day. Drives the cell's intensity. */
  sets: number;
  /** Distinct exercises, for the cell's tooltip. */
  exercises: number;
  /** Outside the requested window — drawn as a blank so the grid stays square. */
  isPadding: boolean;
}

export interface Calendar {
  /**
   * Whole weeks, oldest first, each running Monday to Sunday.
   *
   * Always seven days long even at the ends, so the grid is rectangular and the
   * weekday rows line up. The overhang is marked `isPadding`.
   */
  weeks: CalendarDay[][];
  /** Days with at least one set. */
  daysTrained: number;
  totalSets: number;
  /** Consecutive trained days, at its longest, within the window. */
  longestStreak: number;
  /** Consecutive trained days ending today, or 0 if today is empty. */
  currentStreak: number;
  /** The most sets any one day carried — the top of the intensity scale. */
  busiestDay: number;
}

/**
 * Group sets into local calendar days across a window of whole weeks.
 *
 * Days are local, not UTC: an evening session logged at 22:00 belongs to that
 * evening, and a UTC bucket would file it under tomorrow for anyone west of
 * Greenwich. Same reasoning as the weekly averages.
 *
 * `now` is a parameter rather than `Date.now()` so the window is pinnable in a
 * test and nothing reads the clock during a render.
 */
export function toCalendar(
  sets: LoggedSet[],
  { weeks: weekCount, now }: { weeks: number; now: number },
): Calendar {
  const setsPerDay = new Map<number, LoggedSet[]>();
  for (const set of sets) {
    const day = startOfDay(set.performedAt);
    const existing = setsPerDay.get(day);
    if (existing) existing.push(set);
    else setsPerDay.set(day, [set]);
  }

  const today = startOfDay(now);
  // The grid's shape is shared with the nutrition heatmaps — see
  // `lib/calendar.ts`. Only what fills a cell differs.
  const weeks = calendarWeeks({ weeks: weekCount, now }).map((week) =>
    week.map(({ date, isPadding }): CalendarDay => {
      const logged = setsPerDay.get(date) ?? [];
      return {
        date,
        sets: logged.length,
        exercises: new Set(logged.map((set) => set.exerciseId)).size,
        isPadding,
      };
    }),
  );

  const inWindow = weeks.flat().filter((day) => !day.isPadding);
  const trained = inWindow.filter((day) => day.sets > 0);

  return {
    weeks,
    daysTrained: trained.length,
    totalSets: trained.reduce((total, day) => total + day.sets, 0),
    longestStreak: longestRun(trained.map((day) => day.date)),
    currentStreak: runEndingAt(new Set(trained.map((day) => day.date)), today),
    busiestDay: Math.max(0, ...trained.map((day) => day.sets)),
  };
}

/** The longest run of consecutive days in an ascending list of day starts. */
function longestRun(days: number[]): number {
  let longest = 0;
  let run = 0;
  let previous: number | undefined;

  for (const day of days) {
    run = previous !== undefined && daysBetween(previous, day) === 1 ? run + 1 : 1;
    previous = day;
    if (run > longest) longest = run;
  }
  return longest;
}

/**
 * The run of trained days ending today.
 *
 * Counts back from today rather than from the last trained day: a streak you
 * broke yesterday is not a streak, and reporting it as one is the kind of
 * flattery that makes a number worthless.
 */
function runEndingAt(trained: ReadonlySet<number>, today: number): number {
  let streak = 0;
  let day = today;
  while (trained.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/**
 * Which of four intensity steps a day belongs to, or 0 for an untrained one.
 *
 * Quartiles of the busiest day rather than fixed thresholds: a five-set day is
 * a lot for someone who does five, and nothing for someone who does thirty.
 * Any trained day is at least step 1, so a day you showed up never reads as
 * blank.
 */
export function intensityStep(sets: number, busiest: number): 0 | 1 | 2 | 3 | 4 {
  if (sets <= 0) return 0;
  if (busiest <= 0) return 1;
  const share = sets / busiest;
  if (share > 0.75) return 4;
  if (share > 0.5) return 3;
  if (share > 0.25) return 2;
  return 1;
}
