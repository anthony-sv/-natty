import { describe, expect, it } from "vitest";
import { dietPlanSchema, diets } from "@/data/diets";
import { BUILT_IN_FOODS } from "../../food-source";
import { dayTotals, resolveDay } from "../../macros";
import {
  emptyPlan,
  hasWeekdayVariants,
  toDietPlan,
  toDraftPlan,
  type DraftPlan,
} from "./draft";

/**
 * The builder's job is producing something `dietPlanSchema` accepts and
 * `resolveDay` can sum. These check that end, not the UI driving it.
 */

function sampleDraft(): DraftPlan {
  return {
    name: "My cut",
    goal: "cutting",
    tdeeKcal: "3000",
    targetKcal: "2200",
    targets: { protein: "180", carbs: "200", fat: "70" },
    meals: [
      {
        name: "Meal 1",
        note: "",
        options: [
          { label: "", items: [{ foodId: "whole-egg", amount: 3 }] },
        ],
      },
      {
        name: "Meal 2",
        note: "with rice",
        options: [
          { label: "Chicken", items: [{ foodId: "chicken-breast-raw", amount: 200 }] },
          { label: "Salmon", items: [{ foodId: "salmon-raw", amount: 180 }] },
        ],
      },
    ],
  };
}

describe("producing a plan", () => {
  it("makes something the schema accepts", () => {
    const plan = toDietPlan(sampleDraft(), "my-cut-abc123");
    expect(dietPlanSchema.safeParse(plan).success).toBe(true);
  });

  it("refuses a draft with no name or no calorie numbers", () => {
    expect(toDietPlan({ ...sampleDraft(), name: "  " }, "s")).toBeUndefined();
    expect(toDietPlan({ ...sampleDraft(), targetKcal: "" }, "s")).toBeUndefined();
    expect(toDietPlan(emptyPlan(), "s")).toBeUndefined();
  });

  it("writes one variant per meal, applying every day", () => {
    // The builder's simplification: swaps yes, weekday variants no. A single
    // variant with no `days` is what "every day" means to `variantForDay`.
    const plan = toDietPlan(sampleDraft(), "s")!;
    for (const meal of plan.meals) {
      expect(meal.variants).toHaveLength(1);
      expect(meal.variants[0]!.days).toBeUndefined();
    }
  });

  it("keeps swap options", () => {
    const plan = toDietPlan(sampleDraft(), "s")!;
    const options = plan.meals[1]!.variants[0]!.options;
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.label)).toEqual(["Chicken", "Salmon"]);
  });

  it("drops an option with nothing in it", () => {
    const draft = sampleDraft();
    draft.meals[0]!.options.push({ label: "Empty", items: [] });
    expect(toDietPlan(draft, "s")!.meals[0]!.variants[0]!.options).toHaveLength(1);
  });

  it("drops a meal left completely empty", () => {
    const draft = sampleDraft();
    draft.meals.push({ name: "Meal 3", note: "", options: [{ label: "", items: [] }] });
    expect(toDietPlan(draft, "s")!.meals).toHaveLength(2);
  });

  it("sums through resolveDay like any other plan", () => {
    // The point of matching `DietPlan` exactly: the existing derivation runs on
    // it with no branch for "this one is yours".
    const plan = toDietPlan(sampleDraft(), "s")!;
    const totals = dayTotals(resolveDay(plan, "mon", BUILT_IN_FOODS));
    expect(totals.protein).toBeGreaterThan(0);
  });

  it("follows the swap choice, as the plan panel will", () => {
    const plan = toDietPlan(sampleDraft(), "s")!;
    const chicken = dayTotals(resolveDay(plan, "mon", BUILT_IN_FOODS, { "Meal 2": 0 }));
    const salmon = dayTotals(resolveDay(plan, "mon", BUILT_IN_FOODS, { "Meal 2": 1 }));
    expect(chicken).not.toEqual(salmon);
  });
});

describe("round-tripping", () => {
  it("survives a trip through the editor unchanged", () => {
    // What Edit and "start from a copy" both depend on.
    const original = toDietPlan(sampleDraft(), "s")!;
    expect(toDietPlan(toDraftPlan(original), "s")).toEqual(original);
  });

  it("keeps a meal's note and its option labels", () => {
    const original = toDietPlan(sampleDraft(), "s")!;
    const again = toDietPlan(toDraftPlan(original), "s")!;
    expect(again.meals[1]!.note).toBe("with rice");
    expect(again.meals[1]!.variants[0]!.options[1]!.label).toBe("Salmon");
  });
});

describe("copying a built-in plan", () => {
  const plan = diets[0]!;

  it("flags that the built-ins use weekday variants", () => {
    // Both do — office days versus home days — and the builder doesn't write
    // them, so the copy flow has to say what it's dropping rather than let you
    // discover it after saving.
    expect(hasWeekdayVariants(plan)).toBe(true);
  });

  it("collapses each meal to its first variant, and still parses", () => {
    const copy = toDietPlan(toDraftPlan(plan), "copy-abc123")!;
    expect(dietPlanSchema.safeParse(copy).success).toBe(true);
    for (const meal of copy.meals) {
      expect(meal.variants).toHaveLength(1);
    }
    expect(copy.meals.map((m) => m.name)).toEqual(plan.meals.map((m) => m.name));
  });

  it("carries the targets across, so the copy is usable immediately", () => {
    const copy = toDietPlan(toDraftPlan(plan), "copy")!;
    expect(copy.targets).toEqual(plan.targets);
    expect(copy.targetKcal).toBe(plan.targetKcal);
  });
});
