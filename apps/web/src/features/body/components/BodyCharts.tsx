import { useMemo } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { defineChart, dot, lineY } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { convertWeight, type WeightUnit } from "@/lib/units";
import type { BodyEntry } from "../schema";
import type { WeeklyAverage } from "../weekly";

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
const tooltipDate = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Weeks are named by the Monday they start on, not by their midpoint. */
const weekDate = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

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
          axis: { label: `Weight (${unit})` },
        },
        theme,
        tooltip: {
          use: tooltip,
          items: [
            {
              channel: "x",
              label: "Date",
              text: (point) => tooltipDate.format(point.xValue),
            },
            {
              channel: "y",
              label: "Weight",
              text: (point) => `${point.yValue.toFixed(1)} ${unit}`,
            },
          ],
        },
      }),
    [weightPoints, weeklyPoints, settledWeeks, runningWeek, unit],
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
          axis: { label: "Body fat (%)" },
        },
        theme,
        tooltip: {
          use: tooltip,
          items: [
            {
              channel: "x",
              label: "Date",
              text: (point) => tooltipDate.format(point.xValue),
            },
            {
              channel: "y",
              label: "Body fat",
              text: (point) => `${point.yValue.toFixed(1)}%`,
            },
          ],
        },
      }),
    [bodyFatPoints],
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
        <EmptyTitle>Not enough weigh-ins yet</EmptyTitle>
        <EmptyDescription>
          Log a second one and the trend shows up here.
        </EmptyDescription>
      </Empty>
    );
  }

  const partial = weekly.find((week) => week.isPartial);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-medium">Weight</h3>
          {/* Written in HTML rather than through the library's `colorLegend`,
              which legends a colour *scale* — these two marks carry fixed
              strokes, so there's no scale for it to read. */}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <LegendItem label="Each weigh-in" variant="daily" />
            <LegendItem label="Weekly average" variant="weekly" />
            {partial ? (
              <LegendItem
                label={`This week so far (${partial.count} of 7 days)`}
                variant="partial"
              />
            ) : null}
          </ul>
        </div>
        <Chart
          definition={weightChart}
          height={CHART_HEIGHT}
          ariaLabel={`Body weight in ${unit} over time, with the weekly average`}
        />
        {weeklyPoints.length >= 2 ? (
          <p className="text-xs text-muted-foreground">
            Each average is plotted mid-week, on the Thursday, so the line sits
            over the days it summarises.{" "}
            {weekDate.format(weeklyPoints[0].weekStart)} onwards.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Body fat</h3>
        {bodyFatPoints.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Body fat is optional, so this needs two weigh-ins that carry a
            reading.
          </p>
        ) : (
          <Chart
            definition={bodyFatChart}
            height={CHART_HEIGHT}
            ariaLabel="Body fat percentage over time"
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
