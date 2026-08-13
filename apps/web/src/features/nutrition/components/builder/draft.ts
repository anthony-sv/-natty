import type { DietPlan, MacroTargets, Meal, MealItem } from "@/data/diets";

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
  /** Free lines under the plan — editable, one per row. */
  notes: string[];
  /**
   * Carried through the editor untouched rather than edited.
   *
   * There's no supplements section yet, and dropping them on save is the
   * thing that must not happen: editing a plan's name would have quietly
   * deleted a protocol you'd copied from elsewhere. Round-tripping something
   * you can't yet edit is a strictly better position than destroying it.
   */
  supplements: DietPlan["supplements"];
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
    notes: [],
    supplements: [],
  };
}

function positive(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** Undefined for a blank field, so "not stated" survives as not stated. */
function optionalNonNegative(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
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

  // All optional. A plan that just records what you eat shouldn't demand a
  // maintenance figure you may not know, and blank stays blank rather than
  // becoming a zero that reads as a stated goal of nothing.
  const tdeeKcal = positive(draft.tdeeKcal);
  const targetKcal = positive(draft.targetKcal);

  const targets: MacroTargets = {
    protein: optionalNonNegative(draft.targets.protein),
    carbs: optionalNonNegative(draft.targets.carbs),
    fat: optionalNonNegative(draft.targets.fat),
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
    supplements: draft.supplements,
    // Blank rows are dropped rather than saved: an empty note renders as an
    // empty bullet, which reads as something failing to load.
    notes: draft.notes.map((note) => note.trim()).filter((note) => note !== ""),
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
    // Blank stays blank on the way back in, so an unstated figure doesn't
    // become the string "undefined" in the field.
    tdeeKcal: plan.tdeeKcal !== undefined ? String(plan.tdeeKcal) : "",
    targetKcal: plan.targetKcal !== undefined ? String(plan.targetKcal) : "",
    targets: {
      protein: plan.targets.protein !== undefined ? String(plan.targets.protein) : "",
      carbs: plan.targets.carbs !== undefined ? String(plan.targets.carbs) : "",
      fat: plan.targets.fat !== undefined ? String(plan.targets.fat) : "",
    },
    meals: plan.meals.map((meal) => ({
      name: meal.name,
      note: meal.note ?? "",
      options: (meal.variants[0]?.options ?? []).map((option) => ({
        label: option.label ?? "",
        items: option.items,
      })),
    })),
    notes: [...plan.notes],
    supplements: plan.supplements,
  };
}

/** Whether collapsing this plan to one variant per meal would lose anything. */
export function hasWeekdayVariants(plan: DietPlan): boolean {
  return plan.meals.some((meal) => meal.variants.length > 1);
}
