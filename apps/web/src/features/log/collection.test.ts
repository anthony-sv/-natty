import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteSet,
  loggedSetsForStep,
  loggedSets,
  logSet,
  restoreSet,
  setsFor,
  updateSet,
} from "./collection";
import { prFrontier } from "./pr";

function clear() {
  for (const set of [...loggedSets().values()]) loggedSets().delete(set.id);
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

describe("correcting a logged set", () => {
  /**
   * The reason edit and delete are safe to offer at all: `isRecord` is decided
   * by `prFrontier` every time it's asked and is never stored, so a correction
   * flows through to the records table, the charts and the player's PR line
   * with nothing to fix up afterwards. These pin that.
   */
  const frontierReps = () =>
    prFrontier(setsFor("hack-squat"))
      .map((set) => `${set.weight}x${set.reps}`)
      .sort();

  it("moves the frontier when a mistyped weight is corrected", () => {
    const good = logSet({
      performedAt: 1,
      exerciseId: "hack-squat",
      unit: "kg",
      weight: 100,
      reps: 8,
    });
    // The classic slip: a stray zero, which then sits on the frontier forever
    // as a personal record nobody set.
    const typo = logSet({
      performedAt: 2,
      exerciseId: "hack-squat",
      unit: "kg",
      weight: 1000,
      reps: 5,
    });

    expect(frontierReps()).toContain("1000x5");

    updateSet(typo.set.id, {
      weight: 100,
      unit: "kg",
      reps: 5,
      performedAt: typo.set.performedAt,
    });

    // The phantom is gone, and 100x8 still holds the record it always did.
    expect(frontierReps()).not.toContain("1000x5");
    expect(frontierReps()).toContain(`${good.set.weight}x8`);
  });

  it("leaves the next-best set holding the record after a delete", () => {
    logSet({ performedAt: 1, exerciseId: "hack-squat", unit: "kg", weight: 100, reps: 5 });
    const best = logSet({
      performedAt: 2,
      exerciseId: "hack-squat",
      unit: "kg",
      weight: 140,
      reps: 5,
    });

    expect(frontierReps()).toEqual(["140x5"]);

    deleteSet(best.set.id);

    expect(frontierReps()).toEqual(["100x5"]);
  });

  it("hands the deleted row back so an undo can put it there again", () => {
    const logged = logSet({
      performedAt: 1,
      exerciseId: "hack-squat",
      unit: "kg",
      weight: 120,
      reps: 3,
    });

    const { set: removed } = deleteSet(logged.set.id);
    expect(setsFor("hack-squat")).toHaveLength(0);

    restoreSet(removed!);

    // Same id, so it lands back where it was rather than as a duplicate.
    expect(setsFor("hack-squat").map((s) => s.id)).toEqual([logged.set.id]);
  });

  it("does not let an edit move a set to another exercise", () => {
    const logged = logSet({
      performedAt: 1,
      exerciseId: "hack-squat",
      unit: "kg",
      weight: 100,
      reps: 8,
    });

    updateSet(logged.set.id, {
      weight: 110,
      unit: "kg",
      reps: 8,
      performedAt: logged.set.performedAt,
    });

    // A set logged against the wrong lift is a different set; moving it would
    // rewrite two exercises' histories at once.
    expect(setsFor("hack-squat")).toHaveLength(1);
    expect(loggedSets().get(logged.set.id)?.exerciseId).toBe("hack-squat");
  });
});
