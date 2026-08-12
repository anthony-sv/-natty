import {
  ClockIcon,
  FlameIcon,
  LayersIcon,
  ListChecksIcon,
  ThermometerIcon,
} from "lucide-react";
import type { TrainingDay } from "@/data/routines";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";
import { formatEstimate, summariseDay } from "../lib/day-summary";

/**
 * What the day costs you, before you start it.
 *
 * The page had the exercises and none of the shape — you couldn't tell an
 * eighteen-set day from a nine-set one without adding up the chips yourself.
 */
export function DaySummaryStrip({ day }: { day: TrainingDay }) {
  const t = useT();
  const f = useFormatting();
  const summary = summariseDay(day, f);

  const tiles = [
    {
      icon: ListChecksIcon,
      label: t("routines.summary.exercises"),
      value: String(summary.exercises),
    },
    {
      icon: LayersIcon,
      label: t("routines.summary.workingSets"),
      value: String(summary.workingSets),
    },
    {
      icon: ClockIcon,
      label: t("routines.summary.roughTime"),
      value: formatEstimate(summary.estimatedSeconds),
    },
    // Only when there are any — a "0 warmup sets" tile is a claim about a day
    // that simply doesn't prescribe them, and the strip already omits the
    // finisher tile on the same reasoning.
    ...(summary.warmupSets > 0
      ? [
          {
            // Not the flame — that one means finisher here.
            icon: ThermometerIcon,
            label: t.plural("routines.warmupSets", summary.warmupSets),
            value: String(summary.warmupSets),
          },
        ]
      : []),
    ...(summary.finishers > 0
      ? [
          {
            icon: FlameIcon,
            // The label is the plural form alone — the count is the tile's
            // value, so interpolating it here would print it twice.
            label: t.plural("routines.summary.finishers", summary.finishers),
            value: String(summary.finishers),
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex items-center gap-3 rounded-lg border px-3 py-2"
        >
          <tile.icon className="size-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{tile.label}</span>
            <span className="text-lg font-semibold tabular-nums">
              {tile.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
