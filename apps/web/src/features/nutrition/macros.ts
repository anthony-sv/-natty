import { getFood } from "@/data/diets";
import type {
  DietPlan,
  Food,
  Macros,
  MealItem,
  MealVariant,
  Weekday,
} from "@/data/diets";

/**
 * Macro arithmetic, kept free of React and of the plan data so it tests
 * directly — the same split `pr.ts` and `ffmi.ts` follow.
 */

/**
 * Atwater factors. Fat carries more than twice what the other two do, which is
 * the whole reason a "low fat" day and a "low carb" day of the same weight are
 * nowhere near the same number of calories.
 */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

/**
 * Fibre is a carbohydrate the body only partly gets at, so it's counted at
 * roughly half. It isn't a fourth macro — it's a share of the carbs already
 * counted — which is why nothing here adds it on top.
 */
export const KCAL_PER_GRAM_FIBRE = 2;

export const ZERO: Macros = { protein: 0, fat: 0, carbs: 0 };

export function kcalOf(macros: Macros): number {
  return (
    macros.protein * KCAL_PER_GRAM.protein +
    macros.carbs * KCAL_PER_GRAM.carbs +
    macros.fat * KCAL_PER_GRAM.fat
  );
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
    carbs: a.carbs + b.carbs,
  };
}

/**
 * What a given amount of a food carries.
 *
 * `unit` foods are counted whole — two eggs is twice one egg — while `g` and
 * `ml` foods carry their macros per 100, which is how every label prints them.
 */
export function macrosForAmount(food: Food, amount: number): Macros {
  const factor = food.unit === "unit" ? amount : amount / 100;
  return {
    protein: food.macros.protein * factor,
    fat: food.macros.fat * factor,
    carbs: food.macros.carbs * factor,
  };
}

export function macrosForItem(item: MealItem): Macros {
  return macrosForAmount(getFood(item.foodId), item.amount);
}

export function totalFor(items: MealItem[]): Macros {
  return items.reduce((total, item) => addMacros(total, macrosForItem(item)), ZERO);
}

/**
 * The variant of a meal that applies on a given day.
 *
 * A variant with no `days` applies to all of them, so it's the fallback when
 * nothing matches — a plan whose lunch only names office days still has to
 * render something on a Sunday.
 */
export function variantForDay(
  variants: MealVariant[],
  day: Weekday,
): MealVariant | undefined {
  return (
    variants.find((variant) => variant.days?.includes(day)) ??
    variants.find((variant) => variant.days === undefined)
  );
}

/** Which swap is selected for each meal, by meal name. */
export type SwapChoices = Record<string, number>;

/**
 * Every meal that applies on `day`, with the chosen option resolved.
 *
 * Returned rather than summed so the UI can render each meal and its total from
 * one pass, instead of walking the plan twice and risking two answers.
 */
export interface ResolvedMeal {
  name: string;
  note?: string;
  variant: MealVariant;
  optionIndex: number;
  items: MealItem[];
  macros: Macros;
  kcal: number;
}

export function resolveDay(
  plan: DietPlan,
  day: Weekday,
  choices: SwapChoices = {},
): ResolvedMeal[] {
  const resolved: ResolvedMeal[] = [];
  for (const meal of plan.meals) {
    const variant = variantForDay(meal.variants, day);
    if (variant === undefined) continue;
    // A choice made for a meal that later has fewer options shouldn't crash the
    // page; fall back to the first.
    const optionIndex = Math.min(
      choices[meal.name] ?? 0,
      variant.options.length - 1,
    );
    const items = variant.options[optionIndex]!.items;
    const macros = totalFor(items);
    resolved.push({
      name: meal.name,
      note: meal.note,
      variant,
      optionIndex,
      items,
      macros,
      kcal: kcalOf(macros),
    });
  }
  return resolved;
}

export function dayTotals(meals: ResolvedMeal[]): Macros {
  return meals.reduce((total, meal) => addMacros(total, meal.macros), ZERO);
}

/**
 * Each macro's share of the calories, not of the grams.
 *
 * Grams would make fat look like a third of what it is. Returns zeroes rather
 * than dividing by nothing when there's no food at all.
 */
export function percentSplit(macros: Macros): {
  protein: number;
  fat: number;
  carbs: number;
} {
  const total = kcalOf(macros);
  if (total <= 0) return { protein: 0, fat: 0, carbs: 0 };
  return {
    protein: (macros.protein * KCAL_PER_GRAM.protein * 100) / total,
    fat: (macros.fat * KCAL_PER_GRAM.fat * 100) / total,
    carbs: (macros.carbs * KCAL_PER_GRAM.carbs * 100) / total,
  };
}

/** Positive on a deficit, negative on a surplus. */
export function deficitPerDay(plan: DietPlan): number {
  return plan.tdeeKcal - plan.targetKcal;
}

/**
 * Roughly 7,700 kcal to a kilo of fat.
 *
 * A textbook figure that assumes the whole gap comes off as fat, which it
 * doesn't — early weeks lose water and the body quietly spends less as it
 * shrinks. Useful as a direction and a rough pace, not as a forecast, and the
 * page says so.
 */
export const KCAL_PER_KG_FAT = 7700;

export function weeklyRateKg(plan: DietPlan): number {
  return (deficitPerDay(plan) * 7) / KCAL_PER_KG_FAT;
}

/** Protein per kilo of body weight, the number that decides if a cut is safe. */
export function proteinPerKg(
  macros: Macros,
  bodyWeightKg: number | undefined,
): number | undefined {
  if (bodyWeightKg === undefined || bodyWeightKg <= 0) return undefined;
  return macros.protein / bodyWeightKg;
}

const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export function weekdays(): Weekday[] {
  return WEEKDAYS;
}

/** `Date.getDay()` is Sunday-first; the week here starts on Monday. */
export function weekdayOf(date: Date): Weekday {
  return WEEKDAYS[(date.getDay() + 6) % 7]!;
}
