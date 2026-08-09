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
 * Remaining time until an absolute deadline.
 *
 * Derived as `endsAt - now` on every tick rather than decremented, so interval
 * drift and background-tab throttling can't desync it — a tab throttled for
 * two minutes reports the correct (smaller) remainder on its next tick, and a
 * deadline that passed while the phone was locked comes back already at zero.
 */
export function useCountdown(endsAt: number | null): {
  remainingMs: number;
  isComplete: boolean;
} {
  // No deadline, no ticking — the shared interval stops when the last
  // countdown unsubscribes.
  const subscribe = useCallback(
    (onChange: () => void) =>
      endsAt === null ? noopSubscribe() : subscribeToClock(onChange),
    [endsAt],
  );

  const now = useSyncExternalStore(subscribe, getClockNow);
  const remainingMs = endsAt === null ? 0 : Math.max(0, endsAt - now);

  return { remainingMs, isComplete: endsAt !== null && remainingMs <= 0 };
}
