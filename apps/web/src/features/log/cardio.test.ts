import { describe, expect, it } from "vitest";
import { formattingFor } from "@/i18n/test-formatting";
import type { CardioEntry } from "./cardio-schema";
import {
  describeDistance,
  distanceSince,
  distanceThisWeek,
  effectiveDistanceKm,
  formatCardio,
  totalDistanceKm,
} from "./cardio";

const T = formattingFor().t;

let seq = 0;
function entry(over: Partial<CardioEntry> & { performedAt: number }): CardioEntry {
  return {
    id: `c${++seq}`,
    exerciseId: "treadmill-run",
    distance: 5,
    unit: "km",
    ...over,
  };
}

describe("effectiveDistanceKm", () => {
  it("passes km through unchanged", () => {
    expect(effectiveDistanceKm(entry({ performedAt: 1, distance: 5, unit: "km" }))).toBe(5);
  });

  it("converts miles to km", () => {
    const km = effectiveDistanceKm(entry({ performedAt: 1, distance: 1, unit: "mi" }));
    expect(km).toBeCloseTo(1.609344, 5);
  });
});

describe("totalDistanceKm", () => {
  it("sums across mixed units", () => {
    const total = totalDistanceKm([
      entry({ performedAt: 1, distance: 5, unit: "km" }),
      entry({ performedAt: 2, distance: 1, unit: "mi" }),
    ]);
    expect(total).toBeCloseTo(6.609344, 5);
  });

  it("is zero for no entries", () => {
    expect(totalDistanceKm([])).toBe(0);
  });
});

describe("distanceSince / distanceThisWeek", () => {
  it("excludes entries before the cutoff", () => {
    const entries = [
      entry({ performedAt: Date.UTC(2026, 0, 1), distance: 5 }),
      entry({ performedAt: Date.UTC(2026, 0, 10), distance: 3 }),
    ];
    expect(distanceSince(entries, Date.UTC(2026, 0, 5))).toBe(3);
  });

  it("this week sums only entries since Monday", () => {
    // Thursday Jan 15, 2026 — week starts Monday Jan 12.
    const now = new Date(2026, 0, 15, 9).getTime();
    const entries = [
      entry({ performedAt: new Date(2026, 0, 10, 9).getTime(), distance: 10 }), // last week
      entry({ performedAt: new Date(2026, 0, 13, 9).getTime(), distance: 4 }), // this week
    ];
    expect(distanceThisWeek(entries, now)).toBe(4);
  });
});

describe("formatCardio", () => {
  it("shows distance and unit alone when no duration was recorded", () => {
    expect(formatCardio(entry({ performedAt: 1, distance: 5, unit: "km" }))).toBe("5km");
  });

  it("adds a duration when one was recorded", () => {
    expect(
      formatCardio(
        entry({ performedAt: 1, distance: 5, unit: "km", durationSeconds: 1925 }),
      ),
    ).toBe("5km · 32:05");
  });
});

describe("describeDistance", () => {
  it("returns undefined at zero", () => {
    expect(describeDistance(0, T)).toBeUndefined();
  });

  it("reports how far short of the smallest route below it", () => {
    const result = describeDistance(3, T);
    expect(result).toEqual({ kind: "toward", label: "a 5K", remainingKm: 2 });
  });

  it("picks the largest route passed and the remainder past it", () => {
    // Between a marathon (42.2) and London-to-Brighton (90).
    const result = describeDistance(50, T);
    expect(result?.kind).toBe("passed");
    if (result?.kind === "passed") {
      expect(result.label).toBe("a marathon");
      expect(result.remainderKm).toBeCloseTo(7.8, 5);
    }
  });

  it("never regresses past the largest route on a huge total", () => {
    const result = describeDistance(100_000, T);
    expect(result?.kind).toBe("passed");
    if (result?.kind === "passed") {
      expect(result.label).toBe("once around the Earth");
    }
  });
});
