import { formulaById, MAX_USEFUL_REPS } from "@/features/calculator/one-rep-max";
import { convertWeight, type WeightUnit } from "@/lib/units";
import { prFrontier } from "./pr";
import type { LoggedSet } from "./schema";

/**
 * One exercise's log, shaped for plotting.
 *
 * The records table answers "what are my bests"; this answers the two questions
 * a table of four rows can't — whether the numbers are going anywhere, and
 * which of the sets behind them were records at the time.
 *
 * Pure and directly tested, like `pr.ts`: no React, no collection.
 */

export interface SetPoint {
  /** The logged set's own id, so a chart mark keys off the record it draws. */
  id: string;
  date: Date;
  reps: number;
  /** Converted to the caller's unit; absent for a bodyweight set. */
  weight: number | undefined;
  /**
   * Epley's estimate for this set, or undefined where it doesn't apply.
   *
   * Raw load can't be compared across rep counts — a heavy triple and a long
   * set of twelve say nothing about each other — so a chart of weight over time
   * for an exercise trained in several rep ranges is a scatter of unrelated
   * numbers. The estimate is the one line that puts them on a common axis.
   */
  oneRepMax: number | undefined;
  /** On the Pareto frontier: nothing beat it on both weight and reps. */
  isRecord: boolean;
}

/**
 * Estimator for the trend line.
 *
 * Epley of the five, because it's linear in reps and sits near the middle of
 * the pack throughout — the disagreement between formulas is the point of
 * `/calculator`, but a single trend line has to pick one and this is the least
 * opinionated choice.
 */
const ESTIMATOR = formulaById("epley");

/**
 * Every logged set for one exercise, oldest first, with its records marked.
 *
 * `isRecord` is frontier membership by id, derived from the same `prFrontier`
 * the records table renders — not recomputed here, so a set can't be a record
 * on the chart and absent from the table.
 */
export function toSetPoints(
  sets: LoggedSet[],
  unit: WeightUnit,
): SetPoint[] {
  const recordIds = new Set(prFrontier(sets).map((set) => set.id));

  return sets
    .map((set) => {
      const weight =
        set.weight === undefined
          ? undefined
          : convertWeight(set.weight, set.unit, unit);

      return {
        id: set.id,
        date: new Date(set.performedAt),
        reps: set.reps,
        weight,
        // A bodyweight set has no load to extrapolate from, and past twelve
        // reps the fits stop meaning anything — `estimateAll` refuses both, and
        // so does this. A true single needs no estimate: it *is* the max.
        oneRepMax:
          weight === undefined || weight <= 0 || set.reps > MAX_USEFUL_REPS
            ? undefined
            : set.reps === 1
              ? weight
              : ESTIMATOR.oneRepMax(weight, set.reps),
        isRecord: recordIds.has(set.id),
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** Just the points that carry a load, which is what the weight axes can plot. */
export function loadedPoints(
  points: SetPoint[],
): (SetPoint & { weight: number })[] {
  return points.filter(
    (point): point is SetPoint & { weight: number } => point.weight !== undefined,
  );
}

/** Just the points with an estimate, for the trend line. */
export function estimatedPoints(
  points: SetPoint[],
): (SetPoint & { oneRepMax: number })[] {
  return points.filter(
    (point): point is SetPoint & { oneRepMax: number } =>
      point.oneRepMax !== undefined,
  );
}

export interface StrengthCurvePoint {
  id: string;
  reps: number;
  weight: number;
  date: Date;
}

/**
 * The frontier as a curve: the best weight at each rep count, fewest reps
 * first.
 *
 * The same four rows the table lists, but as a shape — a line that falls
 * steeply says your strength drops off fast as the set runs long, which is a
 * thing about you that the numbers alone don't announce.
 *
 * Bodyweight records are dropped: they belong on the frontier (most reps wins
 * there) but there's no load to give them a height.
 */
export function toStrengthCurve(
  sets: LoggedSet[],
  unit: WeightUnit,
): StrengthCurvePoint[] {
  return prFrontier(sets)
    .filter((set) => set.weight !== undefined)
    .map((set) => ({
      id: set.id,
      reps: set.reps,
      weight: convertWeight(set.weight!, set.unit, unit),
      date: new Date(set.performedAt),
    }))
    .sort((a, b) => a.reps - b.reps);
}
