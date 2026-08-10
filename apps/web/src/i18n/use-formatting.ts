import { useMemo } from "react";
import type { Formatting } from "@/features/routines/lib/format";
import { useNames } from "./names";
import { useT } from "./use-t";

/**
 * The `{ names, t }` pair the routine formatters take, bound to the active
 * locale.
 *
 * One hook rather than two at every call site, and memoised so the object
 * identity is stable — several of the consumers pass it into a `useMemo`
 * dependency list, where a fresh object each render would rebuild a day's
 * steps on every keystroke elsewhere on the page.
 */
export function useFormatting(): Formatting {
  const names = useNames();
  const t = useT();
  return useMemo(() => ({ names, t }), [names, t]);
}
