/**
 * How much creatine a day, from what you're carrying that can actually store
 * it.
 *
 * ## Why fat-free mass rather than bodyweight
 *
 * Creatine is stored in skeletal muscle. The published dosing is written per
 * kilo of *total* body mass — 0.03 g/kg to maintain, 0.3 g/kg to load — which
 * is a convenient proxy and a poor one at the edges: two people at 90 kg and
 * 12% versus 30% body fat do not have the same muscle to saturate, and the
 * heavier-set one is told to take more.
 *
 * So the coefficients are restated per kilo of fat-free mass, scaled through
 * the ~75% FFM the per-bodyweight figures implicitly assume. That leaves a
 * lean 83 kg person almost exactly where the literature puts them, and moves
 * the two people above apart, which is the point.
 *
 * **Without a body-fat reading there is no fat-free mass**, so the published
 * per-bodyweight coefficients are used instead and the caller is told which
 * basis it got. Guessing a body-fat percentage to feed a formula would be
 * inventing the input and then reporting the output as if it were measured.
 *
 * ## The part that matters more than the arithmetic
 *
 * Almost nobody needs this. 5 g a day saturates essentially everyone, the
 * dose is forgiving, and the excess is simply not retained — which is why
 * `SIMPLE_DOSE_G` is stated alongside every result rather than buried. The
 * calculation is here for people far enough from average that the standard
 * scoop is visibly wrong for them, and as an answer to "why five".
 *
 * Pure and unit-tested, like `hydration.ts` and `ffmi.ts` — no React, no
 * collection, and no import of `features/body` either: lean mass here is one
 * multiplication, and taking a dependency on another feature to avoid writing
 * it would be the worse trade.
 */

/**
 * The published maintenance dose, per kilo of body mass.
 *
 * Kreider et al.'s position stand: 0.03 g/kg/day, or the 3–5 g most sources
 * quote for a typical adult.
 */
export const MAINTENANCE_G_PER_KG_BODY = 0.03;

/** The published loading dose, per kilo of body mass, for 5–7 days. */
export const LOADING_G_PER_KG_BODY = 0.3;

/**
 * What share of body mass the per-bodyweight figures assume is fat-free.
 *
 * The one judgement in this file. It's what converts a published
 * per-bodyweight coefficient into a per-FFM one without changing what a
 * typical lean person is told to take.
 */
export const ASSUMED_FFM_SHARE = 0.75;

export const MAINTENANCE_G_PER_KG_FFM =
  MAINTENANCE_G_PER_KG_BODY / ASSUMED_FFM_SHARE;
export const LOADING_G_PER_KG_FFM = LOADING_G_PER_KG_BODY / ASSUMED_FFM_SHARE;

/** Days a loading phase runs, if you bother with one. */
export const LOADING_DAYS = 6;

/** How many times a day a loading dose is split — it's a lot at once. */
export const LOADING_SPLIT = 4;

/**
 * The dose that makes the rest of this optional.
 *
 * Five grams saturates essentially everyone; the surplus isn't retained, so
 * overshooting costs a few cents rather than anything else.
 */
export const SIMPLE_DOSE_G = 5;

export interface CreatineDose {
  /** Grams a day, ongoing. */
  maintenanceG: number;
  /** Grams a day during a loading phase, and what each of its doses is. */
  loadingG: number;
  loadingPerDoseG: number;
  /** The mass the figures were scaled from, and what kind of mass it is. */
  basisKg: number;
  basis: "fat-free-mass" | "body-mass";
}

/** Rounded to something you can actually measure with a scoop. */
function toHalfGram(grams: number): number {
  return Math.round(grams * 2) / 2;
}

/**
 * Work out a dose from a weigh-in.
 *
 * `bodyFatPercent` is optional and changes the *basis*, not just the number —
 * the caller shows which one it used, because "3.4 g from your lean mass" and
 * "3.4 g from your weight" are different claims.
 */
export function creatineDose(
  weightKg: number,
  bodyFatPercent?: number,
): CreatineDose | undefined {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return undefined;

  const lean =
    bodyFatPercent === undefined || bodyFatPercent < 0 || bodyFatPercent >= 100
      ? undefined
      : weightKg * (1 - bodyFatPercent / 100);

  const basisKg = lean ?? weightKg;
  const basis = lean === undefined ? "body-mass" : "fat-free-mass";
  const maintenancePerKg =
    lean === undefined ? MAINTENANCE_G_PER_KG_BODY : MAINTENANCE_G_PER_KG_FFM;
  const loadingPerKg =
    lean === undefined ? LOADING_G_PER_KG_BODY : LOADING_G_PER_KG_FFM;

  // The per-dose figure is rounded *first* and the total derived from it, so
  // the card can't say "29 g" above "7.5 g × 4". Rounding both independently
  // is the obvious way and lets them disagree by a gram.
  const loadingPerDoseG = toHalfGram((basisKg * loadingPerKg) / LOADING_SPLIT);

  return {
    maintenanceG: toHalfGram(basisKg * maintenancePerKg),
    loadingG: loadingPerDoseG * LOADING_SPLIT,
    loadingPerDoseG,
    basisKg,
    basis,
  };
}
