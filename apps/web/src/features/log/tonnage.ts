import type { MuscleId } from "@/data/exercises";
import { startOfDay, startOfWeek } from "@/lib/week";
import { effectiveWeight } from "./pr";
import type { LoggedSet } from "./schema";
import type { ExerciseAnatomy } from "./volume";

/**
 * How much you have actually moved, in kilograms.
 *
 * `volume.ts` counts *sets*, which is the figure programming runs on. This
 * counts **tonnage** — weight × reps — which is the figure that feels like
 * something: a set is a unit of prescription, a tonne is a unit of work.
 *
 * Pure and injected like `volume.ts`, `pr.ts` and `records.ts` — no library,
 * no collection, so it tests against fixtures.
 *
 * ## The decision that makes these numbers honest
 *
 * A 100 kg × 10 squat is 1,000 kg of work. It is *not* 1,000 kg for quads
 * plus 1,000 for glutes plus 1,000 for hamstrings — that triple-counts, and
 * it hands the biggest number to whichever muscle appears in the most
 * exercises rather than to whichever did the most work.
 *
 * So the total is counted **once per set**, and per-muscle tonnage is
 * attributed the same way `weeklyVolume` attributes sets: to each muscle the
 * exercise makes primary, with the indirect share kept separate rather than
 * folded in at some coefficient. The consequence is that **muscle rows do not
 * sum to the total**, and the UI says so — the same thing is already true of
 * the set counts, since a squat adds a direct set to both quads and glutes.
 *
 * ## What this cannot see
 *
 * `effectiveWeight` reads an absent weight as 0, so bodyweight work — pull-
 * ups, dips, push-ups — contributes **nothing**. That is the right storage
 * decision (the app doesn't know what you weigh at the moment of a set, and
 * guessing would be inventing the input) but it makes tonnage a measure of
 * *weighted* work only. Anywhere this is shown has to say so, or someone
 * whose training is half calisthenics reads a number that badly understates
 * them.
 */

/** How far back a total reaches. */
export type TonnageScope = "week" | "month" | "year" | "all";

export interface MuscleTonnage {
  muscle: MuscleId;
  /** Kilograms from sets where this muscle was the point of the exercise. */
  directKg: number;
  /** Kilograms from sets where it was along for the ride. */
  indirectKg: number;
}

export interface TonnageTotals {
  /** Every kilogram moved, counted once per set. The honest headline. */
  totalKg: number;
  /** How many sets and reps produced it — context for the tonnage. */
  sets: number;
  reps: number;
  /** Sets that carried no weight, so contributed nothing. */
  unweightedSets: number;
  /** Most work first. Rows deliberately do not sum to `totalKg`. */
  muscles: MuscleTonnage[];
  /** Local midnight the window opens at; 0 for all-time. */
  from: number;
}

/**
 * Where a scope starts, in local time.
 *
 * Local rather than UTC, for the reason the heatmap and the weekly averages
 * already give: a late-evening session belongs to the day you did it, not to
 * tomorrow.
 */
export function scopeStart(scope: TonnageScope, now: number): number {
  if (scope === "all") return 0;
  if (scope === "week") return startOfWeek(now);
  const date = new Date(startOfDay(now));
  if (scope === "month") date.setDate(1);
  else {
    date.setMonth(0);
    date.setDate(1);
  }
  return date.getTime();
}

/**
 * Add up everything performed in the window.
 *
 * `now` is a parameter rather than `Date.now()`, so a scope is pinnable in a
 * test and nothing reads the clock during a render.
 */
export function tonnageFor(
  sets: LoggedSet[],
  anatomy: ExerciseAnatomy,
  scope: TonnageScope,
  now: number,
): TonnageTotals {
  const from = scopeStart(scope, now);
  const direct = new Map<MuscleId, number>();
  const indirect = new Map<MuscleId, number>();

  let totalKg = 0;
  let reps = 0;
  let counted = 0;
  let unweightedSets = 0;

  for (const set of sets) {
    if (set.performedAt < from) continue;
    counted++;
    reps += set.reps;

    const kg = effectiveWeight(set) * set.reps;
    if (kg === 0) {
      // Counted rather than skipped: "12 sets carried no weight" is the
      // caveat that stops the total reading as everything you did.
      unweightedSets++;
      continue;
    }
    totalKg += kg;

    const { primary, secondary } = anatomy.muscles(set.exerciseId);
    for (const muscle of primary) {
      direct.set(muscle, (direct.get(muscle) ?? 0) + kg);
    }
    for (const muscle of secondary) {
      // A muscle that is already primary here doesn't also get an indirect
      // share — the stronger claim wins, as it does in `weeklyVolume`.
      if (primary.includes(muscle)) continue;
      indirect.set(muscle, (indirect.get(muscle) ?? 0) + kg);
    }
  }

  const muscles = [...new Set([...direct.keys(), ...indirect.keys()])]
    .map((muscle) => ({
      muscle,
      directKg: direct.get(muscle) ?? 0,
      indirectKg: indirect.get(muscle) ?? 0,
    }))
    // Direct work first, since that's what the row is claiming. Ties fall
    // back to indirect so a muscle that only ever rides along still ranks.
    .sort((a, b) => b.directKg - a.directKg || b.indirectKg - a.indirectKg);

  return { totalKg, sets: counted, reps, unweightedSets, muscles, from };
}

/**
 * Things with a known mass, for "what does that even mean".
 *
 * Deliberately ordinary objects rather than record-breaking ones: the point
 * is a picture, and nobody has an intuition for a metric tonne. Masses are
 * round because they're representative rather than measured — a mid-size car
 * is not exactly 1,500 kg, and printing 1,487 would imply this knows which
 * car.
 */
export const COMPARISONS = [
  { key: "piano", kg: 400 },
  { key: "horse", kg: 500 },
  { key: "car", kg: 1_500 },
  { key: "elephant", kg: 6_000 },
  { key: "bus", kg: 12_000 },
  { key: "whale", kg: 150_000 },
  { key: "eiffel", kg: 10_100_000 },
] as const;

export type ComparisonKey = (typeof COMPARISONS)[number]["key"];

export interface Comparison {
  key: ComparisonKey;
  /** How many of it, rounded to one decimal below 10 and whole above. */
  count: number;
}

/**
 * The best few comparisons for an amount.
 *
 * Picks the *largest* objects that still give at least one of them, so a
 * week's work reads as "eight horses" rather than "0.1 elephants" — a count
 * below one is a worse picture than no picture. When nothing reaches one,
 * the smallest object is used anyway, because "half a piano" still lands.
 */
export function comparisonsFor(kg: number, limit = 3): Comparison[] {
  if (kg <= 0) return [];

  const round = (n: number) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n));
  const reachable = COMPARISONS.filter((item) => kg / item.kg >= 1);

  if (reachable.length === 0) {
    const smallest = COMPARISONS[0];
    return [{ key: smallest.key, count: round(kg / smallest.kg) }];
  }

  // Largest first, so the headline comparison is the most impressive one that
  // is still true.
  return reachable
    .slice(-limit)
    .reverse()
    .map((item) => ({ key: item.key, count: round(kg / item.kg) }));
}
