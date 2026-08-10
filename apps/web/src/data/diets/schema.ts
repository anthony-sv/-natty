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

export const dietPlanSchema = z.object({
  slug: z.string(),
  name: z.string(),
  goal: z.enum(["cutting", "bulking", "maintenance"]),
  /** Total daily energy expenditure the plan was written against. */
  tdeeKcal: z.number().positive(),
  targetKcal: z.number().positive(),
  /**
   * The macro split the plan states. Kept alongside the meals so
   * `diets.test.ts` can check the meals actually add up to it.
   */
  targets: macrosSchema,
  meals: z.array(mealSchema).min(1),
  supplements: z.array(supplementSchema).default([]),
  notes: z.array(z.string()).default([]),
});
export type DietPlan = z.infer<typeof dietPlanSchema>;

/**
 * Water targets, which the source docs give per day type rather than per plan.
 *
 * A "zero coke" counts toward the total but not fully — the docs list the
 * alternatives explicitly rather than giving a formula, so this does too.
 */
export const hydrationOptionSchema = z.object({
  litres: z.number().positive(),
  zeroCokes: z.number().int().nonnegative().default(0),
  note: z.string().optional(),
});
export type HydrationOption = z.infer<typeof hydrationOptionSchema>;

export const hydrationSchema = z.object({
  restDay: z.array(hydrationOptionSchema).min(1),
  trainingDay: z.array(hydrationOptionSchema).min(1),
});
export type Hydration = z.infer<typeof hydrationSchema>;
