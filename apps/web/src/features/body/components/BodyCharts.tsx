import { useMemo } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { defineChart, dot, lineY } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateFormat, useT } from "@/i18n/use-t";
import { convertWeight, type WeightUnit } from "@/lib/units";
import type { BodyEntry } from "../schema";
import { DAYS_IN_WEEK, type WeeklyAverage } from "../weekly";

/**
 * Chart paint, kept out of the definitions so light and dark are one swap.
 *
 * `foreground`/`muted`/`grid` override the library's defaults, which are all
 * `currentColor` — that would draw grid lines in body-text ink. The two series
 * hues are the validated palette's first two slots; they're defined in
 * `styles.css` because they need a dark step.
 */
const theme = {
  foreground: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
};

const CHART_HEIGHT = 220;
/** Marks at 8px across, per the house dataviz rules. */
const DOT_RADIUS = 4;
/** Daily weigh-ins sit under the weekly line, so they read smaller. */
const DAILY_DOT_RADIUS = 3;

/**
 * Tooltip dates. Without an explicit item the default tooltip labels the row
 * "x" and prints a UTC ISO string, which is exact and unreadable.
 */
const TOOLTIP_DATE: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
};

/** Weeks are named by the Monday they start on, not by their midpoint. */
const WEEK_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
};

interface WeightPoint {
  id: string;
  date: Date;
  weight: number;
}

interface WeeklyPoint {
  id: string;
  date: Date;
  weekStart: Date;
  weight: number;
  count: number;
}

interface BodyFatPoint {
  id: string;
  date: Date;
  bodyFatPercent: number;
}

/**
 * Weight and body fat over time.
 *
 * Two charts, never one with two y-axes: the measures share no scale, and a
 * second axis invites reading a crossing point as meaningful. They stack, so
 * the dates still line up by eye.
 *
 * The weight chart carries **two resolutions of one measure** — every weigh-in,
 * and the Monday-anchored weekly mean over them. That is deliberately not two
 * categorical series: they share `--chart-weight` and separate by size and
 * opacity, because a second hue would claim they measure different things. The
 * daily points are the noise; the weekly line is what actually moved.
 */
export function BodyCharts({
  entries,
  weekly,
  isLoading,
}: {
  /** Most recent first, as `useBodyEntries` returns them. */
  entries: BodyEntry[];
  /** Oldest first, as `weeklyAverages` returns them. */
  weekly: WeeklyAverage[];
  isLoading: boolean;
}) {
  // Charted in the unit of the most recent weigh-in: a run mixing 82kg and
  // 181lb would draw a cliff that isn't there. What's *stored* stays as
  // entered — the history table still reads back in each entry's own unit.
  const t = useT();
  const tooltipDate = useDateFormat(TOOLTIP_DATE);
  const weekDate = useDateFormat(WEEK_DATE);
  const unit: WeightUnit = entries[0]?.unit ?? "kg";

  const weightPoints = useMemo<WeightPoint[]>(
    () =>
      entries
        .map((entry) => ({
          id: entry.id,
          date: new Date(entry.measuredAt),
          weight: convertWeight(entry.weight, entry.unit, unit),
        }))
        // Ascending: input order is path order for `lineY`.
        .reverse(),
    [entries, unit],
  );

  const weeklyPoints = useMemo<WeeklyPoint[]>(
    () =>
      weekly.map((week) => ({
        id: String(week.weekStart),
        date: new Date(week.midpoint),
        weekStart: new Date(week.weekStart),
        weight: week.weight,
        count: week.count,
      })),
    [weekly],
  );

  // The week still running is drawn hollow: its mean is over however many days
  // have happened, and a filled point would present a Monday-to-Wednesday
  // figure as finished.
  const settledWeeks = useMemo(
    () => weeklyPoints.filter((_, index) => !weekly[index].isPartial),
    [weeklyPoints, weekly],
  );
  const runningWeek = useMemo(
    () => weeklyPoints.filter((_, index) => weekly[index].isPartial),
    [weeklyPoints, weekly],
  );

  const bodyFatPoints = useMemo<BodyFatPoint[]>(
    () =>
      entries
        .filter((entry) => entry.bodyFatPercent !== undefined)
        .map((entry) => ({
          id: entry.id,
          date: new Date(entry.measuredAt),
          bodyFatPercent: entry.bodyFatPercent!,
        }))
        .reverse(),
    [entries],
  );

  const weightChart = useMemo(
    () =>
      defineChart({
        marks: [
          // Daily first, so the weekly line draws over it rather than under.
          dot(weightPoints, {
            x: "date",
            y: "weight",
            r: DAILY_DOT_RADIUS,
            fill: "var(--chart-weight)",
            fillOpacity: 0.3,
          }),
          lineY(weeklyPoints, {
            x: "date",
            y: "weight",
            stroke: "var(--chart-weight)",
          }),
          dot(settledWeeks, {
            x: "date",
            y: "weight",
            r: DOT_RADIUS,
            fill: "var(--chart-weight)",
          }),
          dot(runningWeek, {
            x: "date",
            y: "weight",
            r: DOT_RADIUS,
            // A ring rather than a disc — the card surface shows through.
            fill: "var(--card)",
            stroke: "var(--chart-weight)",
            strokeWidth: 2,
          }),
        ],
        x: { scale: scaleTime, nice: true },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: t("body.chart.axisWeight", { unit }) },
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
              label: t("common.weight"),
              text: (point) => `${point.yValue.toFixed(1)} ${unit}`,
            },
          ],
        },
      }),
    [
      weightPoints,
      weeklyPoints,
      settledWeeks,
      runningWeek,
      unit,
      t,
      tooltipDate,
    ],
  );

  const bodyFatChart = useMemo(
    () =>
      defineChart({
        marks: [
          lineY(bodyFatPoints, {
            x: "date",
            y: "bodyFatPercent",
            stroke: "var(--chart-body-fat)",
          }),
          dot(bodyFatPoints, {
            x: "date",
            y: "bodyFatPercent",
            r: DOT_RADIUS,
            fill: "var(--chart-body-fat)",
          }),
        ],
        x: { scale: scaleTime, nice: true },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: t("body.chart.axisBodyFat") },
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
              label: t("body.stat.bodyFat"),
              text: (point) => `${point.yValue.toFixed(1)}%`,
            },
          ],
        },
      }),
    [bodyFatPoints, t, tooltipDate],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[220px] w-full" />
        <Skeleton className="h-[220px] w-full" />
      </div>
    );
  }

  // One point is a dot, not a trend. Say so rather than drawing an axis around
  // a single mark.
  if (weightPoints.length < 2) {
    return (
      <Empty>
        <EmptyTitle>{t("body.chart.notEnough.title")}</EmptyTitle>
        <EmptyDescription>{t("body.chart.notEnough.body")}</EmptyDescription>
      </Empty>
    );
  }

  const partial = weekly.find((week) => week.isPartial);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-medium">{t("common.weight")}</h3>
          {/* Written in HTML rather than through the library's `colorLegend`,
              which legends a colour *scale* — these two marks carry fixed
              strokes, so there's no scale for it to read. */}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <LegendItem label={t("body.chart.legendDaily")} variant="daily" />
            <LegendItem label={t("body.chart.legendWeekly")} variant="weekly" />
            {partial ? (
              <LegendItem
                label={t("body.chart.legendPartial", {
                  count: partial.count,
                  total: DAYS_IN_WEEK,
                })}
                variant="partial"
              />
            ) : null}
          </ul>
        </div>
        <Chart
          definition={weightChart}
          height={CHART_HEIGHT}
          ariaLabel={t("body.chart.weightAria", { unit })}
        />
        {weeklyPoints.length >= 2 ? (
          <p className="text-xs text-muted-foreground">
            {t("body.chart.midweekNote", {
              from: weekDate.format(weeklyPoints[0].weekStart),
            })}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("body.stat.bodyFat")}</h3>
        {bodyFatPoints.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            {t("body.chart.bodyFatNeedsTwo")}
          </p>
        ) : (
          <Chart
            definition={bodyFatChart}
            height={CHART_HEIGHT}
            ariaLabel={t("body.chart.bodyFatAria")}
          />
        )}
      </section>
    </div>
  );
}

/** A swatch drawn the same way its mark is, so the legend reads as the chart. */
function LegendItem({
  label,
  variant,
}: {
  label: string;
  variant: "daily" | "weekly" | "partial";
}) {
  return (
    <li className="flex items-center gap-1.5">
      {variant === "weekly" ? (
        <span
          aria-hidden
          className="h-0.5 w-4 rounded-full"
          style={{ backgroundColor: "var(--chart-weight)" }}
        />
      ) : (
        <span
          aria-hidden
          className="size-2.5 rounded-full"
          style={
            variant === "partial"
              ? {
                  backgroundColor: "var(--card)",
                  boxShadow: "inset 0 0 0 2px var(--chart-weight)",
                }
              : { backgroundColor: "var(--chart-weight)", opacity: 0.3 }
          }
        />
      )}
      {label}
    </li>
  );
}
