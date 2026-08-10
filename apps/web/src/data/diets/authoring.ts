import { getFood } from "./foods";
import type { MealItem, MealOption, MealVariant, Weekday } from "./schema";

/**
 * Shorthands for writing a plan out, in the spirit of
 * `data/routines/authoring.ts`.
 *
 * Every one of them resolves its food id through `getFood`, so a typo throws at
 * import time rather than rendering a row with no macros.
 */

/** One line of a meal: `item("avocado", 120, "flesh only")`. */
export function item(foodId: string, amount: number, note?: string): MealItem {
  getFood(foodId);
  return note === undefined ? { foodId, amount } : { foodId, amount, note };
}

/** A meal that's the same every day. */
export function everyDay(...items: MealItem[]): MealVariant {
  return { options: [{ items }] };
}

/** A meal that only applies on some days: `onDays("Office days", ["tue"], …)`. */
export function onDays(
  label: string,
  days: Weekday[],
  ...options: MealOption[]
): MealVariant {
  return { label, days, options };
}

/** One of the interchangeable versions of a meal — a protein swap. */
export function swap(label: string, ...items: MealItem[]): MealOption {
  return { label, items };
}

export const OFFICE_DAYS: Weekday[] = ["tue", "wed", "thu"];
export const HOME_DAYS: Weekday[] = ["mon", "fri", "sat", "sun"];
