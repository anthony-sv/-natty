import { describe, expect, it } from "vitest";
import {
  formatSet,
  isNewRecord,
  lastSetFor,
  prForRepRange,
  prFrontier,
} from "./pr";
import type { WeightUnit } from "@/lib/units";
import type { LoggedSet } from "./schema";

let seq = 0;
function set(
  weight: number | undefined,
  reps: number,
  performedAt = ++seq,
  unit: WeightUnit = "kg",
): LoggedSet {
  return {
    id: `s${seq}`,
    performedAt,
    exerciseId: "lat-pulldown-wide",
    weight,
    unit,
    reps,
  };
}

/** Compact "weight×reps" for readable assertions. */
const shape = (sets: LoggedSet[]) =>
  sets.map((s) => `${s.weight ?? "bw"}x${s.reps}`);

describe("prFrontier", () => {
  it("drops a set beaten on both weight and reps", () => {
    const frontier = prFrontier([
      set(120, 1),
      set(110, 3),
      set(95, 5), // 100x6 is heavier AND longer
      set(100, 6),
      set(90, 8),
    ]);
    expect(shape(frontier)).toEqual(["120x1", "110x3", "100x6", "90x8"]);
  });

  it("keeps a lighter set that goes longer", () => {
    expect(shape(prFrontier([set(100, 5), set(80, 12)]))).toEqual([
      "100x5",
      "80x12",
    ]);
  });

  it("keeps a heavier set that goes shorter", () => {
    expect(shape(prFrontier([set(80, 12), set(100, 5)]))).toEqual([
      "100x5",
      "80x12",
    ]);
  });

  it("keeps only the longest of several sets at one weight", () => {
    expect(shape(prFrontier([set(100, 5), set(100, 8), set(100, 3)]))).toEqual([
      "100x8",
    ]);
  });

  it("keeps only the heaviest of several sets at one rep count", () => {
    expect(shape(prFrontier([set(90, 8), set(100, 8), set(85, 8)]))).toEqual([
      "100x8",
    ]);
  });

  it("returns the single set when there is only one", () => {
    expect(shape(prFrontier([set(60, 10)]))).toEqual(["60x10"]);
  });

  it("returns nothing for an empty log", () => {
    expect(prFrontier([])).toEqual([]);
  });

  it("ranks added weight above bodyweight at the same reps", () => {
    expect(shape(prFrontier([set(undefined, 8), set(20, 8)]))).toEqual(["20x8"]);
  });

  it("collapses to most-reps when nothing carried weight", () => {
    const frontier = prFrontier([
      set(undefined, 8),
      set(undefined, 12),
      set(undefined, 10),
    ]);
    expect(shape(frontier)).toEqual(["bwx12"]);
  });

  it("compares pounds against kilos by normalising", () => {
    // 100lb is 45.4kg, so the 50kg set is the real record despite the smaller
    // number on it.
    const frontier = prFrontier([set(100, 8, 1, "lb"), set(50, 8, 2, "kg")]);
    expect(shape(frontier)).toEqual(["50x8"]);
  });

  it("keeps a pounds set that genuinely wins", () => {
    // 200lb is 90.7kg, which beats 80kg.
    const frontier = prFrontier([set(200, 8, 1, "lb"), set(80, 8, 2, "kg")]);
    expect(frontier).toHaveLength(1);
    expect(formatSet(frontier[0])).toBe("200lb × 8");
  });

  it("does not mutate the input", () => {
    const sets = [set(80, 12), set(100, 5)];
    const before = sets.map((s) => s.id);
    prFrontier(sets);
    expect(sets.map((s) => s.id)).toEqual(before);
  });
});

describe("prForRepRange", () => {
  const frontier = prFrontier([
    set(120, 1),
    set(110, 3),
    set(100, 6),
    set(90, 8),
  ]);

  it("picks the heaviest record reaching the prescribed reps", () => {
    // 8-12 reps prescribed: 120x1 is useless, 90x8 is the relevant record.
    expect(formatSet(prForRepRange(frontier, [8, 12])!)).toBe("90kg × 8");
  });

  it("uses the lower bound of the range, not the upper", () => {
    // 6-10 reps: you have a 100x6, so that is the bar to beat.
    expect(formatSet(prForRepRange(frontier, [6, 10])!)).toBe("100kg × 6");
  });

  it("accepts a single rep target", () => {
    expect(formatSet(prForRepRange(frontier, 3)!)).toBe("110kg × 3");
  });

  it("falls back to the heaviest when nothing reaches the target reps", () => {
    expect(formatSet(prForRepRange(frontier, [15, 20])!)).toBe("120kg × 1");
  });

  it("returns the heaviest when no reps are prescribed", () => {
    expect(formatSet(prForRepRange(frontier, undefined)!)).toBe("120kg × 1");
  });

  it("returns undefined for an empty frontier", () => {
    expect(prForRepRange([], [8, 12])).toBeUndefined();
  });
});

describe("isNewRecord", () => {
  const logged = [set(120, 1), set(100, 6), set(90, 8)];

  it("counts a first-ever set as a record", () => {
    expect(isNewRecord([], set(40, 10))).toBe(true);
  });

  it("counts a set nothing dominates as a record", () => {
    // Longer than every heavier set.
    expect(isNewRecord(logged, set(85, 12))).toBe(true);
  });

  it("rejects a set beaten on both axes", () => {
    // 100x6 is heavier and longer.
    expect(isNewRecord(logged, set(95, 5))).toBe(false);
  });

  it("rejects matching a previous best exactly", () => {
    // Repeating your best is a tie, not a record.
    expect(isNewRecord(logged, set(100, 6))).toBe(false);
  });

  it("counts more reps at an existing weight as a record", () => {
    expect(isNewRecord(logged, set(100, 7))).toBe(true);
  });

  it("counts more weight at an existing rep count as a record", () => {
    expect(isNewRecord(logged, set(105, 6))).toBe(true);
  });

  it("compares across units", () => {
    // 250lb is 113.4kg -- heavier than the 120kg? No: 113.4 < 120, and 1 rep
    // ties, so 120x1 still dominates it.
    expect(isNewRecord(logged, set(250, 1, 99, "lb"))).toBe(false);
    // 280lb is 127kg, which does beat 120kg.
    expect(isNewRecord(logged, set(280, 1, 99, "lb"))).toBe(true);
  });
});

describe("lastSetFor", () => {
  it("picks the most recent by performedAt, not by log order", () => {
    const sets = [set(80, 10, 300), set(90, 8, 500), set(85, 9, 100)];
    expect(formatSet(lastSetFor(sets)!)).toBe("90kg × 8");
  });

  it("returns undefined for an empty log", () => {
    expect(lastSetFor([])).toBeUndefined();
  });
});

describe("formatSet", () => {
  it("omits the weight for a bodyweight set", () => {
    expect(formatSet(set(undefined, 12))).toBe("× 12");
  });

  it("shows the unit it was logged in, never a conversion", () => {
    expect(formatSet(set(100, 8, 1, "lb"))).toBe("100lb × 8");
    expect(formatSet(set(100, 8, 1, "kg"))).toBe("100kg × 8");
  });
});
