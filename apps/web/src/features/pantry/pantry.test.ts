import { describe, expect, it } from "vitest";
import { getFood } from "@/data/diets";
import { kcalOf, macrosForAmount, macrosForItem } from "@/features/nutrition/macros";
import { mergePantry, recipeAsFood, recipeTotal } from "./pantry";
import type { Recipe, UserFood } from "./schema";

/**
 * The claim these exist to check is that a recipe resolves to a `Food` — which
 * is what lets a recipe id sit in a `MealItem.foodId` and be summed by the same
 * code that sums an ingredient.
 */

const yogurt: UserFood = {
  id: "food:yogurt",
  name: "Greek yogurt",
  unit: "g",
  macros: { protein: 10, fat: 0.4, carbs: 3.6 },
  createdAt: 0,
};

const butter: UserFood = {
  id: "food:butter",
  name: "Butter",
  unit: "g",
  macros: { protein: 0.9, fat: 81, carbs: 0.1 },
  createdAt: 0,
};

/** 600 g raw chicken + 15 g butter, pan-fried down to 480 g. */
function chicken(portioning: Recipe["portioning"]): Recipe {
  return {
    id: "recipe:chicken",
    name: "Pan-fried chicken",
    method: "pan-fry",
    ingredients: [
      { foodId: "chicken-breast-raw", amount: 600 },
      { foodId: "food:butter", amount: 15 },
    ],
    portioning,
    createdAt: 0,
  };
}

const PANTRY = mergePantry([yogurt, butter], []);

describe("recipeTotal", () => {
  it("sums its ingredients", () => {
    const recipe = chicken({ kind: "servings", servings: 4 });
    const expected = {
      protein:
        macrosForAmount(getFood("chicken-breast-raw"), 600).protein +
        macrosForAmount({ ...butter, id: butter.id }, 15).protein,
      fat:
        macrosForAmount(getFood("chicken-breast-raw"), 600).fat +
        macrosForAmount({ ...butter, id: butter.id }, 15).fat,
      carbs:
        macrosForAmount(getFood("chicken-breast-raw"), 600).carbs +
        macrosForAmount({ ...butter, id: butter.id }, 15).carbs,
    };
    expect(recipeTotal(recipe, PANTRY)).toEqual(expected);
  });

  it("resolves an ingredient that is a food you wrote", () => {
    // 15 g of butter at 81 g fat per 100.
    const recipe = chicken({ kind: "servings", servings: 1 });
    expect(recipeTotal(recipe, PANTRY).fat).toBeCloseTo(
      macrosForAmount(getFood("chicken-breast-raw"), 600).fat + 12.15,
      5,
    );
  });

  it("skips an ingredient nothing resolves rather than throwing", () => {
    const recipe: Recipe = {
      ...chicken({ kind: "servings", servings: 1 }),
      ingredients: [
        { foodId: "food:deleted", amount: 500 },
        { foodId: "food:butter", amount: 100 },
      ],
    };
    expect(() => recipeTotal(recipe, PANTRY)).not.toThrow();
    expect(recipeTotal(recipe, PANTRY)).toEqual(butter.macros);
  });
});

describe("recipeAsFood", () => {
  it("is a per-unit food when portioned by servings", () => {
    const recipe = chicken({ kind: "servings", servings: 4 });
    const food = recipeAsFood(recipe, PANTRY);
    const total = recipeTotal(recipe, PANTRY);

    expect(food.unit).toBe("unit");
    expect(food.macros.protein).toBeCloseTo(total.protein / 4, 6);
    // `amount: 1` is one serving, which is the point of the unit choice.
    expect(macrosForAmount(food, 1).protein).toBeCloseTo(total.protein / 4, 6);
    expect(macrosForAmount(food, 2).protein).toBeCloseTo(total.protein / 2, 6);
  });

  it("is a per-100g food when portioned by cooked weight", () => {
    const recipe = chicken({ kind: "weight", cookedGrams: 480 });
    const food = recipeAsFood(recipe, PANTRY);
    const total = recipeTotal(recipe, PANTRY);

    expect(food.unit).toBe("g");
    expect(food.macros.protein).toBeCloseTo((total.protein / 480) * 100, 6);
    // Eating the whole batch is the whole batch, whatever the yield was.
    expect(macrosForAmount(food, 480).protein).toBeCloseTo(total.protein, 6);
    // And this is the thing servings can't answer.
    expect(macrosForAmount(food, 250).protein).toBeCloseTo(
      (total.protein / 480) * 250,
      6,
    );
  });

  it("marks a weighed recipe cooked, because that's when you weigh it", () => {
    expect(recipeAsFood(chicken({ kind: "weight", cookedGrams: 480 }), PANTRY).state).toBe(
      "cooked",
    );
  });

  it("gives the same total either way — only the portioning differs", () => {
    // The yield is what separates them, not the food. Eating the whole thing
    // is the same meal however you chose to measure it out.
    const byServings = recipeAsFood(chicken({ kind: "servings", servings: 4 }), PANTRY);
    const byWeight = recipeAsFood(chicken({ kind: "weight", cookedGrams: 480 }), PANTRY);
    expect(kcalOf(macrosForAmount(byServings, 4))).toBeCloseTo(
      kcalOf(macrosForAmount(byWeight, 480)),
      6,
    );
  });

  it("adds nothing for the cooking method", () => {
    // The method is a note on how to cook it. The fat it needs is the butter
    // line, which you typed — no per-method absorption factor.
    const fried = chicken({ kind: "servings", servings: 1 });
    const steamed: Recipe = { ...fried, method: "steam" };
    expect(recipeAsFood(steamed, PANTRY).macros).toEqual(
      recipeAsFood(fried, PANTRY).macros,
    );
  });
});

describe("the merged pantry", () => {
  it("resolves all three kinds by id", () => {
    const pantry = mergePantry(
      [yogurt, butter],
      [chicken({ kind: "weight", cookedGrams: 480 })],
    );
    expect(pantry.get("chicken-breast-raw")?.name).toBe(
      getFood("chicken-breast-raw").name,
    );
    expect(pantry.get("food:yogurt")?.name).toBe("Greek yogurt");
    expect(pantry.get("recipe:chicken")?.name).toBe("Pan-fried chicken");
    expect(pantry.get("food:nope")).toBeUndefined();
  });

  it("lets a meal item point at a recipe", () => {
    // The whole reason `recipeAsFood` exists: `macrosForItem` doesn't know or
    // care that this id is a recipe.
    const recipe = chicken({ kind: "weight", cookedGrams: 480 });
    const pantry = mergePantry([yogurt, butter], [recipe]);
    const macros = macrosForItem({ foodId: "recipe:chicken", amount: 250 }, pantry);
    expect(macros.protein).toBeCloseTo(
      (recipeTotal(recipe, pantry).protein / 480) * 250,
      6,
    );
  });

  it("keeps recipes out of what an ingredient resolves against", () => {
    // How nesting is prevented: a recipe listed as an ingredient resolves to
    // nothing, so it contributes zero instead of recursing.
    const pantry = mergePantry(
      [yogurt, butter],
      [chicken({ kind: "servings", servings: 1 })],
    );
    expect(pantry.ingredientSource.get("recipe:chicken")).toBeUndefined();
    expect(pantry.get("recipe:chicken")).toBeDefined();
  });

  it("hides an archived entry from the pickers but still resolves it", () => {
    const pantry = mergePantry([{ ...yogurt, archivedAt: 1 }], []);
    expect(pantry.selectable.some((e) => e.food.id === "food:yogurt")).toBe(false);
    // A plan already referencing it still reads correctly, which is the
    // difference between archiving and deleting.
    expect(pantry.get("food:yogurt")?.name).toBe("Greek yogurt");
  });
});
