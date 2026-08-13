import { convertLength, type LengthUnit } from "@/lib/units";
import { seriesKey, type Measurement, type MeasurementSite } from "./schema";

/**
 * Reading a run of girths as a trend.
 *
 * Pure and injected, like `pr.ts`, `volume.ts` and `ffmi.ts` — the rows come
 * in, nothing is imported from a collection or from React, and every function
 * here is directly testable.
 */

/** One site (and side), with its history and how it has moved. */
export interface SiteSeries {
  key: string;
  site: MeasurementSite;
  side: "left" | "right" | undefined;
  /**
   * Oldest first, all converted to one unit so a chart can plot them on one
   * axis. `unit` says which.
   */
  points: { at: number; value: number }[];
  unit: LengthUnit;
  latest: number;
  /** Latest minus first, in `unit`. Undefined until there are two readings. */
  change: number | undefined;
}

/**
 * Group rows into one series per site and side.
 *
 * **Everything is converted to the newest reading's unit**, not to
 * centimetres: the number a reader recognises is the one they last wrote down,
 * and a series that silently became metric would read as a different arm. Same
 * call `BodyCharts` makes for weight, for the same reason — mixing 40cm and
 * 15.7in points draws a collapse that never happened.
 *
 * A left and a right arm are separate series rather than one averaged, because
 * the whole reason to record a side is that they differ.
 */
export function toSeries(rows: Measurement[]): SiteSeries[] {
  const grouped = new Map<string, Measurement[]>();
  for (const row of rows) {
    const key = seriesKey(row.site, row.side);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(row);
    else grouped.set(key, [row]);
  }

  const series: SiteSeries[] = [];
  for (const [key, group] of grouped) {
    const ordered = [...group].sort((a, b) => a.measuredAt - b.measuredAt);
    const newest = ordered[ordered.length - 1]!;
    const unit = newest.unit;

    const points = ordered.map((row) => ({
      at: row.measuredAt,
      value: convertLength(row.value, row.unit, unit),
    }));

    const first = points[0]!;
    const last = points[points.length - 1]!;

    series.push({
      key,
      site: newest.site,
      side: newest.side,
      points,
      unit,
      latest: last.value,
      // One reading is a measurement, not a trend. Reporting +0 would suggest
      // you'd held steady rather than only started.
      change: points.length < 2 ? undefined : last.value - first.value,
    });
  }

  return series;
}

/**
 * The same series, ordered the way the sites are declared and left before
 * right.
 *
 * `measurementSiteSchema` lists sites head to foot, so the page reads down the
 * body rather than alphabetically — and a fixed order needs no per-locale
 * sort, unlike anything sorted by its translated name.
 */
export function orderSeries(
  series: SiteSeries[],
  siteOrder: readonly MeasurementSite[],
): SiteSeries[] {
  const rank = new Map(siteOrder.map((site, index) => [site, index]));
  const sideRank = { left: 0, right: 1 } as const;

  return [...series].sort((a, b) => {
    const bySite = (rank.get(a.site) ?? 0) - (rank.get(b.site) ?? 0);
    if (bySite !== 0) return bySite;
    // A sideless reading sorts first: it's the whole site, not one half of it.
    return (
      (a.side === undefined ? -1 : sideRank[a.side]) -
      (b.side === undefined ? -1 : sideRank[b.side])
    );
  });
}

/**
 * The most recent reading per site and side, for the summary strip.
 *
 * Derived from `toSeries` rather than scanning the rows again, so the strip
 * and the charts can't disagree about which reading is the latest.
 */
export function latestBySeries(rows: Measurement[]): Map<string, SiteSeries> {
  return new Map(toSeries(rows).map((entry) => [entry.key, entry]));
}

/**
 * Which sites have anything recorded at all.
 *
 * What the page shows, as distinct from what the profile says you *track* —
 * a site you stopped tracking still has history worth reading, and a site you
 * just started tracking has nothing to draw.
 */
export function sitesWithData(rows: Measurement[]): Set<MeasurementSite> {
  return new Set(rows.map((row) => row.site));
}
