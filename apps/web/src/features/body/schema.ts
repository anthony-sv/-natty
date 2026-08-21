import { z } from "zod";
import { weightUnitSchema } from "@/lib/units";

/**
 * One weigh-in.
 *
 * Height deliberately isn't here — it belongs to you, not to a given morning,
 * so it lives on the profile (`features/profile`). That does mean an entry's
 * FFMI is only meaningful alongside the current profile height; correcting a
 * mistyped height therefore fixes every row at once, which is the behaviour
 * you want.
 */
export const bodyEntrySchema = z.object({
  id: z.string(),
  /** Epoch ms. Editable, so a weigh-in can be dated to when it happened. */
  measuredAt: z.number(),
  weight: z.number().positive(),
  unit: weightUnitSchema.default("kg"),
  /** Optional: a weigh-in with no body-fat reading is still worth recording. */
  bodyFatPercent: z.number().min(0).max(100).optional(),
  /**
   * The bioimpedance-scale **rating**, not a percentage — Omron/Tanita-style
   * consumer scales report visceral fat as a unitless 1-59 index, and this
   * mirrors that rather than inventing a different scale nobody's scale
   * agrees with.
   */
  visceralFat: z.number().min(1).max(59).optional(),
  notes: z.string().optional(),
});
export type BodyEntry = z.infer<typeof bodyEntrySchema>;

/** What a form supplies; `id` is minted at insert time. */
export const bodyEntryInputSchema = bodyEntrySchema.omit({ id: true });
export type BodyEntryInput = z.infer<typeof bodyEntryInputSchema>;
