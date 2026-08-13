import { z } from "zod";
import { lengthUnitSchema } from "@/lib/units";

/**
 * Where on the body a tape measure goes.
 *
 * Closed and coarse, like `muscleSchema` and `foodCategorySchema` — the point
 * is a set of things you can actually measure repeatably, not an anthropometry
 * textbook. "Back" isn't here because there's no repeatable tape position for
 * it; chest and shoulders together are what people mean by it.
 *
 * **Wrist and ankle are deliberately absent.** They live on the profile, where
 * `/calculator` reads them as frame proxies: they're mostly bone and tendon, so
 * they barely move with training, and carrying them here as well would leave
 * two sources of truth for one number that never changes.
 *
 * The other six — neck, chest, upper arm, forearm, thigh, calf — are exactly
 * what `casey-butt.ts` predicts a peak-condition natural physique carries, so
 * measuring them is what makes that page's numbers something you can check
 * yourself against rather than just read.
 */
export const measurementSiteSchema = z.enum([
  "neck",
  "shoulders",
  "chest",
  "upperArm",
  "forearm",
  "waist",
  "hips",
  "thigh",
  "calf",
]);
export type MeasurementSite = z.infer<typeof measurementSiteSchema>;

/**
 * The sites that come in pairs, and are therefore the only ones a `side` means
 * anything on.
 *
 * A waist has no left and right. Keeping this as data rather than as a
 * condition scattered through the form and the charts is what stops "left
 * waist" being enterable.
 */
export const PAIRED_SITES: readonly MeasurementSite[] = [
  "upperArm",
  "forearm",
  "thigh",
  "calf",
];

export function isPaired(site: MeasurementSite): boolean {
  return PAIRED_SITES.includes(site);
}

/**
 * What a first-time user is asked for.
 *
 * Three, not nine. Thirteen possible inputs on an empty form is a wall, and
 * these are the three that answer "is the training working" — arms and legs
 * for what you're building, waist for what you'd rather not be. Everything
 * else is opt-in, held in `profileSchema.trackedSites`.
 */
export const DEFAULT_TRACKED_SITES: readonly MeasurementSite[] = [
  "upperArm",
  "waist",
  "thigh",
];

/**
 * One girth, measured once.
 *
 * **A row per measurement, not per session.** A session isn't a thing you ever
 * ask a question about — every question here is "how has my arm changed",
 * which is a filter on site and a sort on time. It also means correcting one
 * number touches one row, and measuring only your calves on a Tuesday isn't a
 * session with seven holes in it. Same shape as `LoggedSet` for the same
 * reason; `bodyEntrySchema` is one-per-weigh-in only because a weigh-in *is*
 * one number.
 */
export const measurementSchema = z.object({
  id: z.string(),
  /** Epoch ms. Editable, so a measurement can be dated to when it was taken. */
  measuredAt: z.number(),
  site: measurementSiteSchema,
  /**
   * Which one, on a site that comes in a pair. Absent means you didn't
   * distinguish — the common case, and the one the form defaults to, since
   * most people measure their working arm and write down a number.
   */
  side: z.enum(["left", "right"]).optional(),
  value: z.number().positive(),
  /** Stored as entered. Only `toCentimetres` and the charts ever convert. */
  unit: lengthUnitSchema.default("cm"),
  notes: z.string().optional(),
});
export type Measurement = z.infer<typeof measurementSchema>;

/** What a form supplies; `id` is minted at insert time. */
export const measurementInputSchema = measurementSchema.omit({ id: true });
export type MeasurementInput = z.infer<typeof measurementInputSchema>;

/**
 * Site plus side as one string — `"upperArm"`, `"upperArm:left"`.
 *
 * A chart series, a map key and a React key all want one value here, and
 * building it in three places would let them disagree about a sideless row.
 */
export function seriesKey(site: MeasurementSite, side?: "left" | "right"): string {
  return side === undefined ? site : `${site}:${side}`;
}
