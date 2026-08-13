import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { foodCategorySchema, type FoodCategory } from "@/data/diets";
import { dominantMacro } from "@/features/nutrition/macros";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { matchesAllWords } from "@/lib/search";
import { userFoodsFork, userRecipesFork } from "./collection";
import { mergePantry, type Pantry } from "./pantry";

/**
 * Built-in foods, your foods and your recipes as one lookup.
 *
 * Memoised on both collections because the result is a `FoodSource` that ends
 * up in `resolveDay`'s dependencies — a fresh object each render would re-sum
 * every meal of every day on any unrelated change.
 */
export function usePantry(): Pantry & { isLoading: boolean } {
  const userFoods = userFoodsFork.useActive();
  const { data: foodRows, isLoading: foodsLoading } = useLiveQuery(
    (q) => q.from({ f: userFoods }),
    [userFoods],
  );
  const userRecipes = userRecipesFork.useActive();
  const { data: recipeRows, isLoading: recipesLoading } = useLiveQuery(
    (q) => q.from({ r: userRecipes }),
    [userRecipes],
  );

  const merged = useMemo(
    () => mergePantry(foodRows ?? [], recipeRows ?? []),
    [foodRows, recipeRows],
  );

  return { ...merged, isLoading: foodsLoading || recipesLoading };
}

/**
 * Which heading a food sits under: its authored family, or the macro it's
 * mostly made of when it has no family.
 */
export type FoodGroupKey = FoodCategory | ReturnType<typeof dominantMacro>;

export interface FoodOption {
  id: string;
  name: string;
  search: string;
  kind: "built-in" | "food" | "recipe";
  /** "g", "ml", or the word for one unit — shown beside the amount field. */
  unit: "g" | "ml" | "unit";
  group: FoodGroupKey;
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
          // Authored family first, derived macro second. A recipe never has a
          // family — a cooked dish genuinely is a mixture — so it always takes
          // the macro heading.
          group: entry.food.category ?? dominantMacro(entry.food.macros),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, t.locale)),
    [selectable, names, t.locale],
  );
}

export function filterFoodOption(item: FoodOption, query: string): boolean {
  return matchesAllWords(item.search, query);
}

export interface FoodOptionGroup {
  key: FoodGroupKey;
  label: string;
  items: FoodOption[];
}

/**
 * Headings in a fixed order: the food families, then the macro fallbacks.
 *
 * Families come from `foodCategorySchema` in its own order — roughly a
 * shopping list's, plants through animals through the things you add a
 * spoonful of — so the sequence means something and needs no per-locale sort.
 * The macro headings trail them because they're what's left when a food didn't
 * say what it was, and a reader should meet the specific answer first.
 */
const GROUP_ORDER: readonly FoodGroupKey[] = [
  ...foodCategorySchema.options,
  "protein",
  "carbs",
  "fat",
  "mixed",
];

/**
 * The picker's sections.
 *
 * **Grouped by what a food *is*, not by where it came from.** An earlier pass
 * split the list into your recipes, your foods and the built-ins, which
 * answered a question nobody asks mid-meal: you're looking for a protein, or
 * for rice, not for something you happened to type yourself. Provenance is
 * back on the row as a badge, where it costs a heading nothing.
 *
 * Takes the flat list because `RecipeForm` filters recipes out before grouping
 * — recipes can't nest — and because resolving the Combobox's `value` needs a
 * flat find.
 */
export function useGroupedFoodOptions(options: FoodOption[]): FoodOptionGroup[] {
  const t = useT();

  return useMemo(() => {
    const byGroup = new Map<FoodGroupKey, FoodOption[]>();
    for (const option of options) {
      const bucket = byGroup.get(option.group);
      if (bucket) bucket.push(option);
      else byGroup.set(option.group, [option]);
    }

    return GROUP_ORDER.flatMap((key) => {
      const items = byGroup.get(key);
      if (items === undefined) return [];
      return [{ key, label: t(`foodGroup.${key}` as never), items }];
    });
  }, [options, t]);
}
