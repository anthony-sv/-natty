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

export interface FoodOptionGroup {
  key: FoodOption["kind"];
  label: string;
  items: FoodOption[];
}

/**
 * Yours first, the compiled-in table last.
 *
 * A recipe, a food you wrote and a built-in read identically as rows, which is
 * why every picker used to hang a badge off each one. A heading says the same
 * thing once per section instead — so the badges came off.
 *
 * Ordered rather than derived: the built-in list is the long tail you scroll
 * past, and what you wrote is what you opened the picker looking for. Takes the
 * flat list because `RecipeForm` filters recipes out before grouping — recipes
 * can't nest — and because resolving the Combobox's `value` needs a flat find.
 */
export function useGroupedFoodOptions(options: FoodOption[]): FoodOptionGroup[] {
  const t = useT();

  return useMemo(() => {
    const order = [
      ["recipe", "pantry.group.recipes"],
      ["food", "pantry.group.foods"],
      ["built-in", "pantry.group.builtIn"],
    ] as const;

    return order.flatMap(([kind, key]) => {
      const items = options.filter((option) => option.kind === kind);
      return items.length === 0 ? [] : [{ key: kind, label: t(key), items }];
    });
  }, [options, t]);
}
