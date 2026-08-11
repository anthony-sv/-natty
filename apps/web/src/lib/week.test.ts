import { describe, expect, it } from "vitest";
import { addDays, DAYS_IN_WEEK, daysBetween, startOfDay, startOfWeek } from "./week";

/**
 * Local-time helpers, so nothing here depends on the machine's timezone.
 *
 * The whole point of this module is that it works in the reader's own zone, so
 * pinning the tests to one would test the wrong thing — CI, a laptop in Mexico
 * City and a laptop in Madrid would disagree.
 */
function at(
  year: number,
  month: number,
  day: number,
  hour = 9,
  minute = 0,
): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

const MONDAY = 1;

describe("startOfDay", () => {
  it("strips the time of day", () => {
    const start = new Date(startOfDay(at(2026, 8, 12, 23, 59)));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getDate()).toBe(12);
  });

  it("keeps a late-evening moment on its own day", () => {
    // A session logged at 23:00 belongs to that day, not tomorrow. A UTC
    // bucket would move it for anyone west of Greenwich.
    expect(startOfDay(at(2026, 8, 12, 23, 0))).toBe(at(2026, 8, 12, 0, 0));
  });
});

describe("startOfWeek", () => {
  it("always lands on a Monday at local midnight", () => {
    // 2026-08-10 is a Monday; walk a fortnight of arbitrary times off it.
    for (let day = 0; day < 14; day++) {
      const start = new Date(startOfWeek(at(2026, 8, 10 + day, 13, 47)));
      expect(start.getDay()).toBe(MONDAY);
      expect(start.getHours()).toBe(0);
    }
  });

  it("keeps a Sunday-night weigh-in in the week that just ended", () => {
    expect(startOfWeek(at(2026, 8, 16, 23, 0))).toBe(at(2026, 8, 10, 0, 0));
  });

  it("puts Monday 00:00 in its own week rather than the previous one", () => {
    const monday = at(2026, 8, 10, 0, 0);
    expect(startOfWeek(monday)).toBe(monday);
  });

  it("crosses a month boundary", () => {
    expect(startOfWeek(at(2026, 9, 2))).toBe(at(2026, 8, 31, 0, 0));
  });

  /**
   * The DST guarantee, without naming a timezone.
   *
   * Every week of a year, in whatever zone the test runs in: midweek must map
   * back to that week's own Monday. Subtracting `days * 86_400_000` fails this
   * wherever the clocks change, because a day is then 23 or 25 hours long.
   */
  it("holds across a whole year, including any clock change", () => {
    let monday = startOfWeek(at(2026, 1, 5));
    for (let week = 0; week < 52; week++) {
      const midweek = addDays(monday, 3);
      expect(startOfWeek(midweek)).toBe(monday);
      monday = addDays(monday, DAYS_IN_WEEK);
    }
  });
});

describe("addDays", () => {
  it("counts calendar days, not milliseconds", () => {
    expect(addDays(at(2026, 8, 10, 0, 0), 3)).toBe(at(2026, 8, 13, 0, 0));
  });

  it("normalises past the end of a month", () => {
    expect(addDays(at(2026, 8, 31, 0, 0), 1)).toBe(at(2026, 9, 1, 0, 0));
  });

  it("lands on midnight every day of a year", () => {
    // The property a millisecond-based version breaks: after a clock change it
    // drifts to 23:00 or 01:00 and stays there.
    let day = startOfDay(at(2026, 1, 1));
    for (let i = 0; i < 365; i++) {
      expect(new Date(day).getHours()).toBe(0);
      day = addDays(day, 1);
    }
  });

  it("goes backwards too", () => {
    expect(addDays(at(2026, 8, 10, 0, 0), -1)).toBe(at(2026, 8, 9, 0, 0));
  });
});

describe("daysBetween", () => {
  it("ignores the time of day at both ends", () => {
    expect(daysBetween(at(2026, 8, 10, 23, 0), at(2026, 8, 11, 1, 0))).toBe(1);
  });

  it("is zero within one day", () => {
    expect(daysBetween(at(2026, 8, 10, 6, 0), at(2026, 8, 10, 22, 0))).toBe(0);
  });

  it("is negative going backwards", () => {
    expect(daysBetween(at(2026, 8, 12), at(2026, 8, 10))).toBe(-2);
  });

  it("counts a whole year correctly despite the clock changes", () => {
    const start = startOfDay(at(2026, 1, 1));
    expect(daysBetween(start, addDays(start, 365))).toBe(365);
  });
});
