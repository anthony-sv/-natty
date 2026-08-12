import { bodyEntries } from "@/features/body/collection";
import { userExercises } from "@/features/library/collection";
import { intakeEntries } from "@/features/intake/collection";
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

/** Every collection the backup covers, in one list so nothing is forgotten. */
const ALL_COLLECTIONS = [
  loggedSets,
  bodyEntries,
  userExercises,
  userRoutines,
  userFoods,
  userRecipes,
  userDiets,
  intakeEntries,
];

/**
 * Wake every collection before reading or writing one.
 *
 * **Collections load lazily** — nothing syncs until something subscribes — so
 * a collection no mounted component happens to query reads back *empty*.
 * Exporting from the Data tab without this wrote a backup with `sets: 0` while
 * localStorage held a year of them, because only the command palette's
 * routines and diets were warm. Silent, and exactly the failure a backup
 * exists to prevent.
 *
 * A restore has the same problem from the other side: it clears by walking
 * `collection.keys()`, and an unloaded collection has none, so "replace
 * everything" would quietly merge instead.
 */
async function loadAll(): Promise<void> {
  await Promise.all(ALL_COLLECTIONS.map((collection) => collection.preload()));
}

/** Read synchronously, not from a live query — an export is a point in time. */
export async function currentData(): Promise<BackupData> {
  await loadAll();
  return {
    sets: [...loggedSets.values()],
    bodyEntries: [...bodyEntries.values()],
    exercises: [...userExercises.values()],
    routines: [...userRoutines.values()],
    foods: [...userFoods.values()],
    recipes: [...userRecipes.values()],
    diets: [...userDiets.values()],
    intake: [...intakeEntries.values()],
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
  intake: [],
});

/** The real id generator. Uuid-backed, so two imports never collide. */
export const liveIds: IdSource = {
  routineSlug: (name) => slugFor(name),
  dietSlug: (name) => dietSlugFor(name),
  id: (prefix) => `${prefix}:${crypto.randomUUID()}`,
};

export async function exportEverything(now: number): Promise<Backup> {
  return buildBackup(await currentData(), "full", now);
}

/**
 * One routine, with the custom exercises it references.
 *
 * Carrying them is what makes the share usable: a routine whose lifts the
 * recipient doesn't have would import with entries pointing at nothing.
 */
export async function exportRoutine(
  slug: string,
  now: number,
): Promise<Backup | undefined> {
  await loadAll();
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
export async function exportRecipe(
  id: string,
  now: number,
): Promise<Backup | undefined> {
  await loadAll();
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
export async function exportDiet(
  slug: string,
  now: number,
): Promise<Backup | undefined> {
  await loadAll();
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
export async function importAdditive(
  data: BackupData,
  ids: IdSource = liveIds,
): Promise<void> {
  await loadAll();
  const fresh = rekey(data, ids);
  for (const food of fresh.foods) userFoods.insert(food);
  for (const exercise of fresh.exercises) userExercises.insert(exercise);
  for (const recipe of fresh.recipes) userRecipes.insert(recipe);
  for (const routine of fresh.routines) userRoutines.insert(routine);
  for (const plan of fresh.diets) userDiets.insert(plan);
  for (const entry of fresh.intake) intakeEntries.insert(entry);
}

/**
 * Put your own data back, ids and all.
 *
 * **Replaces**, and deliberately doesn't re-key: these are the ids your logged
 * sets' provenance already names, so changing them would orphan the history
 * this exists to protect.
 */
export async function restoreEverything(data: BackupData): Promise<void> {
  await loadAll();
  for (const collection of ALL_COLLECTIONS) {
    for (const key of [...collection.keys()]) collection.delete(key);
  }

  for (const set of data.sets) loggedSets.insert(set);
  for (const entry of data.bodyEntries) bodyEntries.insert(entry);
  for (const exercise of data.exercises) userExercises.insert(exercise);
  for (const routine of data.routines) userRoutines.insert(routine);
  for (const food of data.foods) userFoods.insert(food);
  for (const recipe of data.recipes) userRecipes.insert(recipe);
  for (const plan of data.diets) userDiets.insert(plan);
  for (const entry of data.intake) intakeEntries.insert(entry);
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
