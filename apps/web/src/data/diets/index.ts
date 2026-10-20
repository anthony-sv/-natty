import type { DietPlan } from "./schema";
import { cutV5 } from "./cut-v5-2040";
import { cutV4 } from "./cut-v4-2252";
import { cutV6 } from "./cut-v6-2068";

/** Newest first — the plan you're on is the one you want to open. */
export const diets: DietPlan[] = [cutV6, cutV5, cutV4];

export function getDietBySlug(slug: string): DietPlan | undefined {
  return diets.find((diet) => diet.slug === slug);
}

export { foods, findFood, getFood } from "./foods";
export {
  dietPlanSchema,
  foodCategorySchema,
  foodSchema,
  foodStateSchema,
  macroTargetsSchema,
  macrosSchema,
  mealItemSchema,
  microsSchema,
  NUTRIENTS,
  NUTRIENT_UNITS,
} from "./schema";
export type { MacroTargets } from "./schema";
export type {
  DietPlan,
  Food,
  FoodCategory,
  FoodState,
  Macros,
  Meal,
  MealItem,
  MealOption,
  MealVariant,
  Micros,
  Nutrient,
  Supplement,
  Weekday,
} from "./schema";
