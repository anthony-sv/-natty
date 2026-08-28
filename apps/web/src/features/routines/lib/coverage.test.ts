import { describe, expect, it } from "vitest";
import { muscleSchema, type MovementPattern, type MuscleId } from "@/data/exercises";
import { routines } from "@/data/routines";
import type { ExerciseEntry, Prescription, Routine, TrainingDay } from "@/data/routines";
import type { ExerciseAnatomy } from "@/features/log/volume";
import { mergeLibrary } from "@/features/library/merged";
import {
  routineCoverage,
  unifiedCoverage,
  type LibraryMuscleIndex,
  type LibraryPatternIndex,
} from "./coverage";

/**
 * A handful of exercises that don't exist in the real library, standing in
 * for it — `bike` is deliberately muscle-less, matching how a real cardio
 * movement carries no primary/secondary muscles.
 */
const FIXTURES: Record<
  string,
  { primary: MuscleId[]; secondary: MuscleId[]; pattern: MovementPattern }
> = {
  bench: { primary: ["chest"], secondary: ["triceps"], pattern: "horizontal-press" },
  fly: { primary: ["chest"], secondary: [], pattern: "chest-fly" },
  row: { primary: ["upper-back"], secondary: ["lats"], pattern: "horizontal-pull" },
  pulldown: { primary: ["lats"], secondary: [], pattern: "vertical-pull" },
  curl: { primary: ["biceps"], secondary: ["forearms"], pattern: "elbow-flexion" },
  bike: { primary: [], secondary: [], pattern: "cardio" },
};

function anatomyOf(): ExerciseAnatomy {
  return {
    muscles: (id) => {
      const fixture = FIXTURES[id];
      return fixture
        ? { primary: fixture.primary, secondary: fixture.secondary }
        : { primary: [], secondary: [] };
    },
    pattern: (id) => FIXTURES[id]?.pattern,
  };
}

/**
 * Library-wide facts — deliberately broader than any one test routine's own
 * exercise list, the same way the real library is broader than any one
 * program. `forearms` and `glutes` are trainable directly *somewhere* but no
 * fixture routine below actually uses them, which is what makes them useful
 * for the never-direct/not-in-routine cases.
 */
function libraryOf(): LibraryMuscleIndex {
  return {
    trainableDirectly: new Set<MuscleId>([
      "chest",
      "upper-back",
      "lats",
      "biceps",
      "forearms",
      "glutes",
    ]),
    patternsByMuscle: new Map<MuscleId, ReadonlySet<MovementPattern>>([
      ["chest", new Set(["horizontal-press", "chest-fly"])],
      ["upper-back", new Set(["horizontal-pull"])],
      ["lats", new Set(["vertical-pull", "horizontal-pull"])],
      ["biceps", new Set(["elbow-flexion"])],
    ]),
  };
}

/**
 * Same facts as `libraryOf`, plus the name/pattern/muscle projection
 * `unifiedCoverage` needs to name candidates — and, unlike `libraryOf`,
 * internally consistent: every `trainableDirectly` muscle also has a real
 * `patternsByMuscle` entry, matching the real merged library's invariant
 * (both are built from the same loop over the same rows) that `libraryOf`
 * deliberately breaks just to exercise `routineCoverage`'s reason logic.
 */
function patternLibraryOf(): LibraryPatternIndex {
  return {
    trainableDirectly: new Set<MuscleId>([
      "chest",
      "upper-back",
      "lats",
      "biceps",
      "forearms",
      "glutes",
    ]),
    patternsByMuscle: new Map<MuscleId, ReadonlySet<MovementPattern>>([
      ["chest", new Set(["horizontal-press", "chest-fly"])],
      ["upper-back", new Set(["horizontal-pull"])],
      ["lats", new Set(["vertical-pull", "horizontal-pull"])],
      ["biceps", new Set(["elbow-flexion"])],
      ["forearms", new Set(["wrist-flexion"])],
      ["glutes", new Set(["hip-extension"])],
    ]),
    all: [
      { id: "bench-press", pattern: "horizontal-press", primaryMuscles: ["chest"] },
      { id: "fly", pattern: "chest-fly", primaryMuscles: ["chest"] },
      { id: "row", pattern: "horizontal-pull", primaryMuscles: ["upper-back"] },
      { id: "pulldown", pattern: "vertical-pull", primaryMuscles: ["lats"] },
      { id: "curl", pattern: "elbow-flexion", primaryMuscles: ["biceps"] },
      { id: "wrist-curl", pattern: "wrist-flexion", primaryMuscles: ["forearms"] },
      { id: "hip-thrust", pattern: "hip-extension", primaryMuscles: ["glutes"] },
    ],
  };
}

function prescription(over: Partial<Prescription> = {}): Prescription {
  return { sets: 3, reps: [8, 12], restSeconds: 90, ...over };
}

function entry(exerciseId: string, over: Partial<ExerciseEntry> = {}): ExerciseEntry {
  return {
    exerciseId,
    orAlternatives: [],
    kind: "resistance",
    isFinisher: false,
    prescriptions: [prescription()],
    ...over,
  };
}

function day(dayNumber: number, exercises: ExerciseEntry[] = []): TrainingDay {
  return {
    dayNumber,
    label: `Day ${dayNumber}`,
    isRest: exercises.length === 0,
    exercises,
    warmupRefs: [],
  };
}

function routine(weeks: TrainingDay[][]): Routine {
  return {
    slug: "test-routine",
    name: "Test routine",
    weeks: weeks.map((days, index) => ({ weekNumber: index + 1, days })),
  };
}

describe("muscle gaps", () => {
  it("flags a muscle nothing in the library makes primary as never-direct", () => {
    const r = routine([[day(1, [entry("bench")])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), [
      "chest",
      "hamstrings",
    ]);
    expect(result.muscleGaps).toContainEqual({
      muscle: "hamstrings",
      reason: "never-direct",
      indirectCount: 0,
    });
  });

  it("flags a muscle only ever loaded indirectly as indirect-only", () => {
    const r = routine([[day(1, [entry("curl")])]]); // curl: secondary forearms
    const result = routineCoverage(r, anatomyOf(), libraryOf(), [
      "biceps",
      "forearms",
    ]);
    expect(result.muscleGaps).toContainEqual({
      muscle: "forearms",
      reason: "indirect-only",
      indirectCount: 1,
    });
  });

  it("flags a muscle the library can train directly but this routine never does", () => {
    const r = routine([[day(1, [entry("bench")])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["chest", "glutes"]);
    expect(result.muscleGaps).toContainEqual({
      muscle: "glutes",
      reason: "not-in-routine",
      indirectCount: 0,
    });
  });

  it("doesn't flag a directly-trained muscle as a gap", () => {
    const r = routine([[day(1, [entry("bench")])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["chest"]);
    expect(result.muscleGaps).toEqual([]);
  });

  it("reads every week and day, not just the first", () => {
    const r = routine([[day(1, [entry("bench")])], [day(1, [entry("fly")])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["chest"]);
    expect(result.muscleGaps).toEqual([]);
    expect(result.variety).toEqual([]); // both chest patterns land, across weeks
  });

  it("lets a rest day contribute nothing without throwing", () => {
    const r = routine([[day(1, [entry("bench")]), day(2, [])]]);
    expect(() =>
      routineCoverage(r, anatomyOf(), libraryOf(), ["chest"]),
    ).not.toThrow();
  });

  it("lets an unresolvable exerciseId contribute nothing rather than throwing", () => {
    const r = routine([[day(1, [entry("ghost-exercise")])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["chest"]);
    expect(result.muscleGaps).toContainEqual({
      muscle: "chest",
      reason: "not-in-routine",
      indirectCount: 0,
    });
  });

  it("orders gaps by indirect count descending, then by muscle name", () => {
    const r = routine([
      [day(1, [entry("curl"), entry("row"), entry("row")])],
    ]); // forearms: +1 indirect (curl); lats: +2 indirect (two rows)
    const result = routineCoverage(r, anatomyOf(), libraryOf(), [
      "forearms",
      "lats",
    ]);
    expect(result.muscleGaps.map((g) => g.muscle)).toEqual(["lats", "forearms"]);
  });
});

describe("movement variety", () => {
  it("never produces a row for a muscle the library trains with only one pattern", () => {
    const r = routine([[day(1, [entry("row")])]]); // upper-back has only horizontal-pull
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["upper-back"]);
    expect(result.variety).toEqual([]);
  });

  it("reports the missing pattern when only one of a muscle's is used", () => {
    const r = routine([[day(1, [entry("bench")])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["chest"]);
    expect(result.variety).toEqual([
      { muscle: "chest", used: ["horizontal-press"], missing: ["chest-fly"] },
    ]);
  });

  it("clears the gap once both patterns are used", () => {
    const r = routine([[day(1, [entry("bench"), entry("fly")])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["chest"]);
    expect(result.variety).toEqual([]);
  });

  it("never produces a variety row for a muscle that's already a muscle gap", () => {
    const r = routine([[day(1, [entry("bench")])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["chest", "glutes"]);
    expect(result.variety.some((v) => v.muscle === "glutes")).toBe(false);
  });

  it("doesn't count a secondary-only pattern as covering that muscle's variety", () => {
    // pulldown makes lats primary via vertical-pull; row only ever makes lats
    // secondary, so its horizontal-pull shouldn't count toward lats's variety
    // even though lats is genuinely trained directly (by pulldown).
    const r = routine([[day(1, [entry("pulldown"), entry("row")])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["lats"]);
    expect(result.variety).toEqual([
      { muscle: "lats", used: ["vertical-pull"], missing: ["horizontal-pull"] },
    ]);
  });

  it("skips a warmup-only entry but still counts a mixed one", () => {
    const allWarmup = entry("bench", {
      prescriptions: [prescription({ isWarmup: true })],
    });
    const mixed = entry("fly", {
      prescriptions: [prescription({ isWarmup: true }), prescription()],
    });
    const r = routine([[day(1, [allWarmup, mixed])]]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["chest"]);
    // Only fly's chest-fly lands — bench's horizontal-press never counts,
    // since its only prescription is a warmup.
    expect(result.variety).toEqual([
      { muscle: "chest", used: ["chest-fly"], missing: ["horizontal-press"] },
    ]);
  });
});

describe("cardio", () => {
  it("never lets a cardio entry count toward a muscle, and produces no variety row", () => {
    const r = routine([
      [
        day(1, [
          entry("bike", {
            kind: "cardio",
            prescriptions: [{ sets: 1, durationSeconds: 1800 }],
          }),
        ]),
      ],
    ]);
    const result = routineCoverage(r, anatomyOf(), libraryOf(), ["chest"]);
    expect(result.muscleGaps).toContainEqual({
      muscle: "chest",
      reason: "not-in-routine",
      indirectCount: 0,
    });
    expect(result.variety).toEqual([]);
  });
});

describe("unifiedCoverage", () => {
  it("expands a not-in-routine muscle into one row per available pattern, with named candidates", () => {
    const r = routine([[day(1, [entry("bench")])]]);
    const coverage = routineCoverage(r, anatomyOf(), patternLibraryOf(), [
      "chest",
      "glutes",
    ]);
    const result = unifiedCoverage(coverage, patternLibraryOf(), [
      "chest",
      "glutes",
    ]);
    expect(result.muscles).toContainEqual({
      muscle: "glutes",
      indirectCount: 0,
      missing: [{ pattern: "hip-extension", candidates: ["hip-thrust"] }],
    });
    expect(result.neverDirect).toEqual([]);
  });

  it("keeps a never-direct muscle out of muscles, listing it in neverDirect instead", () => {
    const r = routine([[day(1, [entry("bench")])]]);
    const coverage = routineCoverage(r, anatomyOf(), patternLibraryOf(), [
      "chest",
      "hamstrings",
    ]);
    const result = unifiedCoverage(coverage, patternLibraryOf(), [
      "chest",
      "hamstrings",
    ]);
    expect(result.neverDirect).toEqual(["hamstrings"]);
    expect(result.muscles.some((m) => m.muscle === "hamstrings")).toBe(false);
  });

  it("carries the indirect count through for an indirect-only muscle", () => {
    const r = routine([[day(1, [entry("curl")])]]); // curl: secondary forearms
    const coverage = routineCoverage(r, anatomyOf(), patternLibraryOf(), [
      "biceps",
      "forearms",
    ]);
    const result = unifiedCoverage(coverage, patternLibraryOf(), [
      "biceps",
      "forearms",
    ]);
    expect(result.muscles).toContainEqual({
      muscle: "forearms",
      indirectCount: 1,
      missing: [{ pattern: "wrist-flexion", candidates: ["wrist-curl"] }],
    });
  });

  it("only lists the pattern actually missing for a partially-covered muscle", () => {
    const r = routine([[day(1, [entry("bench")])]]); // chest: horizontal-press only
    const coverage = routineCoverage(r, anatomyOf(), patternLibraryOf(), ["chest"]);
    const result = unifiedCoverage(coverage, patternLibraryOf(), ["chest"]);
    expect(result.muscles).toEqual([
      {
        muscle: "chest",
        indirectCount: 0,
        missing: [{ pattern: "chest-fly", candidates: ["fly"] }],
      },
    ]);
  });

  it("orders muscles by the allMuscles list, not by discovery order", () => {
    // row: upper-back primary, lats secondary-only — lats is indirect-only,
    // glutes is not-in-routine; both are real gaps regardless of order.
    const r = routine([[day(1, [entry("row")])]]);
    const coverage = routineCoverage(r, anatomyOf(), patternLibraryOf(), [
      "glutes",
      "lats",
    ]);
    const reversed = unifiedCoverage(coverage, patternLibraryOf(), [
      "lats",
      "glutes",
    ]);
    expect(reversed.muscles.map((m) => m.muscle)).toEqual(["lats", "glutes"]);
  });
});

describe("against the real library", () => {
  it("finds no never-direct muscle gap in any built-in routine", () => {
    // never-direct depends only on `trainableDirectly`, a library-wide fact —
    // this is the same finding `volume.test.ts` pins for `muscleGaps`,
    // re-checked here as the guard for this feature's own reason logic.
    const library = mergeLibrary([]);
    for (const r of routines) {
      const result = routineCoverage(
        r,
        library.anatomy,
        library,
        muscleSchema.options,
      );
      expect(result.muscleGaps.filter((g) => g.reason === "never-direct")).toEqual(
        [],
      );
    }
  });
});
