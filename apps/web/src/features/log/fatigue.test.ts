import { describe, expect, it } from "vitest";
import { muscleSchema, type MovementPattern, type MuscleId } from "@/data/exercises";
import type { WorkoutCompletion } from "./completion-schema";
import type { LoggedSet } from "./schema";
import type { ExerciseAnatomy } from "./volume";
import {
  fatigueStep,
  muscleFatigue,
  RECOVERY_HOURS,
  type RoutineDayExercises,
} from "./fatigue";

const HOUR_MS = 60 * 60 * 1000;
const NOW = new Date(2026, 7, 12, 9, 0).getTime();

let seq = 0;
function set(exerciseId: string, hoursAgo: number): LoggedSet {
  return {
    id: `s${++seq}`,
    performedAt: NOW - hoursAgo * HOUR_MS,
    exerciseId,
    weight: 100,
    unit: "kg",
    reps: 8,
  };
}

function completion(
  routineSlug: string,
  weekNumber: number,
  dayNumber: number,
  hoursAgo: number,
): WorkoutCompletion {
  return {
    id: `c${++seq}`,
    routineSlug,
    weekNumber,
    dayNumber,
    performedAt: NOW - hoursAgo * HOUR_MS,
  };
}

/** Three fixtures, like `volume.test.ts` — no real library involved. */
const FIXTURES: Record<string, { primary: MuscleId[]; secondary: MuscleId[] }> = {
  squat: { primary: ["quads"], secondary: ["glutes", "hamstrings"] },
  bench: { primary: ["chest"], secondary: ["triceps"] },
  // Same muscle both ways on one set — pins that it counts once, as direct.
  odd: { primary: ["chest"], secondary: ["chest", "triceps"] },
};

const anatomy: ExerciseAnatomy = {
  muscles: (id) => FIXTURES[id] ?? { primary: [], secondary: [] },
  pattern: () => "squat" as MovementPattern,
};

/** No completions to resolve — most tests care only about logged sets. */
const NO_COMPLETIONS: WorkoutCompletion[] = [];
const EMPTY_LOOKUP: RoutineDayExercises = { exercisesFor: () => undefined };

/** "chest-day" w1d1 prescribes `bench`; "back-day" w1d1 prescribes `squat`. */
const ROUTINE_LOOKUP: RoutineDayExercises = {
  exercisesFor: (slug, week, day) => {
    if (slug === "chest-day" && week === 1 && day === 1) return ["bench"];
    if (slug === "back-day" && week === 1 && day === 1) return ["squat"];
    return undefined;
  },
};

const ALL: MuscleId[] = ["quads", "glutes", "hamstrings", "chest", "triceps"];

describe("RECOVERY_HOURS", () => {
  it("covers every muscle the schema allows", () => {
    // Exhaustive on purpose, the way `SPLIT_FOR_PATTERN` is pinned in
    // `volume.test.ts` — a muscle added to the schema and forgotten here
    // would read `undefined` and silently break every downstream comparison.
    for (const muscle of muscleSchema.options) {
      expect(RECOVERY_HOURS[muscle]).toBeGreaterThan(0);
    }
  });
});

describe("muscleFatigue", () => {
  it("reports a muscle never worked as untrained", () => {
    const [quads] = muscleFatigue(
      [],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    );
    expect(quads).toEqual({
      muscle: "quads",
      state: "untrained",
      lastDirectAt: undefined,
      lastIndirectAt: undefined,
      hoursSinceDirect: undefined,
      recoveryHours: RECOVERY_HOURS.quads,
      fatigue: 0,
    });
  });

  it("is recovering well inside the window", () => {
    // Quads recover in 72h; 12h in is deep in the window.
    const [quads] = muscleFatigue(
      [set("squat", 12)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    );
    expect(quads.state).toBe("recovering");
    expect(quads.hoursSinceDirect).toBe(12);
  });

  it("is ready once well past the window", () => {
    const [quads] = muscleFatigue(
      [set("squat", 90)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    );
    expect(quads.state).toBe("ready");
  });

  it("treats both sides of the +/-3h tolerance as 'nearly', not a flip", () => {
    // 72h window: 69h and 75h are the two edges of the band.
    const early = muscleFatigue(
      [set("squat", 69)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    )[0];
    const late = muscleFatigue(
      [set("squat", 75)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    )[0];
    expect(early.state).toBe("nearly");
    expect(late.state).toBe("nearly");

    // Just outside either edge falls back to the plain states.
    const justBefore = muscleFatigue(
      [set("squat", 68.9)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    )[0];
    const justAfter = muscleFatigue(
      [set("squat", 75.1)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    )[0];
    expect(justBefore.state).toBe("recovering");
    expect(justAfter.state).toBe("ready");
  });

  it("drives the clock off direct work only", () => {
    // Glutes are only ever secondary on a squat — indirect, never direct.
    const [glutes] = muscleFatigue(
      [set("squat", 1)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["glutes"],
      NOW,
    );
    expect(glutes.state).toBe("untrained");
    expect(glutes.lastDirectAt).toBeUndefined();
    expect(glutes.lastIndirectAt).toBe(NOW - 1 * HOUR_MS);
  });

  it("counts a muscle once when it's listed both ways on one set", () => {
    const [chest] = muscleFatigue(
      [set("odd", 1)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["chest"],
      NOW,
    );
    // Direct work recorded; the same set's secondary listing didn't also
    // register as an indirect hit.
    expect(chest.lastDirectAt).toBe(NOW - 1 * HOUR_MS);
    expect(chest.lastIndirectAt).toBeUndefined();
  });

  it("keeps the most recent direct set, not the first", () => {
    const [chest] = muscleFatigue(
      [set("bench", 50), set("bench", 5)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["chest"],
      NOW,
    );
    expect(chest.hoursSinceDirect).toBe(5);
  });

  it("clamps fatigue to [0, 1]", () => {
    // Just trained: fatigue is at its ceiling.
    const fresh = muscleFatigue(
      [set("squat", 0)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    )[0];
    expect(fresh.fatigue).toBe(1);

    // Long past recovery: fatigue floors at 0 rather than going negative.
    const stale = muscleFatigue(
      [set("squat", 1000)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    )[0];
    expect(stale.fatigue).toBe(0);
  });

  it("has nothing to say about an empty log", () => {
    const result = muscleFatigue(
      [],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ALL,
      NOW,
    );
    expect(result.every((m) => m.state === "untrained")).toBe(true);
  });

  // The bug this section pins: a day finished via "Finish" with no sets typed
  // in by hand used to be invisible to the fatigue clock, even though the
  // streak and the heatmap already count it as trained.
  describe("a finished day with nothing logged", () => {
    it("counts as direct work, resolved through the routine", () => {
      const [chest] = muscleFatigue(
        [],
        [completion("chest-day", 1, 1, 2)],
        anatomy,
        ROUTINE_LOOKUP,
        ["chest"],
        NOW,
      );
      expect(chest.state).toBe("recovering");
      expect(chest.hoursSinceDirect).toBe(2);
      expect(chest.lastDirectAt).toBe(NOW - 2 * HOUR_MS);
    });

    it("merges with logged sets by recency, not by source", () => {
      // An older completion and a newer logged set for the same muscle — the
      // set should win.
      const [chest] = muscleFatigue(
        [set("bench", 1)],
        [completion("chest-day", 1, 1, 40)],
        anatomy,
        ROUTINE_LOOKUP,
        ["chest"],
        NOW,
      );
      expect(chest.hoursSinceDirect).toBe(1);

      // And the reverse: a newer completion beats an older logged set.
      const [quads] = muscleFatigue(
        [set("squat", 40)],
        [completion("back-day", 1, 1, 1)],
        anatomy,
        ROUTINE_LOOKUP,
        ["quads"],
        NOW,
      );
      expect(quads.hoursSinceDirect).toBe(1);
    });

    it("still splits direct and indirect the way a logged set would", () => {
      // "back-day" prescribes `squat`, which is only ever indirect for
      // glutes/hamstrings — the completion shouldn't promote them to direct.
      const [glutes] = muscleFatigue(
        [],
        [completion("back-day", 1, 1, 3)],
        anatomy,
        ROUTINE_LOOKUP,
        ["glutes"],
        NOW,
      );
      expect(glutes.state).toBe("untrained");
      expect(glutes.lastIndirectAt).toBe(NOW - 3 * HOUR_MS);
    });

    it("contributes nothing when the routine or day can't be resolved", () => {
      // A deleted routine, or a day the lookup doesn't know about — the
      // completion is silently skipped rather than throwing.
      const [chest] = muscleFatigue(
        [],
        [completion("deleted-routine", 1, 1, 2)],
        anatomy,
        ROUTINE_LOOKUP,
        ["chest"],
        NOW,
      );
      expect(chest.state).toBe("untrained");
    });
  });
});

describe("fatigueStep", () => {
  it("is 0 for ready and untrained regardless of the fatigue number", () => {
    const [ready] = muscleFatigue(
      [set("squat", 90)],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    );
    const [untrained] = muscleFatigue(
      [],
      NO_COMPLETIONS,
      anatomy,
      EMPTY_LOOKUP,
      ["quads"],
      NOW,
    );
    expect(fatigueStep(ready)).toBe(0);
    expect(fatigueStep(untrained)).toBe(0);
  });

  it("climbs through quartiles as fatigue rises", () => {
    // 72h window: fresh (0h) is the top step, and each fixture sits in a
    // different quartile of the way back down.
    const quartiles = [0, 20, 40, 60].map(
      (hoursAgo) =>
        muscleFatigue(
          [set("squat", hoursAgo)],
          NO_COMPLETIONS,
          anatomy,
          EMPTY_LOOKUP,
          ["quads"],
          NOW,
        )[0],
    );
    expect(quartiles.map(fatigueStep)).toEqual([4, 3, 2, 1]);
  });
});
