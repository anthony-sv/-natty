import { intensityStep, type Calendar } from "@/features/log/heatmap";
import { cn } from "@/lib/utils";

/**
 * The training card's visual, condensed: the last four weeks of `toCalendar`
 * as one row of small cells rather than the full year grid — a glance, not
 * the `/progress` heatmap. Same `--heat-1..4` sequential ramp, so a card and
 * the real thing never disagree about what a busy day looks like.
 */
export function MiniHeatmapStrip({ calendar }: { calendar: Calendar }) {
  const days = calendar.weeks.slice(-4).flat();

  return (
    <div className="flex gap-1" aria-hidden="true">
      {days.map((day) => (
        <span
          key={day.date}
          className={cn(
            "h-3 flex-1 rounded-sm",
            day.isPadding && "opacity-0",
          )}
          style={{
            background:
              day.isPadding || day.sets === 0
                ? "var(--muted)"
                : `var(--heat-${intensityStep(day.sets, calendar.busiestDay)})`,
          }}
        />
      ))}
    </div>
  );
}

/** Before there's a single logged set — the shape the real strip will take. */
export function MiniHeatmapStripSample() {
  // Fixed, not random: a placeholder that changes on every render reads as
  // broken rather than as "nothing here yet".
  const pattern = [0, 0, 1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0];

  return (
    <div className="flex gap-1" aria-hidden="true">
      {pattern.map((step, i) => (
        <span
          key={i}
          className="h-3 flex-1 rounded-sm opacity-40"
          style={{
            background: step === 0 ? "var(--muted)" : `var(--heat-${step})`,
          }}
        />
      ))}
    </div>
  );
}
