import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { habitLogsFork, habitsFork } from "./collection";
import type { Habit, HabitLog } from "./schema";

/**
 * Every habit and every day's log, for display.
 *
 * Whole rather than filtered by day, like `useIntake`: the page moves between
 * days and the history needs months at once. **For display only** — event
 * handlers read `allHabitLogs()`. Both collections are in their dep arrays
 * because they fork on the session.
 */
export function useHabits(): {
  habits: Habit[];
  logs: HabitLog[];
  isLoading: boolean;
} {
  const habitCollection = habitsFork.useActive();
  const logCollection = habitLogsFork.useActive();
  const { data: habits, isLoading: habitsLoading } = useLiveQuery(
    (q) => q.from({ h: habitCollection }),
    [habitCollection],
  );
  const { data: logs, isLoading: logsLoading } = useLiveQuery(
    (q) => q.from({ l: logCollection }),
    [logCollection],
  );
  return useMemo(
    () => ({
      habits: habits ?? [],
      logs: logs ?? [],
      isLoading: habitsLoading || logsLoading,
    }),
    [habits, logs, habitsLoading, logsLoading],
  );
}
