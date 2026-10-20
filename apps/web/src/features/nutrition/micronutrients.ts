import { NUTRIENTS, type MealItem, type Nutrient } from "@/data/diets";
import {
  addMacros,
  fiberTarget,
  kcalOf,
  macrosForAmount,
  ZERO,
  type FoodSource,
} from "./macros";

/**
 * Vitamins, minerals and electrolytes for a day, against a reference intake —
 * and the category scores built from them.
 *
 * Pure and injected like `macros.ts`: the foods come in through a
 * `FoodSource`, so this tests against a two-food fixture rather than the whole
 * table.
 *
 * ## The targets
 *
 * The US/Canadian Dietary Reference Intakes for adults 19–50 — the RDA where
 * one exists, the adequate intake where it doesn't. They're the reference
 * almost every label and tracker uses, and the sports-nutrition literature
 * doesn't replace them: its consensus is that someone eating enough to fuel
 * their training meets them from food, and that supplementing above them
 * doesn't improve performance. Where training *does* move a number — sweat
 * takes sodium, potassium and some magnesium, zinc and iron with it — it's the
 * electrolytes, and the panel says that in words rather than inventing a
 * per-person sweat-rate figure.
 *
 * Two targets aren't DRIs because there is none:
 *
 * - **EPA + DHA** at 0.5 g, the top of the 250–500 mg most heart and dietetic
 *   bodies recommend. Plant omega-3 (ALA) doesn't count towards it — the body
 *   converts only a few percent — so ALA is its own row with its own AI.
 * - **Fibre**, which is `fiberTarget` — 14 g per 1,000 kcal — rather than a
 *   flat number. See `macros.ts`.
 *
 * Where men's and women's values differ the profile's sex picks; unset, the
 * panel uses the men's column and says so, since it's the higher one for every
 * nutrient except iron.
 */

export type Sex = "male" | "female";

export interface NutrientReference {
  target: Record<Sex, number>;
  /**
   * The tolerable upper intake level, where one applies to food *and*
   * supplements together. Left off where the UL covers supplements only
   * (magnesium, niacin, folate, vitamin E) — food can't reach those, and
   * flagging a food total against them would be wrong.
   */
  upper?: number;
}

export const REFERENCES: Record<Nutrient, NutrientReference> = {
  vitaminA: { target: { male: 900, female: 700 }, upper: 3000 },
  vitaminC: { target: { male: 90, female: 75 }, upper: 2000 },
  vitaminD: { target: { male: 15, female: 15 }, upper: 100 },
  vitaminE: { target: { male: 15, female: 15 } },
  vitaminK: { target: { male: 120, female: 90 } },
  thiamin: { target: { male: 1.2, female: 1.1 } },
  riboflavin: { target: { male: 1.3, female: 1.1 } },
  niacin: { target: { male: 16, female: 14 } },
  vitaminB6: { target: { male: 1.3, female: 1.3 }, upper: 100 },
  folate: { target: { male: 400, female: 400 } },
  vitaminB12: { target: { male: 2.4, female: 2.4 } },
  choline: { target: { male: 550, female: 425 }, upper: 3500 },
  calcium: { target: { male: 1000, female: 1000 }, upper: 2500 },
  phosphorus: { target: { male: 700, female: 700 }, upper: 4000 },
  magnesium: { target: { male: 400, female: 310 } },
  iron: { target: { male: 8, female: 18 }, upper: 45 },
  zinc: { target: { male: 11, female: 8 }, upper: 40 },
  selenium: { target: { male: 55, female: 55 }, upper: 400 },
  potassium: { target: { male: 3400, female: 2600 } },
  /**
   * The adequate intake is 1,500; 2,300 is the chronic-disease risk reduction
   * level, and it's what `upper` means here. Someone sweating through an hour
   * of training a day loses several hundred milligrams in it, which is why
   * going over reads as "high" and not as a failure.
   */
  sodium: { target: { male: 1500, female: 1500 }, upper: 2300 },
  epaDha: { target: { male: 0.5, female: 0.5 } },
  ala: { target: { male: 1.6, female: 1.1 } },
};

/** A row in the report: every micronutrient, plus fibre. */
export type ReportKey = Nutrient | "fiber";

/**
 * What each score is made of.
 *
 * Grouped by what the nutrient is *known* to do, from the same reference texts
 * — so magnesium sits under minerals, electrolytes, bone and metabolism at
 * once, because it genuinely does all four. These are a reading aid over the
 * table below them, not a claim that a percentage means a stronger immune
 * system.
 */
export const CATEGORIES = {
  vitamins: [
    "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminK", "thiamin",
    "riboflavin", "niacin", "vitaminB6", "folate", "vitaminB12", "choline",
  ],
  minerals: ["calcium", "phosphorus", "magnesium", "iron", "zinc", "selenium"],
  electrolytes: ["sodium", "potassium", "magnesium", "calcium"],
  immune: [
    "vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminB6", "zinc",
    "selenium", "iron",
  ],
  antioxidants: ["vitaminC", "vitaminE", "vitaminA", "selenium", "zinc"],
  bone: ["calcium", "vitaminD", "vitaminK", "magnesium", "phosphorus"],
  metabolism: [
    "thiamin", "riboflavin", "niacin", "vitaminB6", "vitaminB12", "folate",
    "iron", "magnesium", "choline",
  ],
  heart: ["epaDha", "ala", "fiber", "potassium", "magnesium"],
} as const satisfies Record<string, readonly ReportKey[]>;
export type Category = keyof typeof CATEGORIES;

export interface DayNutrients {
  totals: Record<ReportKey, number>;
  kcal: number;
  /**
   * The share of the day's calories that came from foods carrying micronutrient
   * data. Your own foods and anything a deleted id points at don't, and a day
   * built mostly from them would otherwise read as deficient in everything.
   */
  coverage: number;
}

/**
 * Sum a day's items.
 *
 * A recipe resolves through the same `FoodSource` with its ingredients' micros
 * already folded in (`recipeAsFood`), so nothing here knows recipes exist.
 */
export function dayNutrients(items: MealItem[], foods: FoodSource): DayNutrients {
  const totals = Object.fromEntries(
    [...NUTRIENTS, "fiber"].map((key) => [key, 0]),
  ) as Record<ReportKey, number>;
  let macros = ZERO;
  let coveredKcal = 0;

  for (const item of items) {
    const food = foods.get(item.foodId);
    if (food === undefined) continue;
    const itemMacros = macrosForAmount(food, item.amount);
    macros = addMacros(macros, itemMacros);
    totals.fiber += itemMacros.fiber ?? 0;
    if (food.micros === undefined) continue;

    coveredKcal += kcalOf(itemMacros);
    const factor = food.unit === "unit" ? item.amount : item.amount / 100;
    for (const nutrient of NUTRIENTS) {
      totals[nutrient] += (food.micros[nutrient] ?? 0) * factor;
    }
  }

  const kcal = kcalOf(macros);
  // A day of nothing is fully covered by definition — there's nothing missing.
  return { totals, kcal, coverage: kcal > 0 ? coveredKcal / kcal : 1 };
}

/**
 * Close is three quarters of the way. The bands are the ones every tracker
 * draws and nothing more scientific than that: an RDA already carries a margin
 * over the average requirement, so 80% of one is rarely a deficiency — but a
 * plan reads better when it says "slightly low" than when it pretends.
 */
export const CLOSE_RATIO = 0.75;

export type NutrientStatus = "met" | "close" | "low" | "high";

export interface NutrientRow {
  key: ReportKey;
  amount: number;
  target: number;
  upper?: number;
  /** amount / target, unclamped. */
  ratio: number;
  status: NutrientStatus;
}

export function nutrientRows(day: DayNutrients, sex: Sex): NutrientRow[] {
  const rows: NutrientRow[] = NUTRIENTS.map((key) => {
    const { target, upper } = REFERENCES[key];
    return row(key, day.totals[key], target[sex], upper);
  });
  rows.push(row("fiber", day.totals.fiber, fiberTarget(day.kcal)));
  return rows;
}

function row(
  key: ReportKey,
  amount: number,
  target: number,
  upper?: number,
): NutrientRow {
  const ratio = target > 0 ? amount / target : 0;
  const status: NutrientStatus =
    upper !== undefined && amount > upper
      ? "high"
      : ratio >= 1
        ? "met"
        : ratio >= CLOSE_RATIO
          ? "close"
          : "low";
  return { key, amount, target, upper, ratio, status };
}

/**
 * Each category as the mean of its nutrients' progress, each capped at 100%.
 *
 * Capped because 400% of your vitamin K can't make up for 30% of your vitamin
 * E, and an uncapped mean would let it. Going over an upper limit doesn't
 * *lower* a score — the row says "high" instead — since folding a ceiling into
 * a "how covered are you" number would make it mean two things.
 */
export function categoryScores(
  rows: NutrientRow[],
): Record<Category | "all", number> {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const score = (keys: readonly ReportKey[]) =>
    keys.reduce((sum, key) => sum + Math.min(byKey.get(key)?.ratio ?? 0, 1), 0) /
    keys.length;

  const scores = Object.fromEntries(
    (Object.keys(CATEGORIES) as Category[]).map((category) => [
      category,
      score(CATEGORIES[category]),
    ]),
  ) as Record<Category, number>;
  return { all: score(rows.map((r) => r.key)), ...scores };
}
