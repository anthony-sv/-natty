import { useMemo } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { defineChart, dot, lineY } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { convertWeight, type WeightUnit } from "@/lib/units";
import type { BodyEntry } from "../schema";

/**
 * Chart paint, kept out of the definitions so light and dark are one swap.
 *
 * `foreground`/`muted`/`grid` override the library's defaults, which are all
 * `currentColor` — that would draw grid lines in body-text ink. The two series
 * hues are the validated palette's first two slots; they're defined in
 * `styles.css` because they need a dark step, and the same two colours never
 * appear in one chart, so nothing here rests on telling them apart.
 */
const theme = {
  foreground: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
};

const CHART_HEIGHT = 220;
/** Marks at 8px across, per the house dataviz rules. */
const DOT_RADIUS = 4;

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

interface WeightPoint {
  id: string;
  date: Date;
  weight: number;
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
 */
export function BodyCharts({
  entries,
  isLoading,
}: {
  /** Most recent first, as `useBodyEntries` returns them. */
  entries: BodyEntry[];
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
          lineY(weightPoints, {
            x: "date",
            y: "weight",
            stroke: "var(--chart-weight)",
          }),
          dot(weightPoints, {
            x: "date",
            y: "weight",
            r: DOT_RADIUS,
            fill: "var(--chart-weight)",
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
    [weightPoints, unit],
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

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Weight</h3>
        <Chart
          definition={weightChart}
          height={CHART_HEIGHT}
          ariaLabel={`Body weight in ${unit} over time`}
        />
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
