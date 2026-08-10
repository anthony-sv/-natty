import { describe, expect, it } from "vitest";
import { formatEstimate, setsPerExercise, summariseDay } from "./day-summary";
import { formattingFor } from "@/i18n/test-formatting";

/** English; nothing here asserts on wording, only on counts and durations. */
const F = formattingFor();
import type { ExerciseEntry, TrainingDay } from "@/data/routines";

function exercise(partial: Partial<ExerciseEntry> = {}): ExerciseEntry {
  return {
    exerciseId: "flat-barbell-bench-press",
    orAlternatives: [],
    kind: "resistance",
    isFinisher: false,
    prescriptions: [{ sets: 3, reps: [8, 12], restSeconds: 90 }],
    ...partial,
  };
}

function day(exercises: ExerciseEntry[]): TrainingDay {
  return {
    dayNumber: 1,
    label: "Chest",
    isRest: false,
    exercises,
    warmupRefs: [],
  };
}

describe("summariseDay", () => {
  it("counts every set across every phase", () => {
    const summary = summariseDay(
      day([
        exercise(),
        exercise({
          prescriptions: [
            { sets: 2, reps: [10, 12], restSeconds: 90 },
            { sets: 1, reps: [8, 12], restSeconds: 90 },
          ],
        }),
      ]),
      F,
    );

    expect(summary.exercises).toBe(2);
    expect(summary.workingSets).toBe(6);
  });

  it("counts finishers separately", () => {
    const summary = summariseDay(
      day([exercise(), exercise({ isFinisher: true })]),
      F,
    );

    expect(summary.finishers).toBe(1);
  });

  it("adds rest into the estimate, not just the sets", () => {
    const short = summariseDay(
      day([exercise({ prescriptions: [{ sets: 3, reps: 10, restSeconds: 30 }] })]),
      F,
    );
    const long = summariseDay(
      day([exercise({ prescriptions: [{ sets: 3, reps: 10, restSeconds: 180 }] })]),
      F,
    );

    expect(long.estimatedSeconds).toBeGreaterThan(short.estimatedSeconds);
  });

  it("uses a cardio block's own duration", () => {
    const summary = summariseDay(
      day([
        exercise({
          kind: "cardio",
          prescriptions: [{ sets: 1, durationSeconds: 1200, restSeconds: 0 }],
        }),
      ]),
      F,
    );

    // The block itself, not the 45s guess a plain set gets.
    expect(summary.estimatedSeconds).toBe(1200);
  });

  it("has nothing to say about a rest day", () => {
    const summary = summariseDay(day([]), F);

    expect(summary).toEqual({
      exercises: 0,
      workingSets: 0,
      finishers: 0,
      estimatedSeconds: 0,
    });
  });
});

describe("formatEstimate", () => {
  it("stays in minutes under an hour", () => {
    expect(formatEstimate(48 * 60)).toBe("48m");
    expect(formatEstimate(59 * 60 + 20)).toBe("59m");
  });

  it("splits into hours past one", () => {
    expect(formatEstimate(65 * 60)).toBe("1h 05m");
    expect(formatEstimate(125 * 60)).toBe("2h 05m");
  });

  it("rounds to the nearest minute", () => {
    expect(formatEstimate(90)).toBe("2m");
  });
});

describe("setsPerExercise", () => {
  it("totals each exercise's phases in day order", () => {
    expect(
      setsPerExercise(
        day([
          exercise({ prescriptions: [{ sets: 4, reps: 8, restSeconds: 90 }] }),
          exercise({
            prescriptions: [
              { sets: 2, reps: 10, restSeconds: 90 },
              { sets: 1, reps: 8, restSeconds: 90 },
            ],
          }),
        ]),
      ),
    ).toEqual([4, 3]);
  });
});

