import { z } from "zod";

/**
 * Weight units, shared by everything that records a load — training sets and
 * body measurements alike.
 *
 * Lives in `lib/` rather than inside a feature because both `features/log` and
 * `features/body` need it, and a feature importing another feature's schema is
 * a coupling worth avoiding.
 */
export const weightUnitSchema = z.enum(["kg", "lb"]);
export type WeightUnit = z.infer<typeof weightUnitSchema>;

/** Options for a unit picker, in the order they should appear. */
export const UNITS: Array<{ value: WeightUnit; label: string }> = [
  { value: "kg", label: "kg" },
  { value: "lb", label: "lb" },
];

const KG_PER_LB = 0.45359237;

/**
 * Kilograms, whatever it was entered in.
 *
 * Weights are always *stored* in the unit they were entered in — a machine
 * marked in pounds reads back as pounds — so conversion happens only where
 * numbers are compared or fed into a formula.
 */
export function toKilograms(weight: number, unit: WeightUnit): number {
  return unit === "lb" ? weight * KG_PER_LB : weight;
}

/**
 * The same load expressed in another unit.
 *
 * Needed where a run of entries has to share one axis: a chart mixing 82kg and
 * 181lb points would draw a cliff that isn't there. Display still shows what
 * was entered — this is for plotting and arithmetic only.
 */
export function convertWeight(
  weight: number,
  from: WeightUnit,
  to: WeightUnit,
): number {
  if (from === to) return weight;
  return to === "kg" ? weight * KG_PER_LB : weight / KG_PER_LB;
}

/**
 * A weight as a person would write it.
 *
 * Every screen printed the stored number raw, which is fine right up until the
 * number didn't come from a keyboard: the weigh-in history rendered
 * `83.60000000000001 kg`, because binary floats don't hold 83.6 and nothing
 * asked them to round before being shown. A converted load, an imported one, or
 * any arithmetic on a stored value can produce that, and it reads as the app
 * being broken rather than as IEEE 754 being itself.
 *
 * Two decimals is past anything a scale or a plate reports, and trailing zeros
 * are dropped so 84 stays 84 rather than becoming 84.00.
 */
export function formatWeightValue(weight: number): string {
  return String(Number(weight.toFixed(2)));
}

/**
 * Length units, for girth measurements.
 *
 * The same trio as weight and for the same reasons: stored as entered, so a
 * tape marked in inches reads back in inches, with conversion confined to the
 * two places that compare or plot. Centimetres are the canonical side because
 * that's what `profileSchema.heightCm` and the Casey Butt model already use.
 */
export const lengthUnitSchema = z.enum(["cm", "in"]);
export type LengthUnit = z.infer<typeof lengthUnitSchema>;

export const LENGTH_UNITS: Array<{ value: LengthUnit; label: string }> = [
  { value: "cm", label: "cm" },
  { value: "in", label: "in" },
];

const CM_PER_INCH = 2.54;

/** Centimetres, whatever it was entered in. For comparison, never for display. */
export function toCentimetres(length: number, unit: LengthUnit): number {
  return unit === "in" ? length * CM_PER_INCH : length;
}

/**
 * The same girth in another unit.
 *
 * Same job `convertWeight` does: a trend line mixing 40cm and 15.7in would
 * draw a collapse that never happened.
 */
export function convertLength(
  length: number,
  from: LengthUnit,
  to: LengthUnit,
): number {
  if (from === to) return length;
  return to === "cm" ? length * CM_PER_INCH : length / CM_PER_INCH;
}
