import type { WeightUnit } from "@/lib/units";

/**
 * Bars and plates, as the equipment actually found in a gym.
 *
 * Kept out of `lib/units.ts` because none of it is a unit concern: these are
 * physical objects with weights that happen to be expressed in one.
 */

export interface Bar {
  id: string;
  name: string;
  weight: number;
  unit: WeightUnit;
}

export const BARS: readonly Bar[] = [
  { id: "olympic-20", name: "Olympic bar", weight: 20, unit: "kg" },
  { id: "womens-15", name: "Women's Olympic bar", weight: 15, unit: "kg" },
  { id: "training-10", name: "Training bar", weight: 10, unit: "kg" },
  { id: "ez-7.5", name: "EZ curl bar", weight: 7.5, unit: "kg" },
  { id: "trap-25", name: "Trap bar", weight: 25, unit: "kg" },
  { id: "safety-squat-25", name: "Safety squat bar", weight: 25, unit: "kg" },
  { id: "olympic-45lb", name: "Olympic bar", weight: 45, unit: "lb" },
  { id: "womens-35lb", name: "Women's Olympic bar", weight: 35, unit: "lb" },
  { id: "ez-15lb", name: "EZ curl bar", weight: 15, unit: "lb" },
];

export interface Plate {
  weight: number;
  unit: WeightUnit;
  /**
   * The competition colour for that denomination, as a CSS colour.
   *
   * Calibrated kilo discs are colour-coded by weight to a fixed standard —
   * red 25, blue 20, yellow 15, green 10, white 5, and the same four hues
   * repeating on the small change plates. Pound plates have no equivalent
   * standard, so they get one neutral steel finish rather than an invented
   * scheme that would read as meaning something.
   */
  color: string;
  /** Whether `color` is dark enough to need light text on it. */
  darkInk: boolean;
}

/**
 * A denomination's disc size relative to the largest, for the visual stack.
 *
 * Real plates shrink with weight; drawing them all the same height loses the
 * at-a-glance read that a loaded bar gives you in person.
 */
export function discScale(plate: Plate): number {
  const heaviest = plate.unit === "kg" ? 25 : 45;
  const ratio = plate.weight / heaviest;
  // Cube-rootish: a 1.25kg disc is 1/20th the mass of a 25 but nowhere near
  // 1/20th the diameter, and a flat ratio would render it as a sliver.
  return 0.42 + 0.58 * Math.pow(ratio, 1 / 3);
}

export const KG_PLATES: readonly Plate[] = [
  { weight: 25, unit: "kg", color: "#d32f2f", darkInk: true },
  { weight: 20, unit: "kg", color: "#1565c0", darkInk: true },
  { weight: 15, unit: "kg", color: "#f9c000", darkInk: false },
  { weight: 10, unit: "kg", color: "#2e7d32", darkInk: true },
  { weight: 5, unit: "kg", color: "#f5f5f5", darkInk: false },
  { weight: 2.5, unit: "kg", color: "#d32f2f", darkInk: true },
  { weight: 2, unit: "kg", color: "#1565c0", darkInk: true },
  { weight: 1.5, unit: "kg", color: "#f9c000", darkInk: false },
  { weight: 1.25, unit: "kg", color: "#8d8d8d", darkInk: true },
  { weight: 1, unit: "kg", color: "#2e7d32", darkInk: true },
  { weight: 0.5, unit: "kg", color: "#f5f5f5", darkInk: false },
];

export const LB_PLATES: readonly Plate[] = [
  { weight: 45, unit: "lb", color: "#4a4a4a", darkInk: true },
  { weight: 35, unit: "lb", color: "#565656", darkInk: true },
  { weight: 25, unit: "lb", color: "#626262", darkInk: true },
  { weight: 10, unit: "lb", color: "#6e6e6e", darkInk: true },
  { weight: 5, unit: "lb", color: "#7a7a7a", darkInk: true },
  { weight: 2.5, unit: "lb", color: "#868686", darkInk: true },
];

export function platesFor(unit: WeightUnit): readonly Plate[] {
  return unit === "kg" ? KG_PLATES : LB_PLATES;
}

export function barsFor(unit: WeightUnit): Bar[] {
  return BARS.filter((bar) => bar.unit === unit);
}

/**
 * The plates a typical gym has, as pairs per denomination.
 *
 * A starting inventory rather than a claim about any real rack — the point is
 * that you edit it once and the solver respects it from then on.
 */
export function defaultInventory(unit: WeightUnit): Record<string, number> {
  const pairs = unit === "kg" ? [4, 4, 2, 2, 2, 2, 0, 0, 2, 0, 0] : [5, 2, 2, 2, 2, 2];
  const plates = platesFor(unit);
  return Object.fromEntries(
    plates.map((plate, index) => [String(plate.weight), pairs[index] ?? 0]),
  );
}
