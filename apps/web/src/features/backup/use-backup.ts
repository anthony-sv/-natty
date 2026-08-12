import { bodyEntries } from "@/features/body/collection";
import { userExercises } from "@/features/library/collection";
import { loggedSets } from "@/features/log/collection";
import { userDiets, dietSlugFor } from "@/features/nutrition/collection";
import { userFoods, userRecipes } from "@/features/pantry/collection";
import { slugFor, userRoutines } from "@/features/routines/collection";
import { profileStore } from "@/features/profile/profile-store";
import { buildBackup, type Backup, type BackupData } from "./backup";
import { rekey, type IdSource } from "./rekey";

/**
 * Reading the collections out and writing them back.
 *
 * The one place that touches every collection at once, kept apart from
 * `backup.ts` so the format stays pure and directly testable.
 */

/** Read synchronously, not from a live query — an export is a point in time. */
export function currentData(): BackupData {
  return {
    sets: [...loggedSets.values()],
    bodyEntries: [...bodyEntries.values()],
    exercises: [...userExercises.values()],
    routines: [...userRoutines.values()],
    foods: [...userFoods.values()],
    recipes: [...userRecipes.values()],
    diets: [...userDiets.values()],
    profile: profileStore.state,
  };
}

const emptyData = (): BackupData => ({
  sets: [],
  bodyEntries: [],
  exercises: [],
  routines: [],
  foods: [],
  recipes: [],
  diets: [],
});

/** The real id generator. Uuid-backed, so two imports never collide. */
export const liveIds: IdSource = {
  routineSlug: (name) => slugFor(name),
  dietSlug: (name) => dietSlugFor(name),
  id: (prefix) => `${prefix}:${crypto.randomUUID()}`,
};

export function exportEverything(now: number): Backup {
  return buildBackup(currentData(), "full", now);
}

/**
 * One routine, with the custom exercises it references.
 *
 * Carrying them is what makes the share usable: a routine whose lifts the
 * recipient doesn't have would import with entries pointing at nothing.
 */
export function exportRoutine(slug: string, now: number): Backup | undefined {
  const routine = userRoutines.get(slug);
  if (routine === undefined) return undefined;

  const referenced = new Set(
    routine.weeks.flatMap((week) =>
      week.days.flatMap((day) =>
        day.exercises.flatMap((entry) => [entry.exerciseId, ...entry.orAlternatives]),
      ),
    ),
  );

  return buildBackup(
    {
      ...emptyData(),
      routines: [routine],
      exercises: [...userExercises.values()].filter((e) => referenced.has(e.id)),
    },
    "routine",
    now,
  );
}

/** One recipe, plus any of your own foods it's built from. */
export function exportRecipe(id: string, now: number): Backup | undefined {
  const recipe = userRecipes.get(id);
  if (recipe === undefined) return undefined;

  const referenced = new Set(recipe.ingredients.map((item) => item.foodId));
  return buildBackup(
    {
      ...emptyData(),
      recipes: [recipe],
      foods: [...userFoods.values()].filter((f) => referenced.has(f.id)),
    },
    "recipe",
    now,
  );
}

/** One plan, plus the foods and recipes its meals point at. */
export function exportDiet(slug: string, now: number): Backup | undefined {
  const plan = userDiets.get(slug);
  if (plan === undefined) return undefined;

  const referenced = new Set(
    plan.meals.flatMap((meal) =>
      meal.variants.flatMap((variant) =>
        variant.options.flatMap((option) => option.items.map((i) => i.foodId)),
      ),
    ),
  );
  const recipes = [...userRecipes.values()].filter((r) => referenced.has(r.id));
  // A recipe's own ingredients have to travel too, or it lands with nothing in
  // it — the same transitive step `rekey` handles on the way back in.
  const fromRecipes = recipes.flatMap((r) => r.ingredients.map((i) => i.foodId));

  return buildBackup(
    {
      ...emptyData(),
      diets: [plan],
      recipes,
      foods: [...userFoods.values()].filter(
        (f) => referenced.has(f.id) || fromRecipes.includes(f.id),
      ),
    },
    "diet",
    now,
  );
}

/**
 * Add someone else's data to yours.
 *
 * **Additive and re-keyed**, which is the difference from a restore: nothing
 * you have is touched, and every imported id is fresh so a shared routine
 * can't adopt a slug your logged sets already point at.
 */
export function importAdditive(data: BackupData, ids: IdSource = liveIds): void {
  const fresh = rekey(data, ids);
  for (const food of fresh.foods) userFoods.insert(food);
  for (const exercise of fresh.exercises) userExercises.insert(exercise);
  for (const recipe of fresh.recipes) userRecipes.insert(recipe);
  for (const routine of fresh.routines) userRoutines.insert(routine);
  for (const plan of fresh.diets) userDiets.insert(plan);
}

/**
 * Put your own data back, ids and all.
 *
 * **Replaces**, and deliberately doesn't re-key: these are the ids your logged
 * sets' provenance already names, so changing them would orphan the history
 * this exists to protect.
 */
export function restoreEverything(data: BackupData): void {
  for (const collection of [
    loggedSets,
    bodyEntries,
    userExercises,
    userRoutines,
    userFoods,
    userRecipes,
    userDiets,
  ]) {
    for (const key of [...collection.keys()]) collection.delete(key);
  }

  for (const set of data.sets) loggedSets.insert(set);
  for (const entry of data.bodyEntries) bodyEntries.insert(entry);
  for (const exercise of data.exercises) userExercises.insert(exercise);
  for (const routine of data.routines) userRoutines.insert(routine);
  for (const food of data.foods) userFoods.insert(food);
  for (const recipe of data.recipes) userRecipes.insert(recipe);
  for (const plan of data.diets) userDiets.insert(plan);
  if (data.profile) profileStore.setState(() => data.profile!);
}

/** Trigger a download. The file never leaves the machine. */
export function downloadBackup(backup: Backup, filename: string): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
