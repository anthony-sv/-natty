import type { DietPlan, Macros, Meal, MealItem } from "@/data/diets";

/**
 * The plan builder's working copy.
 *
 * A draft parsed by `dietPlanSchema` on save rather than a TanStack Form, for
 * the reason `RoutineBuilder` records: this is a document editor with nested
 * dynamic arrays where nearly every interaction is structural, and the schema
 * is the authority either way.
 *
 * **Swap options, no weekday variants.** Every meal is written as a single
 * variant with no `days`, which is already schema-valid — so the simplification
 * is in the builder, not the model, and a plan that does use variants (both
 * built-ins do) still renders and still round-trips its first variant.
 */
export interface DraftPlan {
  name: string;
  goal: "cutting" | "bulking" | "maintenance";
  tdeeKcal: string;
  targetKcal: string;
  targets: { protein: string; carbs: string; fat: string };
  meals: DraftMeal[];
}

export interface DraftMeal {
  name: string;
  note: string;
  /** Interchangeable versions of the same meal — the docs' "equivalencies". */
  options: DraftOption[];
}

export interface DraftOption {
  label: string;
  items: MealItem[];
}

/** Meals default to "Meal 1"… rather than to a guess at what you eat when. */
export function emptyMeal(index: number): DraftMeal {
  return { name: `Meal ${index + 1}`, note: "", options: [{ label: "", items: [] }] };
}

export function emptyPlan(): DraftPlan {
  return {
    name: "",
    goal: "cutting",
    tdeeKcal: "",
    targetKcal: "",
    targets: { protein: "", carbs: "", fat: "" },
    meals: [emptyMeal(0)],
  };
}

function positive(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function nonNegative(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Turn the draft into a real `DietPlan`.
 *
 * Undefined when something essential is missing, so the caller keeps Save
 * disabled rather than surfacing a parse error mid-typing. The result still
 * goes through `dietPlanSchema` at the collection, which is what guarantees it.
 */
export function toDietPlan(
  draft: DraftPlan,
  slug: string,
): DietPlan | undefined {
  if (draft.name.trim() === "") return undefined;

  const tdeeKcal = positive(draft.tdeeKcal);
  const targetKcal = positive(draft.targetKcal);
  if (tdeeKcal === undefined || targetKcal === undefined) return undefined;

  const targets: Macros = {
    protein: nonNegative(draft.targets.protein),
    carbs: nonNegative(draft.targets.carbs),
    fat: nonNegative(draft.targets.fat),
  };

  const meals: Meal[] = draft.meals
    .map((meal): Meal | undefined => {
      // An option with nothing in it isn't a swap, it's an empty row.
      const options = meal.options
        .filter((option) => option.items.some((item) => item.foodId !== ""))
        .map((option) => ({
          label: option.label.trim() === "" ? undefined : option.label.trim(),
          items: option.items.filter((item) => item.foodId !== ""),
        }));
      if (options.length === 0) return undefined;
      return {
        name: meal.name.trim() === "" ? "Meal" : meal.name.trim(),
        note: meal.note.trim() === "" ? undefined : meal.note.trim(),
        // One variant, no `days` — it applies every day.
        variants: [{ options }],
      };
    })
    .filter((meal): meal is Meal => meal !== undefined);

  if (meals.length === 0) return undefined;

  return {
    slug,
    name: draft.name.trim(),
    goal: draft.goal,
    tdeeKcal,
    targetKcal,
    targets,
    meals,
    // Both are in the schema with defaults and neither is worth a builder
    // section: supplements are a standing protocol rather than part of a plan's
    // arithmetic, and the docs' plan-level notes are transcription artefacts.
    supplements: [],
    notes: [],
  };
}

/**
 * Load a plan back into the editor — for Edit, and for "start from a copy".
 *
 * A built-in plan's weekday variants collapse to their **first** variant, since
 * the builder doesn't write them. That's lossy and it's the one place this is,
 * so the copy flow says so rather than letting you find out by saving.
 */
export function toDraftPlan(plan: DietPlan): DraftPlan {
  return {
    name: plan.name,
    goal: plan.goal,
    tdeeKcal: String(plan.tdeeKcal),
    targetKcal: String(plan.targetKcal),
    targets: {
      protein: String(plan.targets.protein),
      carbs: String(plan.targets.carbs),
      fat: String(plan.targets.fat),
    },
    meals: plan.meals.map((meal) => ({
      name: meal.name,
      note: meal.note ?? "",
      options: (meal.variants[0]?.options ?? []).map((option) => ({
        label: option.label ?? "",
        items: option.items,
      })),
    })),
  };
}

/** Whether collapsing this plan to one variant per meal would lose anything. */
export function hasWeekdayVariants(plan: DietPlan): boolean {
  return plan.meals.some((meal) => meal.variants.length > 1);
}
