import { describe, expect, it } from "vitest";
import { summariseRoutine } from "./summary";
import { formattingFor } from "@/i18n/test-formatting";

/** English, so the assertions read against the source strings. */
const F = formattingFor();
import type { Routine, TrainingDay } from "@/data/routines";

function day(dayNumber: number, label: string, isRest = false): TrainingDay {
  return { dayNumber, label, isRest, exercises: [], warmupRefs: [] };
}

function routine(partial: Partial<Routine> = {}): Routine {
  return {
    slug: "test",
    name: "Test",
    weeks: [
      {
        weekNumber: 1,
        days: [
          day(1, "Chest"),
          day(2, "Back"),
          day(3, "Shoulder/Traps"),
          day(4, "Rest", true),
          day(5, "Legs"),
          day(6, "Arms/Calves"),
          day(7, "Rest", true),
        ],
      },
    ],
    ...partial,
  };
}

describe("summariseRoutine", () => {
  it("lists the training days in order and leaves rest out of the split", () => {
    expect(summariseRoutine(routine(), F).split).toEqual([
      "Chest",
      "Back",
      "Shoulder/Traps",
      "Legs",
      "Arms/Calves",
    ]);
  });

  it("counts training and rest days separately", () => {
    const summary = summariseRoutine(routine(), F);

    expect(summary.trainingDays).toBe(5);
    expect(summary.restDays).toBe(2);
  });

  it("describes a single-week program as a cycle", () => {
    expect(summariseRoutine(routine(), F).length).toBe("7-day cycle");
  });

  it("describes a multi-week program in weeks", () => {
    const eightWeeks = routine({
      weeks: Array.from({ length: 8 }, (_, index) => ({
        weekNumber: index + 1,
        days: [day(1, "Chest"), day(2, "Rest", true)],
      })),
    });

    expect(summariseRoutine(eightWeeks, F).length).toBe("8 weeks");
  });

  it("reads the split off the first week only", () => {
    // Later weeks repeat the split with different prescriptions, so listing
    // every week would say the same thing eight times over.
    const drifting = routine({
      weeks: [
        { weekNumber: 1, days: [day(1, "Chest"), day(2, "Back")] },
        { weekNumber: 2, days: [day(1, "Legs"), day(2, "Arms")] },
      ],
    });

    expect(summariseRoutine(drifting, F).split).toEqual(["Chest", "Back"]);
  });

  it("survives a program with no weeks worth of days", () => {
    const empty = routine({ weeks: [{ weekNumber: 1, days: [] }] });
    const summary = summariseRoutine(empty, F);

    expect(summary.split).toEqual([]);
    expect(summary.trainingDays).toBe(0);
    expect(summary.restDays).toBe(0);
  });
});
