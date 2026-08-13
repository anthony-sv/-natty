import { useCallback, useSyncExternalStore } from "react";

/**
 * A shared 250ms clock, modelled as an external store.
 *
 * The wall clock is exactly what `useSyncExternalStore` is for: it's mutable
 * state living outside React. Reading it via a cached snapshot keeps render
 * pure (no `Date.now()` mid-render) and means every countdown on screen shares
 * one interval instead of each running its own.
 */
let clockNow = Date.now();
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function tick() {
  clockNow = Date.now();
  for (const listener of listeners) listener();
}

function subscribeToClock(onChange: () => void): () => void {
  listeners.add(onChange);
  if (intervalId === null) {
    intervalId = setInterval(tick, 250);
    // A backgrounded tab may not tick; resync the moment it comes back.
    document.addEventListener("visibilitychange", tick);
  }
  // Refresh immediately — the cached value may be stale if the clock has been
  // idle. React re-reads the snapshot right after subscribing, so this lands
  // in the same commit rather than showing a stale frame.
  tick();

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      document.removeEventListener("visibilitychange", tick);
    }
  };
}

function getClockNow(): number {
  return clockNow;
}

const noopSubscribe = () => () => {};

/**
 * The shared clock, or a frozen substitute for it.
 *
 * `frozenAt` is how a pause works everywhere downstream: nothing tracks a
 * separate "remaining while paused", it just stops asking what time it is. It
 * also stops the interval, since a paused card has nothing to redraw.
 */
export function useNow(active: boolean, frozenAt: number | null = null): number {
  const live = active && frozenAt === null;
  const subscribe = useCallback(
    (onChange: () => void) =>
      live ? subscribeToClock(onChange) : noopSubscribe(),
    [live],
  );

  const now = useSyncExternalStore(subscribe, getClockNow);
  return frozenAt ?? now;
}

/** Where a countdown is: not started, counting you in, running, or done. */
export type TimerPhase = "idle" | "lead" | "running" | "complete";

export interface TimerState {
  phase: TimerPhase;
  /** Until the run proper begins. Zero outside the lead-in. */
  leadRemainingMs: number;
  /** Until the run ends. Zero before it starts and once it's over. */
  remainingMs: number;
  /** Since the run began — what a sequence reads its current part off. */
  elapsedMs: number;
  isPaused: boolean;
}

/**
 * A step's countdown, resolved from the one stored deadline.
 *
 * Derived as `endsAt - now` on every tick rather than decremented, so interval
 * drift and background-tab throttling can't desync it — a tab throttled for
 * two minutes reports the correct (smaller) remainder on its next tick, and a
 * deadline that passed while the phone was locked comes back already at zero.
 *
 * The lead-in falls out of the same subtraction: the run begins at
 * `endsAt - totalSeconds`, so a deadline set further out than the step is long
 * *is* a countdown that hasn't started yet. Nothing extra is stored, and a
 * lead-in interrupted by a locked phone resolves like everything else here.
 */
export function useTimerState(
  session: { timerEndsAt: number | null; pausedAt: number | null },
  totalSeconds: number,
): TimerState {
  const { timerEndsAt, pausedAt } = session;
  const now = useNow(timerEndsAt !== null, pausedAt);

  if (timerEndsAt === null) {
    return {
      phase: "idle",
      leadRemainingMs: 0,
      remainingMs: totalSeconds * 1000,
      elapsedMs: 0,
      isPaused: false,
    };
  }

  const startsAt = timerEndsAt - totalSeconds * 1000;
  const isPaused = pausedAt !== null;

  if (now < startsAt) {
    return {
      phase: "lead",
      leadRemainingMs: startsAt - now,
      remainingMs: totalSeconds * 1000,
      elapsedMs: 0,
      isPaused,
    };
  }

  const remainingMs = Math.max(0, timerEndsAt - now);
  return {
    phase: remainingMs <= 0 ? "complete" : "running",
    leadRemainingMs: 0,
    remainingMs,
    elapsedMs: now - startsAt,
    isPaused,
  };
}

/**
 * Time since an absolute moment — how long a workout has been running.
 *
 * Shares the same clock as every countdown rather than starting a second
 * interval, and is derived from the timestamp the same way, so locking the
 * phone for ten minutes reports ten more minutes rather than losing them.
 */
export function useElapsed(since: number | null): number {
  const subscribe = useCallback(
    (onChange: () => void) =>
      since === null ? noopSubscribe() : subscribeToClock(onChange),
    [since],
  );

  const now = useSyncExternalStore(subscribe, getClockNow);
  return since === null ? 0 : Math.max(0, now - since);
}
