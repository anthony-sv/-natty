import { toKilometers } from "@/lib/units";
import { startOfWeek } from "@/lib/week";
import type { MessageKey, Translate } from "@/i18n/use-t";
import type { CardioEntry } from "./cardio-schema";

/**
 * Pure and injected, like `pr.ts`/`volume.ts` — no React, no collection, so
 * the totals and the landmark comparison are directly unit-tested.
 */

/** Normalises to km, the same job `effectiveWeight` does for load. */
export function effectiveDistanceKm(entry: CardioEntry): number {
  return toKilometers(entry.distance, entry.unit);
}

export function totalDistanceKm(entries: CardioEntry[]): number {
  return entries.reduce((total, entry) => total + effectiveDistanceKm(entry), 0);
}

/** Every entry from `since` onward, summed. */
export function distanceSince(entries: CardioEntry[], since: number): number {
  return totalDistanceKm(entries.filter((entry) => entry.performedAt >= since));
}

/** This week's total, Monday to now — same week boundary `weekly.ts` uses. */
export function distanceThisWeek(entries: CardioEntry[], now: number): number {
  return distanceSince(entries, startOfWeek(now));
}

/**
 * "5km" or "5km · 32:00" — stored unit, never converted, same rule
 * `formatSet` follows for weight.
 */
export function formatCardio(entry: CardioEntry): string {
  const distance = `${entry.distance}${entry.unit}`;
  if (entry.durationSeconds === undefined) return distance;
  const minutes = Math.floor(entry.durationSeconds / 60);
  const seconds = entry.durationSeconds % 60;
  return `${distance} · ${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Real-world reference distances, ascending, for the "you've gone the
 * distance from..." line. Approximate — this is flavor text, not a survey
 * measurement — and deliberately not routed through the `names.ts`
 * authored-data machinery: a short fixed list translates as plain message
 * keys the same way `routines.dayLabel` etc. do, rather than open-ended user
 * data.
 */
const ROUTES: ReadonlyArray<{ labelKey: MessageKey; km: number }> = [
  { labelKey: "cardio.route.5k", km: 5 },
  { labelKey: "cardio.route.10k", km: 10 },
  { labelKey: "cardio.route.halfMarathon", km: 21.1 },
  { labelKey: "cardio.route.marathon", km: 42.2 },
  { labelKey: "cardio.route.londonBrighton", km: 90 },
  { labelKey: "cardio.route.laSanDiego", km: 195 },
  { labelKey: "cardio.route.madridValencia", km: 350 },
  { labelKey: "cardio.route.sfLa", km: 615 },
  { labelKey: "cardio.route.parisBerlin", km: 1050 },
  { labelKey: "cardio.route.ukLength", km: 1400 },
  { labelKey: "cardio.route.nyLa", km: 3944 },
  { labelKey: "cardio.route.madridMexicoCity", km: 9100 },
  { labelKey: "cardio.route.earthCircumference", km: 40075 },
];

export type DistanceMilestone =
  | { kind: "passed"; label: string; remainderKm: number }
  | { kind: "toward"; label: string; remainingKm: number };

/**
 * The largest reference route the total has passed, and how far beyond it —
 * or, below the smallest entry, how far short of it. `undefined` at zero:
 * there's nothing to compare yet.
 */
export function describeDistance(
  totalKm: number,
  t: Translate,
): DistanceMilestone | undefined {
  if (totalKm <= 0) return undefined;

  // Routes are ascending, so the last one at or under the total is the
  // largest one passed.
  let passed: (typeof ROUTES)[number] | undefined;
  for (const route of ROUTES) {
    if (route.km <= totalKm) passed = route;
    else break;
  }

  if (passed === undefined) {
    const next = ROUTES[0];
    return {
      kind: "toward",
      label: t(next.labelKey),
      remainingKm: next.km - totalKm,
    };
  }

  return {
    kind: "passed",
    label: t(passed.labelKey),
    remainderKm: totalKm - passed.km,
  };
}
