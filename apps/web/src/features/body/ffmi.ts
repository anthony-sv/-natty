import { toKilograms } from "@/lib/units";
import type { Profile } from "@/features/profile/profile-store";
import type { BodyEntry } from "./schema";

/**
 * Fat-free mass in kilograms: what's left with the fat taken off.
 *
 * Body fat is optional on an entry — plenty of weigh-ins have no caliper or
 * scale reading attached — and without it there is no lean mass to speak of.
 */
export function leanMassKg(entry: BodyEntry): number | undefined {
  if (entry.bodyFatPercent === undefined) return undefined;
  const weight = toKilograms(entry.weight, entry.unit);
  return weight * (1 - entry.bodyFatPercent / 100);
}

/**
 * The most recent reading that actually carries a body-fat percentage.
 *
 * A weigh-in with no caliper or scale reading is the common case — you don't
 * measure body fat every morning — and until this existed, logging one made
 * FFMI, lean mass and the meter vanish from the card: they were all read off
 * `latest` alone, so the one field you didn't retype deleted three others.
 * Carrying the last real reading forward is what "current body fat" means
 * between remeasurements; it's undefined only when none was ever logged, which
 * is the one case with nothing honest to carry.
 */
export function lastBodyFat(
  entries: BodyEntry[],
): { percent: number; measuredAt: number } | undefined {
  const found = entries
    .filter(
      (entry): entry is BodyEntry & { bodyFatPercent: number } =>
        entry.bodyFatPercent !== undefined,
    )
    .sort((a, b) => b.measuredAt - a.measuredAt)[0];
  return found === undefined
    ? undefined
    : { percent: found.bodyFatPercent, measuredAt: found.measuredAt };
}

export interface CarriedBodyFat {
  /** `latest` with a carried `bodyFatPercent` filled in, or unchanged. */
  entry: BodyEntry;
  /** True when the percentage isn't from `latest` itself. */
  isCarried: boolean;
  /** When the carried reading was actually taken — for saying so on screen. */
  measuredAt?: number;
}

/**
 * `latest`, with its body-fat reading filled in from history when it has none
 * of its own.
 *
 * The weight is always `latest`'s own — that's what changed this morning —
 * only the body-fat percentage is carried, and only because it's the one
 * field that goes stale slower than the scale reading it rides alongside.
 */
export function withCarriedBodyFat(
  latest: BodyEntry,
  entries: BodyEntry[],
): CarriedBodyFat {
  if (latest.bodyFatPercent !== undefined) {
    return { entry: latest, isCarried: false };
  }
  const carried = lastBodyFat(entries);
  if (carried === undefined) return { entry: latest, isCarried: false };
  return {
    entry: { ...latest, bodyFatPercent: carried.percent },
    isCarried: true,
    measuredAt: carried.measuredAt,
  };
}

/**
 * Fat-Free Mass Index: lean mass over height squared, the body-composition
 * analogue of BMI.
 *
 * Needs a height, which lives on the profile rather than the entry.
 */
export function ffmi(entry: BodyEntry, heightCm: number | undefined): number | undefined {
  const lean = leanMassKg(entry);
  if (lean === undefined || heightCm === undefined || heightCm <= 0) {
    return undefined;
  }
  const heightM = heightCm / 100;
  return lean / (heightM * heightM);
}

/**
 * FFMI adjusted to a 1.8 m reference height.
 *
 * Raw FFMI still drifts with height — taller people tend to score lower for
 * the same build — so the standard correction adds 6.1 per metre of shortfall.
 * The 1.8 m reference comes from the literature the index originates in and is
 * used regardless of who is being measured.
 */
export function normalizedFfmi(
  entry: BodyEntry,
  heightCm: number | undefined,
): number | undefined {
  const raw = ffmi(entry, heightCm);
  if (raw === undefined || heightCm === undefined) return undefined;
  return raw + 6.1 * (1.8 - heightCm / 100);
}

/**
 * Descriptive band boundaries, in normalized FFMI.
 *
 * Deliberately coarse. Published cut-offs vary between sources, so finer
 * gradations would imply a precision the underlying data doesn't support.
 * These describe where a value sits in the adult population — they are not a
 * diagnostic, a target, or a statement about how a physique was built.
 */
/**
 * The classic FFMI chart's bands, keyed by the value each one runs up to.
 *
 * The male scale is the published one, 16 through 30. The female scale is the
 * same shape shifted down 4 points — female fat-free mass norms run roughly
 * that much lower — which is an approximation, not a separately published
 * table, and is the weaker half of this data.
 *
 * The top bands are the conventional labels for this chart. They describe
 * where a number sits relative to what's typically observed drug-free; they
 * are not evidence about any particular person, and the ~25 threshold they
 * pivot on comes from a single small 1995 study that later work disputes.
 */
const BANDS = {
  male: [
    { upTo: 18, label: "Below average" },
    { upTo: 20, label: "Average" },
    { upTo: 22, label: "Above average" },
    { upTo: 23, label: "Excellent" },
    { upTo: 26, label: "Superior" },
    { upTo: 28, label: "Suspicious" },
    { upTo: 30, label: "Unlikely" },
  ],
  female: [
    { upTo: 14, label: "Below average" },
    { upTo: 16, label: "Average" },
    { upTo: 18, label: "Above average" },
    { upTo: 19, label: "Excellent" },
    { upTo: 22, label: "Superior" },
    { upTo: 24, label: "Suspicious" },
    { upTo: 26, label: "Unlikely" },
  ],
} as const;

/** Where each scale starts — one band-width below its first boundary. */
const SCALE_MIN: Record<NonNullable<Profile["sex"]>, number> = {
  male: 16,
  female: 12,
};

export interface FfmiScale {
  min: number;
  max: number;
  bands: Array<{ from: number; to: number; label: string }>;
}

export function ffmiScale(sex: NonNullable<Profile["sex"]>): FfmiScale {
  const raw = BANDS[sex];
  const min = SCALE_MIN[sex];
  const max = raw[raw.length - 1].upTo;
  let from = min;
  const bands = raw.map((band) => {
    const entry = { from, to: band.upTo, label: band.label };
    from = band.upTo;
    return entry;
  });
  return { min, max, bands };
}

/**
 * Where a normalized FFMI sits against population norms, or undefined when
 * there's no `sex` on the profile to pick a scale with — better to show no band
 * than one drawn from the wrong population.
 */
export function describeFfmi(
  normalized: number | undefined,
  sex: Profile["sex"],
): string | undefined {
  if (normalized === undefined || sex === undefined) return undefined;
  const bands = BANDS[sex];
  // Anything past the top boundary still belongs to the top band rather than
  // falling off the end.
  return (
    bands.find((band) => normalized < band.upTo)?.label ??
    bands[bands.length - 1].label
  );
}

/** One decimal is all the precision the inputs justify. */
export function formatIndex(value: number | undefined): string {
  return value === undefined ? "—" : value.toFixed(1);
}
