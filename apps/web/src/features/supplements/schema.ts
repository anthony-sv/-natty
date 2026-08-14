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
  /** The dose of one serving — not the day's total. */
  amount: z.number().positive(),
  unit: supplementUnitSchema,
  /**
   * How many times a day you take that dose.
   *
   * **Split from `amount` because two people's "3 a day" mean different
   * things to tick off.** Two magnesium pills taken together are one serving;
   * three fish-oil capsules taken across the day are three. Folding both into
   * one number and one tick would either round three real doses down to one
   * checkbox, or force someone taking a single 2-pill dose to tick twice for
   * no reason — `supplementDay` renders exactly this many checkboxes.
   */
  servingsPerDay: z.number().int().min(1).max(12).default(1),
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
