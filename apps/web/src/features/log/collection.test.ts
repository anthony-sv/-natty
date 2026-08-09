import { beforeEach, describe, expect, it } from "vitest";
import { loggedSetsForStep, loggedSets, logSet, setsFor } from "./collection";

function clear() {
  for (const set of [...loggedSets.values()]) loggedSets.delete(set.id);
}

beforeEach(clear);

describe("setsFor", () => {
  it("returns only the requested exercise's sets", () => {
    logSet({ performedAt: 1, exerciseId: "hack-squat", unit: "kg", weight: 100, reps: 8 });
    logSet({ performedAt: 2, exerciseId: "chest-dip", unit: "kg", reps: 12 });

    expect(setsFor("hack-squat").map((s) => s.reps)).toEqual([8]);
    expect(setsFor("chest-dip").map((s) => s.reps)).toEqual([12]);
    expect(setsFor("never-logged")).toEqual([]);
  });

  it("sees a set the moment it is inserted, without a re-render", () => {
    // The whole point: event handlers can't wait for a live query to catch up.
    expect(setsFor("hack-squat")).toHaveLength(0);
    logSet({ performedAt: 1, exerciseId: "hack-squat", unit: "kg", weight: 60, reps: 10 });
    expect(setsFor("hack-squat")).toHaveLength(1);
  });
});

describe("loggedSetsForStep", () => {
  const ref = {
    exerciseId: "hack-squat",
    routineSlug: "big-wheels-program",
    weekNumber: 1,
    dayNumber: 2,
    setNumber: 3,
  };

  it("returns nothing before the set is logged", () => {
    expect(loggedSetsForStep(ref)).toEqual([]);
  });

  it("returns the set logged for exactly that step", () => {
    logSet({ ...ref, performedAt: 1, unit: "kg", weight: 100, reps: 8 });
    expect(loggedSetsForStep(ref).map((s) => s.reps)).toEqual([8]);
  });

  it("does not match a different set of the same exercise", () => {
    logSet({ ...ref, performedAt: 1, unit: "kg", weight: 100, reps: 8 });
    expect(loggedSetsForStep({ ...ref, setNumber: 4 })).toEqual([]);
  });

  it("does not match the same set number on a different day", () => {
    logSet({ ...ref, performedAt: 1, unit: "kg", weight: 100, reps: 8 });
    expect(loggedSetsForStep({ ...ref, dayNumber: 5 })).toEqual([]);
    expect(loggedSetsForStep({ ...ref, weekNumber: 2 })).toEqual([]);
  });

  it("ignores backfilled sets, which carry no provenance", () => {
    logSet({ exerciseId: "hack-squat", performedAt: 1, unit: "kg", weight: 200, reps: 5 });
    expect(loggedSetsForStep(ref)).toEqual([]);
  });

  it("returns every entry when a step holds more than one", () => {
    // A drop set, or extra work past the prescription.
    logSet({ ...ref, performedAt: 1, unit: "kg", weight: 100, reps: 8 });
    logSet({ ...ref, performedAt: 2, unit: "kg", weight: 70, reps: 6 });
    expect(loggedSetsForStep(ref).map((s) => s.weight)).toEqual([100, 70]);
  });
});

describe("record detection", () => {
  let at = 0;
  /** Exactly what the player calls — `logSet` owns the ordering. */
  function log(weight: number, reps: number) {
    return logSet({
      performedAt: ++at,
      exerciseId: "smith-bulgarian-split-squat",
      unit: "kg",
      weight,
      reps,
    }).isRecord;
  }

  it("counts a first-ever set as a record", () => {
    // Regression: this reported only "logged" when the check ran against a
    // stale live-query snapshot that held another exercise's heavier sets.
    expect(log(40, 10)).toBe(true);
  });

  it("does not repeat the record toast for an identical second set", () => {
    // Regression: set 2 of the same weight announced a new PR, because the
    // snapshot hadn't caught up and still looked empty.
    expect(log(60, 12)).toBe(true);
    expect(log(60, 12)).toBe(false);
  });

  it("still recognises a genuine improvement later in the exercise", () => {
    expect(log(60, 12)).toBe(true);
    expect(log(60, 12)).toBe(false);
    expect(log(65, 12)).toBe(true);
    expect(log(65, 10)).toBe(false);
  });
});
