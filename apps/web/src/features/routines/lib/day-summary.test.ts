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
      warmupSets: 0,
      finishers: 0,
      estimatedSeconds: 0,
    });
  });

  /**
   * "18 sets" has to keep meaning eighteen sets that count. A day whose number
   * jumped because you wrote your ramp-ups down would stop being comparable to
   * last week's, which is the only thing the figure is for.
   */
  it("keeps warmups out of the working-set count", () => {
    const summary = summariseDay(
      day([
        exercise({
          prescriptions: [
            { sets: 2, reps: 10, restSeconds: 60, isWarmup: true },
            { sets: 3, reps: [8, 12], restSeconds: 120 },
          ],
        }),
      ]),
      F,
    );

    expect(summary.workingSets).toBe(3);
    expect(summary.warmupSets).toBe(2);
  });

  it("still charges for the time a warmup takes", () => {
    const withWarmup = summariseDay(
      day([
        exercise({
          prescriptions: [
            { sets: 2, reps: 10, restSeconds: 60, isWarmup: true },
            { sets: 3, reps: [8, 12], restSeconds: 120 },
          ],
        }),
      ]),
      F,
    );
    const without = summariseDay(
      day([exercise({ prescriptions: [{ sets: 3, reps: [8, 12], restSeconds: 120 }] })]),
      F,
    );

    // Not counted, but they happen — an estimate that skipped them would send
    // you home early.
    expect(withWarmup.estimatedSeconds).toBeGreaterThan(without.estimatedSeconds);
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


describe("a day with segmented sets", () => {
  /** Three sets, each running hold → pulses → reps → hold → pulses. */
  const day: TrainingDay = {
    dayNumber: 1,
    label: "Glutes",
    isRest: false,
    warmupRefs: [],
    exercises: [
      {
        exerciseId: "machine-hip-abduction",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        prescriptions: [
          {
            sets: 3,
            restSeconds: 90,
            segments: [
              { kind: "hold", seconds: 10 },
              { kind: "pulses", count: 12 },
              { kind: "reps", count: 12, pulsePerRep: true },
              { kind: "hold", seconds: 10 },
              { kind: "pulses", count: 12 },
            ],
          },
        ],
      },
    ],
  };

  it("counts sets, not the parts they run in", () => {
    // The strip said fifteen for three sets when a sequence was five work
    // steps. One step per set is what made that arithmetic go away rather than
    // needing to be corrected for.
    expect(summariseDay(day, F).workingSets).toBe(3);
  });

  it("charges a sequence its own paced length, not the per-set guess", () => {
    // A sequence is paced end to end (10s hold + 12 pulses + 12 pulsed reps +
    // 10s hold + 12 pulses = 88s), so it reports a real duration the way a
    // cardio block does. Adding the 45s guess on top would count the same
    // minute twice. Plus 2 × 90s rest — the trailing one is trimmed.
    expect(summariseDay(day, F).estimatedSeconds).toBe(3 * 88 + 180);
  });
});
