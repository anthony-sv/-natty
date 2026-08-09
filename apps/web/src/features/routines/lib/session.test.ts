import { describe, expect, it } from "vitest";
import { getRoutineBySlug, type TrainingDay } from "@/data/routines";
import { autoStartSecondsFor, buildSteps, countWorkSteps } from "./session";

/** The first day in the app that contains a finisher, so a pose hold exists. */
function dayWithFinisher(): TrainingDay {
  for (const routine of [getRoutineBySlug("cutting-program")!]) {
    for (const week of routine.weeks) {
      for (const day of week.days) {
        if (day.exercises.some((e) => e.isFinisher)) return day;
      }
    }
  }
  throw new Error("no finisher day found");
}

describe("pose hold steps", () => {
  it("puts the hold between the set and its rest", () => {
    const steps = buildSteps(dayWithFinisher());
    const poseIndex = steps.findIndex((s) => s.type === "pose");
    expect(poseIndex).toBeGreaterThan(0);
    expect(steps[poseIndex - 1].type).toBe("work");
    expect(steps[poseIndex + 1].type).toBe("rest");
  });

  it("holds after every set of the finisher, not just the last", () => {
    const day = dayWithFinisher();
    const steps = buildSteps(day);
    const finisherSets = day.exercises
      .filter((e) => e.isFinisher)
      .flatMap((e) => e.prescriptions)
      .reduce((total, p) => total + p.sets, 0);
    expect(steps.filter((s) => s.type === "pose")).toHaveLength(finisherSets);
  });

  it("does not count a hold as a work set", () => {
    const day = dayWithFinisher();
    const steps = buildSteps(day);
    const sets = day.exercises
      .flatMap((e) => e.prescriptions)
      .reduce((total, p) => total + p.sets, 0);
    expect(countWorkSteps(steps)).toBe(sets);
  });

  it("keeps a trailing hold even though a trailing rest is dropped", () => {
    // The last finisher set still ends on a pose; only the rest after it is
    // pointless. Regression guard for the trailing-step trim.
    const day: TrainingDay = {
      ...dayWithFinisher(),
      exercises: [
        {
          exerciseId: "cable-crossover-mid",
          orAlternatives: [],
          kind: "resistance",
          isFinisher: true,
          prescriptions: [
            {
              sets: 1,
              reps: [15, 20],
              restSeconds: 30,
              pose: { poseId: "most-muscular", holdSeconds: 10 },
            },
          ],
        },
      ],
    };
    const steps = buildSteps(day);
    expect(steps.map((s) => s.type)).toEqual(["work", "pose"]);
  });

  it("gives a hold no step when the pose has no timed hold", () => {
    const day: TrainingDay = {
      ...dayWithFinisher(),
      exercises: [
        {
          exerciseId: "cable-crossover-mid",
          orAlternatives: [],
          kind: "resistance",
          isFinisher: true,
          prescriptions: [
            {
              sets: 1,
              reps: [15, 20],
              restSeconds: 30,
              pose: { poseId: "most-muscular" },
            },
          ],
        },
      ],
    };
    expect(buildSteps(day).map((s) => s.type)).toEqual(["work"]);
  });
});

describe("auto-start", () => {
  it("starts rest and pose holds, but waits on cardio and work", () => {
    const steps = buildSteps(dayWithFinisher());
    const pose = steps.find((s) => s.type === "pose")!;
    const rest = steps.find((s) => s.type === "rest")!;
    const work = steps.find((s) => s.type === "work")!;
    expect(autoStartSecondsFor(pose)).toBe(10);
    expect(autoStartSecondsFor(rest)).toBe(rest.seconds);
    expect(autoStartSecondsFor(work)).toBeUndefined();
    expect(autoStartSecondsFor(undefined)).toBeUndefined();
  });
});
