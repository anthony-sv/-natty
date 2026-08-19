import { calendarWeeks } from "@/lib/calendar";
import { daysBetween, startOfDay } from "@/lib/week";
import type { WorkoutCompletion } from "./completion-schema";
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
  /**
   * Something happened this day — a set was logged, or a workout was run to
   * "Finish" with nothing logged against it. `sets > 0` implies this, but the
   * reverse doesn't: a completed day with no logged sets is trained with
   * `sets` still honestly at 0, which is what `cellStep` reads to color a cell
   * without pretending a set exists that doesn't.
   */
  trained: boolean;
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
  /** Days you trained — logged a set, or completed a workout. */
  daysTrained: number;
  totalSets: number;
  /** The most training days one unbroken run held, within the window. */
  longestStreak: number;
  /** Training days in the run that is still alive, or 0 if it has lapsed. */
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
 *
 * `completions` is optional and defaults to none, so every existing call —
 * and every test in this file — still reads a day as trained purely off
 * logged sets. Pass it to also count a day you ran a workout to "Finish" but
 * logged nothing against, which is what lets the streak and the day-count
 * agree with `nextTrainingDay` about what "showed up" means.
 */
export function toCalendar(
  sets: LoggedSet[],
  { weeks: weekCount, now }: { weeks: number; now: number },
  completions: WorkoutCompletion[] = [],
): Calendar {
  const setsPerDay = new Map<number, LoggedSet[]>();
  for (const set of sets) {
    const day = startOfDay(set.performedAt);
    const existing = setsPerDay.get(day);
    if (existing) existing.push(set);
    else setsPerDay.set(day, [set]);
  }

  const completedDays = new Set<number>();
  for (const completion of completions) {
    completedDays.add(startOfDay(completion.performedAt));
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
        trained: logged.length > 0 || completedDays.has(date),
        isPadding,
      };
    }),
  );

  const inWindow = weeks.flat().filter((day) => !day.isPadding);
  const trained = inWindow.filter((day) => day.trained);

  return {
    weeks,
    daysTrained: trained.length,
    totalSets: trained.reduce((total, day) => total + day.sets, 0),
    longestStreak: longestRun(trained.map((day) => day.date)),
    currentStreak: liveRun(
      trained.map((day) => day.date),
      today,
    ),
    busiestDay: Math.max(0, ...trained.map((day) => day.sets)),
  };
}

/**
 * How far apart two sessions can be and still belong to the same streak.
 *
 * **Rest days are prescribed, not missed, and a streak that a rest day breaks
 * measures nothing.** Every program in this app runs five or six training days
 * a week, so counting *consecutive calendar days* capped the number at six by
 * construction and read 0 on every rest day — the one morning the figure was
 * meant to be encouraging. A commit graph can define a streak that way because
 * nobody schedules a day off from committing.
 *
 * Three days apart, so up to two rest days sit between sessions: that covers a
 * Saturday-and-Sunday weekend, the longest gap any of the six programs
 * prescribes. Three days off is a week that got away from you, which is the
 * thing a streak exists to notice.
 */
const MAX_GAP_DAYS = 3;

/** The most training days in one unbroken run, over ascending day starts. */
function longestRun(days: number[]): number {
  let longest = 0;
  let run = 0;
  let previous: number | undefined;

  for (const day of days) {
    run =
      previous !== undefined && daysBetween(previous, day) <= MAX_GAP_DAYS
        ? run + 1
        : 1;
    previous = day;
    if (run > longest) longest = run;
  }
  return longest;
}

/**
 * The run that is still alive, counted in training days.
 *
 * Anchored on today rather than on the last session, which is what stops a
 * streak you let lapse a fortnight ago from reading as current — that half of
 * the original was right and is kept. What changed is the tolerance: today
 * being a rest day no longer zeroes it, since you haven't missed anything
 * until the gap outgrows `MAX_GAP_DAYS`.
 */
function liveRun(days: number[], today: number): number {
  const last = days[days.length - 1];
  if (last === undefined || daysBetween(last, today) > MAX_GAP_DAYS) return 0;

  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (daysBetween(days[i - 1], days[i]) > MAX_GAP_DAYS) break;
    streak++;
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

/**
 * A cell's step, the way the two heatmap components should actually read
 * `CalendarDay` — `intensityStep(day.sets, busiest)` alone goes blank on a
 * completed day with nothing logged, because `sets` is honestly 0 there.
 * `trained` is what says the day still counts, and the minimum step is what
 * "any trained day reads as at least step 1" already means for a logged one.
 */
export function cellStep(day: CalendarDay, busiestDay: number): 0 | 1 | 2 | 3 | 4 {
  if (day.sets > 0) return intensityStep(day.sets, busiestDay);
  return day.trained ? 1 : 0;
}
