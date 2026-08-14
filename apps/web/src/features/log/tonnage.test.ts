import { describe, expect, it } from "vitest";
import type { MuscleId } from "@/data/exercises";
import type { LoggedSet } from "./schema";
import {
  comparisonsFor,
  scopeStart,
  tonnageFor,
  type TonnageScope,
} from "./tonnage";
import type { ExerciseAnatomy } from "./volume";

/** A squat: quads primary, glutes and hamstrings along for the ride. */
const anatomy: ExerciseAnatomy = {
  muscles: (id) =>
    id === "back-squat"
      ? {
          primary: ["quads"] as MuscleId[],
          secondary: ["glutes", "hamstrings"] as MuscleId[],
        }
      : id === "hip-thrust"
        ? { primary: ["glutes"] as MuscleId[], secondary: [] }
        : { primary: [], secondary: [] },
  pattern: () => "squat",
};

const NOW = Date.parse("2026-08-13T18:00:00Z");
const DAY = 86_400_000;

function set(over: Partial<LoggedSet> = {}): LoggedSet {
  return {
    id: Math.random().toString(36),
    performedAt: NOW,
    exerciseId: "back-squat",
    weight: 100,
    unit: "kg",
    reps: 10,
    ...over,
  };
}

describe("tonnageFor", () => {
  it("counts weight times reps, once per set", () => {
    const total = tonnageFor([set(), set()], anatomy, "all", NOW);
    expect(total.totalKg).toBe(2000);
    expect(total.sets).toBe(2);
    expect(total.reps).toBe(20);
  });

  it("does not triple-count a compound lift across its muscles", () => {
    // The whole reason this module makes a decision. A squat is 1,000 kg of
    // work, not 1,000 for quads plus 1,000 for glutes plus 1,000 for
    // hamstrings — the total has to stay the total.
    const total = tonnageFor([set()], anatomy, "all", NOW);
    expect(total.totalKg).toBe(1000);

    const summed = total.muscles.reduce(
      (n, m) => n + m.directKg + m.indirectKg,
      0,
    );
    // The rows deliberately exceed it, which is why the UI says they don't
    // add up rather than pretending they do.
    expect(summed).toBeGreaterThan(total.totalKg);
  });

  it("keeps direct and indirect apart", () => {
    const total = tonnageFor([set()], anatomy, "all", NOW);
    const quads = total.muscles.find((m) => m.muscle === "quads")!;
    const glutes = total.muscles.find((m) => m.muscle === "glutes")!;

    expect(quads.directKg).toBe(1000);
    expect(quads.indirectKg).toBe(0);
    // Never fused at a coefficient — the same call `weeklyVolume` makes.
    expect(glutes.directKg).toBe(0);
    expect(glutes.indirectKg).toBe(1000);
  });

  it("counts a muscle once when it is both primary and secondary", () => {
    const both: ExerciseAnatomy = {
      muscles: () => ({
        primary: ["glutes"] as MuscleId[],
        secondary: ["glutes"] as MuscleId[],
      }),
      pattern: () => "hinge",
    };
    const total = tonnageFor([set()], both, "all", NOW);
    const glutes = total.muscles.find((m) => m.muscle === "glutes")!;
    expect(glutes.directKg).toBe(1000);
    expect(glutes.indirectKg).toBe(0);
  });

  it("normalises pounds rather than adding them to kilos", () => {
    const total = tonnageFor(
      [set({ weight: 100, unit: "lb", reps: 1 })],
      anatomy,
      "all",
      NOW,
    );
    expect(total.totalKg).toBeCloseTo(45.36, 1);
  });

  it("reports bodyweight sets rather than silently dropping them", () => {
    // The limitation that has to reach the screen: an unweighted set is real
    // work worth zero tonnage, and a total that just ignored it would
    // understate someone doing calisthenics with no way to tell.
    const total = tonnageFor(
      [set(), set({ weight: undefined })],
      anatomy,
      "all",
      NOW,
    );
    expect(total.totalKg).toBe(1000);
    expect(total.sets).toBe(2);
    expect(total.unweightedSets).toBe(1);
  });

  it("only counts what falls inside the scope", () => {
    const sets = [set(), set({ performedAt: NOW - 400 * DAY })];
    expect(tonnageFor(sets, anatomy, "all", NOW).totalKg).toBe(2000);
    expect(tonnageFor(sets, anatomy, "year", NOW).totalKg).toBe(1000);
  });

  it("ranks muscles by the work they actually did", () => {
    const total = tonnageFor(
      [set(), set({ exerciseId: "hip-thrust", weight: 200 })],
      anatomy,
      "all",
      NOW,
    );
    // Glutes did 2,000 kg directly against quads' 1,000.
    expect(total.muscles[0]!.muscle).toBe("glutes");
  });
});

describe("scopeStart", () => {
  it("opens each window at local midnight", () => {
    for (const scope of ["week", "month", "year"] as TonnageScope[]) {
      const start = new Date(scopeStart(scope, NOW));
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    }
  });

  it("reaches back further the wider the scope", () => {
    expect(scopeStart("all", NOW)).toBe(0);
    expect(scopeStart("year", NOW)).toBeLessThanOrEqual(scopeStart("month", NOW));
    expect(scopeStart("month", NOW)).toBeLessThanOrEqual(scopeStart("week", NOW));
  });
});

describe("comparisonsFor", () => {
  it("picks the biggest thing you have actually beaten", () => {
    // 20 tonnes is a week of decent training: two buses reads better than
    // 0.13 whales, which is the failure this ordering exists to avoid.
    const [first] = comparisonsFor(20_000);
    expect(first.key).toBe("bus");
    expect(first.count).toBeCloseTo(1.7, 1);
  });

  it("never leads with a fraction of something when a whole one exists", () => {
    for (const kg of [500, 5_000, 50_000, 500_000, 5_000_000, 50_000_000]) {
      const [first] = comparisonsFor(kg);
      expect(first.count).toBeGreaterThanOrEqual(1);
    }
  });

  it("still says something below the smallest object", () => {
    // "Half a piano" is a picture; nothing at all is not.
    const [only] = comparisonsFor(200);
    expect(only.key).toBe("piano");
    expect(only.count).toBe(0.5);
  });

  it("has nothing to say about no work", () => {
    expect(comparisonsFor(0)).toEqual([]);
  });

  it("rounds to something readable", () => {
    // One decimal while the count is small enough for it to matter, whole
    // numbers after — "1,234.7 pianos" is false precision.
    // 600 kg is 1.2 horses, not 1.5 pianos: the largest object that still
    // gives a whole one wins, which is the ordering rule above.
    expect(comparisonsFor(600)[0]!.count).toBe(1.2);
    expect(comparisonsFor(400_000)[0]!.count).toBe(2.7);
    expect(Number.isInteger(comparisonsFor(6_000_000)[0]!.count)).toBe(true);
  });
});
