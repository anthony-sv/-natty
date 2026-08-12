import { describe, expect, it } from "vitest";
import { routineSchema } from "@/data/routines";
import { formattingFor } from "@/i18n/test-formatting";
import { buildSteps, isLoggableStep } from "../../lib/session";
import {
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
    days: [
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
    ],
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
    draft.days = [
      { label: "Push", isRest: false, exercises: [] },
      { label: "Rest", isRest: true, exercises: [] },
      { label: "Pull", isRest: false, exercises: [] },
    ];
    const routine = toRoutine(draft, "s")!;
    expect(routine.weeks[0].days.map((d) => d.dayNumber)).toEqual([1, 2, 3]);
    expect(routine.weeks[0].days.map((d) => d.isRest)).toEqual([false, true, false]);
  });

  it("is one week, because it repeats", () => {
    expect(toRoutine(holdAndPulseDraft(), "s")!.weeks).toHaveLength(1);
  });

  it("drops an exercise with no lift picked", () => {
    const draft = holdAndPulseDraft();
    draft.days[0].exercises.push({
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
    draft.days[0].exercises[0].phases[0].segments = [emptySegment("hold")];
    // Three phases survive, not four — and the whole exercise stays.
    expect(
      toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].prescriptions,
    ).toHaveLength(3);
  });

  it("keeps a rest day's exercises out", () => {
    const draft = holdAndPulseDraft();
    draft.days[0].isRest = true;
    expect(toRoutine(draft, "s")!.weeks[0].days[0].exercises).toEqual([]);
  });

  it("reads a single rep target as a number, not a range", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.days[0].exercises = [
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
    draft.days[0].exercises = [
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
    draft.days[0].exercises = [
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
    draft.days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "cardio",
        isFinisher: false,
        phases: [{ ...emptyPhase(), sets: "1", durationSeconds: "1200" }],
      },
    ];

    const p = toRoutine(draft, "s")!.weeks[0].days[0].exercises[0].prescriptions[0];
    expect(p.durationSeconds).toBe(1200);
    // The schema's own `.refine` rejects both at once, so this isn't just
    // tidiness — carrying reps too would fail the parse at the collection.
    expect(p.reps).toBeUndefined();
  });

  it("reads a timed phase back into the editor", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.days[0].exercises = [
      {
        exerciseId: "barbell-hip-thrust",
        orAlternatives: [],
        kind: "cardio",
        isFinisher: false,
        phases: [{ ...emptyPhase(), sets: "1", durationSeconds: "900" }],
      },
    ];

    const routine = toRoutine(draft, "s")!;
    const back = toDraft(routine);
    expect(back.days[0].exercises[0].phases[0].durationSeconds).toBe("900");
  });

  it("carries the substitutes you picked", () => {
    const draft = emptyDraft();
    draft.name = "x";
    draft.days[0].exercises = [
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
    draft.days[0].exercises = [
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
    // 20 steps the schema-level test pins by hand.
    expect(work).toHaveLength(20);
    expect(work.map((s) => s.setNumber)).toEqual([
      1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4,
    ]);
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
    draft.days[0].exercises = [
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
