/**
 * One-rep-max estimators.
 *
 * Each is a curve fitted to submaximal sets, and they disagree — by 5kg or
 * more on the same input once reps climb. That disagreement is the useful
 * information, which is why the UI shows all of them rather than picking one
 * and presenting it as the answer.
 *
 * Every formula also runs backwards: given a 1RM, what should a set of N reps
 * weigh? That inverse is what makes the estimate actionable, and it's why each
 * entry carries both directions rather than just the forward one.
 */

export type FormulaId =
  | "epley"
  | "brzycki"
  | "lander"
  | "lombardi"
  | "mayhew";

export interface Formula {
  id: FormulaId;
  name: string;
  /** Where it's known to behave, in reps. */
  note: string;
  /** Reps -> one-rep max. */
  oneRepMax: (weight: number, reps: number) => number;
  /** One-rep max -> the load for a set of that many reps. */
  loadForReps: (oneRepMax: number, reps: number) => number;
}

/**
 * Above this the fits diverge badly from each other and from reality — a set
 * of 20 is limited by conditioning as much as by strength.
 */
export const MAX_USEFUL_REPS = 12;

export const FORMULAS: readonly Formula[] = [
  {
    id: "epley",
    name: "Epley",
    note: "The common default. Linear in reps, and near the middle throughout.",
    oneRepMax: (w, r) => w * (1 + r / 30),
    loadForReps: (m, r) => m / (1 + r / 30),
  },
  {
    id: "brzycki",
    name: "Brzycki",
    note: "Lowest of the five on short sets, among the highest past ten reps.",
    oneRepMax: (w, r) => (w * 36) / (37 - r),
    loadForReps: (m, r) => (m * (37 - r)) / 36,
  },
  {
    id: "lander",
    name: "Lander",
    note: "Tracks Brzycki closely, and climbs highest of all on long sets.",
    oneRepMax: (w, r) => (100 * w) / (101.3 - 2.67123 * r),
    loadForReps: (m, r) => (m * (101.3 - 2.67123 * r)) / 100,
  },
  {
    id: "lombardi",
    name: "Lombardi",
    note: "A power curve: near the top on short sets, clearly lowest on long ones.",
    oneRepMax: (w, r) => w * Math.pow(r, 0.1),
    loadForReps: (m, r) => m / Math.pow(r, 0.1),
  },
  {
    id: "mayhew",
    name: "Mayhew",
    note: "Fitted to bench press, and the highest of the five on short sets.",
    oneRepMax: (w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r)),
    loadForReps: (m, r) => (m * (52.2 + 41.9 * Math.exp(-0.055 * r))) / 100,
  },
];

export function formulaById(id: FormulaId): Formula {
  // Non-null: `id` is a union of the ids in the list above, so this can only
  // miss if the two fall out of step, which the test catches.
  return FORMULAS.find((formula) => formula.id === id)!;
}

export interface Estimate {
  formula: Formula;
  oneRepMax: number;
}

/**
 * Every formula's estimate for one set.
 *
 * Undefined for input that isn't a real set, and for a single rep — a 1RM
 * estimated from a 1RM is just the weight, and showing five identical rows
 * implies a calculation that didn't happen.
 */
export function estimateAll(
  weight: number | undefined,
  reps: number | undefined,
): Estimate[] | undefined {
  if (
    weight === undefined ||
    reps === undefined ||
    !Number.isFinite(weight) ||
    !Number.isFinite(reps) ||
    weight <= 0 ||
    // A single *is* the one-rep max, so there is nothing to estimate — and
    // the formulas don't agree on it anyway (Epley reads a single as 103% of
    // itself), so five rows here would be five wrong answers to a question
    // that was already answered.
    reps < 2 ||
    reps > MAX_USEFUL_REPS
  ) {
    return undefined;
  }
  return FORMULAS.map((formula) => ({
    formula,
    oneRepMax: formula.oneRepMax(weight, reps),
  }));
}

/** The middle of the pack, which is the closest thing to a consensus answer. */
export function medianEstimate(estimates: Estimate[]): number {
  const sorted = estimates.map((e) => e.oneRepMax).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}
