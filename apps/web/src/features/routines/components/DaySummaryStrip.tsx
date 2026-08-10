import { ClockIcon, FlameIcon, LayersIcon, ListChecksIcon } from "lucide-react";
import type { TrainingDay } from "@/data/routines";
import { formatEstimate, summariseDay } from "../lib/day-summary";

/**
 * What the day costs you, before you start it.
 *
 * The page had the exercises and none of the shape — you couldn't tell an
 * eighteen-set day from a nine-set one without adding up the chips yourself.
 */
export function DaySummaryStrip({ day }: { day: TrainingDay }) {
  const summary = summariseDay(day);

  const tiles = [
    { icon: ListChecksIcon, label: "Exercises", value: String(summary.exercises) },
    { icon: LayersIcon, label: "Working sets", value: String(summary.workingSets) },
    {
      icon: ClockIcon,
      label: "Rough time",
      value: formatEstimate(summary.estimatedSeconds),
    },
    ...(summary.finishers > 0
      ? [
          {
            icon: FlameIcon,
            label: summary.finishers === 1 ? "Finisher" : "Finishers",
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
