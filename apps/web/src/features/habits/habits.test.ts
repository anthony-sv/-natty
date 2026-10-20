import { describe, expect, it } from "vitest";
import { addDays, startOfDay } from "@/lib/week";
import {
  cellStep,
  completionRate,
  habitDay,
  hasHistory,
  indexLogs,
  isDueOn,
  streakOf,
  weekdayIndex,
} from "./habits";
import { habitLogId, type Habit, type HabitLog } from "./schema";

// A Wednesday at 9am, so "today" has a morning still to go.
const NOW = new Date(2026, 9, 21, 9, 0).getTime();
const TODAY = startOfDay(NOW);

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: "habit:teeth",
    name: "Brush teeth",
    target: { kind: "count", perDay: 3 },
    schedule: { kind: "daily" },
    createdAt: addDays(TODAY, -60),
    ...overrides,
  };
}

function log(habitId: string, daysAgo: number, amount: number): HabitLog {
  const day = addDays(TODAY, -daysAgo);
  return { id: habitLogId(habitId, day), habitId, day, amount, updatedAt: day };
}

describe("weekdayIndex", () => {
  it("counts Monday as 0", () => {
    expect(weekdayIndex(TODAY)).toBe(2); // Wednesday
    expect(weekdayIndex(addDays(TODAY, -2))).toBe(0);
    expect(weekdayIndex(addDays(TODAY, 4))).toBe(6);
  });
});

describe("isDueOn", () => {
  it("only fires on the scheduled weekdays", () => {
    const h = habit({ schedule: { kind: "weekdays", days: [0, 2, 4] } });
    expect(isDueOn(h, TODAY)).toBe(true);
    expect(isDueOn(h, addDays(TODAY, -1))).toBe(false);
  });
});

describe("streakOf", () => {
  it("treats an unfinished today as pending, not a break", () => {
    const h = habit();
    const logs = [log(h.id, 0, 1), log(h.id, 1, 3), log(h.id, 2, 3)];
    expect(streakOf(h, indexLogs(logs), NOW)).toEqual({ count: 2, unit: "days" });
  });

  it("counts today once it's met", () => {
    const h = habit();
    const logs = [log(h.id, 0, 3), log(h.id, 1, 3)];
    expect(streakOf(h, indexLogs(logs), NOW).count).toBe(2);
  });

  it("breaks on a past day that fell short", () => {
    const h = habit();
    const logs = [log(h.id, 1, 3), log(h.id, 2, 2), log(h.id, 3, 3)];
    expect(streakOf(h, indexLogs(logs), NOW).count).toBe(1);
  });

  it("skips days a weekday habit isn't scheduled", () => {
    // Mon/Wed/Fri. Today is Wednesday, Monday was two days ago, Friday five.
    const h = habit({
      target: { kind: "count", perDay: 1 },
      schedule: { kind: "weekdays", days: [0, 2, 4] },
    });
    const logs = [log(h.id, 0, 1), log(h.id, 2, 1), log(h.id, 5, 1)];
    expect(streakOf(h, indexLogs(logs), NOW).count).toBe(3);
  });

  it("counts weeks for a weekly habit", () => {
    const h = habit({
      target: { kind: "minutes", perDay: 30 },
      schedule: { kind: "weekly", timesPerWeek: 2 },
    });
    // This week: Monday only (pending). Last week: two days. The one before:
    // one, so it stops there.
    const logs = [
      log(h.id, 2, 30),
      log(h.id, 7, 30),
      log(h.id, 9, 45),
      log(h.id, 14, 30),
    ];
    expect(streakOf(h, indexLogs(logs), NOW)).toEqual({ count: 1, unit: "weeks" });
  });

  it("doesn't count before the habit existed", () => {
    const h = habit({ createdAt: addDays(TODAY, -1) });
    expect(streakOf(h, indexLogs([log(h.id, 1, 3)]), NOW).count).toBe(1);
  });
});

describe("habitDay", () => {
  it("lists due habits with their amount and counts the done ones", () => {
    const teeth = habit();
    const read = habit({
      id: "habit:read",
      name: "Read",
      target: { kind: "minutes", perDay: 15 },
      createdAt: addDays(TODAY, -59),
    });
    const day = habitDay([read, teeth], [log(teeth.id, 0, 3), log(read.id, 0, 5)], TODAY, NOW);
    expect(day.rows.map((row) => [row.habit.id, row.amount, row.met])).toEqual([
      ["habit:teeth", 3, true],
      ["habit:read", 5, false],
    ]);
    expect(day.done).toBe(1);
    expect(day.total).toBe(2);
  });

  it("keeps an archived habit only on the days it was done", () => {
    const h = habit({ archivedAt: TODAY });
    expect(habitDay([h], [], TODAY, NOW).rows).toHaveLength(0);
    expect(habitDay([h], [log(h.id, 3, 1)], addDays(TODAY, -3), NOW).rows).toHaveLength(1);
  });

  it("doesn't list a habit on days before it was created", () => {
    const h = habit({ createdAt: NOW });
    expect(habitDay([h], [], addDays(TODAY, -1), NOW).rows).toHaveLength(0);
  });

  it("reports a weekly habit's progress through the week", () => {
    const h = habit({ schedule: { kind: "weekly", timesPerWeek: 3 } });
    const day = habitDay([h], [log(h.id, 1, 3), log(h.id, 2, 3)], TODAY, NOW);
    expect(day.rows[0]!.week).toEqual({ met: 2, target: 3 });
    expect(day.done).toBe(0);
  });
});

describe("completionRate", () => {
  it("is met due days over due days, leaving today out", () => {
    const h = habit({ createdAt: addDays(TODAY, -4) });
    const logs = [log(h.id, 0, 3), log(h.id, 1, 3), log(h.id, 2, 1), log(h.id, 3, 3)];
    // Due: days 1-4 ago (four). Met: 1 and 3.
    expect(completionRate(h, logs, NOW)).toBe(0.5);
  });

  it("is undefined with nothing due yet", () => {
    expect(completionRate(habit({ createdAt: NOW }), [], NOW)).toBeUndefined();
  });
});

describe("cellStep", () => {
  it("steps against the habit's own target", () => {
    const h = habit();
    expect([0, 1, 2, 3, 4].map((n) => cellStep(h, n))).toEqual([0, 2, 3, 4, 4]);
  });
});

describe("hasHistory", () => {
  it("is true once anything was logged", () => {
    expect(hasHistory([log("habit:teeth", 2, 1)], "habit:teeth")).toBe(true);
    expect(hasHistory([], "habit:teeth")).toBe(false);
  });
});
