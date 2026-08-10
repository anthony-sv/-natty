import { describe, expect, it } from "vitest";
import {
  CHART_REPS,
  RPE_VALUES,
  loadFor,
  oneRepMaxFrom,
  percentOfMax,
  rirForRpe,
  rpeForRir,
} from "./rpe";

describe("percentOfMax", () => {
  it("matches the published chart", () => {
    // Spot values from across the grid, one per corner and a few inside.
    expect(percentOfMax(1, 10)).toBe(100);
    expect(percentOfMax(12, 10)).toBe(68.0);
    expect(percentOfMax(5, 8)).toBe(81.1);
    expect(percentOfMax(8, 7)).toBe(70.7);
    expect(percentOfMax(3, 6.5)).toBe(82.4);
    expect(percentOfMax(2, 9)).toBe(92.2);
  });

  it("treats a rep in reserve as a rep — that's the whole chart", () => {
    // A single at RPE 9 leaves one in the tank, so it's the same effort as a
    // double taken to failure. If these ever disagree the table has drifted
    // into two independent axes.
    expect(percentOfMax(1, 9)).toBe(percentOfMax(2, 10));
    expect(percentOfMax(3, 8)).toBe(percentOfMax(5, 10));
    expect(percentOfMax(6, 7.5)).toBe(percentOfMax(8, 9.5));
  });

  it("gets lighter as reps rise and as RPE falls", () => {
    for (const rpe of RPE_VALUES) {
      const row = CHART_REPS.map((reps) => percentOfMax(reps, rpe)).filter(
        (value): value is number => value !== undefined,
      );
      expect(row).toEqual([...row].sort((a, b) => b - a));
    }
    for (const reps of [1, 5, 8]) {
      const column = RPE_VALUES.map((rpe) => percentOfMax(reps, rpe)).filter(
        (value): value is number => value !== undefined,
      );
      expect(column).toEqual([...column].sort((a, b) => a - b));
    }
  });

  it("stops at the edge of the chart rather than extrapolating", () => {
    expect(percentOfMax(13, 10)).toBeUndefined();
    expect(percentOfMax(12, 6)).toBeUndefined();
    expect(percentOfMax(1, 5.5)).toBeUndefined();
    expect(percentOfMax(1, 11)).toBeUndefined();
    expect(percentOfMax(0, 10)).toBeUndefined();
  });

  it("declines a quarter-point RPE, which the chart doesn't publish", () => {
    expect(percentOfMax(5, 8.25)).toBeUndefined();
  });
});

describe("RPE and RIR", () => {
  it("are the same statement from opposite ends", () => {
    expect(rirForRpe(10)).toBe(0);
    expect(rirForRpe(7.5)).toBe(2.5);
    expect(rpeForRir(3)).toBe(7);
    expect(rpeForRir(rirForRpe(8.5))).toBe(8.5);
  });
});

describe("oneRepMaxFrom", () => {
  it("scales the load up by its share of the max", () => {
    // 100kg × 5 @ RPE 8 is 81.1% of a max.
    expect(oneRepMaxFrom(100, 5, 8)).toBeCloseTo(123.3, 1);
  });

  it("leaves a true single alone", () => {
    expect(oneRepMaxFrom(140, 1, 10)).toBe(140);
  });

  it("declines what the chart can't answer", () => {
    expect(oneRepMaxFrom(100, 20, 8)).toBeUndefined();
    expect(oneRepMaxFrom(0, 5, 8)).toBeUndefined();
  });
});

describe("loadFor", () => {
  it("is the inverse of oneRepMaxFrom", () => {
    const max = oneRepMaxFrom(100, 5, 8)!;

    expect(loadFor(max, 5, 8)).toBeCloseTo(100, 6);
  });

  it("prescribes less weight for more reps at the same effort", () => {
    expect(loadFor(150, 8, 8)!).toBeLessThan(loadFor(150, 3, 8)!);
  });

  it("prescribes less weight for the same reps at a lower effort", () => {
    expect(loadFor(150, 5, 7)!).toBeLessThan(loadFor(150, 5, 9)!);
  });
});
