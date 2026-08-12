import { describe, expect, it } from "vitest";
import { dayTotals, kcalOf, resolveDay, compareToTargets } from "@/features/nutrition/macros";
import { startOfDay } from "@/lib/week";
import { entriesForDay, resolveIntake, tickedMeals } from "./intake";
import type { DietPlan, Food } from "@/data/diets";
import type { FoodSource } from "@/features/nutrition/macros";
import type { IntakeEntry } from "./schema";

const rice: Food = {
  id: "rice",
  name: "Rice",
  unit: "g",
  macros: { protein: 2.75, fat: 0.25, carbs: 28 },
};
const chicken: Food = {
  id: "chicken",
  name: "Chicken",
  unit: "g",
  macros: { protein: 31, fat: 3.6, carbs: 0 },
};
const egg: Food = {
  id: "egg",
  name: "Egg",
  unit: "unit",
  macros: { protein: 6, fat: 5, carbs: 0.5 },
};

const table = new Map([rice, chicken, egg].map((food) => [food.id, food]));
const foods: FoodSource = { get: (id) => table.get(id) };

/** A Wednesday, so a weekday-restricted variant has something to match. */
const WED = startOfDay(new Date(2026, 7, 12).getTime());
const THU = startOfDay(new Date(2026, 7, 13).getTime());

function plan(overrides: Partial<DietPlan> = {}): DietPlan {
  return {
    slug: "test-plan",
    name: "Test plan",
    goal: "cutting",
    targets: {},
    meals: [
      {
        name: "Lunch",
        variants: [
          {
            options: [
              { items: [{ foodId: "chicken", amount: 200 }] },
              { items: [{ foodId: "rice", amount: 300 }] },
            ],
          },
        ],
      },
      {
        name: "Dinner",
        variants: [
          { options: [{ items: [{ foodId: "egg", amount: 3 }] }] },
        ],
      },
    ],
    supplements: [],
    notes: [],
    ...overrides,
  };
}

function mealEntry(
  id: string,
  day: number,
  mealName: string,
  optionIndex = 0,
  planSlug = "test-plan",
): IntakeEntry {
  return {
    id,
    day,
    source: { kind: "meal", planSlug, mealName, optionIndex },
    loggedAt: day + 1,
  };
}

function itemEntry(
  id: string,
  day: number,
  foodId: string,
  amount: number,
): IntakeEntry {
  return {
    id,
    day,
    source: { kind: "item", foodId, amount },
    loggedAt: day + 2,
  };
}

describe("entriesForDay", () => {
  it("keeps only the day asked for, oldest first", () => {
    const entries = [
      { ...itemEntry("late", WED, "egg", 1), loggedAt: 900 },
      mealEntry("other-day", THU, "Lunch"),
      { ...itemEntry("early", WED, "egg", 1), loggedAt: 100 },
    ];
    expect(entriesForDay(entries, WED).map((e) => e.id)).toEqual([
      "early",
      "late",
    ]);
  });
});

describe("resolveIntake", () => {
  it("resolves a ticked meal through the plan rather than a stored copy", () => {
    const entries = [mealEntry("a", WED, "Lunch")];
    const resolved = resolveIntake(entries, plan(), foods, WED);

    expect(resolved.meals).toHaveLength(1);
    expect(resolved.meals[0]!.items).toEqual([
      { foodId: "chicken", amount: 200 },
    ]);
    expect(resolved.totals.protein).toBeCloseTo(62, 5);
  });

  /**
   * The whole reason the entry stores provenance. Editing the plan has to
   * change what an already-logged meal resolves to, or the plan stops being
   * the authority on what its own meals are.
   */
  it("follows an edit to the plan", () => {
    const entries = [mealEntry("a", WED, "Lunch")];
    const edited = plan({
      meals: [
        {
          name: "Lunch",
          variants: [
            { options: [{ items: [{ foodId: "chicken", amount: 400 }] }] },
          ],
        },
      ],
    });

    expect(resolveIntake(entries, edited, foods, WED).totals.protein).toBeCloseTo(
      124,
      5,
    );
  });

  it("resolves the weekday variant the day falls on, not the one logged", () => {
    const weekdayPlan = plan({
      meals: [
        {
          name: "Lunch",
          variants: [
            {
              days: ["wed"],
              options: [{ items: [{ foodId: "chicken", amount: 200 }] }],
            },
            { options: [{ items: [{ foodId: "egg", amount: 1 }] }] },
          ],
        },
      ],
    });
    const wed = resolveIntake([mealEntry("a", WED, "Lunch")], weekdayPlan, foods, WED);
    const thu = resolveIntake([mealEntry("b", THU, "Lunch")], weekdayPlan, foods, THU);

    expect(wed.totals.protein).toBeCloseTo(62, 5);
    expect(thu.totals.protein).toBeCloseTo(6, 5);
  });

  it("honours which swap was eaten", () => {
    const first = resolveIntake([mealEntry("a", WED, "Lunch", 0)], plan(), foods, WED);
    const second = resolveIntake([mealEntry("a", WED, "Lunch", 1)], plan(), foods, WED);

    expect(first.totals.protein).toBeCloseTo(62, 5);
    expect(second.totals.carbs).toBeCloseTo(84, 5);
  });

  it("adds free items on top of the ticked meals", () => {
    const entries = [
      mealEntry("a", WED, "Dinner"),
      itemEntry("b", WED, "egg", 2),
    ];
    const resolved = resolveIntake(entries, plan(), foods, WED);

    expect(resolved.extras).toHaveLength(1);
    // Three eggs from the meal, two typed in.
    expect(resolved.totals.protein).toBeCloseTo(30, 5);
    expect(resolved.kcal).toBeCloseTo(kcalOf(resolved.totals), 5);
  });

  it("agrees with dayTotals when every meal is ticked", () => {
    const entries = plan().meals.map((meal, index) =>
      mealEntry(`m${index}`, WED, meal.name),
    );
    const resolved = resolveIntake(entries, plan(), foods, WED);
    const planned = dayTotals(resolveDay(plan(), "wed", foods));

    expect(resolved.totals.protein).toBeCloseTo(planned.protein, 5);
    expect(resolved.totals.carbs).toBeCloseTo(planned.carbs, 5);
    expect(resolved.totals.fat).toBeCloseTo(planned.fat, 5);
  });

  it("reports the same gaps compareToTargets does", () => {
    const targeted = plan({ targets: { protein: 180, carbs: 200 } });
    const resolved = resolveIntake([mealEntry("a", WED, "Lunch")], targeted, foods, WED);

    expect(resolved.vsTargets).toEqual(
      compareToTargets(resolved.totals, targeted.targets),
    );
    expect(resolved.vsTargets.map((gap) => gap.macro)).toEqual([
      "protein",
      "carbs",
    ]);
  });

  /** Switching plans mid-week must not count one plan's day into the other. */
  it("ignores an entry logged against a different plan", () => {
    const entries = [mealEntry("a", WED, "Lunch", 0, "other-plan")];
    expect(resolveIntake(entries, plan(), foods, WED).meals).toEqual([]);
  });

  it("keeps a meal the plan no longer has, at zero", () => {
    const entries = [mealEntry("a", WED, "Second breakfast")];
    const resolved = resolveIntake(entries, plan(), foods, WED);

    expect(resolved.meals[0]!.isOrphaned).toBe(true);
    expect(resolved.totals).toEqual({ protein: 0, fat: 0, carbs: 0 });
  });

  it("falls back to the first swap when the one eaten was edited away", () => {
    const entries = [mealEntry("a", WED, "Dinner", 3)];
    const resolved = resolveIntake(entries, plan(), foods, WED);

    expect(resolved.meals[0]!.isOrphaned).toBe(false);
    expect(resolved.totals.protein).toBeCloseTo(18, 5);
  });

  it("contributes zero for a food that no longer resolves", () => {
    const resolved = resolveIntake(
      [itemEntry("a", WED, "food:deleted", 100)],
      plan(),
      foods,
      WED,
    );

    expect(resolved.extras[0]!.food).toBeUndefined();
    expect(resolved.totals).toEqual({ protein: 0, fat: 0, carbs: 0 });
  });
});

describe("tickedMeals", () => {
  it("keys by meal name and carries the swap", () => {
    const ticked = tickedMeals([mealEntry("a", WED, "Lunch", 1)], "test-plan", WED);
    expect(ticked.get("Lunch")).toEqual({ entryId: "a", optionIndex: 1 });
    expect(ticked.has("Dinner")).toBe(false);
  });

  it("doesn't see another plan's day", () => {
    const entries = [mealEntry("a", WED, "Lunch", 0, "other-plan")];
    expect(tickedMeals(entries, "test-plan", WED).size).toBe(0);
  });
});
