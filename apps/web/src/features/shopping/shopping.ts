import type { DietPlan, MealItem } from "@/data/diets";
import type { Habit, HabitLog } from "@/features/habits/schema";
import type { IntakeEntry } from "@/features/intake/schema";
import { itemsForMealEntry } from "@/features/intake/intake";
import { resolveDay, weekdayOf, type FoodSource } from "@/features/nutrition/macros";
import type { Recipe } from "@/features/pantry/schema";
import type { Supplement } from "@/features/supplements/schema";
import { addDays, startOfDay } from "@/lib/week";
import type { ShoppingItem, StockItem } from "./schema";

/**
 * Stock levels and the shopping list, derived.
 *
 * Pure and injected like `intake.ts` and `volume.ts`: what you ate, ticked
 * and did arrives as arguments, nothing is read from a collection, and `now`
 * is a parameter. Every figure here is a function of the log — so unticking a
 * meal puts the rice back, with nothing stored to correct.
 */

const DAY_MS = 86_400_000;
/** How far back "how fast does this go" looks once there's enough history. */
const MEASURE_WINDOW_DAYS = 14;
/** Fewer days than this and a measured rate is mostly noise. */
const MIN_MEASURED_DAYS = 7;

/** Everything that can use something up, as the app has it right now. */
export interface ConsumptionSources {
  intake: IntakeEntry[];
  habitLogs: HabitLog[];
  habits: Habit[];
  supplements: Supplement[];
  /** A ticked meal resolves through its plan, as the Today tab does. */
  planFor: (slug: string) => DietPlan | undefined;
  /** Raw recipes, so a portion of one breaks down into its ingredients. */
  recipes: Map<string, Recipe>;
}

/**
 * A food eaten, as the things you'd have bought for it.
 *
 * A recipe is cooked from ingredients, and those are what's in the cupboard —
 * so 250 g of a chili weighed at 1,000 g cooked takes a quarter of each
 * ingredient line. Recipes can't nest, so one level is all there is.
 */
export function expandToIngredients(
  foodId: string,
  amount: number,
  recipes: Map<string, Recipe>,
): MealItem[] {
  const recipe = recipes.get(foodId);
  if (recipe === undefined) return [{ foodId, amount }];
  const fraction =
    recipe.portioning.kind === "servings"
      ? amount / recipe.portioning.servings
      : amount / recipe.portioning.cookedGrams;
  return recipe.ingredients.map((item) => ({
    foodId: item.foodId,
    amount: item.amount * fraction,
  }));
}

function addTo(map: Map<string, number>, key: string, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

/** What got used in `[from, to)`, by what it was. */
export interface UsageIndex {
  food: Map<string, number>;
  supplementServings: Map<string, number>;
  habitAmount: Map<string, number>;
}

/**
 * Everything used in a window, in one pass over the logs.
 *
 * Intake is placed by `loggedAt` — when you ticked it — rather than by the
 * day it's filed under, because "since I counted the bag" is a moment, and a
 * breakfast ticked before you restocked was eaten from the old bag. Habit
 * logs carry only a day, so a habit counts from the start of the day the
 * window opens: on the day you restock, the morning's brushes count against
 * the new tube. That errs towards running out early, which is the safe way
 * round for a shopping list.
 */
export function usageBetween(
  sources: ConsumptionSources,
  from: number,
  to: number,
): UsageIndex {
  const food = new Map<string, number>();
  const supplementServings = new Map<string, number>();
  const habitAmount = new Map<string, number>();

  for (const entry of sources.intake) {
    if (entry.loggedAt < from || entry.loggedAt >= to) continue;
    const { source } = entry;
    if (source.kind === "supplement") {
      addTo(supplementServings, source.supplementId, 1);
      continue;
    }
    const items =
      source.kind === "item"
        ? [{ foodId: source.foodId, amount: source.amount }]
        : (() => {
            const plan = sources.planFor(source.planSlug);
            if (plan === undefined) return [];
            return (
              itemsForMealEntry(plan, source.mealName, source.optionIndex, entry.day) ??
              []
            );
          })();
    for (const item of items) {
      for (const part of expandToIngredients(item.foodId, item.amount, sources.recipes)) {
        addTo(food, part.foodId, part.amount);
      }
    }
  }

  const firstDay = startOfDay(from);
  for (const log of sources.habitLogs) {
    if (log.day < firstDay || log.day >= to) continue;
    addTo(habitAmount, log.habitId, log.amount);
  }

  return { food, supplementServings, habitAmount };
}

/** How much of this stock item a window's usage took. */
export function usedBy(item: StockItem, usage: UsageIndex): number {
  let used = 0;
  for (const use of item.uses) {
    if (use.kind === "food") used += (usage.food.get(use.foodId) ?? 0) * use.factor;
    else if (use.kind === "supplement")
      used += (usage.supplementServings.get(use.supplementId) ?? 0) * use.perServing;
    else used += (usage.habitAmount.get(use.habitId) ?? 0) * use.perTime;
  }
  return used;
}

/**
 * What a plan asks you to eat over `days` days from `fromDay`, per food, in
 * ingredients.
 *
 * The weekday variant is the one each day falls on, and the swap is the
 * first option — the default the plan page shows. A week of different
 * lunches is four rows of different proteins the list can't choose between,
 * and the first is the one the plan writes down first.
 */
export function planNeeds(
  plan: DietPlan,
  foods: FoodSource,
  recipes: Map<string, Recipe>,
  fromDay: number,
  days: number,
): Map<string, number> {
  const needs = new Map<string, number>();
  for (let offset = 0; offset < days; offset++) {
    const day = addDays(fromDay, offset);
    for (const meal of resolveDay(plan, weekdayOf(new Date(day)), foods)) {
      for (const item of meal.items) {
        for (const part of expandToIngredients(item.foodId, item.amount, recipes)) {
          addTo(needs, part.foodId, part.amount);
        }
      }
    }
  }
  return needs;
}

/** Share of the week a habit is due — what its daily average is scaled by. */
function dueShare(habit: Habit): number {
  const { schedule } = habit;
  if (schedule.kind === "weekdays") return schedule.days.length / 7;
  if (schedule.kind === "weekly") return schedule.timesPerWeek / 7;
  return 1;
}

/**
 * The rate the app expects from what you've told it, before it has history:
 * the plan's daily average, the stack's servings, the habit's target.
 */
export function plannedDailyUse(
  item: StockItem,
  sources: Pick<ConsumptionSources, "habits" | "supplements">,
  planDaily: Map<string, number>,
): number {
  let perDay = 0;
  for (const use of item.uses) {
    if (use.kind === "food") {
      perDay += (planDaily.get(use.foodId) ?? 0) * use.factor;
    } else if (use.kind === "supplement") {
      const supplement = sources.supplements.find((s) => s.id === use.supplementId);
      if (supplement !== undefined && supplement.archivedAt === undefined) {
        perDay += supplement.servingsPerDay * use.perServing;
      }
    } else {
      const habit = sources.habits.find((h) => h.id === use.habitId);
      if (habit !== undefined && habit.archivedAt === undefined) {
        perDay += habit.target.perDay * dueShare(habit) * use.perTime;
      }
    }
  }
  return perDay;
}

export type DailyUseSource = "manual" | "measured" | "plan";

export interface StockStatus {
  item: StockItem;
  /** Never below zero — "−40 g of rice" isn't a thing you have. */
  remaining: number;
  /** Packages' worth left; above 1 when you've more than one. */
  packages: number;
  dailyUse?: { value: number; source: DailyUseSource };
  /** Undefined when nothing says how fast it goes. */
  daysLeft?: number;
}

/**
 * Where one stock item stands.
 *
 * The rate, in order of trust: yours if you set one; what you actually used
 * over the last two weeks once there are a week's worth of days to go on;
 * what the plan, the stack and your habits say you *will* use; and finally a
 * short measured window, which is better than nothing but not better than a
 * plan. Measured beats planned when there's enough of it because it's what
 * really happened — the plan doesn't know you skipped lunch twice.
 */
export function stockStatus(
  item: StockItem,
  sources: ConsumptionSources,
  planDaily: Map<string, number>,
  now: number,
): StockStatus {
  const sinceCount = usedBy(item, usageBetween(sources, item.countedAt, now));
  const remaining = Math.max(0, item.onHand - sinceCount);

  const windowStart = Math.max(now - MEASURE_WINDOW_DAYS * DAY_MS, item.createdAt);
  const spanDays = (now - windowStart) / DAY_MS;
  const measuredUse = usedBy(item, usageBetween(sources, windowStart, now));
  const measured = spanDays > 0 ? measuredUse / spanDays : 0;
  const planned = plannedDailyUse(item, sources, planDaily);

  const dailyUse: StockStatus["dailyUse"] =
    item.dailyUse !== undefined
      ? { value: item.dailyUse, source: "manual" }
      : spanDays >= MIN_MEASURED_DAYS && measured > 0
        ? { value: measured, source: "measured" }
        : planned > 0
          ? { value: planned, source: "plan" }
          : spanDays >= 1 && measured > 0
            ? { value: measured, source: "measured" }
            : undefined;

  return {
    item,
    remaining,
    packages: remaining / item.packageSize,
    dailyUse,
    daysLeft: dailyUse === undefined ? undefined : remaining / dailyUse.value,
  };
}

export interface LowStockRow extends StockStatus {
  /** Packages that see you through the window — at least one. */
  suggestedPackages: number;
}

export interface PlanRow {
  foodId: string;
  amount: number;
  checked: boolean;
}

export interface ShoppingList {
  low: LowStockRow[];
  plan: PlanRow[];
  manual: ShoppingItem[];
}

/**
 * The list for the next `horizonDays`.
 *
 * Three sections, and a food is only ever in one:
 *
 * - **Running low** — stock that's empty or runs out inside the window.
 * - **For your plan** — what the plan needs over the window, for foods you
 *   *don't* track. A tracked food is already answered by its stock row,
 *   which knows what you have; listing it here too would tell you to buy
 *   rice you're holding.
 * - **Other** — what you typed.
 */
export function shoppingList({
  stock,
  sources,
  plan,
  foods,
  shoppingItems,
  now,
  horizonDays,
}: {
  stock: StockItem[];
  sources: ConsumptionSources;
  plan: DietPlan | undefined;
  foods: FoodSource;
  shoppingItems: ShoppingItem[];
  now: number;
  horizonDays: number;
}): ShoppingList {
  const today = startOfDay(now);
  const active = stock.filter((item) => item.archivedAt === undefined);
  const planDaily = dailyPlanAverage(plan, foods, sources.recipes, today);

  const low = active
    .map((item) => stockStatus(item, sources, planDaily, now))
    .filter(
      (status) =>
        status.remaining <= 0 ||
        (status.daysLeft !== undefined && status.daysLeft <= horizonDays),
    )
    .map((status): LowStockRow => {
      const short =
        status.dailyUse === undefined
          ? status.item.packageSize
          : status.dailyUse.value * horizonDays - status.remaining;
      return {
        ...status,
        suggestedPackages: Math.max(1, Math.ceil(short / status.item.packageSize)),
      };
    })
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));

  const tracked = new Set(
    active.flatMap((item) =>
      item.uses.flatMap((use) => (use.kind === "food" ? [use.foodId] : [])),
    ),
  );
  const checkedSince = now - horizonDays * DAY_MS;
  const checkedFoods = new Set(
    shoppingItems.flatMap((row) =>
      row.source.kind === "planFood" &&
      row.checkedAt !== undefined &&
      row.checkedAt >= checkedSince
        ? [row.source.foodId]
        : [],
    ),
  );
  const planRows =
    plan === undefined
      ? []
      : [...planNeeds(plan, foods, sources.recipes, today, horizonDays)]
          .filter(([foodId, amount]) => amount > 0 && !tracked.has(foodId))
          .map(([foodId, amount]) => ({
            foodId,
            amount,
            checked: checkedFoods.has(foodId),
          }));

  const manual = shoppingItems
    .filter((row) => row.source.kind === "manual")
    .sort(
      (a, b) =>
        Number(a.checkedAt !== undefined) - Number(b.checkedAt !== undefined) ||
        a.createdAt - b.createdAt,
    );

  return { low, plan: planRows, manual };
}

/** The plan's average day over the coming week, per food — a weekday-fair rate. */
export function dailyPlanAverage(
  plan: DietPlan | undefined,
  foods: FoodSource,
  recipes: Map<string, Recipe>,
  today: number,
): Map<string, number> {
  if (plan === undefined) return new Map();
  const week = planNeeds(plan, foods, recipes, today, 7);
  return new Map([...week].map(([foodId, amount]) => [foodId, amount / 7]));
}
