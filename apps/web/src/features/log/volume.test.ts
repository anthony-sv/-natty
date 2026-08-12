import { describe, expect, it } from "vitest";
import {
  exercises,
  movementPatternSchema,
  movements,
  muscleSchema,
  musclesForExercise,
  type MovementPattern,
  type MuscleId,
} from "@/data/exercises";
import type { LoggedSet } from "./schema";
import {
  muscleGaps,
  SPLIT_FOR_PATTERN,
  totalsFor,
  weeklyVolume,
  type ExerciseAnatomy,
} from "./volume";

function at(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day, 9, 0).getTime();
}

/** Weeks are identified by local midnight on their Monday. */
function midnight(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getTime();
}

let seq = 0;
function set(exerciseId: string, performedAt: number): LoggedSet {
  return {
    id: `s${++seq}`,
    performedAt,
    exerciseId,
    weight: 100,
    unit: "kg",
    reps: 8,
  };
}

/**
 * Three fixtures rather than the real library, so the counting is tested
 * without also testing 113 exercises' muscle assignments.
 */
const FIXTURES: Record<
  string,
  { primary: MuscleId[]; secondary: MuscleId[] }
> = {
  squat: { primary: ["quads"], secondary: ["glutes", "hamstrings"] },
  bench: { primary: ["chest"], secondary: ["triceps"] },
  curl: { primary: ["biceps"], secondary: ["forearms"] },
  // Deliberately lists one muscle both ways, to pin that it counts once.
  odd: { primary: ["chest"], secondary: ["chest", "triceps"] },
  run: { primary: [], secondary: [] },
};

const anatomy: ExerciseAnatomy = {
  muscles: (id) => FIXTURES[id] ?? { primary: [], secondary: [] },
  pattern: (id) =>
    ({
      squat: "squat",
      bench: "horizontal-press",
      curl: "elbow-flexion",
      odd: "horizontal-press",
      run: "cardio",
    })[id] as MovementPattern | undefined,
};

const NOW = at(2026, 8, 12); // Wednesday of the week starting the 10th.

describe("SPLIT_FOR_PATTERN", () => {
  it("covers every pattern the schema allows", () => {
    // Exhaustive on purpose: a pattern added to the schema and forgotten here
    // would silently count toward nothing.
    for (const pattern of movementPatternSchema.options) {
      expect(SPLIT_FOR_PATTERN[pattern]).toBeDefined();
    }
  });

  it("puts every real movement somewhere", () => {
    for (const movement of movements) {
      expect(SPLIT_FOR_PATTERN[movement.pattern]).toBeDefined();
    }
  });

  it("classifies raises as push and rear delts as pull", () => {
    expect(SPLIT_FOR_PATTERN["lateral-raise"]).toBe("push");
    expect(SPLIT_FOR_PATTERN["front-raise"]).toBe("push");
    expect(SPLIT_FOR_PATTERN["rear-delt"]).toBe("pull");
  });
});

describe("weeklyVolume", () => {
  it("counts a primary muscle as direct and a secondary as indirect", () => {
    const [week] = weeklyVolume([set("squat", at(2026, 8, 10))], anatomy, NOW);

    expect(week.muscles).toEqual([
      { muscle: "quads", directSets: 1, indirectSets: 0 },
      { muscle: "glutes", directSets: 0, indirectSets: 1 },
      { muscle: "hamstrings", directSets: 0, indirectSets: 1 },
    ]);
  });

  it("counts a muscle once when it is listed both ways", () => {
    const [week] = weeklyVolume([set("odd", at(2026, 8, 10))], anatomy, NOW);
    const chest = week.muscles.find((m) => m.muscle === "chest")!;

    // The stronger claim wins: it's direct work, not direct *and* incidental.
    expect(chest).toEqual({ muscle: "chest", directSets: 1, indirectSets: 0 });
  });

  it("ranks by direct sets, not by total", () => {
    const week = weeklyVolume(
      [
        set("squat", at(2026, 8, 10)),
        set("squat", at(2026, 8, 10)),
        set("squat", at(2026, 8, 10)),
        set("bench", at(2026, 8, 11)),
        set("bench", at(2026, 8, 11)),
      ],
      anatomy,
      NOW,
    )[0];

    // Glutes have 3 indirect sets and chest only 2 direct, but direct is what
    // the ranking is about.
    expect(week.muscles.map((m) => m.muscle)).toEqual([
      "quads",
      "chest",
      "glutes",
      "hamstrings",
      "triceps",
    ]);
  });

  it("splits by pattern and keeps cardio out of the total", () => {
    const [week] = weeklyVolume(
      [
        set("bench", at(2026, 8, 10)),
        set("curl", at(2026, 8, 10)),
        set("squat", at(2026, 8, 11)),
        set("run", at(2026, 8, 11)),
      ],
      anatomy,
      NOW,
    );

    expect(week.split).toEqual({ push: 1, pull: 1, legs: 1, core: 0, cardio: 1 });
    // Cardio is counted but isn't resistance volume.
    expect(week.totalSets).toBe(3);
  });

  it("buckets into Monday-to-Sunday weeks, oldest first", () => {
    const weeks = weeklyVolume(
      [
        set("bench", at(2026, 8, 9)), // Sunday — the week of the 3rd
        set("bench", at(2026, 8, 10)), // Monday — the week of the 10th
      ],
      anatomy,
      NOW,
    );

    expect(weeks.map((w) => w.weekStart)).toEqual([
      midnight(2026, 8, 3),
      midnight(2026, 8, 10),
    ]);
  });

  it("marks only the running week as partial", () => {
    const weeks = weeklyVolume(
      [set("bench", at(2026, 8, 3)), set("bench", at(2026, 8, 10))],
      anatomy,
      NOW,
    );

    expect(weeks.map((w) => w.isPartial)).toEqual([false, true]);
  });

  it("has nothing to say about an empty log", () => {
    expect(weeklyVolume([], anatomy, NOW)).toEqual([]);
  });
});

describe("totalsFor", () => {
  it("adds the splits across weeks", () => {
    const weeks = weeklyVolume(
      [
        set("bench", at(2026, 8, 3)),
        set("squat", at(2026, 8, 4)),
        set("bench", at(2026, 8, 10)),
      ],
      anatomy,
      NOW,
    );

    expect(totalsFor(weeks)).toEqual({
      split: { push: 2, pull: 0, legs: 1, core: 0, cardio: 0 },
      totalSets: 3,
    });
  });
});

describe("muscleGaps", () => {
  const ALL = muscleSchema.options;
  const TRAINABLE = new Set<MuscleId>(["quads", "chest", "biceps"]);

  it("reports a muscle no exercise trains directly", () => {
    const weeks = weeklyVolume([set("squat", at(2026, 8, 10))], anatomy, NOW);
    const gaps = muscleGaps(weeks, ALL, TRAINABLE);

    // Glutes took an indirect set, and nothing in this library could give them
    // a direct one — that's a fact about the catalog, not about the lifter.
    expect(gaps.find((g) => g.muscle === "glutes")).toEqual({
      muscle: "glutes",
      reason: "never-direct",
      indirectSets: 1,
    });
  });

  it("separates 'never trained' from 'only ever indirectly'", () => {
    const weeks = weeklyVolume([set("curl", at(2026, 8, 10))], anatomy, NOW);
    const gaps = muscleGaps(
      weeks,
      ALL,
      new Set<MuscleId>(["quads", "chest", "biceps", "forearms"]),
    );

    // Forearms are trainable directly and got only incidental work.
    expect(gaps.find((g) => g.muscle === "forearms")?.reason).toBe(
      "indirect-only",
    );
    // Quads are trainable directly and got nothing at all.
    expect(gaps.find((g) => g.muscle === "quads")?.reason).toBe("not-trained");
  });

  it("leaves out anything that got direct work", () => {
    const weeks = weeklyVolume([set("bench", at(2026, 8, 10))], anatomy, NOW);
    const gaps = muscleGaps(weeks, ALL, TRAINABLE);

    expect(gaps.map((g) => g.muscle)).not.toContain("chest");
  });

  it("puts the most-worked-indirectly first", () => {
    const weeks = weeklyVolume(
      [set("squat", at(2026, 8, 10)), set("squat", at(2026, 8, 11))],
      anatomy,
      NOW,
    );
    const gaps = muscleGaps(weeks, ALL, TRAINABLE);

    // A muscle taking constant incidental load with no direct work is a more
    // interesting gap than one you simply never touch.
    expect(gaps[0].indirectSets).toBeGreaterThan(0);
  });
});

describe("against the real exercise library", () => {
  /** Every muscle some exercise in the library lists as primary. */
  const trainableDirectly = new Set<MuscleId>(
    exercises.flatMap((exercise) => musclesForExercise(exercise).primaryMuscles),
  );

  it("can train every muscle it models directly", () => {
    // This assertion has now driven three separate library fixes, which is the
    // whole reason it walks the real data rather than a fixture. It read
    // ["abs", "adductors", "glutes"], then ["abs"] once the hip movements
    // landed, and is empty now that crunches and leg raises do.
    //
    // Each time, the gaps card was naming a deficiency the app gave you no way
    // to fix — a complaint rather than a finding. Empty is the end state: every
    // muscle in `muscleSchema` has at least one exercise that makes it the
    // point of the set. A new muscle added without one fails right here.
    const undirectable = muscleSchema.options.filter(
      (muscle) => !trainableDirectly.has(muscle),
    );
    expect([...undirectable].sort()).toEqual([]);
  });

  it("makes abs directly trainable", () => {
    // Named separately so removing the ab work fails by name rather than
    // silently folding back into the list above.
    expect(trainableDirectly.has("abs")).toBe(true);
  });

  it("makes glutes and adductors directly trainable", () => {
    // Stated separately from the list above so it fails by name if a hip
    // movement is ever removed or repointed, rather than silently folding back
    // into the undirectable set.
    expect(trainableDirectly.has("glutes")).toBe(true);
    expect(trainableDirectly.has("adductors")).toBe(true);
  });

  it("counts a muscle an exercise overrides to primary as directly trainable", () => {
    // No *movement* lists forearms as primary, but the reverse curl overrides
    // its movement to say so — which is exactly why the gap check has to run
    // through `musclesForExercise` rather than over `movements`.
    expect(trainableDirectly.has("forearms")).toBe(true);
    expect(
      movements.every((movement) => !movement.primaryMuscles.includes("forearms")),
    ).toBe(true);
  });

  it("works glutes as a secondary on several movements", () => {
    // So they read as "never-direct" with real indirect volume behind them,
    // rather than as a muscle nothing touches.
    const withGlutes = movements.filter((movement) =>
      movement.secondaryMuscles.includes("glutes"),
    );
    expect(withGlutes.length).toBeGreaterThan(3);
  });
});
