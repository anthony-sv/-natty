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

export function createUserDiet(plan: DietPlan) {
  const now = Date.now();
  const row: UserDietPlan = { ...plan, createdAt: now, updatedAt: now };
  return { plan: row, transaction: userDiets.insert(row) };
}

export function updateUserDiet(slug: string, plan: DietPlan) {
  return userDiets.update(slug, (draft) => {
    // The slug is the key and stays put, so renaming keeps the plan's identity.
    Object.assign(draft, plan, { slug, updatedAt: Date.now() });
  });
}

export function deleteUserDiet(slug: string) {
  const plan = userDiets.get(slug);
  return { plan, transaction: userDiets.delete(slug) };
}

export function restoreUserDiet(plan: UserDietPlan) {
  return userDiets.insert(plan);
}
