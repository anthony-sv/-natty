/**
 * Casey Butt's maximum-lean-mass model, and the girths that go with it.
 *
 * An empirical fit to the measurements of drug-free bodybuilders, predicting
 * peak lean body mass from four numbers: height, wrist circumference, ankle
 * circumference and body-fat percentage. Wrist and ankle stand in for skeletal
 * frame — they're mostly bone and tendon, so they barely move with training or
 * body fat, which is exactly what makes them usable as a frame proxy.
 *
 * Everything here is in centimetres and kilograms at the boundary. The
 * published formula is in inches and pounds, and it's kept that way inside
 * rather than using the metric restatement, so the girth coefficients — which
 * are only published in inches — sit in the same unit as the mass one.
 */

const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;

/**
 * The share of the maximum that's described as realistically achievable.
 *
 * The model predicts a peak; hitting it exactly assumes everything else went
 * right for years. The convention is to quote 95% alongside.
 */
export const REALISTIC_SHARE = 0.95;

export interface Measurements {
  heightCm: number;
  wristCm: number;
  ankleCm: number;
  bodyFatPercent: number;
}

export interface Potential {
  /** Peak lean body mass in kilograms — total weight minus all fat. */
  leanMassKg: number;
  /** Girths in centimetres, at that lean mass and body fat. */
  girths: {
    neck: number;
    chest: number;
    biceps: number;
    forearm: number;
    thigh: number;
    calf: number;
  };
}

/** The girth predictions, as coefficients on wrist, ankle and height inches. */
const GIRTH_COEFFICIENTS = {
  neck: { wrist: 1.1424, ankle: 0, height: 0.1236 },
  chest: { wrist: 1.6817, ankle: 1.3759, height: 0.3314 },
  biceps: { wrist: 1.2033, ankle: 0, height: 0.1236 },
  forearm: { wrist: 0.9626, ankle: 0, height: 0.0989 },
  thigh: { wrist: 0, ankle: 1.3868, height: 0.1805 },
  calf: { wrist: 0, ankle: 0.9298, height: 0.121 },
} as const;

/**
 * Every input has to be a positive, finite number, and body fat a percentage.
 *
 * Returns undefined rather than NaN so a half-filled form renders blanks
 * instead of "NaN kg".
 */
export function potentialFor(
  measurements: Partial<Measurements>,
): Potential | undefined {
  const { heightCm, wristCm, ankleCm, bodyFatPercent } = measurements;
  const positive = (value: number | undefined): value is number =>
    value !== undefined && Number.isFinite(value) && value > 0;
  if (!positive(heightCm) || !positive(wristCm) || !positive(ankleCm)) {
    return undefined;
  }
  if (
    bodyFatPercent === undefined ||
    !Number.isFinite(bodyFatPercent) ||
    bodyFatPercent < 0 ||
    bodyFatPercent >= 100
  ) {
    return undefined;
  }

  const height = heightCm / CM_PER_INCH;
  const wrist = wristCm / CM_PER_INCH;
  const ankle = ankleCm / CM_PER_INCH;

  // M = H^1.5 × (√W ÷ 22.667 + √A ÷ 17.01) × (F ÷ 224 + 1), in pounds.
  const massLb =
    Math.pow(height, 1.5) *
    (Math.sqrt(wrist) / 22.667 + Math.sqrt(ankle) / 17.01) *
    (bodyFatPercent / 224 + 1);

  const girthCm = (of: keyof typeof GIRTH_COEFFICIENTS) => {
    const c = GIRTH_COEFFICIENTS[of];
    return (c.wrist * wrist + c.ankle * ankle + c.height * height) * CM_PER_INCH;
  };

  return {
    leanMassKg: massLb * KG_PER_LB,
    girths: {
      neck: girthCm("neck"),
      chest: girthCm("chest"),
      biceps: girthCm("biceps"),
      forearm: girthCm("forearm"),
      thigh: girthCm("thigh"),
      calf: girthCm("calf"),
    },
  };
}

/**
 * How close a current lean mass is to the predicted peak, as a percentage.
 *
 * Can exceed 100 — the model is a fit to a population, not a wall.
 */
export function percentOfPotential(
  currentLeanMassKg: number,
  potential: Potential,
): number {
  return (currentLeanMassKg / potential.leanMassKg) * 100;
}
