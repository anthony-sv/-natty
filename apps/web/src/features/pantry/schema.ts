import { z } from "zod";
import {
  foodCategorySchema,
  foodStateSchema,
  macrosSchema,
  mealItemSchema,
} from "@/data/diets";

/**
 * A food you added yourself.
 *
 * The fields are `foodSchema`'s, on purpose — `unit`, `macros` per 100 g/ml or
 * per unit, and the `state` flag — so a user food *is* a `Food` once its id is
 * attached, and every consumer reads it without knowing which half it came
 * from.
 *
 * **`state` is carried for the same reason the built-in table carries it.**
 * Raw and cooked are different foods and never a conversion: a gram of cooked
 * chicken holds a third more protein than a gram of raw. The badge on the row
 * is the most important word on it.
 */
export const userFoodSchema = z.object({
  /** `food:<uuid>` — no collision with a kebab-case built-in id. */
  id: z.string().startsWith("food:"),
  name: z.string().min(1),
  unit: z.enum(["g", "ml", "unit"]),
  /** Per 100 for `g`/`ml`, per one of the thing for `unit`. */
  macros: macrosSchema,
  state: foodStateSchema.optional(),
  /**
   * Groups the picker, and optional here for a reason the built-in table
   * doesn't have: nobody should be made to answer "what kind of food is this"
   * to write down a protein bar. Left blank, it groups by whichever macro
   * dominates instead.
   */
  category: foodCategorySchema.optional(),
  /** "~50g each", "1 scoop" — what a unit means in the real world. */
  unitNote: z.string().optional(),
  archivedAt: z.number().optional(),
  createdAt: z.number(),
});
export type UserFood = z.infer<typeof userFoodSchema>;
export type UserFoodInput = Omit<UserFood, "id" | "createdAt">;

/**
 * How a recipe was cooked.
 *
 * **Carries no macros.** It records how to cook the thing, which is half of
 * what a recipe is for. If a method adds fat, that fat is an ingredient row
 * with an amount you typed — an absorption factor per method would invent
 * exactly the precision `foodStateSchema` already refuses to invent, since how
 * much oil a food takes up varies enormously with heat, time and the food
 * itself.
 */
export const cookingMethodSchema = z.enum([
  "none",
  "steam",
  "boil",
  "grill",
  "bake",
  "pan-fry",
  "deep-fry",
  "air-fry",
  "slow-cook",
]);
export type CookingMethod = z.infer<typeof cookingMethodSchema>;

/** The methods where you'd normally add fat, so the form can offer a line. */
export const FAT_ADDING_METHODS: readonly CookingMethod[] = [
  "pan-fry",
  "deep-fry",
  "bake",
];

/**
 * How a finished recipe is measured out into a meal.
 *
 * The two honest answers, and the reason there are two: **a cooked dish weighs
 * less than its raw ingredients** — water leaves, and how much depends on the
 * method. So "200 g of my chili" cannot be derived from the ingredient list.
 *
 * - `servings` — you split the batch into N and eat whole ones. Nothing to weigh.
 * - `weight` — you weighed the finished dish once, and it can then be used per
 *   100 g like any other food.
 */
export const portioningSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("servings"),
    servings: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("weight"),
    /** Measured, never derived. */
    cookedGrams: z.number().positive(),
  }),
]);
export type Portioning = z.infer<typeof portioningSchema>;

/**
 * A recipe: ingredients, how it was cooked, and how it's portioned.
 *
 * `ingredients` reuses `mealItemSchema` verbatim, because an ingredient *is* a
 * meal item — a food id and an amount. That's what lets `recipeAsFood` be a
 * handful of lines rather than a parallel model.
 *
 * **No recipe inside a recipe in v1.** Ingredients resolve to foods only, which
 * makes cycles impossible without a cycle check. Worth having later — a base
 * sauce used in three dishes is a real thing — but it isn't free.
 */
export const recipeSchema = z.object({
  /** `recipe:<uuid>`. Usable anywhere a `foodId` is. */
  id: z.string().startsWith("recipe:"),
  name: z.string().min(1),
  ingredients: z.array(mealItemSchema).min(1),
  method: cookingMethodSchema.optional(),
  portioning: portioningSchema,
  notes: z.string().optional(),
  archivedAt: z.number().optional(),
  createdAt: z.number(),
});
export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeInput = Omit<Recipe, "id" | "createdAt">;
