/**
 * The RPE chart, as one list rather than a grid.
 *
 * The published table is reps 1–12 across RPE 6–10, and every cell in it is a
 * function of a single quantity: how many reps you'd have got in total if the
 * set had gone to failure. A single @ RPE 9 leaves one in the tank, so it sits
 * exactly where a double @ RPE 10 sits — 95.5%. That collapses a 108-cell grid
 * to the 23 numbers below, and means the two axes can't drift apart.
 *
 * Indexed in half-rep steps because half-point RPEs are the interpolated rows.
 */
const PERCENT_BY_REPS_TO_FAILURE = [
  100, 97.8, 95.5, 93.9, 92.2, 90.7, 89.2, 87.8, 86.3, 85.0, 83.7, 82.4, 81.1,
  79.9, 78.6, 77.4, 76.2, 75.1, 73.9, 72.3, 70.7, 69.4, 68.0,
] as const;

/** Reps to failure at index 0, and the step between entries. */
const FIRST_ENTRY = 1;
const STEP = 0.5;

export const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;
export const CHART_REPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Reps in reserve is the other half of the same statement. */
export function rirForRpe(rpe: number): number {
  return 10 - rpe;
}

export function rpeForRir(rir: number): number {
  return 10 - rir;
}

/**
 * What share of a one-rep max a set of `reps` at `rpe` represents.
 *
 * Undefined off the end of the chart rather than extrapolated: past twelve
 * reps to failure the relationship flattens out and the published table stops
 * for a reason.
 */
export function percentOfMax(reps: number, rpe: number): number | undefined {
  if (!Number.isFinite(reps) || !Number.isFinite(rpe)) return undefined;
  if (reps < 1 || rpe < 6 || rpe > 10) return undefined;
  const repsToFailure = reps + rirForRpe(rpe);
  const index = (repsToFailure - FIRST_ENTRY) / STEP;
  if (!Number.isInteger(index)) return undefined;
  return PERCENT_BY_REPS_TO_FAILURE[index];
}

/** The one-rep max a set of `reps` at `rpe` with `weight` implies. */
export function oneRepMaxFrom(
  weight: number,
  reps: number,
  rpe: number,
): number | undefined {
  const percent = percentOfMax(reps, rpe);
  if (percent === undefined || !Number.isFinite(weight) || weight <= 0) {
    return undefined;
  }
  return (weight * 100) / percent;
}

/** What to load for a target set, given a one-rep max. */
export function loadFor(
  oneRepMax: number,
  reps: number,
  rpe: number,
): number | undefined {
  const percent = percentOfMax(reps, rpe);
  if (percent === undefined || !Number.isFinite(oneRepMax) || oneRepMax <= 0) {
    return undefined;
  }
  return (oneRepMax * percent) / 100;
}
