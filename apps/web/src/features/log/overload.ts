import type { WeightUnit } from "@/lib/units";
import type { LoggedSet } from "./schema";

/**
 * Double progression: add reps each session until the top of the prescribed
 * rep range, then add weight and drop back toward the bottom of it. The same
 * rule for a machine and a free weight — there's no equipment-specific case
 * here on purpose, see the plan this shipped against.
 *
 * Pure and injected, like `pr.ts` — no React, no collection.
 */

/**
 * The smallest plate either system adds. A flat constant rather than a
 * percentage: nobody loads a barbell in percent, and 2.5kg/5lb is what's
 * actually sitting on the rack.
 */
const WEIGHT_INCREMENT: Record<WeightUnit, number> = { kg: 2.5, lb: 5 };

export interface OverloadSuggestion {
  weight?: number;
  unit: WeightUnit;
  reps: number;
}

/**
 * What to try next, given the exercise's rep range and your last set.
 *
 * No suggestion without both a target range and a last set — this app
 * doesn't invent a number to fill a gap it can't actually reason about.
 */
export function suggestOverload(
  targetReps: number | [number, number] | undefined,
  last: LoggedSet | undefined,
): OverloadSuggestion | undefined {
  if (last === undefined || targetReps === undefined) return undefined;
  const [min, max] = Array.isArray(targetReps)
    ? targetReps
    : [targetReps, targetReps];

  // Hit or passed the top of the range: go heavier next time, back to the
  // bottom of the range — a fresh ramp at the new weight.
  if (last.reps >= max) {
    return {
      weight:
        last.weight === undefined
          ? undefined
          : last.weight + WEIGHT_INCREMENT[last.unit],
      unit: last.unit,
      reps: min,
    };
  }

  // Otherwise: same weight, one more rep than last time, capped at the top
  // of the range.
  return {
    weight: last.weight,
    unit: last.unit,
    reps: Math.min(last.reps + 1, max),
  };
}

/** Same shape `formatSet` prints a logged set in — "62.5kg × 8" or "× 8". */
export function formatOverload(suggestion: OverloadSuggestion): string {
  return suggestion.weight === undefined
    ? `× ${suggestion.reps}`
    : `${suggestion.weight}${suggestion.unit} × ${suggestion.reps}`;
}
