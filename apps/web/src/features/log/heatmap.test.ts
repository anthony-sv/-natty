import { describe, expect, it } from "vitest";
import { DAYS_IN_WEEK } from "@/lib/week";
import { intensityStep, toCalendar } from "./heatmap";
import type { LoggedSet } from "./schema";

function at(year: number, month: number, day: number, hour = 9): number {
  return new Date(year, month - 1, day, hour, 0).getTime();
}

function midnight(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

let seq = 0;
function set(performedAt: number, exerciseId = "bench"): LoggedSet {
  return {
    id: `s${++seq}`,
    performedAt,
    exerciseId,
    weight: 100,
    unit: "kg",
    reps: 8,
  };
}

/** Wednesday of the week starting Monday 2026-08-10. */
const NOW = at(2026, 8, 12);

describe("toCalendar", () => {
  it("always returns whole weeks of seven days", () => {
    const calendar = toCalendar([], { weeks: 5, now: NOW });

    expect(calendar.weeks).toHaveLength(5);
    for (const week of calendar.weeks) {
      expect(week).toHaveLength(DAYS_IN_WEEK);
    }
  });

  it("starts each week on a Monday and ends on the current one", () => {
    const calendar = toCalendar([], { weeks: 3, now: NOW });
    const firstDays = calendar.weeks.map((week) => week[0].date);

    for (const day of firstDays) {
      expect(new Date(day).getDay()).toBe(1);
    }
    // The last column is the week `now` falls in.
    expect(firstDays[firstDays.length - 1]).toBe(midnight(2026, 8, 10));
  });

  it("buckets a set into its local day", () => {
    const calendar = toCalendar([set(at(2026, 8, 11, 22))], {
      weeks: 2,
      now: NOW,
    });
    const day = calendar.weeks.flat().find((d) => d.date === midnight(2026, 8, 11))!;

    // A 22:00 session belongs to that evening. A UTC bucket would move it to
    // the 12th for anyone west of Greenwich.
    expect(day.sets).toBe(1);
  });

  it("counts sets and distinct exercises per day", () => {
    const calendar = toCalendar(
      [
        set(at(2026, 8, 11), "bench"),
        set(at(2026, 8, 11), "bench"),
        set(at(2026, 8, 11), "squat"),
      ],
      { weeks: 2, now: NOW },
    );
    const day = calendar.weeks.flat().find((d) => d.date === midnight(2026, 8, 11))!;

    expect(day).toMatchObject({ sets: 3, exercises: 2 });
  });

  it("marks days after today as padding rather than as skipped", () => {
    const calendar = toCalendar([], { weeks: 1, now: NOW });
    const padded = calendar.weeks[0].filter((day) => day.isPadding);

    // Thursday to Sunday of the running week haven't happened yet.
    expect(padded.map((d) => d.date)).toEqual([
      midnight(2026, 8, 13),
      midnight(2026, 8, 14),
      midnight(2026, 8, 15),
      midnight(2026, 8, 16),
    ]);
  });

  it("summarises what happened in the window", () => {
    const calendar = toCalendar(
      [
        set(at(2026, 8, 10)),
        set(at(2026, 8, 10)),
        set(at(2026, 8, 11)),
      ],
      { weeks: 2, now: NOW },
    );

    expect(calendar).toMatchObject({
      daysTrained: 2,
      totalSets: 3,
      busiestDay: 2,
    });
  });

  it("has nothing to report on an empty log", () => {
    expect(toCalendar([], { weeks: 4, now: NOW })).toMatchObject({
      daysTrained: 0,
      totalSets: 0,
      longestStreak: 0,
      currentStreak: 0,
      busiestDay: 0,
    });
  });
});

describe("streaks", () => {
  it("counts consecutive days", () => {
    const calendar = toCalendar(
      [set(at(2026, 8, 8)), set(at(2026, 8, 9)), set(at(2026, 8, 10))],
      { weeks: 4, now: NOW },
    );

    expect(calendar.longestStreak).toBe(3);
  });

  it("breaks a streak on a missed day", () => {
    const calendar = toCalendar(
      [
        set(at(2026, 8, 3)),
        set(at(2026, 8, 4)),
        // 5th missed
        set(at(2026, 8, 6)),
      ],
      { weeks: 4, now: NOW },
    );

    expect(calendar.longestStreak).toBe(2);
  });

  it("counts the current streak back from today, not from the last session", () => {
    const calendar = toCalendar(
      [set(at(2026, 8, 11)), set(at(2026, 8, 12))],
      { weeks: 2, now: NOW },
    );

    expect(calendar.currentStreak).toBe(2);
  });

  it("reports no current streak when today is empty", () => {
    const calendar = toCalendar(
      [set(at(2026, 8, 9)), set(at(2026, 8, 10)), set(at(2026, 8, 11))],
      { weeks: 2, now: NOW },
    );

    // Three days in a row, but it ended yesterday. Calling that a live streak
    // is flattery, and a number nobody can trust isn't worth showing.
    expect(calendar.longestStreak).toBe(3);
    expect(calendar.currentStreak).toBe(0);
  });

  it("survives a clock change", () => {
    // A run spanning late March and late October in either hemisphere: the
    // streak is counted in calendar days, so a 23- or 25-hour day can't break
    // it the way a millisecond difference would.
    const march = [26, 27, 28, 29, 30, 31].map((d) => set(at(2026, 3, d)));
    const calendar = toCalendar(march, { weeks: 30, now: at(2026, 4, 1) });

    expect(calendar.longestStreak).toBe(6);
  });
});

describe("intensityStep", () => {
  it("gives an untrained day nothing", () => {
    expect(intensityStep(0, 20)).toBe(0);
  });

  it("gives any trained day at least the first step", () => {
    // A day you showed up should never read as blank, however light it was.
    expect(intensityStep(1, 40)).toBe(1);
  });

  it("scales to the busiest day rather than to a fixed threshold", () => {
    // Five sets is a full day for someone who does five and a light one for
    // someone who does twenty.
    expect(intensityStep(5, 5)).toBe(4);
    expect(intensityStep(5, 20)).toBe(1);
  });

  it("puts the busiest day at the top step", () => {
    expect(intensityStep(20, 20)).toBe(4);
  });
});
