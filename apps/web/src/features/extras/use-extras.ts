import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { extrasFork } from "./collection";
import type { ExtraWork } from "./schema";

/**
 * Every extra ever logged, for display.
 *
 * Whole rather than filtered to a day, like `useIntake`: `composeDay`
 * filters, and the day page, the player and the Today card all move
 * between days — a live query per day would re-warm every time.
 *
 * **For display only.** Event handlers read `allExtras()` instead, the
 * same rule `setsFor` exists for.
 */
export function useExtras(): { extras: ExtraWork[]; isLoading: boolean } {
  const collection = extrasFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ e: collection }),
    [collection],
  );
  return useMemo(() => ({ extras: data ?? [], isLoading }), [data, isLoading]);
}
