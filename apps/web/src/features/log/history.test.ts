import { describe, expect, it } from "vitest";
import type { WeightUnit } from "@/lib/units";
import {
  estimatedPoints,
  loadedPoints,
  toSetPoints,
  toStrengthCurve,
} from "./history";
import { prFrontier } from "./pr";
import type { LoggedSet } from "./schema";

let seq = 0;
function set(
  weight: number | undefined,
  reps: number,
  performedAt = ++seq,
  unit: WeightUnit = "kg",
): LoggedSet {
  return {
    id: `s${++seq}`,
    performedAt,
    exerciseId: "bench",
    weight,
    unit,
    reps,
  };
}

describe("toSetPoints", () => {
  it("orders oldest first, whatever order the log came in", () => {
    const points = toSetPoints(
      [set(100, 5, 300), set(90, 5, 100), set(95, 5, 200)],
      "kg",
    );
    expect(points.map((p) => p.weight)).toEqual([90, 95, 100]);
  });

  it("marks exactly the sets on the frontier", () => {
    const sets = [
      set(120, 1),
      set(110, 3),
      set(95, 5), // dominated by 100x6: heavier *and* longer
      set(100, 6),
      set(90, 8),
    ];
    const points = toSetPoints(sets, "kg");

    const marked = points.filter((p) => p.isRecord).map((p) => p.id).sort();
    const frontier = prFrontier(sets).map((s) => s.id).sort();
    // Derived from the same function the table renders, so the chart and the
    // table can never disagree about what a record is.
    expect(marked).toEqual(frontier);
    expect(marked).toHaveLength(4);
  });

  it("converts to the caller's unit", () => {
    // 220lb is 99.79kg.
    const [point] = toSetPoints([set(220, 5, 1, "lb")], "kg");
    expect(point.weight).toBeCloseTo(99.79, 1);
  });

  it("estimates a one-rep max with Epley", () => {
    // Epley: 100 * (1 + 5/30) = 116.67.
    const [point] = toSetPoints([set(100, 5)], "kg");
    expect(point.oneRepMax).toBeCloseTo(116.67, 1);
  });

  it("reports a true single as itself rather than extrapolating past it", () => {
    // Epley would read a single as 103% of itself, which is a worse answer than
    // the number you actually lifted.
    const [point] = toSetPoints([set(140, 1)], "kg");
    expect(point.oneRepMax).toBe(140);
  });

  it("has no estimate for a bodyweight set", () => {
    const [point] = toSetPoints([set(undefined, 12)], "kg");
    expect(point.weight).toBeUndefined();
    expect(point.oneRepMax).toBeUndefined();
  });

  it("has no estimate past the useful rep range", () => {
    // The fits diverge badly beyond twelve, which is why `estimateAll` stops
    // there too.
    const [point] = toSetPoints([set(60, 20)], "kg");
    expect(point.oneRepMax).toBeUndefined();
  });

  it("has nothing to plot for an empty log", () => {
    expect(toSetPoints([], "kg")).toEqual([]);
  });
});

describe("loadedPoints / estimatedPoints", () => {
  it("drop what the weight axes can't place", () => {
    const points = toSetPoints(
      [set(100, 5), set(undefined, 15), set(60, 20)],
      "kg",
    );
    expect(loadedPoints(points).map((p) => p.reps)).toEqual([5, 20]);
    // The 20-rep set has a load but no honest estimate.
    expect(estimatedPoints(points).map((p) => p.reps)).toEqual([5]);
  });
});

describe("toStrengthCurve", () => {
  it("runs fewest reps first, so the curve reads left to right", () => {
    const curve = toStrengthCurve(
      [set(120, 1), set(110, 3), set(100, 6), set(90, 8)],
      "kg",
    );
    expect(curve.map((p) => [p.reps, p.weight])).toEqual([
      [1, 120],
      [3, 110],
      [6, 100],
      [8, 90],
    ]);
  });

  it("carries only the frontier, not every set", () => {
    const curve = toStrengthCurve([set(100, 5), set(90, 5), set(80, 5)], "kg");
    // Same reps, so only the heaviest survives.
    expect(curve).toHaveLength(1);
    expect(curve[0].weight).toBe(100);
  });

  it("drops bodyweight records, which have no height to plot", () => {
    // Unweighted sets are real records — on a lift you've only done unweighted
    // the frontier is "most reps" — but there's no load to give them a y.
    const curve = toStrengthCurve([set(undefined, 20), set(20, 8)], "kg");
    expect(curve.map((p) => p.reps)).toEqual([8]);
  });

  it("is empty when nothing carried a load", () => {
    expect(toStrengthCurve([set(undefined, 12), set(undefined, 15)], "kg")).toEqual(
      [],
    );
  });
});
