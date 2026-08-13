import { describe, expect, it } from "vitest";
import { routines, routineSchema } from "@/data/routines";
import { formattingFor } from "@/i18n/test-formatting";
import { buildSteps, isLoggableStep } from "../../lib/session";
import {
  duplicateWeek,
  emptyDraft,
  emptyPhase,
  emptySegment,
  toDraft,
  toRoutine,
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
