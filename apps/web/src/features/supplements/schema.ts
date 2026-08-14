import { z } from "zod";

/**
 * Something you take every day, and how much of it.
 *
 * **A stack, not a meal.** Three omega-3 capsules carry macros on paper and
 * nobody counts them; what you want to know is whether you took them. So a
 * supplement is deliberately outside the food model — no per-100g figures, no
 * contribution to a day's totals — and the thing being recorded is adherence.
 *
 * The dose is a number and a unit rather than free text ("3 pills"), because a
 * unit is a closed set and therefore translatable, while a sentence you typed
 * is not. Custom names aren't translation targets, the same rule custom
 * exercises follow; the units are.
 */
export const supplementUnitSchema = z.enum(["pill", "scoop", "g", "mg", "ml"]);
export type SupplementUnit = z.infer<typeof supplementUnitSchema>;

export const supplementSchema = z.object({
  /**
   * `supplement:<uuid>`. Prefixed like `user:`, `food:` and `recipe:` are, so a
   * stored tick says what kind of thing it points at without a lookup.
   */
  id: z.string().startsWith("supplement:"),
  name: z.string().min(1),
  amount: z.number().positive(),
  unit: supplementUnitSchema,
  /** "With breakfast", "pre-workout" — your words, so not translated. */
  timing: z.string().optional(),
  /**
   * Hidden from the checklist, still resolving on the days you took it.
   *
   * Same rule as a custom exercise: deleting one you have history against
   * would leave a raw id on every day you ticked it. A supplement you've never
   * ticked deletes outright — it's just a name.
   */
  archivedAt: z.number().optional(),
  createdAt: z.number(),
});
export type Supplement = z.infer<typeof supplementSchema>;

/** What the form produces; the collection adds `id` and `createdAt`. */
export type SupplementInput = Omit<Supplement, "id" | "createdAt">;
