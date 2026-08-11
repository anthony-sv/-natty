import { useMemo } from "react";
import { useDateFormat, useT } from "@/i18n/use-t";
import { useWeekdayLabels } from "@/i18n/use-weekdays";
import { cn } from "@/lib/utils";
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

const MONTH: Intl.DateTimeFormatOptions = { month: "short" };
const FULL_DATE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

/**
 * Which weekday rows get a label.
 *
 * Every other one, the way a commit graph does it: seven labels in a 10px row
 * height is unreadable, and three is enough to orient by.
 */
const LABELLED_ROWS = [0, 2, 4];

/**
 * A year of training days, as a calendar.
 *
 * Consistency is the one thing about training that reads better as a shape than
 * as a number — a table of dates tells you nothing at a glance, and a run of
 * gaps in a grid tells you immediately.
 *
 * Colour is a sequential ramp because it encodes magnitude; see the note in
 * `styles.css` for why that's four steps of one hue rather than four colours.
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
  const month = useDateFormat(MONTH);
  const fullDate = useDateFormat(FULL_DATE);
  const weekdays = useWeekdayLabels();
  const weekdayList = useMemo(
    () => [
      weekdays.mon,
      weekdays.tue,
      weekdays.wed,
      weekdays.thu,
      weekdays.fri,
      weekdays.sat,
      weekdays.sun,
    ],
    [weekdays],
  );

  /**
   * A month label sits over the first week that starts a new month, so it lines
   * up with where that month's cells begin rather than floating mid-block.
   */
  const monthLabels = useMemo(
    () =>
      calendar.weeks.map((week, index) => {
        const thisMonth = new Date(week[0].date).getMonth();
        const previous = calendar.weeks[index - 1];
        if (previous === undefined) return month.format(new Date(week[0].date));
        return new Date(previous[0].date).getMonth() === thisMonth
          ? ""
          : month.format(new Date(week[0].date));
      }),
    [calendar.weeks, month],
  );

  return (
    <div className="flex flex-col gap-2">
      {/* The grid is wider than a phone; it scrolls rather than shrinking the
          cells to the point where a week is unreadable. */}
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-1.5">
          <div className="flex shrink-0 flex-col gap-[3px] pt-[18px]">
            {weekdayList.map((label, row) => (
              <span
                key={label}
                className="h-[11px] text-[10px] leading-[11px] text-muted-foreground"
              >
                {LABELLED_ROWS.includes(row) ? label : ""}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex gap-[3px]">
              {monthLabels.map((label, index) => (
                <span
                  key={calendar.weeks[index][0].date}
                  className="w-[11px] text-[10px] leading-[14px] whitespace-nowrap text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex gap-[3px]">
              {calendar.weeks.map((week) => (
                <div key={week[0].date} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <Cell
                      key={day.date}
                      day={day}
                      busiest={calendar.busiestDay}
                      label={fullDate.format(new Date(day.date))}
                      t={t}
                      onSelect={onSelectDay}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{t("history.logged")}</span>
        <span className="flex items-center gap-1.5">
          {t("history.less")}
          {STEP_COLOUR.map((colour, step) => (
            <span
              key={step}
              aria-hidden
              className="size-[11px] rounded-[2px]"
              style={{ backgroundColor: colour }}
            />
          ))}
          {t("history.more")}
        </span>
      </div>
    </div>
  );
}

function Cell({
  day,
  busiest,
  label,
  t,
  onSelect,
}: {
  day: CalendarDay;
  busiest: number;
  label: string;
  t: ReturnType<typeof useT>;
  onSelect: (day: CalendarDay) => void;
}) {
  // A day that hasn't happened is left blank rather than drawn as an empty
  // cell — the running week shouldn't read as four days you skipped.
  if (day.isPadding) {
    return <span aria-hidden className="size-[11px]" />;
  }

  const step = intensityStep(day.sets, busiest);
  const title =
    day.sets === 0
      ? `${label} — ${t("history.noSets")}`
      : `${label} — ${t.plural("history.setsOnDay", day.sets)}`;

  // Only a day with something on it is worth opening, so an empty one isn't a
  // button at all rather than a button that does nothing.
  if (day.sets === 0) {
    return (
      <span
        title={title}
        className="size-[11px] rounded-[2px]"
        style={{ backgroundColor: STEP_COLOUR[0] }}
      />
    );
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={() => onSelect(day)}
      className={cn(
        "size-[11px] rounded-[2px] transition-transform",
        "hover:scale-125 focus-visible:scale-125 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
      )}
      style={{ backgroundColor: STEP_COLOUR[step] }}
    />
  );
}
