import { describe, expect, it } from "vitest";
import type { LoggedSet } from "./schema";
import { deloadStatus, isPlateaued } from "./plateau";

function day(n: number): number {
  return new Date(2026, 0, n, 9).getTime();
}

let seq = 0;
function set(over: Partial<LoggedSet> & { performedAt: number }): LoggedSet {
  return {
    id: `s${++seq}`,
    exerciseId: "flat-barbell-bench-press",
    unit: "kg",
    weight: 60,
    reps: 8,
    ...over,
  };
}

/** One set per day, each a new record — steady progress, never a plateau. */
function progressingSets(exerciseId: string, days: number[]): LoggedSet[] {
  return days.map((d, i) => set({ performedAt: day(d), exerciseId, weight: 60 + i }));
}

/** One set per day, all tied at the same weight/reps — a stall. */
function stalledSets(exerciseId: string, days: number[]): LoggedSet[] {
  return days.map((d) => set({ performedAt: day(d), exerciseId, weight: 60, reps: 8 }));
}

describe("isPlateaued", () => {
  it("is false with fewer than 3 training days", () => {
    expect(isPlateaued(stalledSets("a", [1, 2]))).toBe(false);
  });

  it("is false when every recent day still sets a record", () => {
    expect(isPlateaued(progressingSets("a", [1, 2, 3, 4]))).toBe(false);
  });

  it("is true when the last 3 days repeat the same set", () => {
    expect(isPlateaued(stalledSets("a", [1, 2, 3, 4]))).toBe(true);
  });

  it("recovers once a day actually beats the prior best", () => {
    const sets = [
      ...stalledSets("a", [1, 2, 3]),
      set({ performedAt: day(4), exerciseId: "a", weight: 65, reps: 8 }),
    ];
    expect(isPlateaued(sets)).toBe(false);
  });

  it("only counts one top set per day, not every set logged that day", () => {
    // Same weight/reps twice on day 4 shouldn't read as its own improvement.
    const sets = [
      ...stalledSets("a", [1, 2, 3]),
      set({ performedAt: day(4), exerciseId: "a", weight: 60, reps: 8 }),
      set({ performedAt: day(4), exerciseId: "a", weight: 60, reps: 8 }),
    ];
    expect(isPlateaued(sets)).toBe(true);
  });
});

describe("deloadStatus", () => {
  const NOW = day(20);

  it("suggests nothing with no plateaued exercises", () => {
    const sets = [
      ...progressingSets("a", [10, 12, 14, 16]),
      ...progressingSets("b", [10, 12, 14, 16]),
    ];
    expect(deloadStatus(sets, NOW).suggested).toBe(false);
  });

  it("does not suggest from a single stalled exercise among several", () => {
    const sets = [
      ...stalledSets("a", [10, 12, 14, 16]),
      ...progressingSets("b", [10, 12, 14, 16]),
      ...progressingSets("c", [10, 12, 14, 16]),
      ...progressingSets("d", [10, 12, 14, 16]),
    ];
    const status = deloadStatus(sets, NOW);
    expect(status.suggested).toBe(false);
    expect(status.plateauedExerciseIds).toEqual(["a"]);
  });

  it("suggests a deload once enough regularly-trained exercises stall", () => {
    const sets = [
      ...stalledSets("a", [10, 12, 14, 16]),
      ...stalledSets("b", [10, 12, 14, 16]),
      ...progressingSets("c", [10, 12, 14, 16]),
    ];
    const status = deloadStatus(sets, NOW);
    expect(status.suggested).toBe(true);
    expect(status.plateauedExerciseIds.sort()).toEqual(["a", "b"]);
  });

  it("ignores an exercise with too little history even if its top set repeats", () => {
    const sets = [
      ...stalledSets("a", [16, 17]), // only 2 days
      ...stalledSets("b", [10, 12, 14, 16]),
    ];
    // "a" doesn't have enough training days to judge, "b" alone isn't enough
    // to trigger the share/floor rule against however many exercises count.
    const status = deloadStatus(sets, NOW);
    expect(status.plateauedExerciseIds).toEqual(["b"]);
    expect(status.suggested).toBe(false);
  });

  it("ignores an exercise that hasn't been trained recently", () => {
    // Plateaued, but the most recent set is well outside the 14-day window.
    const sets = stalledSets("a", [1, 2, 3]);
    const status = deloadStatus(sets, NOW);
    expect(status.plateauedExerciseIds).toEqual([]);
    expect(status.suggested).toBe(false);
  });
});
