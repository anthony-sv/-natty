import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { supplementsFork } from "./collection";
import type { Supplement } from "./schema";

/**
 * The whole stack, for display.
 *
 * **For display only**, like `useIntake` and `useExerciseLog`: event handlers
 * read `allSupplements()`, because a `useLiveQuery` snapshot is whatever the
 * last render saw.
 *
 * The collection is in the dep array because it *forks* on the session — a
 * query built against the signed-out backing keeps reading it, and signing in
 * appears to do nothing.
 */
export function useSupplements(): {
  supplements: Supplement[];
  isLoading: boolean;
} {
  const collection = supplementsFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ s: collection }),
    [collection],
  );
  return useMemo(
    () => ({ supplements: data ?? [], isLoading }),
    [data, isLoading],
  );
}
