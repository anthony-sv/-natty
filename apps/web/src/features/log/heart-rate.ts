const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Whole years since a birth date, as of `now` — the one place age is
 * computed, so it never quietly goes stale the way a stored "age" field
 * would. `now` is a parameter rather than `Date.now()`, the same DI rule
 * `weeklyVolume`/`hasLoggedToday` follow, so this pins in a test.
 */
export function ageFromBirthDate(birthDateMs: number, now: number): number {
  return Math.floor((now - birthDateMs) / MS_PER_YEAR);
}

/**
 * Age-predicted maximum heart rate — Tanaka et al. (2001), `208 - 0.7 × age`.
 *
 * Not the classic `220 - age`: Tanaka is the better-supported estimate and
 * costs nothing extra to compute, so there's no reason to ship the older,
 * less accurate formula just because it's more widely known.
 */
export function estimatedMaxHr(age: number): number {
  return 208 - 0.7 * age;
}

export interface HeartRateZone {
  lowBpm: number;
  highBpm: number;
}

/**
 * Zone 2 — 60-70% of max heart rate, the conventional aerobic-base band.
 * Rounded to whole beats; nothing about a heart-rate target is precise
 * enough to warrant a decimal.
 */
export function zone2Range(maxHr: number): HeartRateZone {
  return {
    lowBpm: Math.round(maxHr * 0.6),
    highBpm: Math.round(maxHr * 0.7),
  };
}
