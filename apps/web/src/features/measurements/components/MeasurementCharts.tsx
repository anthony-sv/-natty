import { useMemo } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { defineChart, dot, lineY } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateFormat, useT } from "@/i18n/use-t";
import { orderSeries, toSeries, type SiteSeries } from "../measurements";
import { measurementSiteSchema, type Measurement, type MeasurementSite } from "../schema";

/**
 * Girth over time — one chart per site.
 *
 * **Small multiples, never one chart with every site on it.** A neck at 40 cm
 * and a chest at 104 cm on one axis leaves the neck a flat line near the floor,
 * and the change you're looking for is a centimetre. Each site gets its own
 * y-scale, which is the only way a 1 cm move is visible. It also keeps every
 * chart to one or two series, well inside the categorical limit — nine sites
 * as nine lines would need hues the palette deliberately doesn't have.
 *
 * A left and a right arm *are* two series on one chart, because comparing them
 * is the entire reason to have recorded a side.
 */
const theme = {
  foreground: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
};

const CHART_HEIGHT = 180;
/** 8px across, per the house dataviz rules. */
const DOT_RADIUS = 4;

const TOOLTIP_DATE: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
};

interface Point {
  id: string;
  date: Date;
  value: number;
}

/** Which token paints a series. Sideless is the lone-line case — see styles.css. */
function strokeFor(side: SiteSeries["side"]): string {
  if (side === "left") return "var(--chart-girth-left)";
  if (side === "right") return "var(--chart-girth-right)";
  return "var(--chart-girth)";
}

export function MeasurementCharts({
  rows,
  isLoading,
}: {
  rows: Measurement[];
  isLoading: boolean;
}) {
  const t = useT();

  const bySite = useMemo(() => {
    const series = orderSeries(toSeries(rows), measurementSiteSchema.options);
    const grouped = new Map<MeasurementSite, SiteSeries[]>();
    for (const entry of series) {
      const bucket = grouped.get(entry.site);
      if (bucket) bucket.push(entry);
      else grouped.set(entry.site, [entry]);
    }
    // A site with one reading has nothing to draw a line between. Dropped here
    // rather than rendered as an empty axis — the latest strip above already
    // reports the number, so nothing is lost by not drawing it.
    return [...grouped].filter(([, entries]) =>
      entries.some((entry) => entry.points.length >= 2),
    );
  }, [rows]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[180px] w-full" />
      </div>
    );
  }

  if (bySite.length === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("measure.chart.notEnough.title")}</EmptyTitle>
        <EmptyDescription>{t("measure.chart.notEnough.body")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {bySite.map(([site, entries]) => (
        <SiteChart key={site} site={site} entries={entries} />
      ))}
    </div>
  );
}

function SiteChart({
  site,
  entries,
}: {
  site: MeasurementSite;
  entries: SiteSeries[];
}) {
  const t = useT();
  const tooltipDate = useDateFormat(TOOLTIP_DATE);

  const drawable = useMemo(
    () => entries.filter((entry) => entry.points.length >= 2),
    [entries],
  );
  // Every series on one chart shares a site, and `toSeries` already put each in
  // its own newest unit — so on the rare run where a left arm is in inches and
  // a right in centimetres, the axis label would be a lie. The first series'
  // unit names the axis and the tooltip converts nothing, because the honest
  // fix is to measure both with the same tape.
  const unit = drawable[0]?.unit ?? "cm";

  const definition = useMemo(
    () =>
      defineChart({
        marks: drawable.flatMap((entry) => {
          const points: Point[] = entry.points.map((point) => ({
            id: `${entry.key}-${point.at}`,
            date: new Date(point.at),
            value: point.value,
          }));
          return [
            lineY(points, { x: "date", y: "value", stroke: strokeFor(entry.side) }),
            dot(points, {
              x: "date",
              y: "value",
              r: DOT_RADIUS,
              fill: strokeFor(entry.side),
            }),
          ];
        }),
        x: { scale: scaleTime, nice: true },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          // Not zero-based, and deliberately: an arm going 39 → 40 cm on an
          // axis starting at zero is a flat line. The question here is always
          // "did it move", never "how big is it relative to nothing".
          axis: { label: t("measure.chart.axis", { unit }) },
        },
        theme,
        tooltip: {
          use: tooltip,
          items: [
            {
              channel: "x",
              label: t("common.date"),
              text: (point) => tooltipDate.format(point.xValue),
            },
            {
              channel: "y",
              label: t(`measure.site.${site}` as never),
              text: (point) => `${point.yValue.toFixed(1)} ${unit}`,
            },
          ],
        },
      }),
    [drawable, site, unit, t, tooltipDate],
  );

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-medium">{t(`measure.site.${site}` as never)}</h3>
        {/* Always present, and carrying each line's latest value — that's what
            discharges slot 3's contrast warning on a light card, and it's the
            number you came to read anyway. */}
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {drawable.map((entry) => (
            <li key={entry.key} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-0.5 w-4 rounded-full"
                style={{ backgroundColor: strokeFor(entry.side) }}
              />
              {entry.side === undefined
                ? t("measure.chart.latest", {
                    value: entry.latest.toFixed(1),
                    unit: entry.unit,
                  })
                : t("measure.chart.latestSide", {
                    side: t(`measure.side.${entry.side}` as never),
                    value: entry.latest.toFixed(1),
                    unit: entry.unit,
                  })}
            </li>
          ))}
        </ul>
      </div>
      <Chart
        definition={definition}
        height={CHART_HEIGHT}
        ariaLabel={t("measure.chart.aria", {
          site: t(`measure.site.${site}` as never),
          unit,
        })}
      />
    </section>
  );
}
