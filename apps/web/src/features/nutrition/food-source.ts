import { foods } from "@/data/diets";
import type { Food } from "@/data/diets";
import type { FoodSource } from "./macros";

/**
 * The compiled-in foods, as the shape `macros.ts` takes.
 *
 * Built once at module scope: it reads nothing but the transcribed table, so
 * there is no reason to rebuild it per render, and `resolveDay` ends up in a
 * `useMemo` dependency list where a fresh object would defeat the memo.
 *
 * This is the whole `FoodSource` until the pantry lands; after that it's the
 * built-in half of a merge, the way `BUILT_IN` is in `features/library`.
 */
const byId = new Map<string, Food>(foods.map((food) => [food.id, food]));

export const BUILT_IN_FOODS: FoodSource = {
  get: (foodId) => byId.get(foodId),
};
