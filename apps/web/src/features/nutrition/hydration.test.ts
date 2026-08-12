import { describe, expect, it } from "vitest";
import {
  CREATINE_ML,
  DEFAULT_TRAINING_HOURS,
  ML_PER_KG,
  ML_PER_TRAINING_HOUR,
  ZERO_COKE_ML,
  formatLitres,
  hydrationFor,
  hydrationOptions,
} from "./hydration";

describe("hydrationFor", () => {
  it("is bodyweight plus creatine on a rest day", () => {
    expect(hydrationFor(80)).toBe(80 * ML_PER_KG + CREATINE_ML);
    expect(hydrationFor(80)).toBe(3700);
  });

  it("carries creatine on a rest day too", () => {
    // It's a daily supplement, not a training-day one — the 500 ml sits
    // outside the training term on purpose.
    expect(hydrationFor(80, 0) - 80 * ML_PER_KG).toBe(CREATINE_ML);
  });

  it("adds the training term per hour", () => {
    expect(hydrationFor(80, 1)).toBe(3700 + ML_PER_TRAINING_HOUR);
    expect(hydrationFor(80, 2)).toBe(3700 + 2 * ML_PER_TRAINING_HOUR);
    // Half an hour is half the water; nothing rounds to whole sessions.
    expect(hydrationFor(80, 0.5)).toBe(3700 + ML_PER_TRAINING_HOUR / 2);
  });

  it("scales with bodyweight", () => {
    expect(hydrationFor(100) - hydrationFor(90)).toBe(10 * ML_PER_KG);
  });
});

describe("the rows the page shows", () => {
  it("swaps exactly one bottle per coke", () => {
    const { restDay } = hydrationOptions(80);
    expect(restDay.map((row) => row.zeroCokes)).toEqual([0, 1, 2]);
    expect(restDay[0]!.litres - restDay[1]!.litres).toBeCloseTo(
      ZERO_COKE_ML / 1000,
      6,
    );
    expect(restDay[1]!.litres - restDay[2]!.litres).toBeCloseTo(
      ZERO_COKE_ML / 1000,
      6,
    );
  });

  it("assumes one training hour unless told otherwise", () => {
    const assumed = hydrationOptions(80);
    const explicit = hydrationOptions(80, DEFAULT_TRAINING_HOURS);
    expect(assumed.trainingDay).toEqual(explicit.trainingDay);
    // And a longer session really does move it.
    expect(hydrationOptions(80, 2).trainingDay[0]!.litres).toBeGreaterThan(
      assumed.trainingDay[0]!.litres,
    );
  });

  it("never offers a negative total", () => {
    // Only reachable at absurd weights, but a row of "-0.2 L" would be worse
    // than a missing one.
    for (const row of hydrationOptions(10).restDay) {
      expect(row.litres).toBeGreaterThan(0);
    }
  });
});

describe("against the source documents", () => {
  /**
   * The transcribed table this formula replaced, for the author's 83 kg:
   * 4.15 L rest and 4.65 L training.
   *
   * Pinned so the difference is a recorded decision rather than something a
   * later reader mistakes for a transcription bug. The formula is leaner on a
   * rest day and almost identical on a training one.
   */
  const DOC_REST_L = 4.15;
  const DOC_TRAINING_L = 4.65;

  it("comes out lower than the doc on a rest day", () => {
    const { restDay, trainingDay } = hydrationOptions(83);
    expect(restDay[0]!.litres).toBeCloseTo(3.82, 2);
    expect(trainingDay[0]!.litres).toBeCloseTo(4.57, 2);

    expect(restDay[0]!.litres).toBeLessThan(DOC_REST_L);
    expect(trainingDay[0]!.litres).toBeLessThan(DOC_TRAINING_L);
    // Within a glass of water of the doc's training figure.
    expect(DOC_TRAINING_L - trainingDay[0]!.litres).toBeLessThan(0.1);
  });

  it("keeps the doc's coke steps exactly", () => {
    // 4.15 → 3.55 → 2.95 in the source is −0.6 each time, which is the one
    // part of that table that generalises. `toBeCloseTo`, because `4.15 - 3.55`
    // is 0.6000000000000005 in binary floating point — which is also why the
    // module works in millilitres and only divides at the boundary.
    expect(ZERO_COKE_ML / 1000).toBeCloseTo(4.15 - 3.55, 6);
    expect(ZERO_COKE_ML / 1000).toBeCloseTo(3.55 - 2.95, 6);
  });
});

describe("formatLitres", () => {
  it("rounds to one decimal", () => {
    expect(formatLitres(3.82)).toBe("3.8L");
    expect(formatLitres(4)).toBe("4.0L");
  });
});
