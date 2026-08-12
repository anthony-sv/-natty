import { useMemo } from "react";
import { scaleBand, scaleLinear } from "d3-scale";
import { barY, defineChart } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { useDateFormat, useT } from "@/i18n/use-t";
import {
  RESISTANCE_SPLITS,
  type ResistanceSplit,
  type WeekVolume,
} from "../volume";

/** Same overrides as the other charts — the defaults draw grid in body ink. */
const theme = {
  foreground: "var(--foreground)",
  muted: "var(--muted-foreground)",
  grid: "var(--border)",
};

/** Short, because four of them stack on a phone. */
const FACET_HEIGHT = 120;

const WEEK_LABEL: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

interface Bar {
  week: string;
  sets: number;
}

/**
 * How the week divided between push, pull, legs and core — several weeks at once.
 *
 * **Small multiples, not one stacked bar**, and that's forced rather than
 * chosen. A stacked bar distinguishes its bands by colour alone, so it needs
 * every pair of colours tellable apart; `validate_palette.js` says a fourth
 * categorical hue can't clear the normal-vision floor against this trio in dark
 * mode — violet, yellow, magenta, red, green and yellow-green all fail, and the
 * skill is explicit that direct labelling does *not* discharge that particular
 * check. Faceting is the sanctioned answer: each panel carries its own title,
 * so colour stops encoding identity and the constraint disappears.
 *
 * It also reads better for the question actually being asked. A stack shows the
 * mix; four panels sharing one y-scale show each split's own trend, which is
 * what "am I doing enough core work" needs.
 *
 * Cardio is deliberately absent. It's counted elsewhere, but it isn't
 * resistance volume and folding it in would make a long treadmill week look
 * like a productive one.
 */
export function SplitTrendChart({ weeks }: { weeks: WeekVolume[] }) {
  const weekLabel = useDateFormat(WEEK_LABEL);

  // One shared ceiling across all four panels. Per-panel scaling would draw a
  // 3-set core week the same height as a 20-set push week, which is the exact
  // comparison small multiples exist to make honest.
  const maxSets = useMemo(
    () =>
      Math.max(
        1,
        ...weeks.flatMap((week) =>
          RESISTANCE_SPLITS.map((split) => week.split[split]),
        ),
      ),
    [weeks],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {RESISTANCE_SPLITS.map((split) => (
          <SplitFacet
            key={split}
            split={split}
            weeks={weeks}
            maxSets={maxSets}
            weekLabel={weekLabel}
          />
        ))}
      </div>
    </div>
  );
}

function SplitFacet({
  split,
  weeks,
  maxSets,
  weekLabel,
}: {
  split: ResistanceSplit;
  weeks: WeekVolume[];
  maxSets: number;
  weekLabel: Intl.DateTimeFormat;
}) {
  const t = useT();
  const label = t(`split.${split}`);

  const bars = useMemo<Bar[]>(
    () =>
      weeks.map((week) => ({
        week: weekLabel.format(new Date(week.weekStart)),
        sets: week.split[split],
      })),
    [weeks, split, weekLabel],
  );

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(bars, {
            x: "week",
            y: "sets",
            // One colour throughout: the panel title says which split this is,
            // so the fill is just ink. Body foreground rather than a palette
            // slot, because nothing here is encoding identity.
            fill: "var(--foreground)",
            radius: 2,
          }),
        ],
        x: { scale: scaleBand },
        y: {
          scale: scaleLinear,
          // Shared, so the panels are comparable by eye.
          domain: [0, maxSets],
          nice: true,
          grid: true,
        },
        theme,
        tooltip: {
          use: tooltip,
          items: [
            {
              channel: "y",
              label: t("volume.sets"),
              text: (point) => `${label}: ${(point.datum as Bar).sets}`,
            },
          ],
        },
      }),
    [bars, maxSets, label, t],
  );

  const total = bars.reduce((sum, bar) => sum + bar.sets, 0);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {t.plural("volume.setsSuffix", total)}
        </span>
      </div>
      <Chart
        definition={definition}
        height={FACET_HEIGHT}
        ariaLabel={t("volume.splitFacetAria", { split: label })}
      />
    </div>
  );
}
