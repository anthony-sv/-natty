import {
  ZERO,
  addMacros,
  compareToTargets,
  kcalOf,
  macrosForAmount,
  totalFor,
  variantForDay,
  weekdayOf,
  type FoodSource,
  type TargetGap,
} from "@/features/nutrition/macros";
import type { DietPlan, Food, Macros, MealItem } from "@/data/diets";
import type { IntakeEntry } from "./schema";

/**
 * What a day's intake adds up to.
 *
 * Pure and injected — the plan and a `FoodSource` come in, nothing is imported
 * from a collection or from React. The same split `pr.ts`, `volume.ts` and
 * `macros.ts` follow, and the reason this can be tested against a plan the app
 * doesn't ship.
 */

/** A plan meal you ticked off, resolved through the plan as it stands now. */
export interface IntakeMeal {
  entryId: string;
  name: string;
  optionIndex: number;
  items: MealItem[];
  macros: Macros;
  kcal: number;
  /**
   * The plan no longer has a meal by this name, or no longer applies one on
   * this weekday.
   *
   * Kept in the list rather than dropped: the row is the only evidence you
   * logged anything, and silently losing it would read as the app forgetting.
   * It contributes zero, because there's nothing left to resolve.
   */
  isOrphaned: boolean;
}

/** Anything off-plan. Frozen as typed, unlike a meal. */
export interface IntakeExtra {
  entryId: string;
  foodId: string;
  amount: number;
  /** Undefined for a food since deleted — the row still shows, at zero. */
  food: Food | undefined;
  macros: Macros;
  kcal: number;
}

export interface ResolvedIntake {
  meals: IntakeMeal[];
  extras: IntakeExtra[];
  totals: Macros;
  kcal: number;
  /**
   * Reuses `compareToTargets`, so what "off target" means here cannot disagree
   * with what it means in the builder's save dialog.
   */
  vsTargets: TargetGap[];
}

/** Just the entries filed under one local day, in the order they were logged. */
export function entriesForDay(
  entries: IntakeEntry[],
  day: number,
): IntakeEntry[] {
  return entries
    .filter((entry) => entry.day === day)
    .sort((a, b) => a.loggedAt - b.loggedAt);
}

/**
 * Which of the plan's meals a `meal` entry points at, on the weekday `day`
 * falls on.
 *
 * The weekday matters: a plan whose lunch has an office-days variant resolves
 * to different items on a Saturday, and the entry deliberately doesn't record
 * which variant it was — the plan decides that, the same way the plan page does.
 */
function itemsForMealEntry(
  plan: DietPlan,
  mealName: string,
  optionIndex: number,
  day: number,
): MealItem[] | undefined {
  const meal = plan.meals.find((candidate) => candidate.name === mealName);
  if (meal === undefined) return undefined;
  const variant = variantForDay(meal.variants, weekdayOf(new Date(day)));
  if (variant === undefined) return undefined;
  // A swap that no longer exists falls back to the first option rather than
  // orphaning the row — the meal is still the meal, you just picked one that
  // has since been edited away.
  const option = variant.options[optionIndex] ?? variant.options[0];
  return option?.items;
}

/**
 * A day's intake: ticked meals, free items, and the totals against the plan.
 *
 * `entries` may hold every day ever logged — it filters. Entries pointing at a
 * *different* plan are ignored, which is what makes switching plans mid-week
 * behave: the Tuesday you logged against the cut isn't counted into the bulk.
 */
export function resolveIntake(
  entries: IntakeEntry[],
  plan: DietPlan,
  foods: FoodSource,
  day: number,
): ResolvedIntake {
  const meals: IntakeMeal[] = [];
  const extras: IntakeExtra[] = [];

  for (const entry of entriesForDay(entries, day)) {
    if (entry.source.kind === "meal") {
      if (entry.source.planSlug !== plan.slug) continue;
      const items = itemsForMealEntry(
        plan,
        entry.source.mealName,
        entry.source.optionIndex,
        day,
      );
      const resolved = items ?? [];
      const macros = totalFor(resolved, foods);
      meals.push({
        entryId: entry.id,
        name: entry.source.mealName,
        optionIndex: entry.source.optionIndex,
        items: resolved,
        macros,
        kcal: kcalOf(macros),
        isOrphaned: items === undefined,
      });
    } else {
      const food = foods.get(entry.source.foodId);
      const macros =
        food === undefined ? ZERO : macrosForAmount(food, entry.source.amount);
      extras.push({
        entryId: entry.id,
        foodId: entry.source.foodId,
        amount: entry.source.amount,
        food,
        macros,
        kcal: kcalOf(macros),
      });
    }
  }

  const totals = [...meals, ...extras].reduce(
    (total, row) => addMacros(total, row.macros),
    ZERO,
  );

  return {
    meals,
    extras,
    totals,
    kcal: kcalOf(totals),
    vsTargets: compareToTargets(totals, plan.targets),
  };
}

/**
 * Which of the plan's meals are already ticked, by name.
 *
 * A set rather than a count: the checklist asks "is this one done", and a meal
 * logged twice is still one ticked row. Logging the same meal twice is a
 * mistake with no meaning — unlike a set, where a second entry on one step is
 * how a drop set gets recorded — so the panel toggles instead of appending.
 */
export function tickedMeals(
  entries: IntakeEntry[],
  planSlug: string,
  day: number,
): Map<string, { entryId: string; optionIndex: number }> {
  const ticked = new Map<string, { entryId: string; optionIndex: number }>();
  for (const entry of entriesForDay(entries, day)) {
    if (entry.source.kind !== "meal") continue;
    if (entry.source.planSlug !== planSlug) continue;
    ticked.set(entry.source.mealName, {
      entryId: entry.id,
      optionIndex: entry.source.optionIndex,
    });
  }
  return ticked;
}
