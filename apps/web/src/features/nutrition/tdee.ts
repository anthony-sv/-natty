import type { DietPlan } from "@/data/diets";

/**
 * A calorie estimate to fill the plan builder's TDEE/target fields, from data
 * the app already has: the profile, your latest weigh-in, and how many days a
 * week the active routine trains.
 *
 * Pure and unit-tested, like `hydration.ts`/`macros.ts` — no React, no
 * collection. **Never invents a number it can't reason about**: every
 * function here returns `undefined` rather than a guess when an input is
 * missing, the same rule `suggestOverload`/`potentialFor` already follow.
 */

/**
 * Mifflin-St Jeor — the standard estimate, and the one every activity-factor
 * table published alongside it assumes.
 */
export function estimatedBmr({
  weightKg,
  heightCm,
  age,
  sex,
}: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "male" | "female";
}): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/**
 * The standard Mifflin-St Jeor activity multipliers, keyed by training days a
 * week rather than the usual vague "lightly active" wording — we know the
 * actual number from the active routine, so there's no reason to make you
 * translate it back into an adjective.
 */
export function activityFactorForTrainingDays(days: number): number {
  if (days <= 0) return 1.2; // Sedentary
  if (days <= 3) return 1.375; // Light
  if (days <= 5) return 1.55; // Moderate
  if (days === 6) return 1.725; // Active
  return 1.9; // Very active
}

export function estimatedTdee(bmr: number, activityFactor: number): number {
  return bmr * activityFactor;
}

/** The nearest 10 — matching how the built-in plans state their own figures. */
function roundToTen(kcal: number): number {
  return Math.round(kcal / 10) * 10;
}

/**
 * ±200 kcal off TDEE depending on the plan's stated goal — the standard
 * conservative lean/gain adjustment, not a percentage: a percentage of TDEE
 * swings by hundreds of kcal between a small and a large person for the same
 * "how fast" intent, where a flat offset doesn't.
 */
export function suggestedTargetKcal(
  tdeeKcal: number,
  goal: DietPlan["goal"],
): number {
  const offset = goal === "cutting" ? -200 : goal === "bulking" ? 200 : 0;
  return roundToTen(tdeeKcal + offset);
}
