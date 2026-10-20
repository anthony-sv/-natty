import { describe, expect, it } from "vitest";
import { foods, getDietBySlug, NUTRIENTS, type Food } from "@/data/diets";
import { BUILT_IN_FOODS } from "./food-source";
import { dayTotals, fiberTarget, resolveDay, type FoodSource } from "./macros";
import {
  categoryScores,
  CATEGORIES,
  dayNutrients,
  nutrientRows,
  REFERENCES,
} from "./micronutrients";

const spinach: Food = {
  id: "t-spinach",
  name: "Spinach",
  unit: "g",
  macros: { protein: 3, fat: 0, carbs: 1, fiber: 2 },
  micros: { vitaminK: 480, potassium: 560, sodium: 80 },
};
const capsule: Food = {
  id: "t-capsule",
  name: "Fish oil",
  unit: "unit",
  macros: { protein: 0, fat: 1, carbs: 0 },
  micros: { epaDha: 0.5 },
};
/** A food you wrote: macros, no micros. */
const mine: Food = {
  id: "food:mine",
  name: "Protein bar",
  unit: "unit",
  macros: { protein: 20, fat: 10, carbs: 25 },
};
const FOODS: FoodSource = {
  get: (id) => [spinach, capsule, mine].find((food) => food.id === id),
};

describe("dayNutrients", () => {
  it("scales per-100 foods by weight and unit foods by count", () => {
    const day = dayNutrients(
      [
        { foodId: "t-spinach", amount: 50 },
        { foodId: "t-capsule", amount: 3 },
      ],
      FOODS,
    );
    expect(day.totals.vitaminK).toBe(240);
    expect(day.totals.epaDha).toBeCloseTo(1.5);
    expect(day.totals.fiber).toBe(1);
  });

  /**
   * A food with no data is a gap, not a zero — and the gap is reported, or a
   * plan of your own foods would read as deficient in everything.
   */
  it("reports the share of calories it could see", () => {
    const day = dayNutrients(
      [
        { foodId: "t-capsule", amount: 9 }, // 81 kcal, covered
        { foodId: "food:mine", amount: 1 }, // 270 kcal, not
      ],
      FOODS,
    );
    expect(day.coverage).toBeCloseTo(81 / 351);
  });

  it("calls an empty day fully covered rather than dividing by nothing", () => {
    expect(dayNutrients([], FOODS).coverage).toBe(1);
  });

  it("skips an id nothing resolves", () => {
    const day = dayNutrients([{ foodId: "gone", amount: 100 }], FOODS);
    expect(day.kcal).toBe(0);
  });
});

describe("nutrientRows", () => {
  const day = dayNutrients([{ foodId: "t-spinach", amount: 100 }], FOODS);

  it("has a row for every nutrient, plus fibre", () => {
    const rows = nutrientRows(day, "male");
    expect(rows.map((row) => row.key)).toEqual([...NUTRIENTS, "fiber"]);
  });

  it("picks the sex-specific target", () => {
    const male = nutrientRows(day, "male").find((r) => r.key === "iron")!;
    const female = nutrientRows(day, "female").find((r) => r.key === "iron")!;
    expect(male.target).toBe(8);
    expect(female.target).toBe(18);
  });

  it("sets fibre's target from the day's calories", () => {
    const fiber = nutrientRows(day, "male").find((r) => r.key === "fiber")!;
    expect(fiber.target).toBeCloseTo(fiberTarget(day.kcal));
  });

  it("grades met, close and low", () => {
    const rows = nutrientRows(day, "male");
    const status = (key: string) => rows.find((r) => r.key === key)!.status;
    expect(status("vitaminK")).toBe("met"); // 480 of 120
    expect(status("calcium")).toBe("low"); // none
  });

  it("flags going over an upper limit as high, not met", () => {
    const salty = dayNutrients([{ foodId: "t-spinach", amount: 3000 }], FOODS);
    const sodium = nutrientRows(salty, "male").find((r) => r.key === "sodium")!;
    expect(sodium.amount).toBeGreaterThan(REFERENCES.sodium.upper!);
    expect(sodium.status).toBe("high");
  });
});

describe("categoryScores", () => {
  it("caps each nutrient at 100% so a surplus can't hide a gap", () => {
    // Vitamin K at 400% must not carry the rest of the bone score.
    const day = dayNutrients([{ foodId: "t-spinach", amount: 100 }], FOODS);
    const scores = categoryScores(nutrientRows(day, "male"));
    expect(scores.bone).toBeLessThanOrEqual(1);
    expect(scores.bone).toBeCloseTo(1 / CATEGORIES.bone.length, 1);
  });

  it("is zero for a day of nothing", () => {
    const scores = categoryScores(nutrientRows(dayNutrients([], FOODS), "male"));
    expect(scores.all).toBe(0);
  });
});

/**
 * The real table, and the plan it was rebuilt for. Every built-in food has
 * data, so a built-in plan is fully covered — a food added without a `MICROS`
 * entry would quietly drag every plan that uses it into "estimates incomplete".
 */
describe("the built-in foods", () => {
  it("every one has a MICROS entry", () => {
    const missing = foods.filter((food) => food.micros === undefined);
    expect(missing.map((food) => food.id)).toEqual([]);
  });

  it("cover a whole built-in plan", () => {
    const plan = getDietBySlug("cut-v6-2068")!;
    const items = resolveDay(plan, "mon", BUILT_IN_FOODS).flatMap((m) => m.items);
    expect(dayNutrients(items, BUILT_IN_FOODS).coverage).toBe(1);
  });
});

describe("Plan v6", () => {
  const plan = getDietBySlug("cut-v6-2068")!;
  const meals = resolveDay(plan, "mon", BUILT_IN_FOODS);

  // The source states 28.4 g against a ~29 g target; this is the figure the
  // whole plan was rebuilt around, so it gets pinned like the macros are.
  it("reaches the fibre it says it does", () => {
    expect(dayTotals(meals).fiber).toBeCloseTo(28.4, 0);
  });

  it("lands just short of 14 g per 1,000 kcal, as the doc says", () => {
    const day = dayNutrients(meals.flatMap((m) => m.items), BUILT_IN_FOODS);
    const fiber = nutrientRows(day, "male").find((r) => r.key === "fiber")!;
    expect(fiber.target).toBeCloseTo(29, 0);
    expect(fiber.status).toBe("close");
  });
});
