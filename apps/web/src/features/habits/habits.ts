import { addDays, DAYS_IN_WEEK, startOfDay, startOfWeek } from "@/lib/week";
import type { Habit, HabitLog } from "./schema";

/**
 * Habit arithmetic: what's due, what's done, how long the run is.
 *
 * Pure and injected like `pr.ts` and `supplements.ts` — habits and logs come
 * in, nothing is imported from a collection or from React, and `today` is a
 * parameter so nothing reads the clock during a render.
 */

/** Amount done, per habit, per local day. */
export type LogIndex = Map<string, Map<number, number>>;

export function indexLogs(logs: HabitLog[]): LogIndex {
  const index: LogIndex = new Map();
  for (const log of logs) {
    const days = index.get(log.habitId) ?? new Map<number, number>();
    days.set(log.day, log.amount);
    index.set(log.habitId, days);
  }
  return index;
}

export function amountOn(index: LogIndex, habitId: string, day: number): number {
  return index.get(habitId)?.get(day) ?? 0;
}

/** Monday is 0, like `habitScheduleSchema.weekdays`. */
export function weekdayIndex(day: number): number {
  return (new Date(day).getDay() + 6) % DAYS_IN_WEEK;
}

/**
 * Whether the habit asks anything of this day.
 *
 * A weekly habit is due every day — any of them can be one of the three —
 * and `isWeekMet` is what decides whether today still needs it.
 */
export function isDueOn(habit: Habit, day: number): boolean {
  const { schedule } = habit;
  if (schedule.kind === "weekdays") return schedule.days.includes(weekdayIndex(day));
  return true;
}

export function isMet(habit: Habit, amount: number): boolean {
  return amount >= habit.target.perDay;
}

/** Days this week, up to and including `day`, on which the habit was met. */
export function daysMetInWeek(habit: Habit, index: LogIndex, day: number): number {
  const monday = startOfWeek(day);
  let met = 0;
  for (let offset = 0; offset < DAYS_IN_WEEK; offset++) {
    const d = addDays(monday, offset);
    if (isMet(habit, amountOn(index, habit.id, d))) met++;
  }
  return met;
}

export interface HabitRow {
  habit: Habit;
  amount: number;
  met: boolean;
  /** For a weekly habit: met days this week, and how many it asks for. */
  week?: { met: number; target: number };
  streak: Streak;
}

export interface HabitDay {
  rows: HabitRow[];
  /** Habits whose day — or for a weekly one, whose week — is done. */
  done: number;
  total: number;
}

/**
 * The checklist for one day.
 *
 * An archived habit stays on a day you did it and drops off the rest, which
 * is the point of archiving over deleting. Creation order, not alphabetical:
 * habits are usually added in the order you do them through the day, and
 * that's the order worth keeping.
 */
export function habitDay(
  habits: Habit[],
  logs: HabitLog[],
  day: number,
  today: number,
): HabitDay {
  const index = indexLogs(logs);
  const rows = habits
    .filter((habit) => {
      const amount = amountOn(index, habit.id, day);
      if (habit.archivedAt !== undefined) return amount > 0;
      // Not before it existed: a habit added today didn't go unmet last week.
      if (startOfDay(habit.createdAt) > day && amount === 0) return false;
      return isDueOn(habit, day);
    })
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((habit): HabitRow => {
      const amount = amountOn(index, habit.id, day);
      const row: HabitRow = {
        habit,
        amount,
        met: isMet(habit, amount),
        streak: streakOf(habit, index, today),
      };
      if (habit.schedule.kind === "weekly") {
        row.week = {
          met: daysMetInWeek(habit, index, day),
          target: habit.schedule.timesPerWeek,
        };
      }
      return row;
    });

  return {
    rows,
    done: rows.filter((row) =>
      row.week ? row.week.met >= row.week.target : row.met,
    ).length,
    total: rows.length,
  };
}

export interface Streak {
  count: number;
  unit: "days" | "weeks";
}

/** Far enough back for any real streak, short enough to never hang. */
const MAX_LOOKBACK_DAYS = 3660;

/**
 * The current run of kept days (or weeks, for a weekly habit).
 *
 * **Today is pending, not missed.** At 9am the evening brush hasn't happened
 * yet, and a streak reading 0 every morning would be the one number on the
 * page that's wrong all day. So today counts if it's already met and is
 * skipped if not; the run is broken only by a due day that's fully past.
 *
 * Days a weekday habit isn't scheduled are skipped rather than counted — the
 * same reasoning as the training streak tolerating prescribed rest days.
 * Unlike that one there's no tolerance for a *missed* due day: a habit's
 * whole job is the day you'd rather skip.
 */
export function streakOf(habit: Habit, index: LogIndex, today: number): Streak {
  const start = startOfDay(today);
  const days = index.get(habit.id);
  const earliest = Math.min(
    startOfDay(habit.createdAt),
    ...(days ? [...days.keys()] : []),
  );

  if (habit.schedule.kind === "weekly") {
    const target = habit.schedule.timesPerWeek;
    let monday = startOfWeek(start);
    let count = 0;
    // The current week is pending too, until it's met.
    if (daysMetInWeek(habit, index, monday) >= target) count++;
    monday = addDays(monday, -DAYS_IN_WEEK);
    while (addDays(monday, DAYS_IN_WEEK) > earliest) {
      if (daysMetInWeek(habit, index, monday) < target) break;
      count++;
      monday = addDays(monday, -DAYS_IN_WEEK);
    }
    return { count, unit: "weeks" };
  }

  let count = 0;
  let day = start;
  if (isDueOn(habit, day) && !isMet(habit, amountOn(index, habit.id, day))) {
    day = addDays(day, -1);
  }
  for (let i = 0; i < MAX_LOOKBACK_DAYS && day >= earliest; i++) {
    if (isDueOn(habit, day)) {
      if (!isMet(habit, amountOn(index, habit.id, day))) break;
      count++;
    }
    day = addDays(day, -1);
  }
  return { count, unit: "days" };
}

/**
 * Share of due days met over the last `days`, from when the habit started.
 *
 * Today is left out for the reason the streak treats it as pending. Weekly
 * habits are judged by week — met days over asked-for days, capped at the
 * ask — since a weekly habit has no due *day* to miss. Undefined when the
 * window holds nothing due yet, because 0% of nothing isn't a rate.
 */
export function completionRate(
  habit: Habit,
  logs: HabitLog[],
  today: number,
  days = 30,
): number | undefined {
  const index = indexLogs(logs);
  const start = startOfDay(today);
  const created = startOfDay(habit.createdAt);
  let due = 0;
  let met = 0;

  if (habit.schedule.kind === "weekly") {
    const target = habit.schedule.timesPerWeek;
    // Whole past weeks inside the window.
    let monday = addDays(startOfWeek(start), -DAYS_IN_WEEK);
    while (monday >= addDays(start, -days) && addDays(monday, DAYS_IN_WEEK) > created) {
      due += target;
      met += Math.min(target, daysMetInWeek(habit, index, monday));
      monday = addDays(monday, -DAYS_IN_WEEK);
    }
  } else {
    for (let offset = 1; offset <= days; offset++) {
      const day = addDays(start, -offset);
      if (day < created) break;
      if (!isDueOn(habit, day)) continue;
      due++;
      if (isMet(habit, amountOn(index, habit.id, day))) met++;
    }
  }

  return due === 0 ? undefined : met / due;
}

/**
 * A heatmap cell's step: 0 nothing, 1-3 partway, 4 met.
 *
 * Steps of the habit's *own* target rather than of your busiest day, unlike
 * the training heatmap — a habit has a definition of done, and "done" should
 * look the same whatever the target is.
 */
export function cellStep(habit: Habit, amount: number): 0 | 1 | 2 | 3 | 4 {
  if (amount <= 0) return 0;
  const fraction = amount / habit.target.perDay;
  if (fraction >= 1) return 4;
  if (fraction >= 2 / 3) return 3;
  if (fraction >= 1 / 3) return 2;
  return 1;
}

/** Whether anything was ever logged against this habit — archive if so. */
export function hasHistory(logs: HabitLog[], habitId: string): boolean {
  return logs.some((log) => log.habitId === habitId && log.amount > 0);
}
