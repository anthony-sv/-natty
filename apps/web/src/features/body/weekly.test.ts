import { describe, expect, it } from "vitest";
import type { WeightUnit } from "@/lib/units";
import type { BodyEntry } from "./schema";
import { DAYS_IN_WEEK, startOfWeek, weeklyAverages, weekOverWeek } from "./weekly";

/**
 * Local-time helpers, so nothing here depends on the machine's timezone.
 *
 * The whole point of `startOfWeek` is that it works in the reader's own zone,
 * so pinning the tests to one would test the wrong thing — and CI, a laptop in
 * Mexico City and a laptop in Madrid would disagree.
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

function entry(
  measuredAt: number,
  weight: number,
  options: { unit?: WeightUnit; bodyFatPercent?: number } = {},
): BodyEntry {
  return {
    id: `b${measuredAt}-${weight}`,
    measuredAt,
    weight,
    unit: options.unit ?? "kg",
    bodyFatPercent: options.bodyFatPercent,
  };
}

const MONDAY = 1;
const THURSDAY = 4;

describe("startOfWeek", () => {
  it("always lands on a Monday at local midnight", () => {
    // 2026-08-10 is a Monday; walk a fortnight of arbitrary times off it.
    for (let day = 0; day < 14; day++) {
      const start = new Date(startOfWeek(at(2026, 8, 10 + day, 13, 47)));
      expect(start.getDay()).toBe(MONDAY);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    }
  });

  it("keeps a Sunday-night weigh-in in the week that just ended", () => {
    // 2026-08-16 is the Sunday of the week starting Monday the 10th. Weighing
    // in at 23:00 is still that week, not the next one -- a UTC boundary would
    // push it forward for anyone west of Greenwich.
    expect(startOfWeek(at(2026, 8, 16, 23, 0))).toBe(at(2026, 8, 10, 0, 0));
  });

  it("puts Monday 00:00 in its own week rather than the previous one", () => {
    const monday = at(2026, 8, 10, 0, 0);
    expect(startOfWeek(monday)).toBe(monday);
  });

  it("crosses a month boundary", () => {
    // Wednesday 2026-09-02 belongs to the week starting Monday 2026-08-31.
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
      const midweek = new Date(monday);
      midweek.setDate(midweek.getDate() + 3);
      midweek.setHours(12);
      expect(startOfWeek(midweek.getTime())).toBe(monday);

      const next = new Date(monday);
      next.setDate(next.getDate() + DAYS_IN_WEEK);
      monday = next.getTime();
    }
  });
});

describe("weeklyAverages", () => {
  const now = at(2026, 8, 12); // Wednesday of the week starting the 10th.

  it("averages the weigh-ins inside each week, oldest first", () => {
    const averages = weeklyAverages(
      [
        entry(at(2026, 8, 3), 82),
        entry(at(2026, 8, 5), 81),
        entry(at(2026, 8, 9), 80), // Sunday -- still the week of the 3rd.
        entry(at(2026, 8, 10), 79),
        entry(at(2026, 8, 11), 81),
      ],
      "kg",
      now,
    );

    expect(averages).toHaveLength(2);
    expect(averages[0].weekStart).toBe(at(2026, 8, 3, 0, 0));
    expect(averages[0].weight).toBeCloseTo(81, 5);
    expect(averages[0].count).toBe(3);
    expect(averages[1].weight).toBeCloseTo(80, 5);
    expect(averages[1].count).toBe(2);
  });

  it("plots each week at its Thursday, not its Monday", () => {
    const [week] = weeklyAverages([entry(at(2026, 8, 3), 82)], "kg", now);
    expect(week.midpoint).toBe(at(2026, 8, 6, 0, 0));
    expect(new Date(week.midpoint).getDay()).toBe(THURSDAY);
  });

  it("converts to one unit before averaging", () => {
    // 176.37lb is 80kg, so the mean of it and 82kg is 81kg -- not (82+176)/2.
    const [week] = weeklyAverages(
      [
        entry(at(2026, 8, 3), 82),
        entry(at(2026, 8, 4), 176.37, { unit: "lb" }),
      ],
      "kg",
      now,
    );
    expect(week.weight).toBeCloseTo(81, 1);
  });

  it("averages only the entries that carried a body-fat reading", () => {
    const [week] = weeklyAverages(
      [
        entry(at(2026, 8, 3), 82, { bodyFatPercent: 14 }),
        entry(at(2026, 8, 4), 82),
        entry(at(2026, 8, 5), 82, { bodyFatPercent: 16 }),
      ],
      "kg",
      now,
    );
    // The weightless middle entry drags the weight mean but not this one.
    expect(week.bodyFatPercent).toBeCloseTo(15, 5);
    expect(week.count).toBe(3);
  });

  it("leaves body fat undefined when no entry in the week had one", () => {
    const [week] = weeklyAverages([entry(at(2026, 8, 3), 82)], "kg", now);
    expect(week.bodyFatPercent).toBeUndefined();
  });

  it("marks only the running week as partial", () => {
    const averages = weeklyAverages(
      [entry(at(2026, 8, 3), 82), entry(at(2026, 8, 10), 81)],
      "kg",
      now,
    );
    // A past week with one weigh-in is complete -- you just didn't step on the
    // scale the other six days. Only the week `now` falls in can still grow.
    expect(averages[0].isPartial).toBe(false);
    expect(averages[1].isPartial).toBe(true);
  });

  it("skips weeks with nothing logged rather than interpolating", () => {
    const averages = weeklyAverages(
      [entry(at(2026, 7, 20), 84), entry(at(2026, 8, 10), 81)],
      "kg",
      now,
    );
    expect(averages).toHaveLength(2);
    expect(averages[1].weekStart).toBe(at(2026, 8, 10, 0, 0));
  });

  it("is empty with nothing logged", () => {
    expect(weeklyAverages([], "kg", now)).toEqual([]);
  });
});

describe("weekOverWeek", () => {
  const now = at(2026, 8, 12);

  it("reports the change against the previous week", () => {
    const averages = weeklyAverages(
      [entry(at(2026, 8, 3), 82), entry(at(2026, 8, 10), 80.5)],
      "kg",
      now,
    );
    const change = weekOverWeek(averages)!;

    expect(change.latest.weight).toBeCloseTo(80.5, 5);
    expect(change.previous!.weight).toBeCloseTo(82, 5);
    expect(change.deltaWeight).toBeCloseTo(-1.5, 5);
    expect(change.deltaPercent).toBeCloseTo((-1.5 / 82) * 100, 5);
  });

  it("compares against the last week you actually weighed in, not the calendar", () => {
    // Nothing logged in the week of the 3rd; the comparison skips it rather
    // than reporting "no change" against a week that has no number.
    const averages = weeklyAverages(
      [entry(at(2026, 7, 27), 83), entry(at(2026, 8, 10), 81)],
      "kg",
      now,
    );
    const change = weekOverWeek(averages)!;
    expect(change.previous!.weekStart).toBe(at(2026, 7, 27, 0, 0));
    expect(change.deltaWeight).toBeCloseTo(-2, 5);
  });

  it("has no delta on the first week", () => {
    const averages = weeklyAverages([entry(at(2026, 8, 10), 81)], "kg", now);
    const change = weekOverWeek(averages)!;
    expect(change.previous).toBeUndefined();
    expect(change.deltaWeight).toBeUndefined();
  });

  it("is undefined with nothing logged", () => {
    expect(weekOverWeek([])).toBeUndefined();
  });
});
