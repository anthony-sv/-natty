import { describe, expect, it } from "vitest";
import { routines, routineSchema, type Routine } from "@/data/routines";
import { FINISHER_CONVENTION } from "@/data/routines/authoring";
import { formattingFor } from "@/i18n/test-formatting";
import { buildSteps, isLoggableStep } from "../../lib/session";
import {
  duplicateWeek,
  emptyDraft,
  emptyDay,
  emptyPhase,
  emptySegment,
  finisherKindOf,
  finisherPhase,
  moveDay,
  toDraft,
  toRoutine,
  applyFinisher,
  type DraftPhase,
  type DraftRoutine,
} from "./draft";

const F = formattingFor();

/**
 * The builder's only real job is producing something `routineSchema` accepts
 * and the player can run. These check that end, not the UI that drives it.
 */

/** A glute day with the hold-and-pulse ramp, as the builder would hold it. */
function holdAndPulseDraft(): DraftRoutine {
  return {
    name: "Glute day",
    style: "",
    notes: [],
    weeks: [{ days: [
      {
        label: "Glutes",
        isRest: false,
        exercises: [
          {
            exerciseId: "machine-hip-abduction",
            orAlternatives: [],
            kind: "resistance",
            isFinisher: false,
            phases: [12, 10, 8, 6].map((reps) => ({
              ...emptyPhase(),
              sets: "1",
              restSeconds: "60",
              segments: [
                { ...emptySegment("hold"), seconds: "10" },
                { ...emptySegment("pulses"), count: "12" },
                { ...emptySegment("reps"), count: String(reps), pulsePerRep: true },
                { ...emptySegment("hold"), seconds: "10" },
                { ...emptySegment("pulses"), count: "12" },
              ],
            })),
          },
        ],
      },
    ] }],
  };
}

describe("producing a routine", () => {
  it("makes something the schema accepts", () => {
    const routine = toRoutine(holdAndPulseDraft(), "glute-day-abc123");
    expect(routineSchema.safeParse(routine).success).toBe(true);
  });

  it("refuses a draft with no name", () => {
    // The save button is disabled off this, rather than showing a parse error
    // pointing at an array index nobody can see.
    expect(toRoutine({ ...emptyDraft(), name: "  " }, "s")).toBeUndefined();
  });

  it("numbers days from one, in order", () => {
    const draft = emptyDraft();
    draft.name = "Split";
    draft.weeks[0].days = [
      { label: "Push", isRest: false, exercises: [] },
      { label: "Rest", isRest: true, exercises: [] },
      { label: "Pull", isRest: false, exercises: [] },
    ];
    const routine = toRoutine(draft, "s")!;
    expect(routine.weeks[0].days.map((d) => d.dayNumber)).toEqual([1, 2, 3]);
    expect(routine.weeks[0].days.map((d) => d.isRest)).toEqual([false, true, false]);
  });

  it("is one week unless you asked for more", () => {
    expect(toRoutine(holdAndPulseDraft(), "s")!.weeks).toHaveLength(1);
  });

  it("drops an exercise with no lift picked", () => {
    const draft = holdAndPulseDraft();
    draft.weeks[0].days[0].exercises.push({
      exerciseId: "",
      orAlternatives: [],
      kind: "resistance",
      isFinisher: false,
      phases: [emptyPhase()],
    });
    expect(toRoutine(draft, "s")!.weeks[0].days[0].exercises).toHaveLength(1);
  });

  it("drops a sequence with fewer than two parts", () => {
    const draft = holdAndPulseDraft();
    draft.weeks[0].days[0].exercises[0].phases[0].segments = [emptySegment("hold")];
    // Three phases survive, not four — and the whole exercise stays.
    expect(
      toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].prescriptions,
    ).toHaveLength(3);
  });

  it("keeps a rest day's exercises out", () => {
    const draft = holdAndPulseDraft();
    draft.weeks[0].days[0].isRest = true;
    expect(toRoutine(draft, "s")!.weeks[0].days[0].exercises).toEqual([]);
  });

  it("reads a single rep target as a number, not a range", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        phases: [{ ...emptyPhase(), repsFrom: "5", repsTo: "" }],
      },
    ];
    expect(toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].prescriptions[0].reps).toBe(5);
  });

  it("only carries the modifiers that are on", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        phases: [
          { ...emptyPhase(), modifiers: { ...emptyPhase().modifiers, dropSet: true } },
        ],
      },
    ];
    const p = toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].prescriptions[0];
    expect(p.modifiers).toEqual({ dropSet: true });
  });

  /**
   * Written only when true, so a routine prescribing no warmups round-trips to
   * exactly what it was rather than gaining `isWarmup: false` on every phase.
   */
  it("marks a warmup phase, and says nothing about the others", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        phases: [
          { ...emptyPhase(), sets: "2", isWarmup: true },
          { ...emptyPhase(), sets: "3" },
        ],
      },
    ];

    const entry = toRoutine(draft, "s")!.weeks[0].days[0].exercises[0];
    expect(entry.prescriptions[0].isWarmup).toBe(true);
    expect(entry.prescriptions[1].isWarmup).toBeUndefined();
  });

  /**
   * Without this the builder could only write reps, so a twenty-minute cardio
   * block came out as "3 sets of 8-12 reps" of walking.
   */
  it("writes a timed phase as a duration, with no reps", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "cardio",
        isFinisher: false,
        phases: [
          { ...emptyPhase(), sets: "1", duration: "20", durationUnit: "min" },
        ],
      },
    ];

    const p = toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].prescriptions[0];
    expect(p.durationSeconds).toBe(1200);
    // The schema's own `.refine` rejects both at once, so this isn't just
    // tidiness — carrying reps too would fail the parse at the collection.
    expect(p.reps).toBeUndefined();
  });

  /**
   * Both units have to work: a 20-minute steady block in seconds is 1200, and
   * a 30-second HIIT interval in minutes is 0.5. Whichever you force, half the
   * cardio anyone writes reads badly.
   */
  it("takes seconds when that's the unit you picked", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "cardio",
        isFinisher: false,
        phases: [
          { ...emptyPhase(), sets: "8", duration: "30", durationUnit: "s" },
        ],
      },
    ];

    const p = toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].prescriptions[0];
    expect(p.durationSeconds).toBe(30);
    expect(p.sets).toBe(8);
  });

  it("rounds a fractional minute to whole seconds", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "cardio",
        isFinisher: false,
        phases: [
          { ...emptyPhase(), sets: "1", duration: "7.5", durationUnit: "min" },
        ],
      },
    ];

    expect(
      toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].prescriptions[0]
        .durationSeconds,
    ).toBe(450);
  });

  /**
   * Whole minutes come back as minutes, anything else as seconds — so a
   * 45-second stretch hold doesn't reload as "0.75 min".
   */
  it("reads a duration back in the unit it reads best in", () => {
    const build = (seconds: number) => ({
      dayNumber: 1,
      label: "d",
      isRest: false,
      warmupRefs: [],
      exercises: [
        {
          exerciseId: "barbell-hip-thrust",
          orAlternatives: [],
          kind: "cardio" as const,
          isFinisher: false,
          prescriptions: [{ sets: 1, durationSeconds: seconds }],
        },
      ],
    });

    const asMinutes = toDraft({
      slug: "s",
      name: "n",
      weeks: [{ weekNumber: 1, days: [build(1200)] }],
    });
    const asSeconds = toDraft({
      slug: "s",
      name: "n",
      weeks: [{ weekNumber: 1, days: [build(45)] }],
    });

    const phase = (d: DraftRoutine) => d.weeks[0].days[0].exercises[0].phases[0];
    expect(phase(asMinutes).duration).toBe("20");
    expect(phase(asMinutes).durationUnit).toBe("min");
    expect(phase(asSeconds).duration).toBe("45");
    expect(phase(asSeconds).durationUnit).toBe("s");
  });

  it("carries the intensity, and says nothing when you didn't", () => {
    const withIntensity = emptyDraft();
    withIntensity.name = "x";
    withIntensity.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "cardio",
        isFinisher: false,
        phases: [
          {
            ...emptyPhase(),
            sets: "1",
            duration: "20",
            durationUnit: "min",
            intensity: "low",
          },
        ],
      },
    ];

    const p = (draft: DraftRoutine) =>
      toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].prescriptions[0];
    expect(p(withIntensity).intensity).toBe("low");

    const blank = structuredClone(withIntensity);
    blank.weeks[0].days[0].exercises[0].phases[0].intensity = "";
    // "" means you didn't say, which is different from "moderate".
    expect(p(blank).intensity).toBeUndefined();
  });

  it("carries the substitutes you picked", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: ["smith-machine-hip-thrust", "machine-hip-abduction"],
        kind: "resistance",
        isFinisher: false,
        phases: [emptyPhase()],
      },
    ];

    expect(
      toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].orAlternatives,
    ).toEqual(["smith-machine-hip-thrust", "machine-hip-abduction"]);
  });

  it("drops a substitute that is the exercise itself, or a duplicate", () => {
    // Both would render as "or <the same lift>", and the second would give the
    // player two identical entries in its swap list.
    const draft = emptyDraft();
    draft.name = "x";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [
          "barbell-hip-thrust",
          "machine-hip-abduction",
          "machine-hip-abduction",
          "",
        ],
        kind: "resistance",
        isFinisher: false,
        phases: [emptyPhase()],
      },
    ];

    expect(
      toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].orAlternatives,
    ).toEqual(["machine-hip-abduction"]);
  });
});

describe("what the player gets", () => {
  it("runs the sequence the builder wrote", () => {
    const routine = toRoutine(holdAndPulseDraft(), "s")!;
    const steps = buildSteps(routine.weeks[0].days[0], F);
    const work = steps.filter((s) => s.type === "work");

    // The end-to-end claim: a routine authored in the UI produces exactly the
    // four steps the schema-level test pins by hand, each carrying its whole
    // five-part sequence.
    expect(work).toHaveLength(4);
    expect(work.map((s) => s.setNumber)).toEqual([1, 2, 3, 4]);
    for (const step of work) {
      expect(step.type === "work" && step.sequence?.parts).toHaveLength(5);
    }
    expect(steps.filter(isLoggableStep)).toHaveLength(4);
  });
});

describe("finishers", () => {
  /** One exercise, straight out of the picker — nothing typed into it yet. */
  function freshDraft(): DraftRoutine {
    const draft = emptyDraft();
    draft.name = "Arms";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "cable-triceps-pushdown",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        phases: [emptyPhase()],
      },
    ];
    return draft;
  }

  it("writes the convention onto an exercise you haven't touched", () => {
    const phases = applyFinisher([emptyPhase()], "pose");
    expect(phases).toHaveLength(1);
    expect(phases[0].sets).toBe("7");
    expect(phases[0].repsFrom).toBe("15");
    expect(phases[0].repsTo).toBe("20");
    expect(phases[0].restSeconds).toBe("30");
    expect(phases[0].pose?.holdSeconds).toBe("10");
  });

  it("agrees with what the transcribed programs are authored from", () => {
    // Two copies of "7 sets, 30s rest, a 10s hold" would drift, and the one
    // that drifted would be the routine you wrote yourself.
    const phase = finisherPhase();
    expect(phase.sets).toBe(String(FINISHER_CONVENTION.sets));
    expect(phase.restSeconds).toBe(String(FINISHER_CONVENTION.restSeconds));
    expect(phase.pose?.holdSeconds).toBe(
      String(FINISHER_CONVENTION.holdSeconds),
    );
  });

  it("leaves phases you have filled in alone, and only adds the pose slot", () => {
    // The switch is not a licence to throw away four hand-entered phases.
    const typed: DraftPhase[] = [
      { ...emptyPhase(), sets: "4", repsFrom: "6", restSeconds: "180" },
      { ...emptyPhase(), sets: "2", repsFrom: "10" },
    ];
    const phases = applyFinisher(typed, "pose");
    expect(phases.map((p) => p.sets)).toEqual(["4", "2"]);
    expect(phases.map((p) => p.repsFrom)).toEqual(["6", "10"]);
    expect(phases[0].restSeconds).toBe("180");
    for (const phase of phases) expect(phase.pose).toBeDefined();
  });

  it("drops the poses when you turn it off", () => {
    const on = applyFinisher([emptyPhase()], "pose");
    const off = applyFinisher(on, "none");
    for (const phase of off) expect(phase.pose).toBeUndefined();
    // The numbers stay: they're just set counts once the pose is gone.
    expect(off[0].sets).toBe("7");
  });

  it("gives the player a pose step with a real hold", () => {
    // The whole complaint this fixes: the flag alone changed nothing you could
    // see, because `buildSteps` emits the hold off the *pose*, not the flag.
    const draft = freshDraft();
    const exercise = draft.weeks[0].days[0].exercises[0];
    exercise.isFinisher = true;
    exercise.phases = applyFinisher(exercise.phases, "pose").map((phase) => ({
      ...phase,
      pose: { poseId: "most-muscular", holdSeconds: "10" },
    }));

    const routine = toRoutine(draft, "s")!;
    expect(routineSchema.safeParse(routine).success).toBe(true);

    const steps = buildSteps(routine.weeks[0].days[0], F);
    const work = steps.filter((s) => s.type === "work");
    const holds = steps.filter((s) => s.type === "pose");

    // Seven sets, each closing on its own ten-second hold.
    expect(work).toHaveLength(7);
    expect(holds).toHaveLength(7);
    for (const hold of holds) {
      expect(hold.type === "pose" && hold.seconds).toBe(10);
    }
  });

  it("saves without a pose rather than blocking on one you haven't picked", () => {
    // Present-but-blank is a real state: the slot exists so the picker has
    // something to bind to, and an unfinished routine still saves.
    const draft = freshDraft();
    const exercise = draft.weeks[0].days[0].exercises[0];
    exercise.isFinisher = true;
    exercise.phases = applyFinisher(exercise.phases, "pose");

    const routine = toRoutine(draft, "s")!;
    expect(routineSchema.safeParse(routine).success).toBe(true);
    expect(
      routine.weeks[0].days[0].exercises[0].prescriptions[0].pose,
    ).toBeUndefined();
  });

  it("writes the hold-and-pulse ramp as four laddered sequences", () => {
    // The reason this is a preset at all: by hand it is four sets of five
    // parts each, twenty-odd fields, and the only thing that changes between
    // them is one number.
    const phases = applyFinisher([emptyPhase()], "ramp");

    expect(phases).toHaveLength(4);
    expect(phases.map((p) => p.sets)).toEqual(["1", "1", "1", "1"]);
    expect(phases.map((p) => p.segments?.length)).toEqual([5, 5, 5, 5]);
    // The rep part falls; everything around it repeats.
    expect(phases.map((p) => p.segments?.[2].count)).toEqual([
      "12",
      "10",
      "8",
      "6",
    ]);
    for (const phase of phases) {
      expect(phase.segments?.map((s) => s.kind)).toEqual([
        "hold",
        "pulses",
        "reps",
        "hold",
        "pulses",
      ]);
      expect(phase.segments?.[2].pulsePerRep).toBe(true);
    }

    // `load` is the step from the set *before*, so the opening set states
    // nothing — telling you to add weight to nothing is worse than silence.
    expect(phases.map((p) => p.load)).toEqual([
      "",
      "heavier",
      "heavier",
      "heavier",
    ]);
  });

  it("gives the player one step per ramp set, carrying its whole sequence", () => {
    const draft = freshDraft();
    const exercise = draft.weeks[0].days[0].exercises[0];
    exercise.isFinisher = true;
    exercise.phases = applyFinisher(exercise.phases, "ramp");

    const routine = toRoutine(draft, "s")!;
    expect(routineSchema.safeParse(routine).success).toBe(true);

    const work = buildSteps(routine.weeks[0].days[0], F).filter(
      (s) => s.type === "work",
    );
    // Four sets, not twenty steps: one set is one tap, whatever it is made of.
    expect(work).toHaveLength(4);
    for (const step of work) {
      expect(step.type === "work" && step.sequence?.parts).toHaveLength(5);
    }
  });

  it("swaps one preset for the other rather than merging them", () => {
    // The "don't throw away your typing" rule must not protect typing nobody
    // did: picking pose while the ramp preset is loaded left four sequences in
    // place and hung a pose on each.
    const ramp = applyFinisher([emptyPhase()], "ramp");
    const pose = applyFinisher(ramp, "pose");

    expect(pose).toHaveLength(1);
    expect(pose[0].sets).toBe("7");
    expect(pose[0].segments).toBeUndefined();

    // And back again.
    expect(applyFinisher(pose, "ramp")).toHaveLength(4);
  });

  it("reads back which kind an exercise is written as", () => {
    // Derived from the phases rather than stored, so hand-editing them can't
    // leave the picker claiming something the sets don't say.
    const base = freshDraft().weeks[0].days[0].exercises[0];
    expect(finisherKindOf(base)).toBe("none");
    expect(
      finisherKindOf({
        ...base,
        isFinisher: true,
        phases: applyFinisher(base.phases, "pose"),
      }),
    ).toBe("pose");
    expect(
      finisherKindOf({
        ...base,
        isFinisher: true,
        phases: applyFinisher(base.phases, "ramp"),
      }),
    ).toBe("ramp");
  });

  it("round-trips every built-in finisher's pose and hold", () => {
    // Compared prescription by prescription rather than whole-routine, for the
    // same reason the multi-week round trip is: `warmupRefs` is resolved from
    // a built-in vocabulary the editor deliberately drops.
    const posesOf = (routine: Routine) =>
      routine.weeks.flatMap((week) =>
        week.days.flatMap((day) =>
          day.exercises.flatMap((exercise) =>
            exercise.prescriptions.map((p) => p.pose),
          ),
        ),
      );

    for (const routine of routines) {
      const back = toRoutine(toDraft(routine), routine.slug)!;
      expect(posesOf(back)).toEqual(posesOf(routine));
    }

    // And there is something to compare — a green test over an empty list
    // would pass just as well with the pose field deleted.
    expect(
      routines.flatMap(posesOf).filter((pose) => pose !== undefined).length,
    ).toBeGreaterThan(0);
  });
});

describe("round-tripping", () => {
  it("survives a trip through the editor unchanged", () => {
    // What "start from a copy" and "edit" both depend on: loading a routine
    // back into the draft and saving it must not quietly rewrite it.
    const original = toRoutine(holdAndPulseDraft(), "s")!;
    const again = toRoutine(toDraft(original), "s")!;
    expect(again).toEqual(original);
  });

  it("round-trips a plain rep range too", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.weeks[0].days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        phases: [emptyPhase(), { ...emptyPhase(), sets: "1", repsFrom: "6", repsTo: "" }],
      },
    ];
    const original = toRoutine(draft, "s")!;
    expect(toRoutine(toDraft(original), "s")).toEqual(original);
  });
});

/**
 * The builder used to write one week and `toDraft` used to read only
 * `weeks[0]`, so editing a shipped eight-week program threw seven of them
 * away — the edit page had to warn you before you pressed save. These pin the
 * two halves of the fix.
 */
describe("multi-week routines", () => {
  function twoWeeks(): DraftRoutine {
    const draft = emptyDraft();
    draft.name = "Ramp";
    draft.weeks = [
      {
        days: [
          {
            label: "Chest",
            isRest: false,
            exercises: [
              {
                exerciseId: "flat-barbell-bench-press",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                phases: [{ ...emptyPhase(), repsFrom: "10", repsTo: "12" }],
              },
            ],
          },
        ],
      },
      {
        days: [
          {
            label: "Chest",
            isRest: false,
            exercises: [
              {
                exerciseId: "flat-barbell-bench-press",
                orAlternatives: [],
                kind: "resistance",
                isFinisher: false,
                // Week 2 is week 1 with the numbers moved, which is what a
                // second week is actually for.
                phases: [{ ...emptyPhase(), repsFrom: "6", repsTo: "8" }],
              },
            ],
          },
        ],
      },
    ];
    return draft;
  }

  it("numbers the weeks from one, in order", () => {
    const routine = toRoutine(twoWeeks(), "s")!;

    expect(routine.weeks.map((w) => w.weekNumber)).toEqual([1, 2]);
  });

  it("keeps each week's own numbers", () => {
    const routine = toRoutine(twoWeeks(), "s")!;
    const reps = (week: number) =>
      routine.weeks[week].days[0].exercises[0].prescriptions[0].reps;

    expect(reps(0)).toEqual([10, 12]);
    expect(reps(1)).toEqual([6, 8]);
  });

  it("makes something the schema still accepts", () => {
    expect(routineSchema.safeParse(toRoutine(twoWeeks(), "s")).success).toBe(true);
  });

  /**
   * The half that was actually broken: `toDraft` read `weeks[0]` and dropped
   * the rest, so opening an eight-week program in the editor lost seven weeks
   * before you touched anything.
   */
  it("reads every week back, not just the first", () => {
    const original = toRoutine(twoWeeks(), "s")!;
    const back = toDraft(original);

    expect(back.weeks).toHaveLength(2);
    expect(back.weeks[1].days[0].exercises[0].phases[0].repsFrom).toBe("6");
  });

  it("round-trips without rewriting anything", () => {
    const original = toRoutine(twoWeeks(), "s")!;

    expect(toRoutine(toDraft(original), "s")).toEqual(original);
  });

  /** Every shipped program, through the editor and back out unchanged. */
  it("round-trips the built-in programs, weeks and all", () => {
    for (const routine of routines) {
      const back = toRoutine(toDraft(routine), routine.slug)!;
      expect(back.weeks).toHaveLength(routine.weeks.length);
      expect(back.weeks.map((w) => w.days.length)).toEqual(
        routine.weeks.map((w) => w.days.length),
      );
    }
  });

  it("refuses a week with no days rather than saving an unrunnable routine", () => {
    const draft = twoWeeks();
    draft.weeks[1].days = [];

    expect(toRoutine(draft, "s")).toBeUndefined();
  });

  /**
   * A new week starts as a copy so you only change what moves. It has to be a
   * deep one — a week is four levels down to segments, and a shallow copy
   * would leave both weeks editing the same phases.
   */
  it("duplicates a week without sharing its phases", () => {
    const week = twoWeeks().weeks[0];
    const copy = duplicateWeek(week);
    copy.days[0].exercises[0].phases[0].repsFrom = "99";

    expect(week.days[0].exercises[0].phases[0].repsFrom).toBe("10");
  });
});

describe("plan-level notes", () => {
  it("survives a trip through the editor", () => {
    // The diet builder used to drop these on save, which meant editing a
    // plan's name deleted them. Routines gained notes with that already
    // known, so this pins it from the start.
    const routine = toRoutine(
      { ...holdAndPulseDraft(), notes: ["Deload every fourth week.", "  "] },
      "r",
    )!;
    // The blank row is dropped rather than saved as an empty bullet.
    expect(routine.notes).toEqual(["Deload every fourth week."]);
    expect(toRoutine(toDraft(routine), "r")!.notes).toEqual(routine.notes);
  });
});

describe("moveDay", () => {
  const week = (labels: string[]) =>
    labels.map((label) => ({ ...emptyDay(), label }));

  it("swaps two days without touching what is in them", () => {
    // The case this exists for: leg day on Wednesday, rest on Thursday, and
    // you want them the other way round without retyping a day of exercises.
    const days = week(["Legs", "Rest", "Push"]);
    days[0].exercises = [
      {
        exerciseId: "back-squat",
        orAlternatives: [],
        kind: "resistance",
        isFinisher: false,
        phases: [emptyPhase()],
      },
    ];

    const moved = moveDay(days, 0, 1);
    expect(moved.map((d) => d.label)).toEqual(["Rest", "Legs", "Push"]);
    // The exercises travelled with the day rather than staying at index 0.
    expect(moved[1]!.exercises[0]!.exerciseId).toBe("back-squat");
  });

  it("moves a day across the week, not just one step", () => {
    expect(
      moveDay(week(["A", "B", "C", "D"]), 3, 0).map((d) => d.label),
    ).toEqual(["D", "A", "B", "C"]);
  });

  it("refuses to move off either end rather than losing the day", () => {
    const days = week(["A", "B"]);
    expect(moveDay(days, 0, -1)).toBe(days);
    expect(moveDay(days, 1, 2)).toBe(days);
    // Every day survives whatever it is asked to do.
    expect(moveDay(days, 0, -1)).toHaveLength(2);
  });

  it("leaves the original array alone", () => {
    const days = week(["A", "B"]);
    moveDay(days, 0, 1);
    expect(days.map((d) => d.label)).toEqual(["A", "B"]);
  });
});
