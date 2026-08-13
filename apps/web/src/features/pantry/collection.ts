import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteDocuments,
  fetchDocuments,
  upsertDocuments,
} from "@/server/documents";
import {
  recipeSchema,
  userFoodSchema,
  type Recipe,
  type RecipeInput,
  type UserFood,
  type UserFoodInput,
} from "./schema";

/**
 * Foods and recipes you wrote, in two localStorage collections.
 *
 * Separate keys because they're different shapes with different editors, even
 * though `mergedPantry` presents them as one list — the meal model only ever
 * sees `Food`s, and which half a `foodId` came from is nobody's business
 * downstream.
 */
const localUserFoods = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.foods.v1",
    getKey: (food) => food.id,
    schema: userFoodSchema,
  }),
);

export const userFoodsFork = forkCollection({
  queryKey: "foods",
  local: localUserFoods,
  getKey: (food) => food.id,
  fetch: async () =>
    (await fetchDocuments({ data: { kind: "food" } })) as UserFood[],
  upsert: (rows) => upsertDocuments({ data: { kind: "food", rows } }),
  remove: (ids) => deleteDocuments({ data: { kind: "food", ids } }),
});

/** Whichever collection backs the app right now — see `forkCollection`. */
export const userFoods = () => userFoodsFork.active();

const localUserRecipes = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.recipes.v1",
    getKey: (recipe) => recipe.id,
    schema: recipeSchema,
  }),
);

export const userRecipesFork = forkCollection({
  queryKey: "recipes",
  local: localUserRecipes,
  getKey: (recipe) => recipe.id,
  fetch: async () =>
    (await fetchDocuments({ data: { kind: "recipe" } })) as Recipe[],
  upsert: (rows) => upsertDocuments({ data: { kind: "recipe", rows } }),
  remove: (ids) => deleteDocuments({ data: { kind: "recipe", ids } }),
});

/** Whichever collection backs the app right now — see `forkCollection`. */
export const userRecipes = () => userRecipesFork.active();

export function allUserFoods(): UserFood[] {
  return [...userFoods().values()];
}

export function allRecipes(): Recipe[] {
  return [...userRecipes().values()];
}

export function createUserFood(input: UserFoodInput) {
  const food: UserFood = {
    ...input,
    id: `food:${crypto.randomUUID()}`,
    createdAt: Date.now(),
  };
  return { food, transaction: userFoods().insert(food) };
}

export function updateUserFood(id: string, patch: UserFoodInput) {
  return userFoods().update(id, (draft) => {
    Object.assign(draft, patch);
  });
}

export function createRecipe(input: RecipeInput) {
  const recipe: Recipe = {
    ...input,
    id: `recipe:${crypto.randomUUID()}`,
    createdAt: Date.now(),
  };
  return { recipe, transaction: userRecipes().insert(recipe) };
}

export function updateRecipe(id: string, patch: RecipeInput) {
  return userRecipes().update(id, (draft) => {
    Object.assign(draft, patch);
  });
}

/**
 * Archive rather than delete, once something references it.
 *
 * Same rule as a custom exercise with logged sets: deleting a food a plan or a
 * recipe still points at leaves a row with a raw id and no macros. Archiving
 * hides it from the pickers while everything already written keeps resolving.
 */
export function archiveUserFood(id: string) {
  return userFoods().update(id, (draft) => {
    draft.archivedAt = Date.now();
  });
}

export function restoreUserFood(id: string) {
  return userFoods().update(id, (draft) => {
    draft.archivedAt = undefined;
  });
}

export function archiveRecipe(id: string) {
  return userRecipes().update(id, (draft) => {
    draft.archivedAt = Date.now();
  });
}

export function restoreRecipe(id: string) {
  return userRecipes().update(id, (draft) => {
    draft.archivedAt = undefined;
  });
}

export function deleteUserFood(id: string) {
  const food = userFoods().get(id);
  return { food, transaction: userFoods().delete(id) };
}

export function deleteRecipe(id: string) {
  const recipe = userRecipes().get(id);
  return { recipe, transaction: userRecipes().delete(id) };
}
