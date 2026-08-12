import { z } from "zod";

/**
 * A diet plan, as the source docs write one.
 *
 * The shape mirrors `data/routines/schema.ts`: authored data, validated at
 * import, with every derived number computed rather than stored. The docs
 * state meal and day subtotals; those are the *assertion* the data test checks
 * against, not the source — two copies of one total drift.
 */

export const macrosSchema = z.object({
  protein: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
});
export type Macros = z.infer<typeof macrosSchema>;

/**
 * Whether a weight is taken before or after cooking.
 *
 * Deliberately a flag rather than a conversion: 343g of raw chicken and 150g of
 * cooked chicken are different instructions, and the plan already tells you
 * which one to put on the scale. Yield factors vary by cooking method enough
 * that converting would invent precision.
 */
export const foodStateSchema = z.enum(["raw", "cooked"]);
export type FoodState = z.infer<typeof foodStateSchema>;

/**
 * What kind of food this is, the way a shopping list is organised.
 *
 * **Purely a browsing aid — nothing computes from it.** Macros come from
 * `macros`, and a category that disagreed with them would change no number.
 * That's what makes it safe to leave optional: a food with no category still
 * groups, by whichever macro dominates it (`dominantMacro`), so the picker
 * never has an "Other" bucket that fills up with everything you added.
 *
 * Coarse on purpose, like `muscleSchema`. The point is a heading you can scan
 * past, not a taxonomy — splitting fish from meat would put one entry under
 * each and help nobody.
 */
export const foodCategorySchema = z.enum([
  "vegetables",
  "fruits",
  "grains",
  "tubers",
  "legumes",
  // Eggs sit with dairy, as they do in most food-group tables. Alone they'd be
  // a heading over two rows.
  "dairy-eggs",
  "meat-fish",
  /** Oils, nuts, nut butters, and the fatty fruits that read as fats. */
  "fats",
  "sweets",
  "supplements",
]);
export type FoodCategory = z.infer<typeof foodCategorySchema>;

export const foodSchema = z.object({
  id: z.string(),
  name: z.string(),
  /**
   * What an amount counts. `g`/`ml` foods carry macros per 100; `unit` foods
   * carry them per one of whatever the thing is — an egg, a tortilla, a scoop.
   */
  unit: z.enum(["g", "ml", "unit"]),
  macros: macrosSchema,
  /** Raw and cooked are different foods: the same gram holds different macros. */
  state: foodStateSchema.optional(),
  /** Groups the picker. Optional — see `foodCategorySchema`. */
  category: foodCategorySchema.optional(),
  /** "~50g each", "1 scoop" — what the unit means in the real world. */
  unitNote: z.string().optional(),
});
export type Food = z.infer<typeof foodSchema>;

export const mealItemSchema = z.object({
  foodId: z.string(),
  amount: z.number().positive(),
  /** Per-plan instruction: "from the cafeteria", "mix with water → hotcakes". */
  note: z.string().optional(),
});
export type MealItem = z.infer<typeof mealItemSchema>;

/**
 * One complete version of a meal — the "equivalencies" of the source docs.
 *
 * A full item list rather than a set of overrides, because swapping the protein
 * moves the rice and the avocado with it. The docs write four alternative
 * lunches; modelling that as three edits to a base would be a lossier way of
 * saying the same thing.
 */
export const mealOptionSchema = z.object({
  /** Omitted when a variant has only one option, and then nothing is rendered. */
  label: z.string().optional(),
  items: z.array(mealItemSchema).min(1),
});
export type MealOption = z.infer<typeof mealOptionSchema>;

export const weekdaySchema = z.enum([
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);
export type Weekday = z.infer<typeof weekdaySchema>;

/**
 * A meal on some subset of the week.
 *
 * `days` omitted means every day. The docs' "Office days (Tue · Wed · Thu)"
 * versus "Home days" split is the reason this exists — it changes what you eat
 * *and* how it's weighed.
 */
export const mealVariantSchema = z.object({
  label: z.string().optional(),
  days: z.array(weekdaySchema).min(1).optional(),
  options: z.array(mealOptionSchema).min(1),
});
export type MealVariant = z.infer<typeof mealVariantSchema>;

export const mealSchema = z.object({
  name: z.string(),
  note: z.string().optional(),
  variants: z.array(mealVariantSchema).min(1),
});
export type Meal = z.infer<typeof mealSchema>;

export const supplementSchema = z.object({
  name: z.string(),
  dose: z.string(),
  /** "with breakfast", "pre-lifting", "before bed". Grouped by this on screen. */
  timing: z.string(),
  note: z.string().optional(),
});
export type Supplement = z.infer<typeof supplementSchema>;

/**
 * A macro goal, one macro at a time.
 *
 * Deliberately **not** `macrosSchema.optional()`, which is all-or-nothing.
 * "180g of protein and I don't care about the rest" is a real way to eat, and
 * the validation only checks what you actually stated.
 */
export const macroTargetsSchema = z.object({
  protein: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
});
export type MacroTargets = z.infer<typeof macroTargetsSchema>;

export const dietPlanSchema = z.object({
  slug: z.string(),
  name: z.string(),
  goal: z.enum(["cutting", "bulking", "maintenance"]),
  /**
   * Total daily energy expenditure the plan was written against.
   *
   * Optional, like `targetKcal` and every macro target: a plan you write to
   * record what you eat shouldn't demand two numbers you may not know. The
   * transcribed plans state all of them; a plan of your own may state none.
   */
  tdeeKcal: z.number().positive().optional(),
  /** Omitted means "whatever the macro targets come to" — see `effectiveTargetKcal`. */
  targetKcal: z.number().positive().optional(),
  /**
   * The macro split the plan states. Kept alongside the meals so
   * `diets.test.ts` can check the meals actually add up to it.
   */
  targets: macroTargetsSchema.default({}),
  meals: z.array(mealSchema).min(1),
  supplements: z.array(supplementSchema).default([]),
  notes: z.array(z.string()).default([]),
});
export type DietPlan = z.infer<typeof dietPlanSchema>;
