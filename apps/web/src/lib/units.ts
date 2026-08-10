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
