import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { diets, getDietBySlug, type DietPlan } from "@/data/diets";
import { userDietsFork } from "./collection";

/**
 * Every plan: the two built-in ones and anything you wrote.
 *
 * A live query rather than a static import, so a plan you just saved appears
 * without a reload — and yours come first, since a plan you wrote is the one
 * you actually follow.
 */
export interface PlanEntry {
  plan: DietPlan;
  isCustom: boolean;
  /** Saved knowing it misses its own targets. Built-ins are never drafts. */
  isDraft: boolean;
}

export function useDiets(): { plans: PlanEntry[]; isLoading: boolean } {
  const userDiets = userDietsFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ d: userDiets }),
    [userDiets],
  );

  return useMemo(() => {
    const mine = data ?? [];
    // A plan saved at a built-in's slug replaces it, the same mechanism
    // `useRoutines` uses — so editing "Cut v5" leaves one "Cut v5" in the
    // picker, yours, rather than two under the same name.
    const replaced = new Set(mine.map((plan) => plan.slug));

    return {
      plans: [
        ...mine.map((plan) => ({
          plan: plan as DietPlan,
          isCustom: true,
          isDraft: plan.isDraft,
        })),
        ...diets
          .filter((plan) => !replaced.has(plan.slug))
          .map((plan) => ({ plan, isCustom: false, isDraft: false })),
      ],
      isLoading,
    };
  }, [data, isLoading]);
}

/**
 * One plan by slug, built-in or your own.
 *
 * `isLoading` is separate from "not found" for the reason `useRoutine` records:
 * the compiled-in list has never heard of a plan you wrote, so deciding
 * "missing" before the collection answers would 404 a plan that exists.
 */
export function useDietPlan(slug: string): {
  plan: DietPlan | undefined;
  isLoading: boolean;
  isCustom: boolean;
  isDraft: boolean;
  /** A built-in you've edited — yours is showing, the shipped one is intact. */
  isOverridden: boolean;
} {
  const userDiets = userDietsFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ d: userDiets }),
    [userDiets],
  );

  return useMemo(() => {
    // Yours first, or an override would be saved and then never shown.
    const own = (data ?? []).find((plan) => plan.slug === slug);
    const builtIn = getDietBySlug(slug);

    if (own !== undefined) {
      return {
        plan: own,
        isLoading: false,
        isCustom: true,
        isDraft: own.isDraft,
        isOverridden: builtIn !== undefined,
      };
    }
    if (builtIn !== undefined) {
      return {
        plan: builtIn,
        isLoading: false,
        isCustom: false,
        isDraft: false,
        isOverridden: false,
      };
    }
    return {
      plan: undefined,
      isLoading,
      isCustom: false,
      isDraft: false,
      isOverridden: false,
    };
  }, [slug, data, isLoading]);
}
