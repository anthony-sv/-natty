import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { matchesAllWords } from "@/lib/search";
import { userFoods, userRecipes } from "./collection";
import { mergePantry, type Pantry } from "./pantry";

/**
 * Built-in foods, your foods and your recipes as one lookup.
 *
 * Memoised on both collections because the result is a `FoodSource` that ends
 * up in `resolveDay`'s dependencies — a fresh object each render would re-sum
 * every meal of every day on any unrelated change.
 */
export function usePantry(): Pantry & { isLoading: boolean } {
  const { data: foodRows, isLoading: foodsLoading } = useLiveQuery((q) =>
    q.from({ f: userFoods }),
  );
  const { data: recipeRows, isLoading: recipesLoading } = useLiveQuery((q) =>
    q.from({ r: userRecipes }),
  );

  const merged = useMemo(
    () => mergePantry(foodRows ?? [], recipeRows ?? []),
    [foodRows, recipeRows],
  );

  return { ...merged, isLoading: foodsLoading || recipesLoading };
}

export interface FoodOption {
  id: string;
  name: string;
  search: string;
  kind: "built-in" | "food" | "recipe";
  /** "g", "ml", or the word for one unit — shown beside the amount field. */
  unit: "g" | "ml" | "unit";
}

/**
 * The options every food picker shows.
 *
 * Shared for the reason `useExerciseOptions` is: a picker built off the
 * compiled-in table still works, still filters, and simply never offers what
 * you added — a failure that looks like nothing at all.
 */
export function useFoodOptions(): FoodOption[] {
  const names = useNames();
  const t = useT();
  const { selectable } = usePantry();

  return useMemo(
    () =>
      selectable
        .map((entry) => ({
          id: entry.food.id,
          name: names.food(entry.food.id),
          search: [names.food(entry.food.id), entry.food.name].join(" "),
          kind: entry.kind,
          unit: entry.food.unit,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, t.locale)),
    [selectable, names, t.locale],
  );
}

export function filterFoodOption(item: FoodOption, query: string): boolean {
  return matchesAllWords(item.search, query);
}
