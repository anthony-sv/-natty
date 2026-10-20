import { Store } from "@tanstack/store";

const STORAGE_KEY = "natty.habit-timer.v1";

/**
 * The one running habit timer, if any — "read 15 minutes" with a clock on it.
 *
 * A start time, not a count of elapsed seconds: the elapsed figure is
 * `now - startedAt`, so a locked phone or a reload loses nothing, the same
 * reason the player stores a deadline. Per-device scratch state like the
 * workout session — a timer you started on your phone isn't running on your
 * laptop — so it's a plain Store, not a synced collection.
 */
export interface HabitTimer {
  habitId: string;
  /** The day the minutes will be credited to — the one it was started on. */
  day: number;
  startedAt: number;
}

function load(): HabitTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<HabitTimer>;
    if (
      typeof parsed.habitId === "string" &&
      typeof parsed.day === "number" &&
      typeof parsed.startedAt === "number"
    ) {
      return parsed as HabitTimer;
    }
  } catch {
    // Private mode or a mangled value: no timer is the honest answer.
  }
  return null;
}

export const habitTimerStore = new Store<HabitTimer | null>(
  typeof localStorage === "undefined" ? null : load(),
);

habitTimerStore.subscribe(() => {
  try {
    const state = habitTimerStore.state;
    if (state === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked — the timer still runs for this page's lifetime.
  }
});

export function startHabitTimer(habitId: string, day: number, now: number) {
  habitTimerStore.setState(() => ({ habitId, day, startedAt: now }));
}

/** Stops the clock and says how many whole minutes it ran, rounded. */
export function stopHabitTimer(now: number): { timer: HabitTimer; minutes: number } | null {
  const timer = habitTimerStore.state;
  if (timer === null) return null;
  habitTimerStore.setState(() => null);
  return { timer, minutes: Math.round((now - timer.startedAt) / 60_000) };
}

export function cancelHabitTimer() {
  habitTimerStore.setState(() => null);
}
