import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { HabitChecklist } from "@/features/habits/components/HabitChecklist";
import { HabitHistory } from "@/features/habits/components/HabitHistory";
import { useDateFormat, useT } from "@/i18n/use-t";
import { addDays, daysBetween, startOfDay } from "@/lib/week";

export const Route = createFileRoute("/habits")({
  component: HabitsPage,
});

/**
 * The wellbeing side of the day — brushing, reading, stretching.
 *
 * Its own page rather than a card on the nutrition Today tab: the Today tab
 * is about one plan's food, and a habit has nothing to do with which diet
 * you're on. Same day navigation as that tab, and the same rule that forward
 * stops at today — this records what happened.
 */
function HabitsPage() {
  const t = useT();
  // Seeded once, the `react-hooks/purity` rule: no clock reads during render.
  const [today] = useState(() => startOfDay(Date.now()));
  const [day, setDay] = useState(today);
  const offset = daysBetween(today, day);
  const dateLabel = useDateFormat({
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(day));

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">{t("habits.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("habits.subtitle")}</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          aria-label={t("intake.previousDay")}
          onClick={() => setDay((current) => addDays(current, -1))}
        >
          <ChevronLeftIcon />
        </Button>
        <div className="flex w-48 flex-col items-center">
          <span className="font-medium">
            {offset === 0
              ? t("intake.today")
              : offset === -1
                ? t("intake.yesterday")
                : dateLabel}
          </span>
          {offset !== 0 ? (
            <span className="text-xs text-muted-foreground">{dateLabel}</span>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("intake.nextDay")}
          disabled={offset >= 0}
          onClick={() => setDay((current) => addDays(current, 1))}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <HabitChecklist day={day} today={today} />
      <HabitHistory today={today} />
    </Page>
  );
}
