import type { LoggedSet, WeightUnit } from "./schema";

const KG_PER_LB = 0.45359237;

/** Kilograms, whatever the set was entered in. */
export function toKilograms(weight: number, unit: WeightUnit): number {
  return unit === "lb" ? weight * KG_PER_LB : weight;
}

/**
 * The single place that decides how two sets compare by load.
 *
 * Normalises to kg, so a machine marked in pounds ranks against a barbell in
 * kilos correctly. Bodyweight sets sort as 0, so on an exercise you've done
 * both ways `+20kg × 8` beats bodyweight `× 8` — and on one you've only ever
 * done unweighted, every set ties at 0 and the frontier collapses to "most
 * reps", which is the right answer there.
 */
export function effectiveWeight(set: LoggedSet): number {
  return set.weight === undefined ? 0 : toKilograms(set.weight, set.unit);
}

/**
 * The personal records for one exercise: every set that nothing else beat on
 * *both* weight and reps.
 *
 * "Best weight at each rep count" is a Pareto frontier. Given
 * `120×1, 110×3, 95×5, 100×6, 90×8` it returns `120×1, 110×3, 100×6, 90×8` —
 * 95×5 drops out because 100×6 is heavier *and* longer, so it was never your
 * best at anything. No empty rows, no redundant ones.
 *
 * Returned heaviest-first, which is also fewest-reps-first: on a frontier the
 * two orderings are the same, since anything heavier that also had more reps
 * would have eliminated the lighter set.
 */
export function prFrontier(sets: LoggedSet[]): LoggedSet[] {
  // Heaviest first; on equal weight the higher rep count wins, so the first
  // set seen at a given weight is the one that dominates the rest.
  const ranked = [...sets].sort(
    (a, b) => effectiveWeight(b) - effectiveWeight(a) || b.reps - a.reps,
  );

  const frontier: LoggedSet[] = [];
  let bestReps = 0;
  for (const set of ranked) {
    // Everything already kept is at least as heavy, so this set only survives
    // by going longer than all of them.
    if (set.reps > bestReps) {
      frontier.push(set);
      bestReps = set.reps;
    }
  }
  return frontier;
}

/**
 * The record worth showing while you're mid-set: the most you have ever lifted
 * for at least the reps you're about to do.
 *
 * Showing a 1-rep max above a set of 8-12 is noise, so the prescription's lower
 * bound picks the row. Falls back to the heaviest record when you've never gone
 * that long — better to show something than nothing.
 */
export function prForRepRange(
  frontier: LoggedSet[],
  reps: number | [number, number] | undefined,
): LoggedSet | undefined {
  if (frontier.length === 0) return undefined;
  const minReps = reps === undefined ? 0 : Array.isArray(reps) ? reps[0] : reps;
  // The frontier runs heaviest-first, so the first qualifying row is the
  // heaviest one that reaches the target reps.
  return frontier.find((set) => set.reps >= minReps) ?? frontier[0];
}

/**
 * Would this set be a record, given what's already logged for the exercise?
 *
 * True when nothing existing beats it on both weight and reps — i.e. it lands
 * on the frontier. A first-ever set is always a record. Ties don't count:
 * repeating your best is not beating it.
 */
export function isNewRecord(
  existing: LoggedSet[],
  candidate: LoggedSet,
): boolean {
  const weight = effectiveWeight(candidate);
  // Matching a previous set on both axes is a tie, not a record, so `>=` here
  // is deliberate — only a strict improvement on one axis survives it.
  return !existing.some(
    (set) => effectiveWeight(set) >= weight && set.reps >= candidate.reps,
  );
}

/** The most recent set logged for an exercise, by when it was performed. */
export function lastSetFor(sets: LoggedSet[]): LoggedSet | undefined {
  let latest: LoggedSet | undefined;
  for (const set of sets) {
    if (latest === undefined || set.performedAt > latest.performedAt) {
      latest = set;
    }
  }
  return latest;
}

/**
 * "90kg × 8", "100lb × 8", or "× 8" when the set carried no weight.
 * Always in the unit it was logged in — never silently converted.
 */
export function formatSet(set: LoggedSet): string {
  return set.weight === undefined
    ? `× ${set.reps}`
    : `${set.weight}${set.unit} × ${set.reps}`;
}
