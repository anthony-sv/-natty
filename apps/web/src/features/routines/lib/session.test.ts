import { describe, expect, it } from "vitest";
import { getRoutineBySlug, type TrainingDay } from "@/data/routines";
import { composeDay } from "@/features/extras/extras";
import type { ExtraWork } from "@/features/extras/schema";
import { formattingFor } from "@/i18n/test-formatting";
import {
  autoStartFor,
  buildSequence,
  buildSteps,
  countWorkSteps,
  describeStep,
  extendSequence,
  isLoggableStep,
  LEAD_IN_SECONDS,
  partAt,
  previousWorkStep,
  setLadder,
  timedSecondsFor,
  type SessionStep,
  type WorkStep,
} from "./session";
import { formatSegment } from "./format";

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

describe("supersets and circuits", () => {
  /** Two lifts run in rotation, three rounds each. */
  function pairedDay(over: {
    sets?: [number, number];
    transition?: number;
    rest?: number;
  } = {}): TrainingDay {
    const [a, b] = over.sets ?? [3, 3];
    return {
      dayNumber: 1,
      label: "Push",
      isRest: false,
      warmupRefs: [],
      exercises: [
        {
          exerciseId: "flat-barbell-bench-press",
          orAlternatives: [],
          kind: "resistance",
          isFinisher: false,
          group: { id: "g1", transitionSeconds: over.transition },
          // A rest that must NOT be emitted: resting here is what a superset
          // isn't, and the pair's rest is the second member's.
          prescriptions: [{ sets: a, reps: 10, restSeconds: 120 }],
        },
        {
          exerciseId: "rope-pushdown",
          orAlternatives: [],
          kind: "resistance",
          isFinisher: false,
          group: { id: "g1" },
          prescriptions: [{ sets: b, reps: 12, restSeconds: over.rest ?? 90 }],
        },
      ],
    };
  }

  it("alternates the two lifts instead of running each to completion", () => {
    const work = buildSteps(pairedDay(), F).filter(
      (s): s is WorkStep => s.type === "work",
    );

    expect(work.map((s) => s.exerciseIndex)).toEqual([0, 1, 0, 1, 0, 1]);
    // Each lift still counts its own sets: the ladder, the PR line and the
    // log's provenance are all per exercise.
    expect(work.map((s) => s.setNumber)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(work.map((s) => s.group?.round)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(work.map((s) => s.group?.position)).toEqual([1, 2, 1, 2, 1, 2]);
    expect(work.every((s) => s.group?.size === 2)).toBe(true);
  });

  it("rests after the round, not between the lifts", () => {
    const steps = buildSteps(pairedDay(), F);
    const kinds = steps.map((s) => s.type);

    // work → work → rest, three times over, with the trailing rest trimmed.
    expect(kinds).toEqual([
      "work", "work", "rest",
      "work", "work", "rest",
      "work", "work",
    ]);
    // The pair's rest is the last member's 90s. The first member's 120s is
    // dropped rather than averaged or preferred — see the schema.
    expect(
      steps.filter((s) => s.type === "rest").map((s) => s.seconds),
    ).toEqual([90, 90]);
  });

  it("puts a stated transition between the stations", () => {
    // What makes a circuit with a walk between machines expressible without a
    // second structure.
    const steps = buildSteps(pairedDay({ transition: 15 }), F);

    expect(steps.map((s) => s.type)).toEqual([
      "work", "rest", "work", "rest",
      "work", "rest", "work", "rest",
      "work", "rest", "work",
    ]);
    expect(steps.filter((s) => s.type === "rest").map((s) => s.seconds)).toEqual([
      15, 90, 15, 90, 15,
    ]);
  });

  it("runs the last round alone when one lift has more sets", () => {
    const work = buildSteps(pairedDay({ sets: [4, 3] }), F).filter(
      (s): s is WorkStep => s.type === "work",
    );

    expect(work.map((s) => s.exerciseIndex)).toEqual([0, 1, 0, 1, 0, 1, 0]);
    expect(work.every((s) => s.group?.rounds === 4)).toBe(true);
  });

  it("gives the round's rest to whichever member actually ends it", () => {
    // Round 4 is the first lift alone, so its own 120s rest applies — the
    // member that would have taken it has run out.
    const steps = buildSteps(pairedDay({ sets: [4, 3] }), F);
    const rests = steps.filter((s) => s.type === "rest").map((s) => s.seconds);
    expect(rests).toEqual([90, 90, 90]);
  });

  it("names the other lift as what's next, on every set", () => {
    const work = buildSteps(pairedDay(), F).filter(
      (s): s is WorkStep => s.type === "work",
    );
    // The question the card answers between stations: the machine you're
    // walking to. Ungrouped work only says this on the last set of a lift.
    expect(work[0].nextExerciseName).toBeDefined();
    expect(work[0].nextExerciseName).not.toBe(work[0].exerciseName);
  });

  it("treats a run of one as an ordinary exercise", () => {
    // Deleting the other half of a superset leaves one behind, and it should
    // read as the plain lift it now is.
    const day = pairedDay();
    day.exercises = [day.exercises[0]];
    const steps = buildSteps(day, F);

    expect(steps.filter((s) => s.type === "work").every((s) => s.group === undefined)).toBe(true);
    // And its own rest comes back, since nothing else is going to take it.
    expect(steps.filter((s) => s.type === "rest").map((s) => s.seconds)).toEqual([120, 120]);
  });

  it("only groups entries that are actually adjacent", () => {
    // Two entries sharing an id either side of a third lift are not a superset
    // you could run, and treating them as one would reorder the day.
    const day = pairedDay();
    day.exercises = [
      day.exercises[0],
      {
        exerciseId: "lat-pulldown-wide",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        prescriptions: [{ sets: 1, reps: 10, restSeconds: 60 }],
      },
      day.exercises[1],
    ];

    const work = buildSteps(day, F).filter(
      (s): s is WorkStep => s.type === "work",
    );
    expect(work.map((s) => s.exerciseIndex)).toEqual([0, 0, 0, 1, 2, 2, 2]);
    expect(work.every((s) => s.group === undefined)).toBe(true);
  });
});


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
  it("starts rest and pose holds, but waits on work", () => {
    const steps = buildSteps(dayWithFinisher(), F);
    const rest = steps.find((s) => s.type === "rest")!;
    const work = steps.find((s) => s.type === "work")!;

    expect(autoStartFor(rest)).toEqual({
      seconds: rest.seconds,
      leadSeconds: 0,
    });
    expect(autoStartFor(work)).toBeUndefined();
    expect(autoStartFor(undefined)).toBeUndefined();
  });

  /**
   * The bug the lead-in exists for: a pose hold used to begin the instant you
   * tapped Done, while you were still finding the pose, so a prescribed 10s
   * hold reliably measured about seven. Rest gets none — there's nothing to be
   * ready for, and a lead-in there would just make every rest longer.
   */
  it("counts you into a pose hold, but not into rest", () => {
    const steps = buildSteps(dayWithFinisher(), F);
    const pose = steps.find((s) => s.type === "pose")!;
    const rest = steps.find((s) => s.type === "rest")!;

    expect(autoStartFor(pose)).toEqual({
      seconds: 10,
      leadSeconds: LEAD_IN_SECONDS,
    });
    expect(autoStartFor(rest)?.leadSeconds).toBe(0);
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

  /**
   * The change this model exists for. Five steps per set was defensible on
   * paper and unusable in a gym: the parts of a sequence have no rest between
   * them, so advancing them meant tapping a phone four times mid-set with both
   * hands loaded.
   */
  it("makes one step per set, carrying the whole sequence", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const work = steps.filter((s) => s.type === "work");

    expect(work).toHaveLength(4);
    expect(steps.filter((s) => s.type === "rest")).toHaveLength(3);
    for (const step of work) {
      expect(step.type === "work" && step.sequence?.parts).toHaveLength(5);
    }
  });

  it("numbers the sets and offers logging once each", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const work = steps.filter((s): s is WorkStep => s.type === "work");

    expect(work.map((s) => s.setNumber)).toEqual([1, 2, 3, 4]);
    expect(new Set(work.map((s) => s.setsInExercise))).toEqual(new Set([4]));
    // One entry per set, without the "log on the last leg only" rule the split
    // model needed to avoid five entries for one set.
    expect(steps.filter(isLoggableStep)).toHaveLength(4);
  });

  it("waits for you to start a sequence rather than auto-starting it", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const work = steps.find((s): s is WorkStep => s.type === "work")!;

    // You have to be in position before a clock covering the whole set means
    // anything — and starting it is the press that earns the lead-in.
    expect(autoStartFor(work)).toBeUndefined();
    expect(timedSecondsFor(work)).toBe(work.sequence!.seconds);
  });

  it("carries the rep part's own count down the ramp", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const repCounts = steps
      .filter((s): s is WorkStep => s.type === "work")
      .map((step) => {
        const part = step.sequence!.parts.find((p) => p.detail.kind === "reps");
        return part?.detail.kind === "reps" ? part.detail.count : undefined;
      });

    expect(repCounts).toEqual(REP_LEGS);
  });

  it("describes each part by what it is, not as bare reps", () => {
    const steps = buildSteps(holdAndPulseDay(), F);
    const first = steps.find((s): s is WorkStep => s.type === "work")!;
    const labels = first.sequence!.parts.map((part) =>
      formatSegment(part.detail, F),
    );

    // Pulses and reps are both counts; only the wording separates them, which
    // is the whole reason a segment describes itself.
    expect(labels).toEqual([
      "10s hold",
      "12 pulses",
      "12 reps, pulse each",
      "10s hold",
      "12 pulses",
    ]);
    // The step itself answers with the whole run, since that's now what one
    // step is.
    expect(describeStep(first, F)).toBe(labels.join(" → "));
  });
});

describe("the sequence timeline", () => {
  /**
   * A hold is exact because the routine gave it a duration; pulses and reps
   * carry a *count*, so they're paced. Pinned rather than left implicit: these
   * numbers decide how fast the player pulls you through a set, and a change to
   * one should be a change someone made on purpose.
   */
  it("times holds exactly and paces the counted parts", () => {
    const sequence = buildSequence([
      { kind: "hold", seconds: 10 },
      { kind: "pulses", count: 12 },
      { kind: "reps", count: 12, pulsePerRep: true },
      { kind: "reps", count: 12 },
    ]);

    expect(sequence.parts.map((p) => p.seconds)).toEqual([10, 18, 24, 21]);
    expect(sequence.parts.map((p) => p.isTimed)).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(sequence.seconds).toBe(73);
  });

  it("lays the parts end to end so the running one is a subtraction", () => {
    const sequence = buildSequence([
      { kind: "hold", seconds: 10 },
      { kind: "pulses", count: 10 },
      { kind: "hold", seconds: 5 },
    ]);

    // 10 pulses at PULSE_SECONDS (1.5) paces to 15s.
    expect(sequence.parts.map((p) => [p.startMs, p.endMs])).toEqual([
      [0, 10_000],
      [10_000, 25_000],
      [25_000, 30_000],
    ]);

    expect(partAt(sequence, 0).index).toBe(1);
    expect(partAt(sequence, 9_999).index).toBe(1);
    expect(partAt(sequence, 10_000).index).toBe(2);
    expect(partAt(sequence, 24_999).index).toBe(2);
    expect(partAt(sequence, 25_000).index).toBe(3);
    // Past the end it clamps rather than going undefined: a finished sequence
    // still has to render something, and "the last part, done" is both true and
    // what you want on screen while you rack the weight.
    expect(partAt(sequence, 99_999).index).toBe(3);
  });

  /**
   * The bug this pins, found by driving the real player: "+10s" was implemented
   * as pushing the deadline out, which moves the *derived start* out with it —
   * so elapsed time went down and pressing it with eight seconds left on a hold
   * threw you back into the pulses you had already finished. One scalar can't
   * insert time mid-sequence; the boundary of the part you're on has to move
   * too, which is what the grant does.
   */
  it("grows the part you're on and shifts only what comes after it", () => {
    const sequence = buildSequence([
      { kind: "hold", seconds: 10 },
      { kind: "pulses", count: 10 },
      { kind: "hold", seconds: 5 },
    ]);
    const extended = extendSequence(sequence, { "2": 10_000 });

    expect(extended.parts.map((p) => [p.startMs, p.endMs])).toEqual([
      // Untouched: it already happened.
      [0, 10_000],
      // Ten seconds longer, and it still starts where it started — which is
      // what keeps elapsed time pointing at the same part. (Base duration is
      // 15s — 10 pulses at PULSE_SECONDS — plus the 10s grant.)
      [10_000, 35_000],
      // Pushed back by the same ten.
      [35_000, 40_000],
    ]);
    expect(extended.seconds).toBe(40);

    // 12s in is a second into part 2 either way; the grant must not move that.
    expect(partAt(sequence, 12_000).index).toBe(2);
    expect(partAt(extended, 12_000).index).toBe(2);
  });

  it("hands back the same sequence when nothing was granted", () => {
    const sequence = buildSequence([
      { kind: "hold", seconds: 10 },
      { kind: "pulses", count: 10 },
    ]);

    // Identity, not just equality: the common case allocates nothing and keeps
    // a stable reference for everything memoising on it.
    expect(extendSequence(sequence, {})).toBe(sequence);
  });

  it("takes the upper bound of a range, so the pace plans for the longer set", () => {
    const sequence = buildSequence([
      { kind: "reps", count: [8, 12] },
      { kind: "pulses", count: 12 },
    ]);

    expect(sequence.parts[0].seconds).toBe(21);
  });
});

describe("previousWorkStep", () => {
  it("finds the work step a plain rest follows", () => {
    const steps = buildSteps(pairedDayForRest(), F);
    const restIndex = steps.findIndex((s) => s.type === "rest");
    const work = previousWorkStep(steps, restIndex);

    expect(work?.type).toBe("work");
    expect(steps[restIndex - 1]).toBe(work);
  });

  it("walks past a pose hold to the work step that set it up", () => {
    // A finisher's rest follows the pose, not the work step directly — see
    // the comment on the function. `steps[index - 1]` would return the pose.
    const steps = buildSteps(dayWithFinisher(), F);
    const restIndex = steps.findIndex(
      (s, i) => s.type === "rest" && steps[i - 1]?.type === "pose",
    );
    const work = previousWorkStep(steps, restIndex);

    expect(steps[restIndex - 1].type).toBe("pose");
    expect(work?.type).toBe("work");
  });

  it("is undefined before any work step has run", () => {
    const steps = buildSteps(dayWithFinisher(), F);
    expect(previousWorkStep(steps, 0)).toBeUndefined();
  });
});

/** A single-exercise day, for a rest step with an unambiguous predecessor. */
function pairedDayForRest(): TrainingDay {
  return {
    dayNumber: 1,
    label: "Push",
    isRest: false,
    warmupRefs: [],
    exercises: [
      {
        exerciseId: "flat-barbell-bench-press",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        prescriptions: [{ sets: 2, reps: 10, restSeconds: 90 }],
      },
    ],
  };
}

describe("where the load goes", () => {
  function ramped(prescriptions: TrainingDay["exercises"][number]["prescriptions"]) {
    return buildSteps(
      {
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
            prescriptions,
          },
        ],
      },
      F,
    ).filter((s): s is WorkStep => s.type === "work");
  }

  /**
   * The complaint this answers: a ramp reached you as "8 reps" on set three,
   * having been "10 reps" on set two, with nothing anywhere saying to put
   * weight on the bar. The six transcribed programs state their ramps only as
   * rep numbers, so inferring it is what makes them read correctly without
   * being re-authored.
   */
  it("reads a falling rep target as a ramp", () => {
    const work = ramped(
      [10, 8, 6].map((reps) => ({ sets: 1, reps, restSeconds: 90 })),
    );

    expect(work.map((s) => s.load?.direction)).toEqual([
      undefined,
      "heavier",
      "heavier",
    ]);
    expect(work[1].load?.stated).toBe(false);
  });

  it("reads a rising one as a back-off, and equal reps as nothing at all", () => {
    expect(
      ramped([6, 10].map((reps) => ({ sets: 1, reps, restSeconds: 90 }))).map(
        (s) => s.load?.direction,
      ),
    ).toEqual([undefined, "lighter"]);

    // Inferring "same weight" from equal reps would badge every straight set in
    // the app with a fact you already knew.
    expect(
      ramped([{ sets: 3, reps: [8, 12], restSeconds: 90 }]).map((s) => s.load),
    ).toEqual([undefined, undefined, undefined]);
  });

  it("lets the routine state it, on every set of the phase", () => {
    const work = ramped([
      { sets: 1, reps: 10, restSeconds: 90 },
      { sets: 3, reps: 10, restSeconds: 90, load: "heavier" },
    ]);

    // Equal reps throughout, so nothing is inferred — and "these three sets get
    // heavier" means each of them does, not just the first.
    expect(work.map((s) => s.load?.direction)).toEqual([
      undefined,
      "heavier",
      "heavier",
      "heavier",
    ]);
    expect(work[1].load?.stated).toBe(true);
  });

  it("keeps a warmup ramp out of the working sets' progression", () => {
    const work = ramped([
      { sets: 1, reps: 10, restSeconds: 60, isWarmup: true },
      { sets: 2, reps: [8, 12], restSeconds: 120 },
    ]);

    // 10 → 12 across the boundary would otherwise call the first working set a
    // back-off, when it's the first set that counts at all.
    expect(work.map((s) => s.load)).toEqual([undefined, undefined, undefined]);
  });

  /**
   * "Set 2 of 4" says where you are and nothing about where you're going, so a
   * ramp arrived one number at a time and never read as a ramp at all.
   */
  it("lays the exercise's whole plan out as a ladder", () => {
    const steps: SessionStep[] = ramped(
      [12, 10, 8].map((reps) => ({ sets: 1, reps, restSeconds: 90 })),
    );
    const work = steps.filter((s): s is WorkStep => s.type === "work");

    expect(setLadder(steps, work[1], F)).toEqual([
      { setNumber: 1, target: "12", load: undefined, isCurrent: false, isDone: true },
      {
        setNumber: 2,
        target: "10",
        load: { direction: "heavier", stated: false },
        isCurrent: true,
        isDone: false,
      },
      {
        setNumber: 3,
        target: "8",
        load: { direction: "heavier", stated: false },
        isCurrent: false,
        isDone: false,
      },
    ]);
  });
});

describe("saying what's next", () => {
  const day: TrainingDay = {
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
        prescriptions: [{ sets: 2, reps: 10, restSeconds: 90 }],
      },
      {
        exerciseId: "machine-chest-dip",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        prescriptions: [{ sets: 1, reps: 10, restSeconds: 90 }],
      },
    ],
  };

  /**
   * The difference between resting where you are and needing to go and find a
   * machine — which is the thing you'd want to know *before* you sit down.
   */
  it("names the next exercise on the rest and set that lead into it", () => {
    const steps = buildSteps(day, F);
    const work = steps.filter((s): s is WorkStep => s.type === "work");
    const rests = steps.filter((s) => s.type === "rest");

    expect(work[0].nextExerciseName).toBeUndefined();
    expect(work[1].nextExerciseName).toBe("Machine dip (chest)");
    // The last set of the day has nothing after it.
    expect(work[2].nextExerciseName).toBeUndefined();

    expect(rests[0].nextExerciseName).toBeUndefined();
    expect(rests[1].nextExerciseName).toBe("Machine dip (chest)");
    expect(rests[1].nextLabel).toContain("Machine dip (chest)");
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

/**
 * The invariant the whole extra-work feature rests on: `composeDay` (in
 * `features/extras/extras.ts`) appends to `day.exercises`, and `buildSteps`
 * must genuinely not care that it did. See `schema.ts` in that feature for
 * why an extra being a bare `ExerciseEntry` is what makes this true.
 */
describe("appending extra work", () => {
  const TARGET = { routineSlug: "test-routine", weekNumber: 1, dayNumber: 1 };

  function plainDay(): TrainingDay {
    return {
      dayNumber: 1,
      label: "Push",
      isRest: false,
      warmupRefs: [],
      exercises: [
        {
          exerciseId: "flat-barbell-bench-press",
          orAlternatives: [],
          kind: "resistance",
          isFinisher: false,
          prescriptions: [{ sets: 3, reps: 10, restSeconds: 90 }],
        },
        {
          exerciseId: "lat-pulldown-wide",
          orAlternatives: [],
          kind: "resistance",
          isFinisher: false,
          prescriptions: [{ sets: 3, reps: 12, restSeconds: 90 }],
        },
      ],
    };
  }

  function anExtra(): ExtraWork {
    return {
      id: "extra:1",
      createdAt: 1,
      ...TARGET,
      entry: {
        exerciseId: "cable-crossover-mid",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        prescriptions: [{ sets: 3, reps: 15, restSeconds: 60 }],
      },
    };
  }

  /**
   * Asserted on **ids**, not deep equality — the boundary step legitimately
   * gains a `nextExerciseName` once something follows it (see the next
   * test), and asserting the whole object would fail on the one change
   * that's actually correct.
   */
  it("never disturbs the ids of steps that existed before the extra", () => {
    const day = plainDay();
    const before = buildSteps(day, F);

    const { day: composed } = composeDay(day, [anExtra()], TARGET, undefined);
    const after = buildSteps(composed, F);

    expect(after.slice(0, before.length).map((s) => s.id)).toEqual(
      before.map((s) => s.id),
    );
    // Genuinely longer — the extra's own steps landed after.
    expect(after.length).toBeGreaterThan(before.length);
  });

  it("gives the previously-last work step a nextExerciseName once an extra follows it", () => {
    const day = plainDay();
    const before = buildSteps(day, F);
    const lastWork = [...before]
      .reverse()
      .find((s): s is WorkStep => s.type === "work")!;
    expect(lastWork.nextExerciseName).toBeUndefined();

    const { day: composed } = composeDay(day, [anExtra()], TARGET, undefined);
    const after = buildSteps(composed, F);
    const sameStep = after.find((s) => s.id === lastWork.id) as WorkStep;
    expect(sameStep.nextExerciseName).toBeDefined();
  });

  function dayWithCardio(): TrainingDay {
    const base = plainDay();
    return {
      ...base,
      exercises: [
        ...base.exercises,
        {
          exerciseId: "treadmill-steady-state",
          orAlternatives: [],
          kind: "cardio",
          isFinisher: false,
          prescriptions: [{ sets: 1, durationSeconds: 1200 }],
        },
      ],
    };
  }

  /**
   * The whole reason `"append"` placement exists rather than always using
   * `"beforeCardio"`: a live session must be able to add an extra without
   * ever shifting a step it has already shown or passed, and `"append"` is
   * the one placement that keeps that true regardless of whether the day
   * has cardio.
   */
  it('"append" placement keeps the no-earlier-steps-disturbed invariant even when the day has cardio', () => {
    const day = dayWithCardio();
    const before = buildSteps(day, F);

    const { day: composed } = composeDay(
      day,
      [anExtra()],
      TARGET,
      undefined,
      "append",
    );
    const after = buildSteps(composed, F);

    expect(after.slice(0, before.length).map((s) => s.id)).toEqual(
      before.map((s) => s.id),
    );
  });

  /**
   * The negative case, spelled out: the default `"beforeCardio"` placement
   * is explicitly *not* safe to use on a running session, because it can
   * insert ahead of steps that already exist — here, the cardio block's own
   * step shifts to make room for the extra landing in front of it.
   *
   * Compared by **content** (`exerciseName`), not `id` — step ids are built
   * from position alone (`${exerciseIndex}-work${setNumber}-work`), so the
   * treadmill's single step at position 2 and the extra's first set landing
   * at that same position afterward coincidentally produce the identical id
   * string despite being completely different steps. That collision is
   * itself worth knowing: an id equality check alone cannot be trusted to
   * catch this class of corruption, which is exactly why `"append"` — never
   * reusing an existing position at all — is the one placement actually
   * safe for a running session, rather than merely "ids happened to still
   * match".
   */
  it('"beforeCardio" placement, by contrast, does shift what follows the extra', () => {
    const day = dayWithCardio();
    const before = buildSteps(day, F);
    const signature = (steps: typeof before) =>
      steps.map((s) => (s.type === "work" ? s.exerciseName : s.type));

    const { day: composed } = composeDay(day, [anExtra()], TARGET, undefined);
    const after = buildSteps(composed, F);

    expect(signature(after.slice(0, before.length))).not.toEqual(
      signature(before),
    );
  });
});
