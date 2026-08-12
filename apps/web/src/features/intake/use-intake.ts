import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { intakeEntries } from "./collection";
import type { IntakeEntry } from "./schema";

/**
 * Every intake entry, for display.
 *
 * Whole rather than filtered to a day: `resolveIntake` filters, the panel walks
 * back and forward through days, and the collection holds one small row per
 * meal — a live query per day would re-warm on every arrow press.
 *
 * **For display only**, like `useExerciseLog`. Event handlers read
 * `allIntake()` instead.
 */
export function useIntake(): { entries: IntakeEntry[]; isLoading: boolean } {
  const { data, isLoading } = useLiveQuery((q) => q.from({ e: intakeEntries }));
  return useMemo(() => ({ entries: data ?? [], isLoading }), [data, isLoading]);
}
