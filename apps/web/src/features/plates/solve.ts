import type { Plate } from "./equipment";

/**
 * What to hang on each end of a bar to hit a target weight.
 *
 * ## Why this isn't greedy
 *
 * Taking the heaviest plate that fits, repeatedly, is right for an unlimited
 * rack of standard denominations and wrong the moment a gym runs out of
 * something. 47.5kg on a 20kg bar wants 13.75 a side. Greedy takes
 * 10 + 2.5 + 1.25 and lands exactly — but on a rack with no 10s it takes
 * 5 + 5 + 2.5 and then has nothing that fits, reporting 45kg, while
 * 5 + 5 + 2.5 + 1.25 was sitting right there.
 *
 * So this is a bounded subset-sum over the denominations you actually have:
 * every reachable per-side weight, then the largest one that doesn't overshoot.
 * Ten-odd denominations and a few hundred kilos is small enough to solve
 * outright rather than approximate.
 *
 * ## Everything is in hundredths
 *
 * Plate weights are decimal — 2.5, 1.25, 0.5 — and repeated float addition
 * drifts; `47.5 - 20` is not exactly `27.5` to a computer. Integer hundredths
 * keep the sums exact and make the table index-addressable. The boundary
 * converts back.
 */

const SCALE = 100;
/** Cost of a sum nothing can make. */
const UNREACHABLE = Number.MAX_SAFE_INTEGER;
/** 1000kg a side. Past this someone mistyped, and the table would be huge. */
const MAX_PER_SIDE_UNITS = 100_000;

export interface PlateCount {
  plate: Plate;
  /** Pairs, not plates: one on each end. */
  pairs: number;
}

export interface Loading {
  /** Heaviest first, the order you'd load them in. */
  perSide: PlateCount[];
  /** What the bar actually weighs once loaded. */
  totalWeight: number;
  /** Target minus total. Zero when the target was reachable. */
  shortBy: number;
  /** True when nothing on the rack could close the gap. */
  isApproximate: boolean;
}

export type SolveResult =
  | { ok: true; loading: Loading }
  | { ok: false; reason: "below-bar" };

/**
 * Plates for one side of the bar, given a target total and what's available.
 *
 * `available` is keyed by plate weight in pairs — an odd plate can't be loaded
 * symmetrically, so half a pair is no pair at all.
 */
export function solveLoading(
  targetWeight: number,
  barWeight: number,
  plates: readonly Plate[],
  available: Record<string, number>,
): SolveResult {
  if (!Number.isFinite(targetWeight) || targetWeight < barWeight) {
    return { ok: false, reason: "below-bar" };
  }

  const perSideTarget = Math.round(((targetWeight - barWeight) / 2) * SCALE);
  if (perSideTarget === 0) {
    return {
      ok: true,
      loading: {
        perSide: [],
        totalWeight: barWeight,
        shortBy: 0,
        isApproximate: false,
      },
    };
  }

  if (perSideTarget < 0 || perSideTarget > MAX_PER_SIDE_UNITS) {
    return { ok: false, reason: "below-bar" };
  }

  // Heaviest first, so ties break towards fewer, bigger discs.
  const usable = plates
    .map((plate) => ({
      plate,
      units: Math.round(plate.weight * SCALE),
      pairs: Math.max(0, Math.floor(available[String(plate.weight)] ?? 0)),
    }))
    .filter((entry) => entry.pairs > 0 && entry.units > 0)
    .sort((a, b) => b.units - a.units);

  // One layer per denomination, each holding the fewest plates needed to reach
  // every sum using the denominations up to it. Layered rather than rolled into
  // one array because reconstruction has to know which denomination was
  // decided where — a single array gets overwritten by later, better paths and
  // can walk back through the same denomination twice, spending pairs the rack
  // doesn't have.
  let previous = new Float64Array(perSideTarget + 1).fill(UNREACHABLE);
  previous[0] = 0;
  const choices: Uint8Array[] = [];

  for (const entry of usable) {
    const current = previous.slice();
    const taken = new Uint8Array(perSideTarget + 1);
    for (let sum = entry.units; sum <= perSideTarget; sum++) {
      for (let pairs = 1; pairs <= entry.pairs; pairs++) {
        const from = sum - pairs * entry.units;
        if (from < 0) break;
        if (previous[from] === UNREACHABLE) continue;
        const cost = previous[from]! + pairs;
        if (cost < current[sum]!) {
          current[sum] = cost;
          taken[sum] = pairs;
        }
      }
    }
    choices.push(taken);
    previous = current;
  }

  let reached = perSideTarget;
  while (reached > 0 && previous[reached] === UNREACHABLE) reached--;

  const perSide: PlateCount[] = [];
  let at = reached;
  for (let index = usable.length - 1; index >= 0; index--) {
    const pairs = choices[index]![at]!;
    if (pairs > 0) {
      perSide.push({ plate: usable[index]!.plate, pairs });
      at -= pairs * usable[index]!.units;
    }
  }
  perSide.reverse();

  const totalWeight = round(barWeight + (reached / SCALE) * 2);

  return {
    ok: true,
    loading: {
      perSide,
      totalWeight,
      shortBy: round(targetWeight - totalWeight),
      isApproximate: reached !== perSideTarget,
    },
  };
}

/** Adds up a hand-picked loading — the calculator run backwards. */
export function weightOf(perSide: PlateCount[], barWeight: number): number {
  const sideUnits = perSide.reduce(
    (sum, entry) => sum + Math.round(entry.plate.weight * SCALE) * entry.pairs,
    0,
  );
  return round(barWeight + (sideUnits / SCALE) * 2);
}

/** Two decimals is finer than any plate, and kills float dust. */
function round(value: number): number {
  return Math.round(value * SCALE) / SCALE;
}
