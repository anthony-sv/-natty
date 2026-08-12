import { foodSchema, type Food } from "./schema";

/**
 * Every food the plans reference, with its macros per 100 g/ml or per unit.
 *
 * ## Where these numbers come from
 *
 * All of them are **derived from the source docs' own item tables**, not looked
 * up elsewhere: dividing a stated row (343 g chicken → P78.9 F5.1 C0) by its
 * amount gives the per-100g value, and the two most detailed plan versions
 * agree with each other where they overlap. That agreement is why this table is
 * trustworthy enough to compute from.
 *
 * The four swap proteins are the exception. The docs give their weights and the
 * resulting day total but never their macros, so those were solved for: take
 * the day's target, subtract everything else in the meal, and divide by the
 * stated weight. Each one reconciles across *two* independent plan versions to
 * within a couple of kcal, which is a stronger check than a lookup table would
 * have been. `diets.test.ts` pins the result.
 *
 * ## Raw and cooked are different foods
 *
 * Not a flag on one entry — a gram of cooked chicken holds a third more protein
 * than a gram of raw, because the water left. Anything the docs weigh both ways
 * gets two entries.
 */
const RAW: Food[] = [
  // — Breakfast ————————————————————————————————————————————————
  {
    id: "whole-egg",
    name: "Whole eggs",
    unit: "unit",
    unitNote: "~50g each",
    macros: { protein: 6, fat: 5, carbs: 0.5 },
  },
  {
    id: "liquid-egg-whites",
    name: "Liquid egg whites",
    unit: "ml",
    macros: { protein: 10.79, fat: 0.08, carbs: 0.71 },
  },
  {
    id: "bacon",
    name: "Bacon",
    unit: "unit",
    unitNote: "1 strip, ~15g",
    macros: { protein: 3, fat: 4.5, carbs: 0 },
  },
  {
    id: "manchego-low-fat",
    name: "Low-fat manchego",
    unit: "g",
    macros: { protein: 28, fat: 22, carbs: 15 },
  },
  {
    id: "protein-flour",
    name: "Protein flour",
    unit: "g",
    state: "raw",
    macros: { protein: 26, fat: 4, carbs: 51 },
  },

  // — Lunch ————————————————————————————————————————————————————
  {
    id: "chicken-breast-cooked",
    name: "Chicken breast",
    unit: "g",
    state: "cooked",
    macros: { protein: 31, fat: 3.6, carbs: 0 },
  },
  {
    id: "chicken-breast-raw",
    name: "Chicken breast",
    unit: "g",
    state: "raw",
    macros: { protein: 23, fat: 1.5, carbs: 0 },
  },
  {
    id: "carne-asada-raw",
    name: "Carne asada",
    unit: "g",
    state: "raw",
    macros: { protein: 21.8, fat: 5, carbs: 0 },
  },
  {
    id: "pork-loin-raw",
    name: "Pork loin",
    unit: "g",
    state: "raw",
    macros: { protein: 21, fat: 3.5, carbs: 0 },
  },
  {
    id: "turkey-breast-raw",
    name: "Turkey breast",
    unit: "g",
    state: "raw",
    macros: { protein: 24.1, fat: 1.05, carbs: 0 },
  },
  {
    id: "white-rice-cooked",
    name: "White rice",
    unit: "g",
    state: "cooked",
    macros: { protein: 2.75, fat: 0.25, carbs: 28 },
  },
  {
    id: "corn-tortilla",
    name: "Corn tortillas",
    unit: "unit",
    unitNote: "~30g each",
    macros: { protein: 1.5, fat: 0.7, carbs: 12 },
  },
  {
    id: "avocado",
    name: "Avocado",
    unit: "g",
    macros: { protein: 2, fat: 15, carbs: 9 },
  },

  // — Dinner ———————————————————————————————————————————————————
  {
    id: "whey-protein",
    name: "Whey protein",
    unit: "unit",
    unitNote: "1 scoop, 31g",
    macros: { protein: 24, fat: 1.5, carbs: 4 },
  },
  {
    id: "high-protein-milk",
    name: "High-protein milk",
    unit: "ml",
    macros: { protein: 5.4, fat: 0.5, carbs: 5.1 },
  },
  {
    id: "greek-yogurt",
    name: "Greek yogurt",
    unit: "ml",
    macros: { protein: 10.1, fat: 1.7, carbs: 8.3 },
  },
  {
    id: "peanut-butter",
    name: "Peanut butter",
    unit: "g",
    macros: { protein: 24, fat: 49, carbs: 13 },
  },
  {
    id: "white-bread",
    name: "White bread",
    unit: "g",
    unitNote: "~31.5g a slice",
    macros: { protein: 8.57, fat: 2.54, carbs: 50.63 },
  },
];

export const foods: Food[] = RAW.map((food) => foodSchema.parse(food));

const byId = new Map(foods.map((food) => [food.id, food]));

/** A built-in food by id, or undefined. For anywhere a miss isn't fatal. */
export function findFood(id: string): Food | undefined {
  return byId.get(id);
}

/**
 * A food by id, or a throw.
 *
 * Same reasoning as `idFor` in the routines authoring helpers: a typo should
 * fail at import rather than render a blank row or silently drop macros out of
 * a day total.
 *
 * **Authoring only.** At runtime a food id can legitimately be one you wrote
 * yourself, which this table has never heard of — use `findFood`, or the
 * injected `FoodSource` in `features/nutrition/macros.ts`.
 */
export function getFood(id: string): Food {
  const food = byId.get(id);
  if (!food) {
    throw new Error(
      `Unknown food "${id}" — add it to src/data/diets/foods.ts.`,
    );
  }
  return food;
}
