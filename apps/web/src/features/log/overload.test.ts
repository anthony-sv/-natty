import { describe, expect, it } from "vitest";
import type { LoggedSet } from "./schema";
import { suggestOverload } from "./overload";

function set(over: Partial<LoggedSet>): LoggedSet {
  return {
    id: "s1",
    performedAt: 1,
    exerciseId: "flat-barbell-bench-press",
    unit: "kg",
    reps: 10,
    weight: 60,
    ...over,
  };
}

describe("suggestOverload", () => {
  it("has no suggestion without a last set", () => {
    expect(suggestOverload([8, 12], undefined)).toBeUndefined();
  });

  it("has no suggestion without a target range", () => {
    expect(suggestOverload(undefined, set({ reps: 10 }))).toBeUndefined();
  });

  it("adds a rep when below the top of the range", () => {
    const result = suggestOverload([8, 12], set({ reps: 10, weight: 60 }));
    expect(result).toEqual({ weight: 60, unit: "kg", reps: 11 });
  });

  it("adds weight and drops to the bottom of the range at the top", () => {
    const result = suggestOverload([8, 12], set({ reps: 12, weight: 60 }));
    expect(result).toEqual({ weight: 62.5, unit: "kg", reps: 8 });
  });

  it("also triggers the weight step past the top of the range", () => {
    const result = suggestOverload([8, 12], set({ reps: 15, weight: 60 }));
    expect(result).toEqual({ weight: 62.5, unit: "kg", reps: 8 });
  });

  it("uses the lb increment for lb sets", () => {
    const result = suggestOverload(
      [8, 12],
      set({ reps: 12, weight: 135, unit: "lb" }),
    );
    expect(result).toEqual({ weight: 140, unit: "lb", reps: 8 });
  });

  it("treats a single fixed rep target as its own min and max", () => {
    const below = suggestOverload(8, set({ reps: 6, weight: 60 }));
    expect(below).toEqual({ weight: 60, unit: "kg", reps: 7 });

    const atTarget = suggestOverload(8, set({ reps: 8, weight: 60 }));
    expect(atTarget).toEqual({ weight: 62.5, unit: "kg", reps: 8 });
  });

  it("suggests only a weight bump for a bodyweight exercise, leaving weight unset", () => {
    const result = suggestOverload(
      [8, 12],
      set({ reps: 12, weight: undefined }),
    );
    expect(result).toEqual({ weight: undefined, unit: "kg", reps: 8 });
  });

  it("never suggests past the top of the range on the reps-only path", () => {
    const result = suggestOverload([8, 12], set({ reps: 11, weight: 60 }));
    expect(result?.reps).toBe(12);
  });
});
