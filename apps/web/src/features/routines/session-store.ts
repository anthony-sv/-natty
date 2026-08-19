import { Store } from "@tanstack/store";
import { z } from "zod";

const STORAGE_KEY = "natty.session.v1";

const sessionStateSchema = z.object({
  routineSlug: z.string(),
  weekNumber: z.number().int().positive(),
  dayNumber: z.number().int().positive(),
  stepIndex: z.number().int().nonnegative(),
  /**
   * Absolute epoch ms when the running timer expires, or null when the current
   * step has no timer running. Storing the *deadline* rather than a remaining
   * count is what makes reload and screen-lock correct for free: remaining
   * time is always recomputed from the wall clock, so a rest that elapsed
   * while the phone was locked comes back already finished.
   */
  timerEndsAt: z.number().nullable(),
  /**
   * The wall clock, frozen — set while a countdown is paused and null while it
   * runs. Every reader takes `pausedAt ?? Date.now()` as "now", so pausing is
   * one substitution rather than a second representation of remaining time, and
   * `resumeTimer` just pushes the deadline out by however long you stood still.
   *
   * Defaulted so a session persisted before this existed still parses. It's
   * scratch state that `endSession()` throws away, but losing a workout in
   * progress to a schema change is exactly the sort of thing you'd only find
   * out about mid-session.
   */
  pausedAt: z.number().nullable().default(null),
  /**
   * Extra milliseconds granted to individual parts of the sequence set you're
   * on, keyed by the part's 1-based index.
   *
   * This exists because a sequence's part boundaries are fixed offsets from one
   * stored deadline, and **pushing that deadline out does not lengthen a part —
   * it rewinds you into the one before.** Moving `endsAt` later moves the
   * derived start later too, so elapsed time goes *down* and a "+10s" pressed
   * with eight seconds left on a hold threw you back into the pulses you'd
   * already done. One scalar genuinely can't express "insert time here"; the
   * boundaries after the insertion have to move and the ones before it must
   * not.
   *
   * Scoped to the current step and cleared whenever the timer is set, so it
   * never outlives the set it was granted to.
   */
  partExtraMs: z.record(z.string(), z.number()).default({}),
  startedAt: z.number(),
  /**
   * Exercises you've swapped for one of their listed alternatives, keyed by
   * position in the day (`exerciseIndex`), valued by the exercise id you're
   * actually doing.
   *
   * **Session state, not routine state.** Taking the dumbbell hip thrust
   * because someone's on the machine is a fact about today, not an edit to the
   * program — so it lives here and `endSession()` throws it away, rather than
   * quietly rewriting a routine you'd then find changed next week.
   *
   * Keyed by index rather than by the original exercise id, because a day can
   * legitimately prescribe the same lift twice and swapping the second
   * shouldn't move the first.
   */
  swaps: z.record(z.string(), z.string()).default({}),
  /**
   * Same shape as `swaps`, one namespace over: which pose you're actually
   * striking on a finisher whose prescription named more than one acceptable
   * one, keyed by `exerciseIndex`. Session state for the same reason a lift
   * swap is — picking "side chest" over "most muscular" today isn't an edit
   * to the routine, and defaulted so a session persisted before this existed
   * still parses.
   */
  poseSwaps: z.record(z.string(), z.string()).default({}),
});

export type SessionState = z.infer<typeof sessionStateSchema>;

function loadPersisted(): SessionState | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = sessionStateSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export const sessionStore = new Store<SessionState | null>(loadPersisted());

sessionStore.subscribe(() => {
  if (typeof localStorage === "undefined") return;
  const state = sessionStore.state;
  if (state === null) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

export function startSession(target: {
  routineSlug: string;
  weekNumber: number;
  dayNumber: number;
}): void {
  sessionStore.setState(() => ({
    ...target,
    stepIndex: 0,
    timerEndsAt: null,
    pausedAt: null,
    partExtraMs: {},
    startedAt: Date.now(),
    swaps: {},
    poseSwaps: {},
  }));
}

/**
 * Record that you're doing one of an exercise's alternatives instead.
 *
 * Passing the entry's own id clears the swap rather than storing it, so
 * switching back leaves no trace — and `loggedSetsForStep` then matches on the
 * original id again, which is what makes going back and forth harmless.
 */
export function swapExercise(
  exerciseIndex: number,
  exerciseId: string,
  originalId: string,
): void {
  sessionStore.setState((state) => {
    if (state === null) return null;
    const swaps = { ...state.swaps };
    if (exerciseId === originalId) delete swaps[String(exerciseIndex)];
    else swaps[String(exerciseIndex)] = exerciseId;
    return { ...state, swaps };
  });
}

/** The lift you're actually doing at this position — the swap, or the original. */
export function effectiveExerciseId(
  state: SessionState | null,
  exerciseIndex: number,
  originalId: string,
): string {
  return state?.swaps[String(exerciseIndex)] ?? originalId;
}

/**
 * Record that you're striking one of a finisher's other acceptable poses
 * instead — the pose equivalent of `swapExercise`. Passing the prescription's
 * own pose id clears the swap, same as swapping an exercise back to itself.
 */
export function swapPose(
  exerciseIndex: number,
  poseId: string,
  originalId: string,
): void {
  sessionStore.setState((state) => {
    if (state === null) return null;
    const poseSwaps = { ...state.poseSwaps };
    if (poseId === originalId) delete poseSwaps[String(exerciseIndex)];
    else poseSwaps[String(exerciseIndex)] = poseId;
    return { ...state, poseSwaps };
  });
}

/** The pose you're actually striking at this position — the swap, or the original. */
export function effectivePoseId(
  state: SessionState | null,
  exerciseIndex: number,
  originalId: string,
): string {
  return state?.poseSwaps[String(exerciseIndex)] ?? originalId;
}

/**
 * Move to `stepIndex`, clearing any running timer. `autoStart` starts the next
 * step's countdown immediately — rest begins the moment you tap done, whereas
 * anything you have to get into position for waits for an explicit Start.
 */
export function goToStep(
  stepIndex: number,
  autoStart?: { seconds: number; leadSeconds: number },
): void {
  sessionStore.setState((state) =>
    state === null
      ? null
      : {
          ...state,
          stepIndex,
          pausedAt: null,
          partExtraMs: {},
          timerEndsAt:
            autoStart === undefined
              ? null
              : Date.now() +
                (autoStart.seconds + autoStart.leadSeconds) * 1000,
        },
  );
}

/**
 * Start (or restart) the current step's countdown.
 *
 * `leadSeconds` is counted *into* the same deadline rather than tracked
 * separately: the run proper begins at `endsAt - seconds`, which every reader
 * can work out from the step it's already holding. One stored number stays one
 * stored number, and a lead-in that elapsed while the phone was locked resolves
 * the same way a finished rest does.
 */
export function startTimer(seconds: number, leadSeconds = 0): void {
  sessionStore.setState((state) =>
    state === null
      ? null
      : {
          ...state,
          pausedAt: null,
          partExtraMs: {},
          timerEndsAt: Date.now() + (seconds + leadSeconds) * 1000,
        },
  );
}

/**
 * Cut the rest of the current part short, landing exactly on the next boundary.
 *
 * Pulling the deadline in by what's left shortens the whole run by the same
 * amount, which pushes the derived start earlier and so moves elapsed time
 * *forward* by exactly that much — onto the boundary. The opposite direction
 * does not work symmetrically, which is what `extendPart` is for.
 *
 * Never earlier than now, so skipping the last part lands on "finished" rather
 * than somewhere in the past.
 */
export function skipAhead(seconds: number): void {
  sessionStore.setState((state) => {
    if (state === null || state.timerEndsAt === null) return state;
    const now = state.pausedAt ?? Date.now();
    return {
      ...state,
      timerEndsAt: Math.max(now, state.timerEndsAt - seconds * 1000),
    };
  });
}

/**
 * Give the part you're on `seconds` more, and push everything after it back.
 *
 * Both halves are required and neither works alone. The deadline moves so the
 * set really does run longer; the per-part grant moves that part's *boundary*
 * by the same amount, which is what keeps elapsed time where it was. Moving
 * only the deadline lengthens the run while leaving the boundaries fixed, and
 * the arithmetic comes out as ten seconds of rewind.
 */
export function extendPart(partIndex: number, seconds: number): void {
  sessionStore.setState((state) => {
    if (state === null || state.timerEndsAt === null) return state;
    const key = String(partIndex);
    return {
      ...state,
      timerEndsAt: state.timerEndsAt + seconds * 1000,
      partExtraMs: {
        ...state.partExtraMs,
        [key]: (state.partExtraMs[key] ?? 0) + seconds * 1000,
      },
    };
  });
}

/** Freeze the countdown where it is — someone needs the machine, or you do. */
export function pauseTimer(): void {
  sessionStore.setState((state) =>
    state === null || state.timerEndsAt === null || state.pausedAt !== null
      ? state
      : { ...state, pausedAt: Date.now() },
  );
}

/** Resume, having lost exactly the time you stood still. */
export function resumeTimer(): void {
  sessionStore.setState((state) => {
    if (state === null || state.pausedAt === null) return state;
    const paused = Date.now() - state.pausedAt;
    return {
      ...state,
      pausedAt: null,
      timerEndsAt:
        state.timerEndsAt === null ? null : state.timerEndsAt + paused,
    };
  });
}

/** Drop back to "not started" — the way out of a sequence you began too early. */
export function clearTimer(): void {
  sessionStore.setState((state) =>
    state === null
      ? null
      : { ...state, timerEndsAt: null, pausedAt: null, partExtraMs: {} },
  );
}

export function endSession(): void {
  sessionStore.setState(() => null);
}

/** True when a session is running for exactly this routine/week/day. */
export function isSessionFor(
  state: SessionState | null,
  target: { routineSlug: string; weekNumber: number; dayNumber: number },
): boolean {
  return (
    state !== null &&
    state.routineSlug === target.routineSlug &&
    state.weekNumber === target.weekNumber &&
    state.dayNumber === target.dayNumber
  );
}
