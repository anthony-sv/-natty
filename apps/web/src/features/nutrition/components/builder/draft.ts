import type {
  DietPlan,
  MacroTargets,
  Meal,
  MealItem,
  MealVariant,
  Weekday,
} from "@/data/diets";
import { weekdays } from "../../macros";

/**
 * The plan builder's working copy.
 *
 * A draft parsed by `dietPlanSchema` on save rather than a TanStack Form, for
 * the reason `RoutineBuilder` records: this is a document editor with nested
 * dynamic arrays where nearly every interaction is structural, and the schema
 * is the authority either way.
 *
 * **It writes everything the model can say**: swap options, and versions of
 * a meal for different weekdays. Copying a built-in used to keep only the
 * first version of each meal, so a dinner that rotates through the week came
 * out as one dinner every day.
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
  /**
   * The meal on different days of the week. Almost always one, with no days:
   * the meal is the same every day.
   */
  variants: DraftVariant[];
}

export interface DraftVariant {
  label: string;
  /**
   * The days this version is for. None means every day no other version
   * names, the way `variantForDay` reads a variant without `days` — so a
   * meal's only version with none is simply every day.
   */
  days: Weekday[];
  /** Interchangeable versions of the same meal — the docs' "equivalencies". */
  options: DraftOption[];
}

export interface DraftOption {
  label: string;
  items: MealItem[];
}

/** Meals default to "Meal 1"… rather than to a guess at what you eat when. */
export function emptyMeal(index: number): DraftMeal {
  return {
    name: `Meal ${index + 1}`,
    note: "",
    variants: [{ label: "", days: [], options: [{ label: "", items: [] }] }],
  };
}

/**
 * The days each version actually ends up on, by the rule `variantForDay`
 * applies: a version that names the day wins, otherwise the first that names
 * none.
 *
 * Which is how the editor knows a version can never be reached — a second one
 * with no days picked, or one with none left over — and can say so before it's
 * saved as a version nobody ever eats.
 */
export function daysCovered(variants: { days: Weekday[] }[]): Weekday[][] {
  const fallback = variants.findIndex((variant) => variant.days.length === 0);
  return variants.map((_, index) =>
    weekdays().filter((day) => {
      const named = variants.findIndex((variant) => variant.days.includes(day));
      return (named !== -1 ? named : fallback) === index;
    }),
  );
}

/** Whether a meal is written per day rather than once for the whole week. */
export function variesByDay(meal: DraftMeal): boolean {
  return meal.variants.length > 1 || (meal.variants[0]?.days.length ?? 0) > 0;
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

  let unreachable = false;
  const meals: Meal[] = draft.meals
    .map((meal): Meal | undefined => {
      // A version with nothing in it is dropped, like an empty swap — which
      // is why reachability is judged on what's left.
      const kept = meal.variants
        .map((variant) => ({ ...variant, options: keptOptions(variant.options) }))
        .filter((variant) => variant.options.length > 0);
      if (kept.length === 0) return undefined;
      if (daysCovered(kept).some((days) => days.length === 0)) unreachable = true;

      return {
        name: meal.name.trim() === "" ? "Meal" : meal.name.trim(),
        note: meal.note.trim() === "" ? undefined : meal.note.trim(),
        variants: kept.map(
          (variant): MealVariant => ({
            label: variant.label.trim() === "" ? undefined : variant.label.trim(),
            // None picked is `days` left out, which means every other day.
            days:
              variant.days.length === 0
                ? undefined
                : weekdays().filter((day) => variant.days.includes(day)),
            options: variant.options,
          }),
        ),
      };
    })
    .filter((meal): meal is Meal => meal !== undefined);

  // A version no day ever reaches would save as dead weight, and reads as a
  // meal you're following when you aren't. The editor names it; Save waits.
  if (meals.length === 0 || unreachable) return undefined;

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

/** An option with nothing in it isn't a swap, it's an empty row. */
function keptOptions(options: DraftOption[]) {
  return options
    .filter((option) => option.items.some((item) => item.foodId !== ""))
    .map((option) => ({
      label: option.label.trim() === "" ? undefined : option.label.trim(),
      items: option.items.filter((item) => item.foodId !== ""),
    }));
}

/** Load a plan back into the editor — for Edit, and for "start from a copy". */
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
      variants: meal.variants.map((variant) => ({
        label: variant.label ?? "",
        days: variant.days ? [...variant.days] : [],
        options: variant.options.map((option) => ({
          label: option.label ?? "",
          items: option.items,
        })),
      })),
    })),
    notes: [...plan.notes],
    supplements: plan.supplements,
  };
}

