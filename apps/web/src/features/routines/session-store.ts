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
    startedAt: Date.now(),
    swaps: {},
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
 * Move to `stepIndex`, clearing any running timer. `autoStartSeconds` starts
 * the next step's countdown immediately — rest steps begin the moment you tap
 * done, whereas cardio waits for an explicit Start.
 */
export function goToStep(stepIndex: number, autoStartSeconds?: number): void {
  sessionStore.setState((state) =>
    state === null
      ? null
      : {
          ...state,
          stepIndex,
          timerEndsAt:
            autoStartSeconds === undefined
              ? null
              : Date.now() + autoStartSeconds * 1000,
        },
  );
}

/** Start (or restart) the current step's countdown — used by cardio blocks. */
export function startTimer(seconds: number): void {
  sessionStore.setState((state) =>
    state === null
      ? null
      : { ...state, timerEndsAt: Date.now() + seconds * 1000 },
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
