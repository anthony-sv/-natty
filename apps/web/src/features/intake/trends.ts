import type { DietPlan, Macros } from "@/data/diets";
import {
  effectiveTargetKcal,
  kcalOf,
  variantForDay,
  weekdayOf,
  type FoodSource,
} from "@/features/nutrition/macros";
import { calendarDays } from "@/lib/calendar";
import { resolveIntake, tickedMeals } from "./intake";
import type { IntakeEntry } from "./schema";

/**
 * What you ate, day by day.
 *
 * Pure and injected like `intake.ts` and `macros.ts` — the entries, the plan
 * and a `FoodSource` come in, nothing is imported from a collection or from
 * React, and `now` is a parameter so a window is pinnable in a test.
 *
 * Everything here resolves through the plan at read time, exactly as the Today
 * tab does. That's the same trade `resolveIntake` documents: edit a plan and
 * last Tuesday's numbers change with it, which is right for a plan you follow
 * and would be wrong for a receipt.
 */

export interface DayIntake {
  /** Local midnight. */
  day: number;
  macros: Macros;
  kcal: number;
  /** Plan meals ticked off that day. */
  mealsTicked: number;
  /**
   * Plan meals that *applied* that day — a weekday variant means the count
   * changes between an office day and a weekend, so the denominator has to be
   * worked out per day rather than taken from the plan once.
   */
  mealsAvailable: number;
  /**
   * Calories minus the day's target. Undefined when the plan states none, and
   * also on a day you logged nothing — being 2,000 under because you didn't
   * open the app is not a diet outcome.
   */
  kcalDelta: number | undefined;
  /** Anything at all recorded — a ticked meal or an off-plan item. */
  hasEntries: boolean;
}

export function dailyIntake(
  entries: IntakeEntry[],
  plan: DietPlan,
  foods: FoodSource,
  window: { weeks: number; now: number },
): DayIntake[] {
  const target = effectiveTargetKcal(plan);

  return calendarDays(window).map((day) => {
    const resolved = resolveIntake(entries, plan, foods, day);
    const hasEntries = resolved.meals.length > 0 || resolved.extras.length > 0;

    // Meals the plan actually prescribes on this weekday. A meal whose
    // variants don't cover the day contributes nothing to either side of the
    // fraction, so a plan with weekend-only meals doesn't read as 3/4 all week.
    const weekday = weekdayOf(new Date(day));
    const mealsAvailable = plan.meals.filter(
      (meal) => variantForDay(meal.variants, weekday) !== undefined,
    ).length;

    return {
      day,
      macros: resolved.totals,
      kcal: resolved.kcal,
      mealsTicked: tickedMeals(entries, plan.slug, day).size,
      mealsAvailable,
      kcalDelta:
        target === undefined || !hasEntries
          ? undefined
          : resolved.kcal - target.kcal,
      hasEntries,
    };
  });
}

/**
 * Which of four steps a day's plan adherence lands on, or 0 for a day with
 * nothing ticked.
 *
 * **Fixed thresholds, unlike the training heatmap's quartiles.** That one
 * scales to your own busiest day because five sets is a lot for one person and
 * nothing for another. This is a percentage of a number the plan states, so it
 * already means the same thing for everyone — scaling it to your best week
 * would make a 60% day look like a 100% one in a bad month.
 */
export function adherenceStep(
  ticked: number,
  available: number,
): 0 | 1 | 2 | 3 | 4 {
  if (available <= 0 || ticked <= 0) return 0;
  const share = ticked / available;
  if (share >= 1) return 4;
  if (share >= 0.75) return 3;
  if (share >= 0.5) return 2;
  return 1;
}

/**
 * How far a day's calories drifted, as a signed step.
 *
 * **Diverging, not sequential**: over and under are different outcomes and
 * merging them into "how far off" would lose the only thing you'd act on. The
 * midpoint is the pale one, which is the right way round here — landing on
 * target is the state with nothing to look at, and a day that drifted is what
 * should catch your eye.
 *
 * Undefined input (no target stated, or nothing logged) returns `null` rather
 * than 0, because 0 means "on target" and that is a claim.
 */
export function calorieStep(
  delta: number | undefined,
): -2 | -1 | 0 | 1 | 2 | null {
  if (delta === undefined) return null;
  // 100 kcal is inside the noise of weighing food and of the table you're
  // reading macros off; 400 is a meal.
  if (delta <= -400) return -2;
  if (delta <= -100) return -1;
  if (delta >= 400) return 2;
  if (delta >= 100) return 1;
  return 0;
}

export interface IntakeSummary {
  /** Days with anything logged at all. */
  daysLogged: number;
  /** Days where every meal the plan prescribed was ticked. */
  daysComplete: number;
  /** Mean calories across the days you logged; undefined if there are none. */
  averageKcal: number | undefined;
  /** Mean macros across the same days. */
  averageMacros: Macros | undefined;
}

/**
 * The window in four numbers.
 *
 * Averaged over **days you logged**, not over the whole window: a fortnight
 * you didn't open the app would otherwise drag the mean toward zero and read
 * as a crash diet.
 */
export function summariseIntake(days: DayIntake[]): IntakeSummary {
  const logged = days.filter((day) => day.hasEntries);

  const totals = logged.reduce(
    (sum, day) => ({
      protein: sum.protein + day.macros.protein,
      carbs: sum.carbs + day.macros.carbs,
      fat: sum.fat + day.macros.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 },
  );

  return {
    daysLogged: logged.length,
    daysComplete: logged.filter(
      (day) => day.mealsAvailable > 0 && day.mealsTicked >= day.mealsAvailable,
    ).length,
    averageKcal:
      logged.length === 0
        ? undefined
        : logged.reduce((sum, day) => sum + day.kcal, 0) / logged.length,
    averageMacros:
      logged.length === 0
        ? undefined
        : {
            protein: totals.protein / logged.length,
            carbs: totals.carbs / logged.length,
            fat: totals.fat / logged.length,
          },
  };
}

/** Just the days with something on them, for a chart that shouldn't plot zeroes. */
export function loggedDays(days: DayIntake[]): DayIntake[] {
  return days.filter((day) => day.hasEntries);
}

/** Restated for the chart, which wants one flat row per day. */
export function toMacroPoints(
  days: DayIntake[],
): { id: string; date: Date; protein: number; carbs: number; fat: number; kcal: number }[] {
  return loggedDays(days).map((day) => ({
    id: String(day.day),
    date: new Date(day.day),
    protein: day.macros.protein,
    carbs: day.macros.carbs,
    fat: day.macros.fat,
    kcal: kcalOf(day.macros),
  }));
}
