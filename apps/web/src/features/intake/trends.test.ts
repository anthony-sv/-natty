import { describe, expect, it } from "vitest";
import { startOfDay } from "@/lib/week";
import {
  adherenceStep,
  calorieStep,
  dailyIntake,
  loggedDays,
  summariseIntake,
} from "./trends";
import type { DietPlan, Food } from "@/data/diets";
import type { FoodSource } from "@/features/nutrition/macros";
import type { IntakeEntry } from "./schema";

const chicken: Food = {
  id: "chicken",
  name: "Chicken",
  unit: "g",
  // 200g -> P62 F7.2 C0 -> 312.8 kcal
  macros: { protein: 31, fat: 3.6, carbs: 0 },
};
const egg: Food = {
  id: "egg",
  name: "Egg",
  unit: "unit",
  // 3 -> P18 F15 C1.5 -> 213 kcal (72 + 6 + 135)
  macros: { protein: 6, fat: 5, carbs: 0.5 },
};

const table = new Map([chicken, egg].map((food) => [food.id, food]));
const foods: FoodSource = { get: (id) => table.get(id) };

/** A Wednesday, and the two days either side of it. */
const WED = startOfDay(new Date(2026, 7, 12).getTime());
const TUE = startOfDay(new Date(2026, 7, 11).getTime());

function plan(overrides: Partial<DietPlan> = {}): DietPlan {
  return {
    slug: "test-plan",
    name: "Test plan",
    targets: {},
    meals: [
      {
        name: "Lunch",
        variants: [{ options: [{ items: [{ foodId: "chicken", amount: 200 }] }] }],
      },
      {
        name: "Dinner",
        variants: [{ options: [{ items: [{ foodId: "egg", amount: 3 }] }] }],
      },
    ],
    supplements: [],
    notes: [],
    ...overrides,
  } as DietPlan;
}

function meal(day: number, name: string): IntakeEntry {
  return {
    id: `${name}-${day}`,
    day,
    loggedAt: day,
    source: { kind: "meal", planSlug: "test-plan", mealName: name, optionIndex: 0 },
  };
}

/** Four weeks ending in the one WED falls in. */
const WINDOW = { weeks: 4, now: WED };

describe("dailyIntake", () => {
  it("covers every real day in the window, and none that haven't happened", () => {
    const days = dailyIntake([], plan(), foods, WINDOW);

    // Four Monday-to-Sunday weeks, minus the part of the current one that is
    // still in the future. WED is day 3 of its week, so four days are padding.
    expect(days).toHaveLength(4 * 7 - 4);
    expect(days[days.length - 1].day).toBe(WED);
  });

  it("resolves each day's macros through the plan", () => {
    const days = dailyIntake(
      [meal(WED, "Lunch"), meal(WED, "Dinner")],
      plan(),
      foods,
      WINDOW,
    );
    const wed = days.find((day) => day.day === WED)!;

    expect(wed.macros.protein).toBeCloseTo(80, 6);
    expect(wed.kcal).toBeCloseTo(525.8, 1);
    expect(wed.hasEntries).toBe(true);
  });

  it("counts ticked meals against the ones the plan offered that day", () => {
    const days = dailyIntake([meal(WED, "Lunch")], plan(), foods, WINDOW);
    const wed = days.find((day) => day.day === WED)!;

    expect(wed.mealsTicked).toBe(1);
    expect(wed.mealsAvailable).toBe(2);
  });

  /**
   * A meal whose variants don't cover the day is out of both sides of the
   * fraction — otherwise a plan with a weekend-only meal reads as 3/4 all week.
   */
  it("leaves a meal that doesn't apply out of the denominator", () => {
    const weekendOnly = plan({
      meals: [
        ...plan().meals,
        {
          name: "Cheat meal",
          variants: [
            { days: ["sat", "sun"], options: [{ items: [{ foodId: "egg", amount: 3 }] }] },
          ],
        },
      ],
    });

    const wed = dailyIntake([], weekendOnly, foods, WINDOW).find(
      (day) => day.day === WED,
    )!;

    expect(wed.mealsAvailable).toBe(2);
  });

  it("has no calorie delta when the plan states no target", () => {
    const wed = dailyIntake([meal(WED, "Lunch")], plan(), foods, WINDOW).find(
      (day) => day.day === WED,
    )!;

    expect(wed.kcalDelta).toBeUndefined();
  });

  /**
   * Being 2,000 under because you didn't open the app is not a diet outcome,
   * and drawing it as the deepest "way under" cell would be a lie about a day
   * you have no data for.
   */
  it("has no calorie delta on a day you logged nothing", () => {
    const days = dailyIntake([meal(WED, "Lunch")], plan({ targetKcal: 2000 }), foods, WINDOW);

    expect(days.find((day) => day.day === WED)!.kcalDelta).toBeDefined();
    expect(days.find((day) => day.day === TUE)!.kcalDelta).toBeUndefined();
  });

  it("measures against the target the macros imply when none is stated", () => {
    // No targetKcal, but macro targets that come to 400 kcal.
    const derived = plan({ targets: { protein: 50, carbs: 50, fat: 0 } });
    const wed = dailyIntake([meal(WED, "Dinner")], derived, foods, WINDOW).find(
      (day) => day.day === WED,
    )!;

    // Dinner is 213 kcal against a derived 400.
    expect(wed.kcalDelta).toBeCloseTo(213 - 400, 1);
  });
});

describe("adherenceStep", () => {
  it("is a share of the plan, not of your best week", () => {
    // Fixed thresholds: 2 of 4 means the same thing in a good month and a bad
    // one, unlike the training grid's quartiles of your own busiest day.
    expect(adherenceStep(4, 4)).toBe(4);
    expect(adherenceStep(3, 4)).toBe(3);
    expect(adherenceStep(2, 4)).toBe(2);
    expect(adherenceStep(1, 4)).toBe(1);
  });

  it("is nothing when nothing was ticked", () => {
    expect(adherenceStep(0, 4)).toBe(0);
  });

  it("declines to divide by a plan with no meals that day", () => {
    expect(adherenceStep(0, 0)).toBe(0);
  });

  it("tops out rather than overflowing when you logged extra", () => {
    expect(adherenceStep(6, 4)).toBe(4);
  });
});

describe("calorieStep", () => {
  it("separates over from under rather than merging them into 'off'", () => {
    expect(calorieStep(600)).toBe(2);
    expect(calorieStep(-600)).toBe(-2);
  });

  it("treats a small miss as landing on target", () => {
    // 100 kcal is inside the noise of weighing food.
    expect(calorieStep(60)).toBe(0);
    expect(calorieStep(-60)).toBe(0);
  });

  it("steps once at a meaningful miss and again at a meal", () => {
    expect(calorieStep(150)).toBe(1);
    expect(calorieStep(-150)).toBe(-1);
  });

  /**
   * `null`, not 0 — 0 means "you landed on target", which is a claim you can't
   * make about a day with no target or no data.
   */
  it("says nothing rather than claiming you hit it", () => {
    expect(calorieStep(undefined)).toBeNull();
  });
});

describe("summariseIntake", () => {
  it("averages over the days you logged, not the whole window", () => {
    // A fortnight you didn't open the app would otherwise drag the mean toward
    // zero and read as a crash diet.
    const days = dailyIntake(
      [meal(WED, "Lunch"), meal(WED, "Dinner")],
      plan(),
      foods,
      WINDOW,
    );
    const summary = summariseIntake(days);

    expect(summary.daysLogged).toBe(1);
    expect(summary.averageKcal).toBeCloseTo(525.8, 1);
  });

  it("counts a day complete only when every meal that applied was ticked", () => {
    const partial = summariseIntake(
      dailyIntake([meal(WED, "Lunch")], plan(), foods, WINDOW),
    );
    const whole = summariseIntake(
      dailyIntake([meal(WED, "Lunch"), meal(WED, "Dinner")], plan(), foods, WINDOW),
    );

    expect(partial.daysComplete).toBe(0);
    expect(whole.daysComplete).toBe(1);
  });

  it("has no average at all with nothing logged", () => {
    const summary = summariseIntake(dailyIntake([], plan(), foods, WINDOW));

    expect(summary.daysLogged).toBe(0);
    expect(summary.averageKcal).toBeUndefined();
    expect(summary.averageMacros).toBeUndefined();
  });
});

describe("loggedDays", () => {
  it("drops the empty days a chart shouldn't plot as zeroes", () => {
    const days = dailyIntake([meal(WED, "Lunch")], plan(), foods, WINDOW);

    expect(loggedDays(days)).toHaveLength(1);
  });
});
