import { describe, expect, it } from "vitest";
import { findFood, type DietPlan } from "@/data/diets";
import type { Habit, HabitLog } from "@/features/habits/schema";
import type { IntakeEntry } from "@/features/intake/schema";
import type { FoodSource } from "@/features/nutrition/macros";
import type { Recipe } from "@/features/pantry/schema";
import type { Supplement } from "@/features/supplements/schema";
import { addDays, startOfDay } from "@/lib/week";
import {
  expandToIngredients,
  planNeeds,
  shoppingList,
  stockStatus,
  usageBetween,
  type ConsumptionSources,
} from "./shopping";
import type { ShoppingItem, StockItem } from "./schema";

const NOW = new Date(2026, 9, 21, 12, 0).getTime();
const TODAY = startOfDay(NOW);
const HOUR = 3_600_000;

const foods: FoodSource = { get: (id) => findFood(id) };

/** One meal a day, every day: 200 g rice and 150 g chicken. */
const plan = {
  slug: "test-plan",
  name: "Test",
  goal: "maintenance",
  meals: [
    {
      name: "Lunch",
      variants: [
        {
          options: [
            {
              items: [
                { foodId: "rice", amount: 200 },
                { foodId: "chicken", amount: 150 },
              ],
            },
          ],
        },
      ],
    },
  ],
  supplements: [],
  notes: [],
} as unknown as DietPlan;

const chili: Recipe = {
  id: "recipe:chili",
  name: "Chili",
  ingredients: [
    { foodId: "beans", amount: 400 },
    { foodId: "beef", amount: 600 },
  ],
  portioning: { kind: "weight", cookedGrams: 1000 },
  createdAt: 0,
};

function sources(overrides: Partial<ConsumptionSources> = {}): ConsumptionSources {
  return {
    intake: [],
    habitLogs: [],
    habits: [],
    supplements: [],
    planFor: (slug) => (slug === plan.slug ? plan : undefined),
    recipes: new Map([[chili.id, chili]]),
    ...overrides,
  };
}

function stock(overrides: Partial<StockItem> = {}): StockItem {
  return {
    id: "stock:rice",
    name: "Rice",
    unit: "g",
    packageSize: 1000,
    onHand: 1000,
    countedAt: addDays(TODAY, -2),
    uses: [{ kind: "food", foodId: "rice", factor: 1 }],
    createdAt: addDays(TODAY, -2),
    ...overrides,
  };
}

let seq = 0;
function meal(day: number, loggedAt = day + 13 * HOUR): IntakeEntry {
  return {
    id: `intake:${seq++}`,
    day,
    source: { kind: "meal", planSlug: plan.slug, mealName: "Lunch", optionIndex: 0 },
    loggedAt,
  };
}

describe("expandToIngredients", () => {
  it("passes a plain food through", () => {
    expect(expandToIngredients("rice", 100, new Map())).toEqual([
      { foodId: "rice", amount: 100 },
    ]);
  });

  it("splits a weighed recipe portion into its ingredients", () => {
    expect(expandToIngredients(chili.id, 250, new Map([[chili.id, chili]]))).toEqual([
      { foodId: "beans", amount: 100 },
      { foodId: "beef", amount: 150 },
    ]);
  });

  it("splits a servings recipe by servings", () => {
    const bowl: Recipe = { ...chili, portioning: { kind: "servings", servings: 4 } };
    expect(expandToIngredients(bowl.id, 1, new Map([[bowl.id, bowl]]))[0]).toEqual({
      foodId: "beans",
      amount: 100,
    });
  });
});

describe("usageBetween", () => {
  it("counts ticked meals through the plan, by when they were ticked", () => {
    const intake = [meal(addDays(TODAY, -1)), meal(TODAY, TODAY + 13 * HOUR)];
    const usage = usageBetween(sources({ intake }), TODAY, NOW + 2 * HOUR);
    expect(usage.food.get("rice")).toBe(200);
  });

  it("counts supplement servings and habit amounts", () => {
    const intake: IntakeEntry[] = [
      { id: "a", day: TODAY, source: { kind: "supplement", supplementId: "supplement:c" }, loggedAt: TODAY + HOUR },
      { id: "b", day: TODAY, source: { kind: "supplement", supplementId: "supplement:c" }, loggedAt: TODAY + 2 * HOUR },
    ];
    const habitLogs: HabitLog[] = [
      { id: "x", habitId: "habit:teeth", day: TODAY, amount: 3, updatedAt: TODAY },
    ];
    const usage = usageBetween(sources({ intake, habitLogs }), TODAY + 30 * 60_000, NOW);
    expect(usage.supplementServings.get("supplement:c")).toBe(2);
    // A habit counts from the start of the window's day.
    expect(usage.habitAmount.get("habit:teeth")).toBe(3);
  });
});

describe("stockStatus", () => {
  it("subtracts what was eaten since the count", () => {
    const intake = [meal(addDays(TODAY, -3)), meal(addDays(TODAY, -1)), meal(TODAY, TODAY + HOUR)];
    const status = stockStatus(stock(), sources({ intake }), new Map(), NOW);
    // The meal three days ago was before the count.
    expect(status.remaining).toBe(600);
    expect(status.packages).toBeCloseTo(0.6);
  });

  it("applies a measured cooked-to-raw factor", () => {
    const item = stock({ uses: [{ kind: "food", foodId: "chicken", factor: 1.3 }] });
    const intake = [meal(TODAY, TODAY + HOUR)];
    expect(stockStatus(item, sources({ intake }), new Map(), NOW).remaining).toBe(805);
  });

  it("never goes below zero", () => {
    const item = stock({ onHand: 100 });
    const intake = [meal(TODAY, TODAY + HOUR)];
    expect(stockStatus(item, sources({ intake }), new Map(), NOW).remaining).toBe(0);
  });

  it("uses the plan's rate before there's history, and the measured one after", () => {
    const fresh = stockStatus(stock(), sources(), new Map([["rice", 200]]), NOW);
    expect(fresh.dailyUse).toEqual({ value: 200, source: "plan" });
    expect(fresh.daysLeft).toBe(5);

    // Ten days in, eating 100 g a day — half the plan.
    const old = stock({ createdAt: addDays(TODAY, -10), countedAt: addDays(TODAY, -10), onHand: 5000 });
    const halfMeals = Array.from({ length: 5 }, (_, i) => meal(addDays(TODAY, -2 * (i + 1))));
    const status = stockStatus(old, sources({ intake: halfMeals }), new Map([["rice", 200]]), NOW);
    expect(status.dailyUse?.source).toBe("measured");
    expect(status.dailyUse?.value).toBeCloseTo(1000 / 10.5, 0);
  });

  it("lets your own rate win", () => {
    const status = stockStatus(stock({ dailyUse: 50 }), sources(), new Map([["rice", 200]]), NOW);
    expect(status.dailyUse).toEqual({ value: 50, source: "manual" });
  });

  it("plans a habit's use from its target and schedule", () => {
    const teeth: Habit = {
      id: "habit:teeth",
      name: "Teeth",
      target: { kind: "count", perDay: 3 },
      schedule: { kind: "daily" },
      createdAt: 0,
    };
    const paste = stock({
      unit: "g",
      packageSize: 100,
      onHand: 90,
      uses: [{ kind: "habit", habitId: teeth.id, perTime: 1 }],
    });
    const status = stockStatus(paste, sources({ habits: [teeth] }), new Map(), NOW);
    expect(status.dailyUse).toEqual({ value: 3, source: "plan" });
    expect(status.daysLeft).toBe(30);
  });

  it("plans a supplement from the stack's servings", () => {
    const creatine: Supplement = {
      id: "supplement:c",
      name: "Creatine",
      amount: 5,
      unit: "g",
      servingsPerDay: 1,
      createdAt: 0,
    };
    const tub = stock({
      packageSize: 300,
      onHand: 300,
      uses: [{ kind: "supplement", supplementId: creatine.id, perServing: 5 }],
    });
    expect(stockStatus(tub, sources({ supplements: [creatine] }), new Map(), NOW).daysLeft).toBe(60);
  });
});

describe("planNeeds", () => {
  it("sums the plan over the window", () => {
    const needs = planNeeds(plan, foods, new Map(), TODAY, 7);
    expect(needs.get("rice")).toBe(1400);
    expect(needs.get("chicken")).toBe(1050);
  });
});

describe("shoppingList", () => {
  const base = {
    sources: sources(),
    plan,
    foods,
    shoppingItems: [] as ShoppingItem[],
    now: NOW,
    horizonDays: 7,
  };

  it("lists stock that runs out inside the window, with packages to cover it", () => {
    const list = shoppingList({ ...base, stock: [stock({ onHand: 600 })] });
    expect(list.low).toHaveLength(1);
    // 200 g/day × 7 = 1400 needed, 600 held: 800 short → one 1 kg bag.
    expect(list.low[0]!.suggestedPackages).toBe(1);
  });

  it("leaves stock alone that lasts past the window", () => {
    expect(shoppingList({ ...base, stock: [stock({ onHand: 5000 })] }).low).toHaveLength(0);
  });

  it("lists plan foods only when they aren't tracked as stock", () => {
    const list = shoppingList({ ...base, stock: [stock({ onHand: 5000 })] });
    expect(list.plan.map((row) => row.foodId)).toEqual(["chicken"]);
  });

  it("keeps a plan tick only for the window", () => {
    const ticked = (checkedAt: number): ShoppingItem => ({
      id: "shop:plan:chicken",
      source: { kind: "planFood", foodId: "chicken" },
      checkedAt,
      createdAt: 0,
    });
    const fresh = shoppingList({ ...base, stock: [], shoppingItems: [ticked(addDays(TODAY, -2))] });
    expect(fresh.plan.find((row) => row.foodId === "chicken")?.checked).toBe(true);
    const lapsed = shoppingList({ ...base, stock: [], shoppingItems: [ticked(addDays(TODAY, -9))] });
    expect(lapsed.plan.find((row) => row.foodId === "chicken")?.checked).toBe(false);
  });

  it("puts unchecked manual items first", () => {
    const manual = (id: string, checkedAt?: number): ShoppingItem => ({
      id,
      source: { kind: "manual", name: id },
      checkedAt,
      createdAt: Number(id.slice(-1)),
    });
    const list = shoppingList({
      ...base,
      stock: [],
      shoppingItems: [manual("shop:1", NOW), manual("shop:2"), manual("shop:3")],
    });
    expect(list.manual.map((row) => row.id)).toEqual(["shop:2", "shop:3", "shop:1"]);
  });
});
