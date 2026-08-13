import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useDateFormat } from "@/i18n/use-t";
import { useWeekdayLabels } from "@/i18n/use-weekdays";
import { cn } from "@/lib/utils";
import type { GridDay } from "@/lib/calendar";

const MONTH: Intl.DateTimeFormatOptions = { month: "short" };
const FULL_DATE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

/**
 * Which weekday rows get a label.
 *
 * Every other one, the way a commit graph does it: seven labels in an 11px row
 * height is unreadable, and three is enough to orient by.
 */
const LABELLED_ROWS = [0, 2, 4];

/**
 * A commit-graph grid, with the cells left to the caller.
 *
 * Three of these exist now — training days, plan adherence and calories
 * against target — and they differ only in what a cell means. The geometry,
 * the month labels over the week a month starts in, the weekday rows and the
 * horizontal scroll are the same problem three times, and were solved once.
 *
 * The caller supplies a colour and a title per day, and optionally makes a day
 * clickable. A day with nothing on it should return no `onSelect`, so it
 * renders as a plain span rather than a button that does nothing.
 */
export function HeatmapGrid<Day extends GridDay>({
  weeks,
  colourFor,
  titleFor,
  onSelect,
  canSelect,
  legend,
  caption,
}: {
  weeks: Day[][];
  colourFor: (day: Day) => string;
  /** Appended to the formatted date, e.g. "— 4 sets". */
  titleFor: (day: Day) => string;
  onSelect?: (day: Day) => void;
  /** Days worth opening. Without it nothing is clickable. */
  canSelect?: (day: Day) => boolean;
  /** Drawn under the grid, on the right — usually a "less → more" strip. */
  legend?: ReactNode;
  /** Drawn under the grid, on the left — what the cells actually count. */
  caption?: ReactNode;
}) {
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
   *
   * A column is 11px and a month name is wider than that, so two labels closer
   * than three columns overlap and read as one word — "MayJun". The leading
   * week is the usual culprit: it gets a label for orientation, and the very
   * next column often starts a month. The later label wins, because it's the
   * one sitting where its month actually begins.
   */
  const monthLabels = useMemo(() => {
    const MIN_GAP = 3;
    const starts = weeks.map((week, index) => {
      const thisMonth = new Date(week[0].date).getMonth();
      const previous = weeks[index - 1];
      return previous === undefined
        ? true
        : new Date(previous[0].date).getMonth() !== thisMonth;
    });

    return weeks.map((week, index) => {
      if (!starts[index]) return "";
      const collides = starts
        .slice(index + 1, index + MIN_GAP)
        .some((start) => start);
      return collides ? "" : month.format(new Date(week[0].date));
    });
  }, [weeks, month]);

  /**
   * Open on the most recent weeks, not the oldest.
   *
   * A year of columns is wider than a phone, so the grid scrolls — and a scroll
   * container starts at the left, which here is *last* August. The whole point
   * of the graph is the run you're on now, and on mobile it was the one part
   * off screen; you had to swipe the length of a year to reach today.
   *
   * Keyed on `weeks` so a data change re-pins it to the end, and it sets
   * `scrollLeft` rather than any state, which is what keeps it clear of the
   * `set-state-in-effect` rule.
   */
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el !== null) el.scrollLeft = el.scrollWidth;
  }, [weeks]);

  return (
    <div className="flex flex-col gap-2">
      {/* The grid is wider than a phone; it scrolls rather than shrinking the
          cells to the point where a week is unreadable. */}
      <div ref={scroller} className="overflow-x-auto pb-1">
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
                  key={weeks[index][0].date}
                  className="w-[11px] text-[10px] leading-[14px] whitespace-nowrap text-muted-foreground"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((week) => (
                <div key={week[0].date} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    // A day that hasn't happened is left blank rather than
                    // drawn as an empty cell — the running week shouldn't read
                    // as four days you skipped.
                    if (day.isPadding) {
                      return (
                        <span
                          key={day.date}
                          aria-hidden
                          className="size-[11px]"
                        />
                      );
                    }

                    const title = `${fullDate.format(new Date(day.date))} — ${titleFor(day)}`;
                    const selectable =
                      onSelect !== undefined && (canSelect?.(day) ?? true);

                    return selectable ? (
                      <button
                        key={day.date}
                        type="button"
                        title={title}
                        aria-label={title}
                        onClick={() => onSelect(day)}
                        className={cn(
                          "size-[11px] rounded-[2px] transition-transform",
                          "hover:scale-125 focus-visible:scale-125 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                        )}
                        style={{ backgroundColor: colourFor(day) }}
                      />
                    ) : (
                      <span
                        key={day.date}
                        title={title}
                        className="size-[11px] rounded-[2px]"
                        style={{ backgroundColor: colourFor(day) }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {caption !== undefined || legend !== undefined ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{caption}</span>
          {legend}
        </div>
      ) : null}
    </div>
  );
}

/** The "less → more" strip most of these carry, given its own steps. */
export function HeatmapLegend({
  from,
  to,
  colours,
}: {
  from: string;
  to: string;
  colours: readonly string[];
}) {
  return (
    <span className="flex items-center gap-1.5">
      {from}
      {colours.map((colour, step) => (
        <span
          key={step}
          aria-hidden
          className="size-[11px] rounded-[2px]"
          style={{ backgroundColor: colour }}
        />
      ))}
      {to}
    </span>
  );
}
