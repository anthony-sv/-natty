import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDateFormat, useT } from "@/i18n/use-t";
import { calendarWeeks } from "@/lib/calendar";
import {
  amountOn,
  cellStep,
  completionRate,
  indexLogs,
  isDueOn,
  streakOf,
  type LogIndex,
} from "../habits";
import type { Habit } from "../schema";
import { useHabits } from "../use-habits";
import { StreakBadge } from "./HabitChecklist";

const WEEKS = 12;

/**
 * How each habit has gone: the last twelve weeks as a grid, the current run,
 * and the last thirty days as a rate.
 *
 * A grid per habit rather than one combined grid: "did I brush" and "did I
 * read" are different questions, and a cell blending both would answer
 * neither. Same `--heat-1..4` ramp as the training heatmap, stepped against
 * the habit's own target (see `cellStep`), so "done" looks the same whatever
 * the target is. A day the habit wasn't due is drawn faint rather than empty,
 * because empty reads as a miss.
 */
export function HabitHistory({ today }: { today: number }) {
  const t = useT();
  const { habits, logs, isLoading } = useHabits();
  const index = useMemo(() => indexLogs(logs), [logs]);
  const weeks = useMemo(() => calendarWeeks({ weeks: WEEKS, now: today }), [today]);
  const active = habits
    .filter((habit) => habit.archivedAt === undefined)
    .sort((a, b) => a.createdAt - b.createdAt);

  if (isLoading || active.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("habits.history")}</CardTitle>
        <CardDescription>{t("habits.historyBody")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {active.map((habit) => {
          const rate = completionRate(habit, logs, today);
          return (
            <div key={habit.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {habit.name}
                </span>
                <StreakBadge row={{ streak: streakOf(habit, index, today) }} />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {rate === undefined
                    ? t("habits.rateNone")
                    : t("habits.rate", { percent: Math.round(rate * 100) })}
                </span>
              </div>
              <HabitGrid habit={habit} index={index} weeks={weeks} today={today} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function HabitGrid({
  habit,
  index,
  weeks,
  today,
}: {
  habit: Habit;
  index: LogIndex;
  weeks: ReturnType<typeof calendarWeeks>;
  today: number;
}) {
  const format = useDateFormat({ day: "numeric", month: "short" });

  return (
    // Columns are weeks and rows weekdays, like the training heatmap, so a
    // skipped Sunday lines up week after week.
    <div className="grid grid-flow-col grid-rows-7 gap-1 self-start">
      {weeks.flat().map((day) => {
        const amount = amountOn(index, habit.id, day.date);
        const due = isDueOn(habit, day.date);
        const step = cellStep(habit, amount);
        return (
          <span
            key={day.date}
            title={day.isPadding ? undefined : format.format(new Date(day.date))}
            className="size-3 rounded-[3px] sm:size-3.5"
            style={{
              background: day.isPadding
                ? "transparent"
                : step > 0
                  ? `var(--heat-${step})`
                  : "var(--muted)",
              opacity: !day.isPadding && step === 0 && (!due || day.date === today) ? 0.45 : 1,
            }}
          />
        );
      })}
    </div>
  );
}
