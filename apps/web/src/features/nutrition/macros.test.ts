import { describe, expect, it } from "vitest";
import {
  KCAL_PER_GRAM,
  addMacros,
  dayTotals,
  deficitPerDay,
  kcalOf,
  macrosForAmount,
  macrosForItem,
  percentSplit,
  proteinPerKg,
  resolveDay,
  totalFor,
  variantForDay,
  weekdayOf,
  weeklyRateKg,
} from "./macros";
import { diets, getFood } from "@/data/diets";
import { BUILT_IN_FOODS as FOODS } from "./food-source";
import type { DietPlan, Food, MealVariant } from "@/data/diets";

const perHundred: Food = {
  id: "test-rice",
  name: "Rice",
  unit: "g",
  macros: { protein: 2.75, fat: 0.25, carbs: 28 },
};

const perUnit: Food = {
  id: "test-egg",
  name: "Egg",
  unit: "unit",
  macros: { protein: 6, fat: 5, carbs: 0.5 },
};

describe("kcalOf", () => {
  it("uses the Atwater factors", () => {
    expect(kcalOf({ protein: 10, carbs: 10, fat: 10 })).toBe(40 + 40 + 90);
  });

  it("counts fat at more than twice the others", () => {
    expect(KCAL_PER_GRAM.fat).toBeGreaterThan(KCAL_PER_GRAM.protein * 2);
    expect(kcalOf({ protein: 0, carbs: 0, fat: 10 })).toBeGreaterThan(
      kcalOf({ protein: 10, carbs: 10, fat: 0 }),
    );
  });

  it("is zero for nothing", () => {
    expect(kcalOf({ protein: 0, carbs: 0, fat: 0 })).toBe(0);
  });
});

describe("macrosForAmount", () => {
  it("scales a per-100g food by weight", () => {
    expect(macrosForAmount(perHundred, 200)).toEqual({
      protein: 5.5,
      fat: 0.5,
      carbs: 56,
    });
  });

  it("counts a per-unit food whole", () => {
    // Two eggs is twice one egg, not two hundredths of one.
    expect(macrosForAmount(perUnit, 2)).toEqual({
      protein: 12,
      fat: 10,
      carbs: 1,
    });
  });
});

describe("totalFor and addMacros", () => {
  it("adds a meal up", () => {
    const total = addMacros(
      macrosForAmount(perHundred, 100),
      macrosForAmount(perUnit, 1),
    );

    expect(total).toEqual({ protein: 8.75, fat: 5.25, carbs: 28.5 });
  });

  it("has nothing to add for an empty meal", () => {
    expect(totalFor([], FOODS)).toEqual({ protein: 0, fat: 0, carbs: 0 });
  });
});

describe("an id nothing resolves", () => {
  // The one behaviour the injection changed. `getFood` threw, which is right
  // while authoring a built-in plan and wrong at runtime: a plan referencing a
  // food you since deleted should render with a visible gap rather than taking
  // the page down.
  const item = { foodId: "food:deleted", amount: 200 };

  it("contributes zero rather than throwing", () => {
    expect(() => macrosForItem(item, FOODS)).not.toThrow();
    expect(macrosForItem(item, FOODS)).toEqual({ protein: 0, fat: 0, carbs: 0 });
  });

  it("leaves the rest of the meal intact", () => {
    const total = totalFor(
      [item, { foodId: "whole-egg", amount: 2 }],
      FOODS,
    );
    expect(total).toEqual(macrosForAmount(getFood("whole-egg"), 2));
  });
});

describe("variantForDay", () => {
  const variants: MealVariant[] = [
    { label: "Office", days: ["tue", "wed"], options: [{ items: [] }] },
    { label: "Home", days: ["mon"], options: [{ items: [] }] },
  ];

  it("picks the variant whose days include the day", () => {
    expect(variantForDay(variants, "wed")?.label).toBe("Office");
    expect(variantForDay(variants, "mon")?.label).toBe("Home");
  });

  it("falls back to an everyday variant", () => {
    const withDefault: MealVariant[] = [
      ...variants,
      { label: "Any", options: [{ items: [] }] },
    ];

    expect(variantForDay(withDefault, "sun")?.label).toBe("Any");
  });

  it("gives nothing when no variant covers the day", () => {
    expect(variantForDay(variants, "sun")).toBeUndefined();
  });
});

describe("percentSplit", () => {
  it("splits by calories, not by grams", () => {
    // Equal grams, but fat carries more than twice the energy.
    const split = percentSplit({ protein: 10, carbs: 10, fat: 10 });

    expect(split.fat).toBeCloseTo(52.94, 2);
    expect(split.protein).toBeCloseTo(23.53, 2);
    expect(split.carbs).toBeCloseTo(23.53, 2);
  });

  it("adds up to a hundred", () => {
    const split = percentSplit({ protein: 187, carbs: 173, fat: 67 });

    expect(split.protein + split.carbs + split.fat).toBeCloseTo(100, 6);
  });

  it("declines to divide by nothing", () => {
    expect(percentSplit({ protein: 0, carbs: 0, fat: 0 })).toEqual({
      protein: 0,
      fat: 0,
      carbs: 0,
    });
  });
});

describe("deficit and rate", () => {
  const plan = { tdeeKcal: 3150, targetKcal: 2040 } as DietPlan;

  it("is the gap between what you burn and what you eat", () => {
    expect(deficitPerDay(plan)).toBe(1110);
  });

  it("turns a week of that into kilos", () => {
    expect(weeklyRateKg(plan)).toBeCloseTo(1.009, 3);
  });

  it("goes negative on a surplus", () => {
    expect(deficitPerDay({ tdeeKcal: 2500, targetKcal: 3000 } as DietPlan)).toBe(
      -500,
    );
  });
});

describe("proteinPerKg", () => {
  it("divides by body weight", () => {
    expect(proteinPerKg({ protein: 187, carbs: 0, fat: 0 }, 114)).toBeCloseTo(
      1.64,
      2,
    );
  });

  it("has no answer without a weight", () => {
    expect(proteinPerKg({ protein: 187, carbs: 0, fat: 0 }, undefined)).toBeUndefined();
    expect(proteinPerKg({ protein: 187, carbs: 0, fat: 0 }, 0)).toBeUndefined();
  });
});

describe("weekdayOf", () => {
  it("starts the week on Monday, unlike Date.getDay", () => {
    // 2026-08-10 is a Monday.
    expect(weekdayOf(new Date(2026, 7, 10))).toBe("mon");
    expect(weekdayOf(new Date(2026, 7, 16))).toBe("sun");
  });
});

describe("resolveDay", () => {
  const plan = diets[0]!;

  it("gives one entry per meal that applies", () => {
    expect(resolveDay(plan, "tue", FOODS)).toHaveLength(plan.meals.length);
  });

  it("picks the office lunch midweek and the home one at the weekend", () => {
    const office = resolveDay(plan, "wed", FOODS).find((meal) => meal.name === "Lunch");
    const home = resolveDay(plan, "sat", FOODS).find((meal) => meal.name === "Lunch");

    expect(office?.variant.label).toBe("Office days");
    expect(home?.variant.label).toBe("Home days");
  });

  it("applies a swap choice", () => {
    const [first] = resolveDay(plan, "sat", FOODS, { Lunch: 0 }).filter(
      (meal) => meal.name === "Lunch",
    );
    const [second] = resolveDay(plan, "sat", FOODS, { Lunch: 2 }).filter(
      (meal) => meal.name === "Lunch",
    );

    expect(first!.items).not.toEqual(second!.items);
    expect(second!.optionIndex).toBe(2);
  });

  it("clamps a choice that's out of range instead of crashing", () => {
    const lunch = resolveDay(plan, "sat", FOODS, { Lunch: 99 }).find(
      (meal) => meal.name === "Lunch",
    );

    expect(lunch?.optionIndex).toBe(
      lunch!.variant.options.length - 1,
    );
  });
});

/**
 * The transcription check.
 *
 * Every plan states its own day totals; the app computes them from the food
 * table instead. Thirty-odd numbers copied by hand out of a markdown file is
 * exactly the work that needs a backstop, and this is the only thing that would
 * catch a mistyped swap protein — those were solved for rather than looked up,
 * so nothing else pins them.
 *
 * Tolerances are per-macro grams and total calories, and they're looser than
 * they look for a reason: the v4 source contradicts itself. Its header states
 * P220 · C190 · F68 = 2,252 while its own totals table states P222 · C190 · F68
 * = 2,261, and the meals really do add to the second. Anything tighter than
 * that gap fails on the document rather than on the code. Three grams still
 * catches what this is for — a mistyped swap protein misses by twenty.
 */
describe("every plan adds up to what it says it does", () => {
  const GRAM_TOLERANCE = 3.5;
  const KCAL_TOLERANCE = 30;

  for (const plan of diets) {
    describe(plan.name, () => {
      const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

      for (const day of days) {
        // Every swap on the day, so a bad protein can't hide behind a default.
        const lunch = plan.meals.find((meal) => meal.name === "Lunch");
        const variant = lunch
          ? variantForDay(lunch.variants, day)
          : undefined;
        const optionCount = variant?.options.length ?? 1;

        for (let option = 0; option < optionCount; option++) {
          const label = variant?.options[option]?.label;
          it(`${day}${label ? ` · ${label}` : ""}`, () => {
            const totals = dayTotals(resolveDay(plan, day, FOODS, { Lunch: option }));

            // Targets are optional on the schema now, because a plan you write
            // yourself may state none. Every *transcribed* plan states all of
            // them, and asserting that here is the point: if one ever stopped,
            // the checks below would silently pass against undefined.
            const { protein, carbs, fat } = plan.targets;
            expect(protein).toBeDefined();
            expect(carbs).toBeDefined();
            expect(fat).toBeDefined();
            expect(plan.targetKcal).toBeDefined();

            expect(Math.abs(totals.protein - protein!)).toBeLessThanOrEqual(
              GRAM_TOLERANCE,
            );
            expect(Math.abs(totals.carbs - carbs!)).toBeLessThanOrEqual(
              GRAM_TOLERANCE,
            );
            expect(Math.abs(totals.fat - fat!)).toBeLessThanOrEqual(
              GRAM_TOLERANCE,
            );
            expect(
              Math.abs(kcalOf(totals) - plan.targetKcal!),
            ).toBeLessThanOrEqual(KCAL_TOLERANCE);
          });
        }
      }
    });
  }
});
