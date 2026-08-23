import { describe, expect, it } from "vitest";
import type { TrainingDay } from "@/data/routines";
import type { WorkoutCompletion } from "@/features/log/completion-schema";
import { composeDay, lastCompletionFor } from "./extras";
import type { ExtraWork } from "./schema";

const TARGET = { routineSlug: "test-routine", weekNumber: 1, dayNumber: 3 };

function day(overrides: Partial<TrainingDay> = {}): TrainingDay {
  return {
    dayNumber: 3,
    label: "Legs",
    isRest: false,
    exercises: [
      {
        exerciseId: "barbell-back-squat",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        prescriptions: [{ sets: 3, reps: 10, restSeconds: 90 }],
      },
    ],
    warmupRefs: [],
    ...overrides,
  };
}

function extra(overrides: Partial<ExtraWork> & { createdAt: number }): ExtraWork {
  return {
    id: `extra-${overrides.createdAt}`,
    routineSlug: TARGET.routineSlug,
    weekNumber: TARGET.weekNumber,
    dayNumber: TARGET.dayNumber,
    entry: {
      exerciseId: "cable-crunch",
      orAlternatives: [],
      kind: "resistance",
      isFinisher: false,
      prescriptions: [{ sets: 3, reps: 15, restSeconds: 60 }],
    },
    ...overrides,
  };
}

function completion(
  overrides: Partial<WorkoutCompletion> & { performedAt: number },
): WorkoutCompletion {
  return {
    id: `completion-${overrides.performedAt}`,
    routineSlug: TARGET.routineSlug,
    weekNumber: TARGET.weekNumber,
    dayNumber: TARGET.dayNumber,
    ...overrides,
  };
}

describe("lastCompletionFor", () => {
  it("returns undefined when nothing matches", () => {
    expect(lastCompletionFor([], TARGET)).toBeUndefined();
    expect(
      lastCompletionFor(
        [completion({ performedAt: 1, routineSlug: "other-routine" })],
        TARGET,
      ),
    ).toBeUndefined();
  });

  it("returns the most recent matching performedAt", () => {
    const completions = [
      completion({ performedAt: 100 }),
      completion({ performedAt: 300 }),
      completion({ performedAt: 200 }),
      completion({ performedAt: 999, weekNumber: 2 }),
    ];
    expect(lastCompletionFor(completions, TARGET)).toBe(300);
  });
});

describe("composeDay", () => {
  it("returns the same day reference when nothing is pending", () => {
    const base = day();
    const result = composeDay(base, [], TARGET, undefined);
    expect(result.day).toBe(base);
    expect(result.extraIndices.size).toBe(0);
  });

  it("appends a pending extra and reports its index", () => {
    const base = day();
    const result = composeDay(base, [extra({ createdAt: 1 })], TARGET, undefined);
    expect(result.extraIndices).toEqual(new Set([1]));
    expect(result.day.exercises).toHaveLength(2);
    expect(result.day.exercises[1]!.exerciseId).toBe("cable-crunch");
    // The input day is never mutated.
    expect(base.exercises).toHaveLength(1);
  });

  it("orders same-kind extras by createdAt, not collection order", () => {
    const base = extra({ createdAt: 0 }).entry;
    const extras = [
      extra({ id: "b", createdAt: 200, entry: { ...base, exerciseId: "second" } }),
      extra({ id: "a", createdAt: 100, entry: { ...base, exerciseId: "first" } }),
    ];
    const result = composeDay(day(), extras, TARGET, undefined);
    expect(result.day.exercises.slice(1).map((e) => e.exerciseId)).toEqual([
      "first",
      "second",
    ]);
  });

  it("excludes an extra once the day has a later completion", () => {
    const extras = [extra({ createdAt: 100 })];
    const lastCompletedAt = lastCompletionFor(
      [completion({ performedAt: 200 })],
      TARGET,
    );
    const result = composeDay(day(), extras, TARGET, lastCompletedAt);
    expect(result.day.exercises).toHaveLength(1);
  });

  it("keeps an extra added after the day's last completion", () => {
    const extras = [extra({ createdAt: 300 })];
    const lastCompletedAt = lastCompletionFor(
      [completion({ performedAt: 200 })],
      TARGET,
    );
    const result = composeDay(day(), extras, TARGET, lastCompletedAt);
    expect(result.day.exercises).toHaveLength(2);
  });

  it("keeps an extra added mid-session, even once later sets exist", () => {
    // The whole reason expiry is completion-based and not set-based: an
    // extra added mid-session must survive the rest of that same session,
    // where every subsequent set (including its own) postdates it.
    const extras = [extra({ createdAt: 100 })];
    // No completion yet — the session is still running.
    const result = composeDay(day(), extras, TARGET, undefined);
    expect(result.day.exercises).toHaveLength(2);
  });

  it("filters by routineSlug, weekNumber and dayNumber independently", () => {
    const extras = [
      extra({ createdAt: 1, routineSlug: "other-routine" }),
      extra({ createdAt: 1, weekNumber: 2 }),
      extra({ createdAt: 1, dayNumber: 4 }),
      extra({ createdAt: 1 }),
    ];
    const result = composeDay(day(), extras, TARGET, undefined);
    expect(result.day.exercises).toHaveLength(2);
  });

  it("strips group so an extra can never join a superset rotation", () => {
    const withGroup = extra({
      createdAt: 1,
      entry: {
        ...extra({ createdAt: 1 }).entry,
        group: { id: "some-group" },
      },
    });
    const result = composeDay(day(), [withGroup], TARGET, undefined);
    expect(result.day.exercises[1]!.group).toBeUndefined();
  });

  it("reports each appended index's source id and createdAt", () => {
    const result = composeDay(day(), [extra({ createdAt: 1 })], TARGET, undefined);
    expect(result.extraMeta.get(1)).toEqual({
      id: `extra-1`,
      createdAt: 1,
    });
    expect(result.extraMeta.size).toBe(1);
  });

  it("gives a rest day real exercises while isRest stays true", () => {
    const restDay = day({ dayNumber: 4, label: "Rest", isRest: true, exercises: [] });
    const result = composeDay(
      restDay,
      [extra({ createdAt: 1, dayNumber: 4 })],
      { ...TARGET, dayNumber: 4 },
      undefined,
    );
    expect(result.day.isRest).toBe(true);
    expect(result.day.exercises).toHaveLength(1);
    expect(result.extraIndices).toEqual(new Set([0]));
  });

  describe("placement", () => {
    function dayWithCardio(): TrainingDay {
      return day({
        exercises: [
          {
            exerciseId: "barbell-back-squat",
            orAlternatives: [],
            kind: "resistance",
            isFinisher: false,
            prescriptions: [{ sets: 3, reps: 10, restSeconds: 90 }],
          },
          {
            exerciseId: "treadmill-steady-state",
            orAlternatives: [],
            kind: "cardio",
            isFinisher: false,
            prescriptions: [{ sets: 1, durationSeconds: 1200 }],
          },
        ],
      });
    }

    it("defaults to beforeCardio: a resistance extra lands ahead of the day's cardio", () => {
      const result = composeDay(
        dayWithCardio(),
        [extra({ createdAt: 1 })],
        TARGET,
        undefined,
      );
      expect(result.day.exercises.map((e) => e.exerciseId)).toEqual([
        "barbell-back-squat",
        "cable-crunch",
        "treadmill-steady-state",
      ]);
      expect(result.extraIndices).toEqual(new Set([1]));
    });

    it("beforeCardio: a cardio extra still lands after the day's own cardio", () => {
      const cardioExtra = extra({
        createdAt: 1,
        entry: {
          exerciseId: "stationary-bike",
          orAlternatives: [],
          kind: "cardio",
          isFinisher: false,
          prescriptions: [{ sets: 1, durationSeconds: 600 }],
        },
      });
      const result = composeDay(dayWithCardio(), [cardioExtra], TARGET, undefined);
      expect(result.day.exercises.map((e) => e.exerciseId)).toEqual([
        "barbell-back-squat",
        "treadmill-steady-state",
        "stationary-bike",
      ]);
      expect(result.extraIndices).toEqual(new Set([2]));
    });

    it("beforeCardio: splits a mixed batch — resistance ahead of cardio, cardio after", () => {
      const resistanceExtra = extra({ id: "r", createdAt: 1 });
      const cardioExtra = extra({
        id: "c",
        createdAt: 2,
        entry: {
          exerciseId: "stationary-bike",
          orAlternatives: [],
          kind: "cardio",
          isFinisher: false,
          prescriptions: [{ sets: 1, durationSeconds: 600 }],
        },
      });
      const result = composeDay(
        dayWithCardio(),
        [cardioExtra, resistanceExtra],
        TARGET,
        undefined,
      );
      expect(result.day.exercises.map((e) => e.exerciseId)).toEqual([
        "barbell-back-squat",
        "cable-crunch",
        "treadmill-steady-state",
        "stationary-bike",
      ]);
      expect(result.extraIndices).toEqual(new Set([1, 3]));
    });

    it("beforeCardio: falls back to the tail when the day has no cardio at all", () => {
      const result = composeDay(day(), [extra({ createdAt: 1 })], TARGET, undefined);
      expect(result.day.exercises.map((e) => e.exerciseId)).toEqual([
        "barbell-back-squat",
        "cable-crunch",
      ]);
    });

    /**
     * The safety property `SessionPlayer` depends on: appending never
     * changes the index of a step that already existed, which is only true
     * for a strict tail append. `"beforeCardio"` would insert ahead of the
     * cardio block and shift it — fine for a fresh view of the day, wrong
     * for a session already running on it.
     */
    it('append: ignores cardio placement entirely, always landing at the tail', () => {
      const result = composeDay(
        dayWithCardio(),
        [extra({ createdAt: 1 })],
        TARGET,
        undefined,
        "append",
      );
      expect(result.day.exercises.map((e) => e.exerciseId)).toEqual([
        "barbell-back-squat",
        "treadmill-steady-state",
        "cable-crunch",
      ]);
      expect(result.extraIndices).toEqual(new Set([2]));
    });
  });
});
