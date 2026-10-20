import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { useStore } from "@tanstack/react-store";
import type { DietPlan } from "@/data/diets";
import { useHabits } from "@/features/habits/use-habits";
import { useIntake } from "@/features/intake/use-intake";
import { useDiets } from "@/features/nutrition/use-diets";
import { userRecipesFork } from "@/features/pantry/collection";
import { usePantry } from "@/features/pantry/use-pantry";
import { profileStore } from "@/features/profile/profile-store";
import { useSupplements } from "@/features/supplements/use-supplements";
import { shoppingFork, stockFork } from "./collection";
import type { ShoppingItem, StockItem } from "./schema";
import type { ConsumptionSources } from "./shopping";

/**
 * Everything the shopping page derives from, gathered once.
 *
 * **For display only**, like every `use*` hook over a collection. The plan is
 * the *active* one — the one you've said you're following — falling back to
 * the first, the same rule `/nutrition` opens on.
 */
export function useShoppingData(): {
  stock: StockItem[];
  shoppingItems: ShoppingItem[];
  sources: ConsumptionSources;
  plan: DietPlan | undefined;
  foods: ReturnType<typeof usePantry>;
  isLoading: boolean;
} {
  const stockCollection = stockFork.useActive();
  const shoppingCollection = shoppingFork.useActive();
  const recipeCollection = userRecipesFork.useActive();
  const { data: stockRows, isLoading: stockLoading } = useLiveQuery(
    (q) => q.from({ s: stockCollection }),
    [stockCollection],
  );
  const { data: shoppingRows, isLoading: shoppingLoading } = useLiveQuery(
    (q) => q.from({ s: shoppingCollection }),
    [shoppingCollection],
  );
  const { data: recipeRows } = useLiveQuery(
    (q) => q.from({ r: recipeCollection }),
    [recipeCollection],
  );

  const { entries } = useIntake();
  const { habits, logs } = useHabits();
  const { supplements } = useSupplements();
  const { plans } = useDiets();
  const pantry = usePantry();
  const activeDietSlug = useStore(profileStore, (state) => state.activeDietSlug);

  const plan =
    plans.find((entry) => entry.plan.slug === activeDietSlug)?.plan ?? plans[0]?.plan;

  const sources = useMemo<ConsumptionSources>(() => {
    const bySlug = new Map(plans.map((entry) => [entry.plan.slug, entry.plan]));
    return {
      intake: entries,
      habitLogs: logs,
      habits,
      supplements,
      planFor: (slug) => bySlug.get(slug),
      recipes: new Map((recipeRows ?? []).map((recipe) => [recipe.id, recipe])),
    };
  }, [entries, logs, habits, supplements, plans, recipeRows]);

  return {
    stock: stockRows ?? [],
    shoppingItems: shoppingRows ?? [],
    sources,
    plan,
    foods: pantry,
    isLoading: stockLoading || shoppingLoading || pantry.isLoading,
  };
}
