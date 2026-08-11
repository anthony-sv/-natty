import type { DietPlan } from "./schema";
import { cutV5 } from "./cut-v5-2040";
import { cutV4 } from "./cut-v4-2252";

/** Newest first — the plan you're on is the one you want to open. */
export const diets: DietPlan[] = [cutV5, cutV4];

export function getDietBySlug(slug: string): DietPlan | undefined {
  return diets.find((diet) => diet.slug === slug);
}

export { foods, findFood, getFood } from "./foods";
export {
  dietPlanSchema,
  foodSchema,
  foodStateSchema,
  macrosSchema,
  mealItemSchema,
} from "./schema";
export { hydration } from "./hydration";
export type {
  DietPlan,
  Food,
  FoodState,
  Hydration,
  HydrationOption,
  Macros,
  Meal,
  MealItem,
  MealOption,
  MealVariant,
  Supplement,
  Weekday,
} from "./schema";
