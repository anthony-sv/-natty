import { useMemo } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { defineChart, dot, lineY } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateFormat, useT } from "@/i18n/use-t";
import type { WeightUnit } from "@/lib/units";
import {
  estimatedPoints,
  loadedPoints,
  toSetPoints,
  toStrengthCurve,
} from "../history";
import type { LoggedSet } from "../schema";

/** Same overrides as `BodyCharts` — the library's defaults draw grid in ink. */
const theme = {
  foreground: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
};

const CHART_HEIGHT = 200;
const RECORD_RADIUS = 5;
const SET_RADIUS = 3;

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/**
 * One exercise's history, as two pictures.
 *
 * The records table says what your bests are. These say the two things four
 * table rows can't: whether the numbers are going anywhere, and which of the
 * sets behind them were records when you did them.
 */
export function ExerciseCharts({
  sets,
  unit,
  isLoading,
}: {
  sets: LoggedSet[];
  unit: WeightUnit;
  isLoading: boolean;
}) {
  const t = useT();
  const tooltipDate = useDateFormat(DATE_OPTIONS);
  const points = useMemo(() => toSetPoints(sets, unit), [sets, unit]);
  const curve = useMemo(() => toStrengthCurve(sets, unit), [sets, unit]);

  const loaded = useMemo(() => loadedPoints(points), [points]);
  const records = useMemo(() => loaded.filter((p) => p.isRecord), [loaded]);
  const ordinary = useMemo(() => loaded.filter((p) => !p.isRecord), [loaded]);
  const estimates = useMemo(() => estimatedPoints(points), [points]);

  const overTime = useMemo(
    () =>
      defineChart({
        marks: [
          // The estimate first, so the sets that produced it sit on top of it.
          lineY(estimates, {
            x: "date",
            y: "oneRepMax",
            stroke: "var(--chart-estimate)",
          }),
          dot(ordinary, {
            x: "date",
            y: "weight",
            r: SET_RADIUS,
            fill: "var(--chart-weight)",
            fillOpacity: 0.35,
          }),
          // Records read as the shape of the series: larger, solid, ringed off
          // the surface so two on the same day don't merge into one blob.
          dot(records, {
            x: "date",
            y: "weight",
            r: RECORD_RADIUS,
            fill: "var(--chart-weight)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }),
        ],
        x: { scale: scaleTime, nice: true },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: t("detail.axis.load", { unit }) },
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
              label: t("calc.orm.load"),
              text: (point) => `${point.yValue.toFixed(1)} ${unit}`,
            },
          ],
        },
      }),
    [estimates, ordinary, records, unit, t, tooltipDate],
  );

  const strengthCurve = useMemo(
    () =>
      defineChart({
        marks: [
          lineY(curve, {
            x: "reps",
            y: "weight",
            stroke: "var(--chart-weight)",
          }),
          dot(curve, {
            x: "reps",
            y: "weight",
            r: RECORD_RADIUS,
            fill: "var(--chart-weight)",
          }),
        ],
        x: { scale: scaleLinear, nice: true, axis: { label: t("common.reps") } },
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
              label: t("common.reps"),
              text: (point) => String(point.xValue),
            },
            {
              channel: "y",
              label: t("common.weight"),
              text: (point) => `${point.yValue.toFixed(1)} ${unit}`,
            },
          ],
        },
      }),
    [curve, unit, t],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (loaded.length === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("detail.empty.title")}</EmptyTitle>
        <EmptyDescription>
          {points.length === 0
            ? t("detail.empty.body")
            : t("detail.empty.bodyweight")}
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-medium">{t("detail.overTime")}</h3>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <LegendItem label={t("detail.legend.set")} variant="set" />
            <LegendItem label={t("detail.legend.record")} variant="record" />
            {estimates.length > 1 ? (
              <LegendItem
                label={t("detail.legend.estimate")}
                variant="estimate"
              />
            ) : null}
          </ul>
        </div>
        {loaded.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            {t("detail.needTwoSets")}
          </p>
        ) : (
          <>
            <Chart
              definition={overTime}
              height={CHART_HEIGHT}
              ariaLabel={t("detail.overTimeAria")}
            />
            <p className="text-xs text-muted-foreground">
              {t("detail.overTimeNote")}
            </p>
          </>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("detail.strengthCurve")}</h3>
        {curve.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            {t("detail.needTwoRepCounts")}
          </p>
        ) : (
          <>
            <Chart
              definition={strengthCurve}
              height={CHART_HEIGHT}
              ariaLabel={t("detail.strengthCurveAria")}
            />
            <p className="text-xs text-muted-foreground">
              {t("detail.strengthCurveNote")}
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function LegendItem({
  label,
  variant,
}: {
  label: string;
  variant: "set" | "record" | "estimate";
}) {
  return (
    <li className="flex items-center gap-1.5">
      {variant === "estimate" ? (
        <span
          aria-hidden
          className="h-0.5 w-4 rounded-full"
          style={{ backgroundColor: "var(--chart-estimate)" }}
        />
      ) : (
        <span
          aria-hidden
          className={variant === "record" ? "size-3 rounded-full" : "size-2 rounded-full"}
          style={{
            backgroundColor: "var(--chart-weight)",
            opacity: variant === "record" ? 1 : 0.35,
          }}
        />
      )}
      {label}
    </li>
  );
}
