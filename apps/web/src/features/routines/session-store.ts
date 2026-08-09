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
  }));
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
