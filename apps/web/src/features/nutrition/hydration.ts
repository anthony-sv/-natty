/**
 * How much water a day, from your bodyweight.
 *
 * ## Why this replaced a table
 *
 * `data/diets/hydration.ts` held six transcribed litre figures — 4.15 L on a
 * rest day, 4.65 L training. Those decode to exactly 50 ml/kg for an 83 kg
 * person, which is a fact about one person and useless to anyone else. A
 * formula generalises; a constant doesn't.
 *
 * ## The formula, and how it differs from the doc
 *
 *   total ml = (weightKg × 40) + 500 + (trainingHours × 750)
 *
 * The 500 ml is creatine, which is taken daily — so it applies on a rest day
 * too, and is not part of the training term.
 *
 * **This gives different numbers from the source docs and that's deliberate.**
 * At 83 kg it comes to 3.82 L rest and 4.57 L training, where the docs say
 * 4.15 and 4.65. `hydration.test.ts` pins that comparison so the discrepancy
 * is recorded rather than discovered later by someone assuming a transcription
 * error.
 *
 * Pure and unit-tested, like `ffmi.ts` and `pr.ts` — no React, no collection.
 */

/** Baseline intake per kilo of bodyweight. */
export const ML_PER_KG = 40;

/** Creatine's standing extra. Daily, so rest days carry it too. */
export const CREATINE_ML = 500;

export const ML_PER_TRAINING_HOUR = 750;

/**
 * What a "training day" assumes when you haven't said otherwise.
 *
 * Surfaced on screen rather than hidden, because a two-hour session needs
 * another 750 ml and the number would otherwise be quietly wrong.
 */
export const DEFAULT_TRAINING_HOURS = 1;

/**
 * A zero-sugar coke's contribution.
 *
 * Kept from the source docs, and the one part of that table worth
 * generalising: 4.15 → 3.55 → 2.95 is exactly −600 ml a step, a standard
 * bottle, counting one for one toward the total.
 */
export const ZERO_COKE_ML = 600;

/** Total daily fluid in millilitres. */
export function hydrationFor(
  weightKg: number,
  trainingHours: number = 0,
): number {
  return (
    weightKg * ML_PER_KG + CREATINE_ML + trainingHours * ML_PER_TRAINING_HOUR
  );
}

export interface HydrationRow {
  /** Litres of water to drink. */
  litres: number;
  /** How many of those are swapped for a zero-sugar coke. */
  zeroCokes: number;
}

/**
 * The rows the plan page shows: water only, then one and two cokes.
 *
 * Stops before the total would go negative, which only matters at absurd
 * weights but costs nothing to get right.
 */
function rowsFor(totalMl: number): HydrationRow[] {
  const rows: HydrationRow[] = [];
  for (let cokes = 0; cokes <= 2; cokes++) {
    const litres = (totalMl - cokes * ZERO_COKE_ML) / 1000;
    if (litres <= 0) break;
    rows.push({ litres, zeroCokes: cokes });
  }
  return rows;
}

export function hydrationOptions(
  weightKg: number,
  trainingHours: number = DEFAULT_TRAINING_HOURS,
): { restDay: HydrationRow[]; trainingDay: HydrationRow[] } {
  return {
    restDay: rowsFor(hydrationFor(weightKg, 0)),
    trainingDay: rowsFor(hydrationFor(weightKg, trainingHours)),
  };
}

/** "4.2 L" — one decimal, because the estimate isn't finer than that. */
export function formatLitres(litres: number): string {
  return `${litres.toFixed(1)}L`;
}
