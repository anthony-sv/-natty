import { describe, expect, it } from "vitest";
import type { Routine, TrainingDay } from "@/data/routines";
import type { WorkoutCompletion } from "@/features/log/completion-schema";
import type { LoggedSet } from "@/features/log/schema";
import { dayAfter, nextTrainingDay } from "./next-day";

/** A calendar day, so `now` can be moved forward in whole-day steps. */
const DAY_MS = 24 * 60 * 60 * 1000;

function day(dayNumber: number, isRest = false): TrainingDay {
  return {
    dayNumber,
    label: isRest ? "Rest" : `Day ${dayNumber}`,
    isRest,
    exercises: isRest
      ? []
      : [
          {
            exerciseId: "flat-barbell-bench-press",
            orAlternatives: [],
            kind: "resistance",
            isFinisher: false,
            prescriptions: [{ sets: 3, reps: 10, restSeconds: 90 }],
          },
        ],
    warmupRefs: [],
  };
}

/** Two weeks of three days — day 2 of week 1 is a rest day. */
function twoWeekRoutine(): Routine {
  return {
    slug: "test-routine",
    name: "Test routine",
    weeks: [
      { weekNumber: 1, days: [day(1), day(2, true), day(3)] },
      { weekNumber: 2, days: [day(1), day(2, true), day(3)] },
    ],
  };
}

/** Two rest days in a row — day 2 *and* day 3 of week 1. */
function twoRestDaysRoutine(): Routine {
  return {
    slug: "test-routine",
    name: "Test routine",
    weeks: [
      {
        weekNumber: 1,
        days: [day(1), day(2, true), day(3, true), day(4)],
      },
    ],
  };
}

function set(over: Partial<LoggedSet> & { performedAt: number }): LoggedSet {
  return {
    id: `set-${over.performedAt}`,
    exerciseId: "flat-barbell-bench-press",
    unit: "kg",
    reps: 10,
    ...over,
  };
}

function completion(
  over: Partial<WorkoutCompletion> & { performedAt: number },
): WorkoutCompletion {
  return {
    id: `completion-${over.performedAt}`,
    routineSlug: "test-routine",
    weekNumber: 1,
    dayNumber: 1,
    ...over,
  };
}

describe("nextTrainingDay", () => {
  it("starts at the first day when nothing has been logged for this routine", () => {
    const result = nextTrainingDay(twoWeekRoutine(), [], [], undefined, 1);
    expect(result).toEqual({ weekNumber: 1, day: day(1) });
  });

  it("ignores sets logged against a different routine", () => {
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "other-routine",
        weekNumber: 2,
        dayNumber: 3,
      }),
    ];
    const result = nextTrainingDay(twoWeekRoutine(), sets, [], undefined, 1);
    expect(result).toEqual({ weekNumber: 1, day: day(1) });
  });

  it("advances to the next day after the most recently logged one", () => {
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "test-routine",
        weekNumber: 1,
        dayNumber: 1,
      }),
      // A later set on an earlier day shouldn't move the pointer backward —
      // only the most recent timestamp counts.
      set({
        performedAt: 100,
        routineSlug: "test-routine",
        weekNumber: 1,
        dayNumber: 1,
      }),
    ];
    const result = nextTrainingDay(twoWeekRoutine(), sets, [], undefined, 100);
    expect(result).toEqual({ weekNumber: 1, day: day(2, true) });
  });

  it("surfaces a rest day as-is rather than skipping past it", () => {
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "test-routine",
        weekNumber: 1,
        dayNumber: 1,
      }),
    ];
    // Same calendar day as the logged set — the rest day right after it is
    // always shown once, whatever `now` turns out to be past that.
    const result = nextTrainingDay(twoWeekRoutine(), sets, [], undefined, 1);
    expect(result?.day.isRest).toBe(true);
  });

  it("steps past a rest day once a full calendar day has passed", () => {
    // The bug this pins: reaching a rest day used to freeze the pointer
    // there forever, since nothing is ever logged *for* a rest day.
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "test-routine",
        weekNumber: 1,
        dayNumber: 1,
      }),
    ];
    const now = 1 + 2 * DAY_MS;
    const result = nextTrainingDay(twoWeekRoutine(), sets, [], undefined, now);
    expect(result).toEqual({ weekNumber: 1, day: day(3) });
  });

  it("steps past two consecutive rest days the same way", () => {
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "test-routine",
        weekNumber: 1,
        dayNumber: 1,
      }),
    ];
    const now = 1 + 3 * DAY_MS;
    const result = nextTrainingDay(
      twoRestDaysRoutine(),
      sets,
      [],
      undefined,
      now,
    );
    expect(result).toEqual({ weekNumber: 1, day: day(4) });
  });

  it("never steps past a training day, no matter how much time passed", () => {
    // Only rest days are time-based — a training day you haven't done yet
    // still waits for you indefinitely, same as it always has.
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "test-routine",
        weekNumber: 1,
        dayNumber: 3,
      }),
    ];
    const now = 1 + 30 * DAY_MS;
    const result = nextTrainingDay(twoWeekRoutine(), sets, [], undefined, now);
    expect(result).toEqual({ weekNumber: 2, day: day(1) });
  });

  it("advances to the day after a completion with nothing logged", () => {
    // Reaching "Finish" with the log popover never opened — the whole reason
    // completions exist.
    const completions = [
      completion({ performedAt: 1, weekNumber: 1, dayNumber: 1 }),
    ];
    const result = nextTrainingDay(
      twoWeekRoutine(),
      [],
      completions,
      undefined,
      1,
    );
    expect(result).toEqual({ weekNumber: 1, day: day(2, true) });
  });

  it("ignores completions logged against a different routine", () => {
    const completions = [
      completion({
        performedAt: 1,
        routineSlug: "other-routine",
        weekNumber: 2,
        dayNumber: 3,
      }),
    ];
    const result = nextTrainingDay(
      twoWeekRoutine(),
      [],
      completions,
      undefined,
      1,
    );
    expect(result).toEqual({ weekNumber: 1, day: day(1) });
  });

  it("prefers whichever of a set or a completion happened more recently", () => {
    const sets = [
      set({
        performedAt: 100,
        routineSlug: "test-routine",
        weekNumber: 1,
        dayNumber: 3,
      }),
    ];
    // An earlier completion shouldn't move the pointer backward past a later
    // logged set — same rule the "later set wins" test pins for two sets.
    const completions = [
      completion({ performedAt: 1, weekNumber: 1, dayNumber: 1 }),
    ];
    const result = nextTrainingDay(
      twoWeekRoutine(),
      sets,
      completions,
      undefined,
      100,
    );
    expect(result).toEqual({ weekNumber: 2, day: day(1) });
  });

  it("advances into the next week's day 1 after the last day of a week", () => {
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "test-routine",
        weekNumber: 1,
        dayNumber: 3,
      }),
    ];
    const result = nextTrainingDay(twoWeekRoutine(), sets, [], undefined, 1);
    expect(result).toEqual({ weekNumber: 2, day: day(1) });
  });

  it("wraps back to week 1 day 1 after the last day of the last week", () => {
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "test-routine",
        weekNumber: 2,
        dayNumber: 3,
      }),
    ];
    const result = nextTrainingDay(twoWeekRoutine(), sets, [], undefined, 1);
    expect(result).toEqual({ weekNumber: 1, day: day(1) });
  });

  it("starts over if the logged day no longer exists in the routine", () => {
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "test-routine",
        weekNumber: 5,
        dayNumber: 9,
      }),
    ];
    const result = nextTrainingDay(twoWeekRoutine(), sets, [], undefined, 1);
    expect(result).toEqual({ weekNumber: 1, day: day(1) });
  });

  it("seeds from startAt when nothing has been logged yet", () => {
    const result = nextTrainingDay(
      twoWeekRoutine(),
      [],
      [],
      { weekNumber: 1, dayNumber: 3 },
      1,
    );
    expect(result).toEqual({ weekNumber: 1, day: day(3) });
  });

  it("ignores startAt once the routine has a logged set", () => {
    const sets = [
      set({
        performedAt: 1,
        routineSlug: "test-routine",
        weekNumber: 1,
        dayNumber: 1,
      }),
    ];
    const result = nextTrainingDay(
      twoWeekRoutine(),
      sets,
      [],
      { weekNumber: 2, dayNumber: 3 },
      1,
    );
    expect(result).toEqual({ weekNumber: 1, day: day(2, true) });
  });

  it("falls back to the first day when startAt names a day the routine doesn't have", () => {
    const result = nextTrainingDay(
      twoWeekRoutine(),
      [],
      [],
      { weekNumber: 9, dayNumber: 9 },
      1,
    );
    expect(result).toEqual({ weekNumber: 1, day: day(1) });
  });
});

describe("dayAfter", () => {
  it("previews the entry that follows a given one", () => {
    const routine = twoWeekRoutine();
    const result = dayAfter(routine, { weekNumber: 1, day: day(2, true) });
    expect(result).toEqual({ weekNumber: 1, day: day(3) });
  });

  it("wraps to week 1 day 1 after the last entry", () => {
    const routine = twoWeekRoutine();
    const result = dayAfter(routine, { weekNumber: 2, day: day(3) });
    expect(result).toEqual({ weekNumber: 1, day: day(1) });
  });
});
