import { HeatmapGrid, HeatmapLegend } from "@/components/heatmap-grid";
import { useT } from "@/i18n/use-t";
import { intensityStep, type Calendar, type CalendarDay } from "../heatmap";

/** Every step's colour, indexed by what `intensityStep` returns. */
const STEP_COLOUR = [
  // An untrained day is the muted surface, not a fifth hue — nothing happened,
  // and a colour would imply something did.
  "var(--muted)",
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-4)",
] as const;

/**
 * A year of training days, as a calendar.
 *
 * Consistency is the one thing about training that reads better as a shape than
 * as a number — a table of dates tells you nothing at a glance, and a run of
 * gaps in a grid tells you immediately.
 *
 * Colour is a sequential ramp because it encodes magnitude; see the note in
 * `styles.css` for why that's four steps of one hue rather than four colours.
 * The grid itself is `HeatmapGrid`, shared with the two nutrition ones.
 */
export function TrainingHeatmap({
  calendar,
  onSelectDay,
}: {
  calendar: Calendar;
  /** Given a day with at least one set logged. */
  onSelectDay: (day: CalendarDay) => void;
}) {
  const t = useT();

  return (
    <HeatmapGrid
      weeks={calendar.weeks}
      colourFor={(day) => STEP_COLOUR[intensityStep(day.sets, calendar.busiestDay)]}
      titleFor={(day) =>
        day.sets === 0
          ? t("history.noSets")
          : t.plural("history.setsOnDay", day.sets)
      }
      // Only a day with something on it is worth opening, so an empty one isn't
      // a button at all rather than a button that does nothing.
      canSelect={(day) => day.sets > 0}
      onSelect={onSelectDay}
      caption={t("history.logged")}
      legend={
        <HeatmapLegend
          from={t("history.less")}
          to={t("history.more")}
          colours={STEP_COLOUR}
        />
      }
    />
  );
}
