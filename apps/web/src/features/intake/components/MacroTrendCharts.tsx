import { useMemo } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { defineChart, dot, lineY, ruleY } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { useDateFormat, useT } from "@/i18n/use-t";
import { toMacroPoints, type DayIntake } from "../trends";

/**
 * Chart paint, kept out of the definitions so light and dark are one swap.
 * The library's defaults are `currentColor` for foreground, muted *and* grid,
 * which draws grid lines in body-text ink.
 */
const theme = {
  foreground: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
};

const CHART_HEIGHT = 200;
/** 8px across, per the house dataviz rules. */
const DOT_RADIUS = 4;

const TOOLTIP_DATE: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
};

/**
 * What you actually ate, over time.
 *
 * **Two charts, never one with two y-axes.** Grams and calories share no scale
 * — the same rule `BodyCharts` follows for weight and body fat, and the reason
 * a crossing point between them would mean nothing. Stacking them keeps the
 * dates lined up by eye anyway.
 *
 * The three macros *do* belong on one chart: they're the same measure in the
 * same unit, and the whole question is how they move against each other. They
 * carry the same three palette slots the donut uses, so protein is the same
 * colour in both places.
 *
 * Only days you logged are plotted. A gap is a day you didn't record, and
 * drawing it as zero would put a cliff in the line every weekend.
 */
export function MacroTrendCharts({
  days,
  targetKcal,
}: {
  days: DayIntake[];
  /** Drawn as a rule across the calorie chart, when the plan states one. */
  targetKcal: number | undefined;
}) {
  const t = useT();
  const tooltipDate = useDateFormat(TOOLTIP_DATE);

  const points = useMemo(() => toMacroPoints(days), [days]);

  const macroChart = useMemo(
    () =>
      defineChart({
        marks: [
          lineY(points, { x: "date", y: "protein", stroke: "var(--macro-protein)" }),
          dot(points, { x: "date", y: "protein", r: DOT_RADIUS, fill: "var(--macro-protein)" }),
          lineY(points, { x: "date", y: "carbs", stroke: "var(--macro-carbs)" }),
          dot(points, { x: "date", y: "carbs", r: DOT_RADIUS, fill: "var(--macro-carbs)" }),
          lineY(points, { x: "date", y: "fat", stroke: "var(--macro-fat)" }),
          dot(points, { x: "date", y: "fat", r: DOT_RADIUS, fill: "var(--macro-fat)" }),
        ],
        x: { scale: scaleTime, nice: true },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: t("trends.axisGrams") },
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
              label: t("trends.grams"),
              text: (point) => `${point.yValue.toFixed(0)} g`,
            },
          ],
        },
      }),
    [points, t, tooltipDate],
  );

  const kcalChart = useMemo(
    () =>
      defineChart({
        marks: [
          // The target first, so the line draws over it rather than under.
          ...(targetKcal === undefined
            ? []
            : [ruleY([targetKcal], { stroke: "var(--muted-foreground)" })]),
          lineY(points, { x: "date", y: "kcal", stroke: "var(--chart-weight)" }),
          dot(points, { x: "date", y: "kcal", r: DOT_RADIUS, fill: "var(--chart-weight)" }),
        ],
        x: { scale: scaleTime, nice: true },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: t("trends.axisKcal") },
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
              label: t("trends.kcal"),
              text: (point) => `${Math.round(point.yValue).toLocaleString()} kcal`,
            },
          ],
        },
      }),
    [points, targetKcal, t, tooltipDate],
  );

  // One point is a dot, not a trend. Say so rather than drawing an axis around
  // a single mark — the same call `BodyCharts` makes.
  if (points.length < 2) {
    return (
      <Empty>
        <EmptyTitle>{t("trends.notEnough.title")}</EmptyTitle>
        <EmptyDescription>{t("trends.notEnough.body")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-medium">{t("trends.macros")}</h3>
          {/* Written in HTML rather than through the library's `colorLegend`,
              which legends a colour *scale* — these three carry fixed strokes,
              so there's no scale for it to read. */}
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <LegendItem colour="var(--macro-protein)" label={t("nutrition.protein")} />
            <LegendItem colour="var(--macro-carbs)" label={t("nutrition.carbs")} />
            <LegendItem colour="var(--macro-fat)" label={t("nutrition.fat")} />
          </ul>
        </div>
        <Chart
          definition={macroChart}
          height={CHART_HEIGHT}
          ariaLabel={t("trends.macrosAria")}
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-medium">{t("trends.calories")}</h3>
          {targetKcal !== undefined ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                aria-hidden
                className="h-px w-4"
                style={{ backgroundColor: "var(--muted-foreground)" }}
              />
              {t("trends.targetLine", {
                kcal: Math.round(targetKcal).toLocaleString(),
              })}
            </span>
          ) : null}
        </div>
        <Chart
          definition={kcalChart}
          height={CHART_HEIGHT}
          ariaLabel={t("trends.caloriesAria")}
        />
      </section>
    </div>
  );
}

function LegendItem({ colour, label }: { colour: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="h-0.5 w-4 rounded-full"
        style={{ backgroundColor: colour }}
      />
      {label}
    </li>
  );
}
