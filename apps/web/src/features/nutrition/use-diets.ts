import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { diets, getDietBySlug, type DietPlan } from "@/data/diets";
import { userDiets } from "./collection";

/**
 * Every plan: the two built-in ones and anything you wrote.
 *
 * A live query rather than a static import, so a plan you just saved appears
 * without a reload — and yours come first, since a plan you wrote is the one
 * you actually follow.
 */
export function useDiets(): { plans: DietPlan[]; isLoading: boolean } {
  const { data, isLoading } = useLiveQuery((q) => q.from({ d: userDiets }));

  return useMemo(
    () => ({ plans: [...(data ?? []), ...diets], isLoading }),
    [data, isLoading],
  );
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
} {
  const { data, isLoading } = useLiveQuery((q) => q.from({ d: userDiets }));

  return useMemo(() => {
    const builtIn = getDietBySlug(slug);
    if (builtIn !== undefined) {
      return { plan: builtIn, isLoading: false, isCustom: false };
    }
    const own = (data ?? []).find((plan) => plan.slug === slug);
    return { plan: own, isLoading, isCustom: own !== undefined };
  }, [slug, data, isLoading]);
}
