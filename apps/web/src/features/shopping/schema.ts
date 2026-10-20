import { z } from "zod";

/** What a package is measured in — the same three a food is. */
export const stockUnitSchema = z.enum(["g", "ml", "unit"]);
export type StockUnit = z.infer<typeof stockUnitSchema>;

/**
 * Something that uses up a stock item, and how much of it per go.
 *
 * - `food` — eaten through a ticked meal or a logged item on Today. `factor`
 *   is stock per unit eaten, and is **1 unless you measured otherwise**: a
 *   bag of raw chicken eaten as cooked chicken loses water on the way, and
 *   the app won't guess how much (the raw/cooked rule). You weigh it once
 *   and say "1.3 g raw per g cooked".
 * - `supplement` — each ticked serving takes `perServing` out of the tub.
 * - `habit` — each time (or minute) of a habit takes `perTime`: a brush is
 *   about a gram of toothpaste.
 */
export const stockUseSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("food"),
    foodId: z.string(),
    factor: z.number().positive().default(1),
  }),
  z.object({
    kind: z.literal("supplement"),
    supplementId: z.string(),
    perServing: z.number().positive(),
  }),
  z.object({
    kind: z.literal("habit"),
    habitId: z.string(),
    perTime: z.number().positive(),
  }),
]);
export type StockUse = z.infer<typeof stockUseSchema>;

/**
 * A thing you keep at home and buy again: rice, whey, toothpaste.
 *
 * **What's left is derived, not stored.** `onHand` is what you had at
 * `countedAt` — the last time you bought some or said how much was left —
 * and everything `uses` has consumed since is subtracted at read time. The
 * same move every derived figure in the app makes: tick a meal and the bag
 * goes down, untick it and the bag comes back, with nothing to keep in step.
 *
 * Buying resets the count (`onHand` = what's left + what you bought) rather
 * than appending a purchase, because an estimate drifts — you cooked for a
 * friend, a bag split — and the moment you're holding the new package is
 * the moment you know the real number.
 */
export const stockItemSchema = z.object({
  /** `stock:<uuid>`. Your words for the name, so not a translation target. */
  id: z.string().startsWith("stock:"),
  name: z.string().min(1),
  unit: stockUnitSchema,
  /** One package, in `unit` — "1000" for a kilo bag of rice. */
  packageSize: z.number().positive(),
  onHand: z.number().nonnegative(),
  countedAt: z.number(),
  uses: z.array(stockUseSchema).default([]),
  /**
   * Your own figure for how fast it goes, in `unit` per day — for things
   * nothing in the app consumes (shampoo, coffee) or to overrule an
   * estimate you know is wrong. Wins over everything when set.
   */
  dailyUse: z.number().positive().optional(),
  archivedAt: z.number().optional(),
  createdAt: z.number(),
});
export type StockItem = z.infer<typeof stockItemSchema>;
export type StockItemInput = Omit<StockItem, "id" | "createdAt">;

/**
 * A line on the shopping list that isn't derived from anything.
 *
 * Two kinds. `manual` is something you typed — bin bags, a birthday card.
 * `planFood` is a tick on one of the plan-derived rows: the row itself is
 * computed every render, so the tick has to live somewhere, and keyed on the
 * food it's the same row however the window moves. It counts as bought for
 * as long as the list's window, then lapses — next week you need rice again.
 */
export const shoppingItemSchema = z.object({
  id: z.string().startsWith("shop:"),
  source: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("manual"),
      name: z.string().min(1),
      /** "2", "a big one" — free text, it's a note to yourself. */
      quantity: z.string().optional(),
    }),
    z.object({ kind: z.literal("planFood"), foodId: z.string() }),
  ]),
  checkedAt: z.number().optional(),
  createdAt: z.number(),
});
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;

export function planFoodItemId(foodId: string): string {
  return `shop:plan:${foodId}`;
}
