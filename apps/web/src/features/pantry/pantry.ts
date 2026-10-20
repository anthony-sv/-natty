import { foods as builtInFoods } from "@/data/diets";
import type { Food, Micros, Nutrient } from "@/data/diets";
import { addMacros, macrosForAmount, ZERO } from "@/features/nutrition/macros";
import type { FoodSource } from "@/features/nutrition/macros";
import type { Recipe, UserFood } from "./schema";

/**
 * Turning what you wrote into what the meal model already understands.
 *
 * Pure and taking rows as arguments, like `mergeLibrary` and `pr.ts` — no
 * collection, no React, so it tests directly.
 */

/** A user food is a `Food` already; this only drops the fields it adds. */
export function userFoodAsFood(food: UserFood): Food {
  return {
    id: food.id,
    name: food.name,
    unit: food.unit,
    macros: food.macros,
    state: food.state,
    unitNote: food.unitNote,
  };
}

/** What a recipe's ingredients come to in total, before portioning. */
export function recipeTotal(recipe: Recipe, source: FoodSource) {
  return recipe.ingredients.reduce((total, item) => {
    const food = source.get(item.foodId);
    // Zero rather than a throw, so one deleted ingredient doesn't take the
    // whole recipe — and the row it came from still shows what's missing.
    return food === undefined
      ? total
      : addMacros(total, macrosForAmount(food, item.amount));
  }, ZERO);
}

/**
 * A recipe, as a `Food`.
 *
 * **This is the whole design.** `MealItem` is `{ foodId, amount }`, so if a
 * recipe resolves to a `Food` then a recipe id in `foodId` renders, sums and
 * swaps exactly like an ingredient does — and nothing in the meal, variant or
 * option model had to change to hold one.
 *
 * The two portionings are the two honest ways to answer "how much of it did I
 * eat", and which one you get decides the unit:
 *
 * - **servings** → a `unit` food. One "unit" is one serving, so `amount: 1` is
 *   a portion. Nothing needs weighing.
 * - **weight** → a `g` food carrying macros per 100 g of the *finished* dish.
 *   That's what makes `250 g` of it meaningful — and it's only possible because
 *   the cooked weight was measured. It cannot be derived: water leaves during
 *   cooking, and how much depends on the method.
 *
 * `source` must resolve the ingredients, so it's the built-ins plus your foods
 * — but **not** other recipes. Nesting is out in v1 (see `recipeSchema`).
 */
export function recipeAsFood(recipe: Recipe, source: FoodSource): Food {
  const total = recipeTotal(recipe, source);
  const micros = recipeMicros(recipe, source);

  // Every figure a recipe carries is the batch divided the same way — per
  // serving, or per 100 g of the finished dish.
  const divisor =
    recipe.portioning.kind === "servings"
      ? recipe.portioning.servings
      : recipe.portioning.cookedGrams / 100;
  const scaled = {
    macros: {
      protein: total.protein / divisor,
      fat: total.fat / divisor,
      carbs: total.carbs / divisor,
      ...(total.fiber === undefined ? {} : { fiber: total.fiber / divisor }),
    },
    ...(micros === undefined
      ? {}
      : {
          micros: Object.fromEntries(
            Object.entries(micros).map(([key, value]) => [key, value / divisor]),
          ),
        }),
  };

  if (recipe.portioning.kind === "servings") {
    return { id: recipe.id, name: recipe.name, unit: "unit", ...scaled };
  }

  return {
    id: recipe.id,
    name: recipe.name,
    // Per 100 g, which is how `macrosForAmount` reads a `g` food and how every
    // label prints one.
    unit: "g",
    ...scaled,
    // A finished dish is cooked by definition, and the badge is worth having:
    // it says you weigh this after cooking, not before.
    state: "cooked",
  };
}

/**
 * The batch's micronutrients, from whichever ingredients carry any.
 *
 * Undefined when none do — a recipe made only of your own foods has no data,
 * and saying so is better than a row of zeroes. A mix counts the part that's
 * known; the scores' coverage figure is per *food*, so such a recipe counts as
 * covered, which is the one place this is generous.
 */
function recipeMicros(recipe: Recipe, source: FoodSource): Micros | undefined {
  let total: Partial<Record<Nutrient, number>> | undefined;
  for (const item of recipe.ingredients) {
    const food = source.get(item.foodId);
    if (food?.micros === undefined) continue;
    total ??= {};
    const factor = food.unit === "unit" ? item.amount : item.amount / 100;
    for (const [key, value] of Object.entries(food.micros) as [Nutrient, number][]) {
      total[key] = (total[key] ?? 0) + value * factor;
    }
  }
  return total;
}

export interface PantryEntry {
  food: Food;
  kind: "built-in" | "food" | "recipe";
  isArchived: boolean;
}

export interface Pantry extends FoodSource {
  /** Everything, archived included — this is what *resolves* an id. */
  all: PantryEntry[];
  /** What a picker offers. */
  selectable: PantryEntry[];
  /** Built-ins plus your foods, with no recipes — what a recipe's own
   *  ingredients resolve against, since recipes can't nest. */
  ingredientSource: FoodSource;
}

/**
 * The built-ins, your foods and your recipes as one lookup.
 *
 * Recipes resolve *last* and against a source that excludes them, which is
 * both how nesting is prevented and why the order here matters.
 */
export function mergePantry(
  userRows: UserFood[],
  recipeRows: Recipe[],
): Pantry {
  // Two maps rather than one, and it has to be two: a single map that recipes
  // were added to would be the same object the ingredient source closes over,
  // so a recipe listed as an ingredient would resolve after all and nesting
  // would be back — silently, and only for recipes written earlier in the list.
  const ingredientById = new Map<string, PantryEntry>();

  for (const food of builtInFoods) {
    ingredientById.set(food.id, { food, kind: "built-in", isArchived: false });
  }
  for (const row of userRows) {
    ingredientById.set(row.id, {
      food: userFoodAsFood(row),
      kind: "food",
      isArchived: row.archivedAt !== undefined,
    });
  }

  const ingredientSource: FoodSource = {
    get: (id) => ingredientById.get(id)?.food,
  };

  const byId = new Map(ingredientById);
  for (const recipe of recipeRows) {
    byId.set(recipe.id, {
      food: recipeAsFood(recipe, ingredientSource),
      kind: "recipe",
      isArchived: recipe.archivedAt !== undefined,
    });
  }

  const all = [...byId.values()];

  return {
    all,
    selectable: all.filter((entry) => !entry.isArchived),
    get: (id) => byId.get(id)?.food,
    ingredientSource,
  };
}
