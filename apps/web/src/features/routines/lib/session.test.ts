import { describe, expect, it } from "vitest";
import { getRoutineBySlug, type TrainingDay } from "@/data/routines";
import { formattingFor } from "@/i18n/test-formatting";
import {
  autoStartSecondsFor,
  buildSteps,
  countWorkSteps,
  describeStep,
  isLoggableStep,
  type WorkStep,
} from "./session";

/** English, so the assertions here read against the source strings. */
const F = formattingFor();

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
    const steps = buildSteps(dayWithFinisher(), F);
    const poseIndex = steps.findIndex((s) => s.type === "pose");
    expect(poseIndex).toBeGreaterThan(0);
    expect(steps[poseIndex - 1].type).toBe("work");
    expect(steps[poseIndex + 1].type).toBe("rest");
  });

  it("holds after every set of the finisher, not just the last", () => {
    const day = dayWithFinisher();
    const steps = buildSteps(day, F);
    const finisherSets = day.exercises
      .filter((e) => e.isFinisher)
      .flatMap((e) => e.prescriptions)
      .reduce((total, p) => total + p.sets, 0);
    expect(steps.filter((s) => s.type === "pose")).toHaveLength(finisherSets);
  });

  it("does not count a hold as a work set", () => {
    const day = dayWithFinisher();
    const steps = buildSteps(day, F);
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
    const steps = buildSteps(day, F);
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
    expect(buildSteps(day, F).map((s) => s.type)).toEqual(["work"]);
  });
});

describe("auto-start", () => {
  it("starts rest and pose holds, but waits on cardio and work", () => {
    const steps = buildSteps(dayWithFinisher(), F);
    const pose = steps.find((s) => s.type === "pose")!;
    const rest = steps.find((s) => s.type === "rest")!;
    const work = steps.find((s) => s.type === "work")!;
    expect(autoStartSecondsFor(pose)).toBe(10);
    expect(autoStartSecondsFor(rest)).toBe(rest.seconds);
    expect(autoStartSecondsFor(work)).toBeUndefined();
    expect(autoStartSecondsFor(undefined)).toBeUndefined();
  });
});

describe("segmented sets", () => {
  /**
   * A hold-and-pulse protocol, as people actually write one: the shape of the
   * set is fixed and only its numbers move, so it's four prescriptions of one
   * set each — weight going up (which the routine doesn't state, you pick it)
   * and the rep leg coming down 12 → 10 → 8 → 6.
   */
  const REP_LEGS = [12, 10, 8, 6];

  function holdAndPulseDay(): TrainingDay {
    return {
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
          prescriptions: REP_LEGS.map((reps) => ({
            sets: 1,
            restSeconds: 60,
            segments: [
              { kind: "hold" as const, seconds: 10 },
              { kind: "pulses" as const, count: 12 },
              { kind: "reps" as const, count: reps, pulsePerRep: true },
              { kind: "hold" as const, seconds: 10 },
              { kind: "pulses" as const, count: 12 },
            ],
          })),
        },
      ],
    };
  }

  it("makes each leg of the set its own step", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const work = steps.filter((s) => s.type === "work");
    // Four sets of five legs. The rest steps sit between them, and the last
    // one is trimmed as always.
    expect(work).toHaveLength(20);
    expect(steps.filter((s) => s.type === "rest")).toHaveLength(3);
  });

  it("keeps counting sets, not legs", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const work = steps.filter((s) => s.type === "work");
    // This is the assertion the whole design hangs on: five steps share one
    // setNumber, so "set 2 of 4" stays true through the middle of a set and
    // `loggedSetsForStep` matches all five legs to the same logged entries.
    expect(work.map((s) => s.setNumber)).toEqual([
      1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4,
    ]);
    expect(new Set(work.map((s) => s.setsInExercise))).toEqual(new Set([4]));
  });

  it("offers logging once per set, on the last leg", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const loggable = steps
      .map((step, index) => ({ step, index }))
      .filter(({ step }) => isLoggableStep(step));
    // One per set, and it's the fifth leg each time — you log what the whole
    // sequence took, not five entries for one set.
    expect(loggable).toHaveLength(4);
    for (const { step } of loggable) {
      expect(step.type === "work" && step.segment?.index).toBe(5);
    }
  });

  it("auto-starts a hold inside a set, unlike other work steps", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const work = steps.filter((s) => s.type === "work");
    // Legs 1 and 4 are the holds; you're already loaded and in position, so
    // making you tap Start is a tap you can't spare mid-set.
    expect(autoStartSecondsFor(work[0])).toBe(10);
    expect(autoStartSecondsFor(work[3])).toBe(10);
    // The pulse and rep legs are counted, not timed.
    expect(autoStartSecondsFor(work[1])).toBeUndefined();
    expect(autoStartSecondsFor(work[2])).toBeUndefined();
  });

  it("carries the rep leg's own count down the ramp", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const repLegs = steps.filter(
      (s) => s.type === "work" && s.segment?.detail.kind === "reps",
    );
    expect(repLegs.map((s) => s.type === "work" && s.reps)).toEqual(REP_LEGS);
  });

  it("describes a leg by what it is, not as bare reps", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const work = steps.filter((s) => s.type === "work");
    // Pulses and reps are both counts; only the wording separates them, which
    // is the whole reason a segment describes itself.
    expect(describeStep(work[0] as WorkStep, F)).toBe("10s hold");
    expect(describeStep(work[1] as WorkStep, F)).toBe("12 pulses");
    expect(describeStep(work[2] as WorkStep, F)).toBe("12 reps, pulse each");
  });
});

describe("warmup sets", () => {
  /** Two ramp-ups, then three working sets — the ordinary shape. */
  function rampedDay(): TrainingDay {
    return {
      dayNumber: 1,
      label: "Chest",
      isRest: false,
      warmupRefs: [],
      exercises: [
        {
          exerciseId: "flat-barbell-bench-press",
          orAlternatives: [],
          kind: "resistance",
          isFinisher: false,
          prescriptions: [
            { sets: 2, reps: 10, restSeconds: 60, isWarmup: true },
            { sets: 3, reps: [8, 12], restSeconds: 120 },
          ],
        },
      ],
    };
  }

  /**
   * The load-bearing rule. Numbering them together would make every routine
   * that gained a warmup look like it grew two sets, and "set 3 of 5" would
   * point at what the athlete calls their first real set.
   */
  it("numbers warmups and working sets separately", () => {
    const work = buildSteps(rampedDay(), F).filter(
      (s): s is WorkStep => s.type === "work",
    );

    expect(work.map((s) => [s.isWarmup, s.setNumber, s.setsInExercise])).toEqual([
      [true, 1, 2],
      [true, 2, 2],
      [false, 1, 3],
      [false, 2, 3],
      [false, 3, 3],
    ]);
  });

  it("gives every step its own id despite the two counters restarting", () => {
    const ids = buildSteps(rampedDay(), F).map((s) => s.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * Why `LoggedSet` needed no change at all: a warmup never becomes a row, so
   * the PR frontier, the volume buckets and the heatmap never had to learn to
   * exclude one.
   */
  it("offers no log control on a warmup", () => {
    const work = buildSteps(rampedDay(), F).filter(
      (s): s is WorkStep => s.type === "work",
    );

    expect(work.filter(isLoggableStep)).toHaveLength(3);
    expect(work.filter(isLoggableStep).every((s) => !s.isWarmup)).toBe(true);
  });

  it("still rests between warmups, and still announces what's next", () => {
    const steps = buildSteps(rampedDay(), F);
    const firstRest = steps.find((s) => s.type === "rest");

    expect(firstRest).toBeDefined();
    expect(firstRest?.type === "rest" && firstRest.nextLabel).toContain(
      "warmup 2 of 2",
    );
  });

  it("treats an exercise with no warmup exactly as before", () => {
    const day = rampedDay();
    day.exercises[0].prescriptions = [{ sets: 3, reps: [8, 12], restSeconds: 120 }];
    const work = buildSteps(day, F).filter(
      (s): s is WorkStep => s.type === "work",
    );

    expect(work.map((s) => s.setNumber)).toEqual([1, 2, 3]);
    expect(work.every((s) => !s.isWarmup)).toBe(true);
    expect(work.filter(isLoggableStep)).toHaveLength(3);
  });
});
