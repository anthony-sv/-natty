import { useMemo } from "react";
import { scaleBand, scaleLinear } from "d3-scale";
import { barY, defineChart, stack } from "@tanstack/charts";
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

const CHART_HEIGHT = 200;

const WEEK_LABEL: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

const COLOUR: Record<ResistanceSplit, string> = {
  push: "var(--split-push)",
  pull: "var(--split-pull)",
  legs: "var(--split-legs)",
};

interface Segment {
  week: string;
  weekStart: number;
  split: ResistanceSplit;
  sets: number;
}

/**
 * How the week divided between push, pull and legs — for several weeks at once.
 *
 * A stacked bar per week rather than a donut of the current one: the mix is
 * only half the question and the other half is whether it's drifting. Stacked
 * shows both, and it's the `dataviz` skill's default for part-to-whole anyway.
 *
 * Cardio is deliberately absent. It's counted elsewhere, but it isn't
 * resistance volume and folding it in would make a long treadmill week look
 * like a productive one.
 */
export function SplitTrendChart({ weeks }: { weeks: WeekVolume[] }) {
  const t = useT();
  const weekLabel = useDateFormat(WEEK_LABEL);

  const segments = useMemo<Segment[]>(
    () =>
      weeks.flatMap((week) =>
        RESISTANCE_SPLITS.map((split) => ({
          week: weekLabel.format(new Date(week.weekStart)),
          weekStart: week.weekStart,
          split,
          sets: week.split[split],
        })),
      ),
    [weeks, weekLabel],
  );

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(segments, {
            x: "week",
            y: "sets",
            color: "split",
            layout: stack(),
            radius: 2,
          }),
        ],
        x: { scale: scaleBand },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: t("volume.setsAxis") },
        },
        color: {
          // Fixed domain, so a week with no leg work doesn't repaint the
          // other two — colour follows the split, never its rank.
          domain: [...RESISTANCE_SPLITS],
          range: RESISTANCE_SPLITS.map((split) => COLOUR[split]),
        },
        theme,
        tooltip: {
          use: tooltip,
          items: [
            {
              channel: "y",
              label: t("volume.sets"),
              text: (point) => {
                const segment = point.datum as Segment;
                return `${t(`split.${segment.split}`)}: ${segment.sets}`;
              },
            },
          ],
        },
      }),
    [segments, t],
  );

  return (
    <div className="flex flex-col gap-2">
      <Chart
        definition={definition}
        height={CHART_HEIGHT}
        ariaLabel={t("volume.splitAria")}
      />
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {RESISTANCE_SPLITS.map((split) => (
          <li key={split} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[2px]"
              style={{ backgroundColor: COLOUR[split] }}
            />
            {t(`split.${split}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
