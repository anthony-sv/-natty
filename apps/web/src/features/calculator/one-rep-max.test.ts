import { describe, expect, it } from "vitest";
import {
  FORMULAS,
  MAX_USEFUL_REPS,
  estimateAll,
  formulaById,
  medianEstimate,
} from "./one-rep-max";

const by = (id: string) => FORMULAS.find((f) => f.id === id)!;

describe("the formulas", () => {
  it("do not agree with themselves on a single rep", () => {
    // Worth pinning, because it is the reason `estimateAll` refuses one rep:
    // only two of the five read a true single as 100% of itself.
    expect(by("brzycki").oneRepMax(100, 1)).toBeCloseTo(100, 6);
    expect(by("lombardi").oneRepMax(100, 1)).toBeCloseTo(100, 6);
    expect(by("epley").oneRepMax(100, 1)).toBeCloseTo(103.33, 2);
    expect(by("lander").oneRepMax(100, 1)).toBeCloseTo(101.39, 2);
    expect(by("mayhew").oneRepMax(100, 1)).toBeCloseTo(108.86, 2);
  });

  it("match their published values on a known set", () => {
    // 100kg × 5.
    expect(by("epley").oneRepMax(100, 5)).toBeCloseTo(116.67, 2);
    expect(by("brzycki").oneRepMax(100, 5)).toBeCloseTo(112.5, 2);
    expect(by("lander").oneRepMax(100, 5)).toBeCloseTo(113.71, 2);
    expect(by("lombardi").oneRepMax(100, 5)).toBeCloseTo(117.46, 2);
    expect(by("mayhew").oneRepMax(100, 5)).toBeCloseTo(119.01, 2);
  });

  it("invert cleanly — the load for N reps re-estimates to the same max", () => {
    for (const formula of FORMULAS) {
      for (const reps of [1, 3, 5, 8, 12]) {
        const load = formula.loadForReps(150, reps);
        expect(formula.oneRepMax(load, reps)).toBeCloseTo(150, 6);
      }
    }
  });

  it("predict a lighter load the more reps you want", () => {
    for (const formula of FORMULAS) {
      const loads = [1, 2, 3, 5, 8, 12].map((r) => formula.loadForReps(150, r));
      const sortedDescending = [...loads].sort((a, b) => b - a);
      expect(loads).toEqual(sortedDescending);
    }
  });

  it("are all reachable by id", () => {
    for (const formula of FORMULAS) {
      expect(formulaById(formula.id)).toBe(formula);
    }
  });
});

describe("estimateAll", () => {
  it("returns one estimate per formula", () => {
    expect(estimateAll(100, 5)).toHaveLength(FORMULAS.length);
  });

  it("declines a single rep, which needs no estimating", () => {
    expect(estimateAll(100, 1)).toBeUndefined();
    expect(estimateAll(100, 2)).toBeDefined();
  });

  it("declines input that isn't a set", () => {
    expect(estimateAll(undefined, 5)).toBeUndefined();
    expect(estimateAll(100, undefined)).toBeUndefined();
    expect(estimateAll(0, 5)).toBeUndefined();
    expect(estimateAll(-100, 5)).toBeUndefined();
    expect(estimateAll(100, 0)).toBeUndefined();
  });

  it("stops where the fits stop being useful", () => {
    expect(estimateAll(100, MAX_USEFUL_REPS)).toBeDefined();
    expect(estimateAll(100, MAX_USEFUL_REPS + 1)).toBeUndefined();
  });
});

describe("medianEstimate", () => {
  it("takes the middle of an odd count", () => {
    const estimates = estimateAll(100, 5)!;
    const sorted = estimates.map((e) => e.oneRepMax).sort((a, b) => a - b);

    expect(medianEstimate(estimates)).toBe(sorted[2]);
  });

  it("averages the middle two of an even count", () => {
    const estimates = estimateAll(100, 5)!.slice(0, 4);
    const sorted = estimates.map((e) => e.oneRepMax).sort((a, b) => a - b);

    expect(medianEstimate(estimates)).toBeCloseTo((sorted[1]! + sorted[2]!) / 2, 6);
  });

  it("sits between the extremes, which is the point of showing it", () => {
    // At twelve reps the five span roughly 128 to 144 — Lombardi lowest,
    // Lander highest — and the median has to land inside that.
    const estimates = estimateAll(100, 12)!;
    const values = estimates.map((e) => e.oneRepMax);
    const median = medianEstimate(estimates);

    expect(median).toBeGreaterThan(Math.min(...values));
    expect(median).toBeLessThan(Math.max(...values));
  });
});
