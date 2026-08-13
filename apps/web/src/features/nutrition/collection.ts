import {
  createCollection,
  localStorageCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod";
import { dietPlanSchema, diets, type DietPlan } from "@/data/diets";

/**
 * A diet plan you wrote.
 *
 * `dietPlanSchema` verbatim plus two timestamps — the same trick as
 * `userRoutineSchema`. A user plan **is** a `DietPlan`, so `PlanPanel`,
 * `MealCard`, `resolveDay`, the donut and the per-meal share bars all work on
 * it untouched.
 */
export const userDietPlanSchema = dietPlanSchema.extend({
  createdAt: z.number(),
  updatedAt: z.number(),
  /**
   * Saved knowing it doesn't hit its own targets.
   *
   * On the *user* schema rather than `dietPlanSchema`, because a transcribed
   * plan is never a draft — there'd be no way for one to become one. It exists
   * so an unfinished plan looks unfinished: without it, a plan with one egg in
   * it reads exactly like a plan you completed.
   */
  isDraft: z.boolean().default(false),
});
export type UserDietPlan = z.infer<typeof userDietPlanSchema>;

export const userDiets = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.diets.v1",
    getKey: (plan) => plan.slug,
    schema: userDietPlanSchema,
  }),
);

const BUILT_IN_SLUGS = new Set(diets.map((plan) => plan.slug));

/** Url-safe and collision-free, the same rule `slugFor` follows for routines. */
export function dietSlugFor(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "plan";

  let slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
  while (BUILT_IN_SLUGS.has(slug) || userDiets.get(slug) !== undefined) {
    slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
  }
  return slug;
}

export function createUserDiet(plan: DietPlan, isDraft = false) {
  const now = Date.now();
  const row: UserDietPlan = { ...plan, createdAt: now, updatedAt: now, isDraft };
  return { plan: row, transaction: userDiets.insert(row) };
}

export function updateUserDiet(slug: string, plan: DietPlan, isDraft = false) {
  return userDiets.update(slug, (draft) => {
    // The slug is the key and stays put, so renaming keeps the plan's identity.
    // `isDraft` is passed on every save rather than only set, so finishing a
    // draft clears the badge without a separate action.
    Object.assign(draft, plan, { slug, updatedAt: Date.now(), isDraft });
  });
}

/** Whether this slug belongs to one of the compiled-in plans. */
export function isBuiltInDietSlug(slug: string): boolean {
  return BUILT_IN_SLUGS.has(slug);
}

/**
 * Save your edit of a built-in plan, at the built-in's own slug.
 *
 * The collision with `BUILT_IN_SLUGS` is deliberate and is the mechanism —
 * `useDiets` drops any built-in you've saved over, so your version replaces it
 * in the picker rather than appearing beside it. Same call `saveBuiltInOverride`
 * makes for routines.
 */
export function saveBuiltInDietOverride(plan: DietPlan, isDraft = false) {
  if (userDiets.get(plan.slug) !== undefined) {
    return updateUserDiet(plan.slug, plan, isDraft);
  }
  const now = Date.now();
  const row: UserDietPlan = { ...plan, createdAt: now, updatedAt: now, isDraft };
  return userDiets.insert(row);
}

/** Throw the edit away; the compiled-in plan was never touched. */
export function resetBuiltInDiet(slug: string) {
  const plan = userDiets.get(slug);
  return { plan, transaction: userDiets.delete(slug) };
}

export function deleteUserDiet(slug: string) {
  const plan = userDiets.get(slug);
  return { plan, transaction: userDiets.delete(slug) };
}

export function restoreUserDiet(plan: UserDietPlan) {
  return userDiets.insert(plan);
}
