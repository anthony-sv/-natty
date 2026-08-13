import { z } from "zod";
import { dietPlanSchema } from "@/data/diets";

/**
 * A diet plan you wrote.
 *
 * `dietPlanSchema` verbatim plus two timestamps — the same trick as
 * `userRoutineSchema`. A user plan **is** a `DietPlan`, so `PlanPanel`,
 * `MealCard`, `resolveDay`, the donut and the per-meal share bars all work on
 * it untouched.
 *
 * In its own file rather than `collection.ts` for the same reason
 * `features/routines/schema.ts` is: the server validates synced plans and
 * must not import a module that builds a localStorage collection.
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
