import { describe, expect, it } from "vitest";
import { dietPlanSchema, getDietBySlug } from "@/data/diets";
import { BUILT_IN_FOODS } from "../../food-source";
import {
  dayTotals,
  deficitPerDay,
  effectiveTargetKcal,
  resolveDay,
  weeklyRateKg,
} from "../../macros";
import {
  daysCovered,
  emptyPlan,
  toDietPlan,
  toDraftPlan,
  type DraftMeal,
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
        variants: [
          {
            label: "",
            days: [],
            options: [
              { label: "", items: [{ foodId: "whole-egg", amount: 3 }] },
            ],
          },
        ],
      },
      {
        name: "Meal 2",
        note: "with rice",
        variants: [
          {
            label: "",
            days: [],
            options: [
              { label: "Chicken", items: [{ foodId: "chicken-breast-raw", amount: 200 }] },
              { label: "Salmon", items: [{ foodId: "salmon-raw", amount: 180 }] },
            ],
          },
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

  it("writes a meal that doesn't vary as one variant, applying every day", () => {
    // A single variant with no `days` is what "every day" means to
    // `variantForDay`.
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
    draft.meals[0]!.variants[0]!.options.push({ label: "Empty", items: [] });
    expect(toDietPlan(draft, "s")!.meals[0]!.variants[0]!.options).toHaveLength(1);
  });

  it("drops a meal left completely empty", () => {
    const draft = sampleDraft();
    draft.meals.push({
      name: "Meal 3",
      note: "",
      variants: [{ label: "", days: [], options: [{ label: "", items: [] }] }],
    });
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

describe("versions of a meal for different days", () => {
  /** Turkey on some days, pork on others — v7's dinner, written by hand. */
  function dinner(turkeyDays: DraftMeal["variants"][number]["days"], porkDays: DraftMeal["variants"][number]["days"]): DraftPlan {
    const draft = sampleDraft();
    draft.meals.push({
      name: "Dinner",
      note: "",
      variants: [
        {
          label: "Turkey",
          days: turkeyDays,
          options: [{ label: "", items: [{ foodId: "turkey-breast-raw", amount: 180 }] }],
        },
        {
          label: "Pork",
          days: porkDays,
          options: [{ label: "", items: [{ foodId: "pork-loin-raw", amount: 180 }] }],
        },
      ],
    });
    return draft;
  }

  const dinnerOn = (plan: ReturnType<typeof toDietPlan>, day: "mon" | "tue" | "sun") =>
    resolveDay(plan!, day, BUILT_IN_FOODS).find((meal) => meal.name === "Dinner");

  it("writes each version with its days, and resolves by them", () => {
    const plan = toDietPlan(dinner(["mon", "wed", "fri"], ["tue", "thu", "sat"]), "s")!;
    expect(dietPlanSchema.safeParse(plan).success).toBe(true);
    expect(dinnerOn(plan, "mon")?.variant.label).toBe("Turkey");
    expect(dinnerOn(plan, "tue")?.variant.label).toBe("Pork");
    // A day no version names has no dinner at all, like v7's rest-day drinks.
    expect(dinnerOn(plan, "sun")).toBeUndefined();
  });

  it("reads a version with no days as every day the others don't name", () => {
    const draft = dinner(["tue"], []);
    expect(daysCovered(draft.meals[2]!.variants)).toEqual([
      ["tue"],
      ["mon", "wed", "thu", "fri", "sat", "sun"],
    ]);
    const plan = toDietPlan(draft, "s")!;
    expect(plan.meals[2]!.variants[1]!.days).toBeUndefined();
    expect(dinnerOn(plan, "sun")?.variant.label).toBe("Pork");
  });

  it("won't save a version no day can reach", () => {
    // Two versions with no days: the second is never picked, and saving it
    // would look like a dinner you're following.
    expect(toDietPlan(dinner([], []), "s")).toBeUndefined();
    // Nor one with no days left over once the others took all seven.
    const allWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
    expect(toDietPlan(dinner([...allWeek], []), "s")).toBeUndefined();
  });

  it("writes the days in week order, whatever order they were picked in", () => {
    const plan = toDietPlan(dinner(["fri", "mon"], ["tue"]), "s")!;
    expect(plan.meals[2]!.variants[0]!.days).toEqual(["mon", "fri"]);
  });

  it("drops an empty version before judging what's reachable", () => {
    // An empty version with no days is just an unfinished row, not a
    // competitor for "every other day".
    const draft = dinner(["mon"], []);
    draft.meals[2]!.variants.push({ label: "", days: [], options: [{ label: "", items: [] }] });
    expect(toDietPlan(draft, "s")!.meals[2]!.variants).toHaveLength(2);
  });
});

describe("copying a built-in plan", () => {
  it.each(["cut-v7-2180", "cut-v5-2040", "cut-v4-2252", "cut-v6-2068"])(
    "keeps every version of every meal: %s",
    (slug) => {
      // Copying used to keep only each meal's first version, so v7's dinner
      // came out as turkey every day and its training drinks every day too.
      const plan = getDietBySlug(slug)!;
      const copy = toDietPlan(toDraftPlan(plan), plan.slug)!;
      expect(copy).toEqual(dietPlanSchema.parse(plan));
    },
  );

  it("carries the targets across, so the copy is usable immediately", () => {
    const plan = getDietBySlug("cut-v5-2040")!;
    const copy = toDietPlan(toDraftPlan(plan), "copy")!;
    expect(copy.targets).toEqual(plan.targets);
    expect(copy.targetKcal).toBe(plan.targetKcal);
  });
});
