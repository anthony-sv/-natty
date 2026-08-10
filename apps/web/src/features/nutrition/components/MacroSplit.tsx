import { useMemo } from "react";
import { defineChart } from "@tanstack/charts";
import { polar, radialArc } from "@tanstack/charts/polar";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { pie } from "d3-shape";
import { cn } from "@/lib/utils";
import type { Macros } from "@/data/diets";
import { KCAL_PER_GRAM, kcalOf, percentSplit } from "../macros";

/**
 * The macro split: a donut, a hero calorie figure, and a row per macro.
 *
 * A donut is the requested form and a legal one here — the house data-viz rules
 * allow it for part-to-whole at a glance with six segments or fewer, and this
 * has three. The rule it would break is comparing close values by arc alone, so
 * every slice is also written out beside it in grams, calories and share. The
 * skill's own default for part-to-whole is a stacked bar; that form is used
 * elsewhere on the page, for how the day divides across meals.
 */

interface MacroSlice {
  key: keyof Macros;
  label: string;
  grams: number;
  kcal: number;
  percent: number;
  color: string;
}

const ORDER: Array<{ key: keyof Macros; label: string; color: string }> = [
  { key: "protein", label: "Protein", color: "var(--macro-protein)" },
  { key: "carbs", label: "Carbs", color: "var(--macro-carbs)" },
  { key: "fat", label: "Fat", color: "var(--macro-fat)" },
];

function slicesOf(macros: Macros): MacroSlice[] {
  const split = percentSplit(macros);
  return ORDER.map(({ key, label, color }) => ({
    key,
    label,
    grams: macros[key],
    kcal: macros[key] * KCAL_PER_GRAM[key],
    percent: split[key],
    color,
  }));
}

const theme = {
  foreground: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
};

export function MacroSplit({
  macros,
  /** Shown in the middle of the ring. */
  caption,
  size = 220,
  className,
}: {
  macros: Macros;
  caption?: string;
  size?: number;
  className?: string;
}) {
  const slices = useMemo(() => slicesOf(macros), [macros]);
  const total = kcalOf(macros);

  const definition = useMemo(() => {
    const layout = pie<MacroSlice>()
      // Input order is the fixed palette order; sorting by size would repaint
      // the slices every time a slider moved.
      .sort(null)
      .padAngle(0.02)
      .value((slice) => slice.kcal);

    return defineChart({
      marks: [
        polar({
          inset: 2,
          radiusRatio: 0.95,
          marks: [
            radialArc(layout(slices), {
              startAngle: "startAngle",
              endAngle: "endAngle",
              padAngle: "padAngle",
              innerRadius: ({ radius }) => radius * 0.62,
              cornerRadius: 4,
              color: (arc) => arc.data.label,
              key: (arc) => arc.data.label,
            }),
          ],
        }),
      ],
      color: {
        domain: slices.map((slice) => slice.label),
        range: slices.map((slice) => slice.color),
      },
      guides: false,
      margin: 0,
      theme,
      tooltip: {
        use: tooltip,
        items: [
          {
            channel: "y",
            label: "Calories",
            // `datum` is d3's arc wrapper; the slice itself is on `.data`.
            text: (point) => {
              const slice = point.datum.data;
              return `${Math.round(slice.kcal)} kcal · ${slice.grams.toFixed(0)}g · ${slice.percent.toFixed(0)}%`;
            },
          },
        ],
      },
    });
  }, [slices]);

  const isEmpty = total <= 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {isEmpty ? (
          <div className="size-full rounded-full border-8 border-dashed border-muted" />
        ) : (
          <Chart
            definition={definition}
            width={size}
            height={size}
            ariaLabel={`Macro split: ${slices
              .map((s) => `${s.label} ${s.percent.toFixed(0)}%`)
              .join(", ")}`}
          />
        )}
        {/* The number the ring is about, in the hole it leaves. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums">
            {Math.round(total).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">kcal</span>
          {caption ? (
            <span className="pt-0.5 text-[11px] text-muted-foreground">
              {caption}
            </span>
          ) : null}
        </div>
      </div>

      {/* Direct labels. The colour is never the only thing identifying a slice
          — which is also what discharges the light-mode contrast relief. */}
      <dl className="flex min-w-52 flex-1 flex-col gap-2">
        {slices.map((slice) => (
          <div key={slice.key} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <dt className="text-sm">{slice.label}</dt>
            <dd className="ml-auto flex items-baseline gap-3 tabular-nums">
              <span className="font-semibold">{slice.grams.toFixed(0)}g</span>
              <span className="w-16 text-right text-sm text-muted-foreground">
                {Math.round(slice.kcal).toLocaleString()} kcal
              </span>
              <span className="w-9 text-right text-sm text-muted-foreground">
                {slice.percent.toFixed(0)}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
