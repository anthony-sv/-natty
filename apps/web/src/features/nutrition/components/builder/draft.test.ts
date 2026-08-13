import { describe, expect, it } from "vitest";
import { dietPlanSchema, diets } from "@/data/diets";
import { BUILT_IN_FOODS } from "../../food-source";
import {
  dayTotals,
  deficitPerDay,
  effectiveTargetKcal,
  resolveDay,
  weeklyRateKg,
} from "../../macros";
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
    notes: [],
    supplements: [],
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

  it("needs a name and at least one meal, and nothing else", () => {
    expect(toDietPlan({ ...sampleDraft(), name: "  " }, "s")).toBeUndefined();
    // An empty plan has no meals, so there's nothing to describe yet.
    expect(toDietPlan(emptyPlan(), "s")).toBeUndefined();
  });

  it("accepts a plan that states no calories and no targets", () => {
    // The point of making these optional: writing down what you eat shouldn't
    // require inventing a maintenance figure you don't know.
    const plan = toDietPlan(
      {
        ...sampleDraft(),
        tdeeKcal: "",
        targetKcal: "",
        targets: { protein: "", carbs: "", fat: "" },
      },
      "s",
    );
    expect(dietPlanSchema.safeParse(plan).success).toBe(true);
    expect(plan!.tdeeKcal).toBeUndefined();
    expect(plan!.targetKcal).toBeUndefined();
    expect(plan!.targets).toEqual({});
    // With nothing stated there is nothing to derive either.
    expect(effectiveTargetKcal(plan!)).toBeUndefined();
  });

  it("keeps a partial target, and derives the calories from it", () => {
    // "180g of protein and I don't care about the rest" is a real goal, which
    // is why `targets` is per-macro optional rather than all-or-nothing.
    const plan = toDietPlan(
      {
        ...sampleDraft(),
        targetKcal: "",
        targets: { protein: "180", carbs: "", fat: "" },
      },
      "s",
    )!;
    expect(plan.targets).toEqual({ protein: 180 });
    // 180 × 4, and flagged so the page can say it wasn't typed.
    expect(effectiveTargetKcal(plan)).toEqual({ kcal: 720, derived: true });
  });

  it("prefers a stated calorie target over the derived one", () => {
    const plan = toDietPlan(sampleDraft(), "s")!;
    expect(effectiveTargetKcal(plan)).toEqual({ kcal: 2200, derived: false });
  });

  it("has no deficit to report without a maintenance figure", () => {
    const plan = toDietPlan({ ...sampleDraft(), tdeeKcal: "" }, "s")!;
    // Zero would be a claim; undefined is what hides the tile.
    expect(deficitPerDay(plan)).toBeUndefined();
    expect(weeklyRateKg(plan)).toBeUndefined();
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

  it("keeps the plan's notes and supplements", () => {
    // Both used to be written empty on save, so editing a plan's *name*
    // silently deleted whatever was under it — and copying a built-in threw
    // away its protocol. The editor now carries notes (which it can edit) and
    // supplements (which it can't, yet) straight through.
    const plan = toDietPlan(
      {
        ...sampleDraft(),
        notes: ["Weigh the chicken cooked.", "  "],
        supplements: [{ name: "Magnesium", dose: "300mg", timing: "Before bed" }],
      },
      "s",
    )!;
    // The blank row is dropped rather than saved as an empty bullet.
    expect(plan.notes).toEqual(["Weigh the chicken cooked."]);
    expect(plan.supplements).toHaveLength(1);

    const again = toDietPlan(toDraftPlan(plan), "s")!;
    expect(again.notes).toEqual(plan.notes);
    expect(again.supplements).toEqual(plan.supplements);
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
