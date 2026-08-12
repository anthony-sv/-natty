import { beforeEach, describe, expect, it } from "vitest";
import {
  effectiveExerciseId,
  endSession,
  sessionStore,
  startSession,
  swapExercise,
} from "./session-store";

const TARGET = { routineSlug: "bulking-program", weekNumber: 1, dayNumber: 5 };

beforeEach(() => {
  endSession();
});

describe("swapping an exercise mid-session", () => {
  it("reports the original until you swap", () => {
    startSession(TARGET);

    expect(
      effectiveExerciseId(sessionStore.state, 2, "machine-hip-thrust"),
    ).toBe("machine-hip-thrust");
  });

  it("reports the substitute once you have", () => {
    startSession(TARGET);
    swapExercise(2, "barbell-hip-thrust", "machine-hip-thrust");

    expect(
      effectiveExerciseId(sessionStore.state, 2, "machine-hip-thrust"),
    ).toBe("barbell-hip-thrust");
  });

  /**
   * Getting back is the same gesture as leaving — picking the original from the
   * same menu. Storing it as a swap-to-itself would work, but leaving no trace
   * is what makes `loggedSetsForStep` match on the original id again.
   */
  it("clears the swap when you pick the original back", () => {
    startSession(TARGET);
    swapExercise(2, "barbell-hip-thrust", "machine-hip-thrust");
    swapExercise(2, "machine-hip-thrust", "machine-hip-thrust");

    expect(sessionStore.state?.swaps).toEqual({});
  });

  /**
   * Keyed by position, not by exercise id: a day can legitimately prescribe the
   * same lift twice, and swapping the second must not move the first.
   */
  it("swaps one position of a repeated lift, not both", () => {
    startSession(TARGET);
    swapExercise(4, "dumbbell-hip-thrust", "machine-hip-thrust");

    expect(
      effectiveExerciseId(sessionStore.state, 1, "machine-hip-thrust"),
    ).toBe("machine-hip-thrust");
    expect(
      effectiveExerciseId(sessionStore.state, 4, "machine-hip-thrust"),
    ).toBe("dumbbell-hip-thrust");
  });

  /**
   * A swap is a fact about today, not an edit to the program. Ending the
   * session has to throw it away, or next week's session would start already
   * substituted and you'd never have asked for that.
   */
  it("does not survive the session", () => {
    startSession(TARGET);
    swapExercise(2, "barbell-hip-thrust", "machine-hip-thrust");
    endSession();
    startSession(TARGET);

    expect(sessionStore.state?.swaps).toEqual({});
    expect(
      effectiveExerciseId(sessionStore.state, 2, "machine-hip-thrust"),
    ).toBe("machine-hip-thrust");
  });

  it("has an answer with no session at all", () => {
    expect(effectiveExerciseId(null, 0, "machine-hip-thrust")).toBe(
      "machine-hip-thrust",
    );
  });
});
