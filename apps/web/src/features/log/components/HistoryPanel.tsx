import { useMemo, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateFormat, useT } from "@/i18n/use-t";
import { addDays } from "@/lib/week";
import { loggedSetsFork } from "../collection";
import { toCalendar, type CalendarDay } from "../heatmap";
import { useDeloadSuggested } from "../use-deload";
import { LoggedSetList } from "./LoggedSetList";
import { TrainingHeatmap } from "./TrainingHeatmap";

/** A year, the span a commit graph shows and the one a training year fits. */
const WEEKS = 53;

const DAY_TITLE: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

/** Every day you logged something, and what you did on any one of them. */
export function HistoryPanel() {
  const t = useT();
  const dayTitle = useDateFormat(DAY_TITLE);

  // Read once on mount rather than during render, per `react-hooks/purity`.
  const [now] = useState(() => Date.now());
  const [selected, setSelected] = useState<CalendarDay | undefined>(undefined);

  const loggedSets = loggedSetsFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ set: loggedSets }),
    [loggedSets],
  );
  const sets = useMemo(() => data ?? [], [data]);
  const calendar = useMemo(
    () => toCalendar(sets, { weeks: WEEKS, now }),
    [sets, now],
  );
  // Same hook `DeloadBanner` and the home strip read.
  const suggestsDeload = useDeloadSuggested(now).suggested;

  // Filtered off the live query rather than read from the collection, so an
  // edit or a delete inside the sheet updates the list underneath it.
  const daySets = useMemo(() => {
    if (selected === undefined) return [];
    const end = addDays(selected.date, 1);
    return sets
      .filter((set) => set.performedAt >= selected.date && set.performedAt < end)
      .sort((a, b) => a.performedAt - b.performedAt);
  }, [sets, selected]);

  if (isLoading) return <Skeleton className="h-56 w-full" />;

  if (sets.length === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("history.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("history.empty.body")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("history.title")}</CardTitle>
          <CardDescription>{t("history.body")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat
              label={t("history.daysTrained")}
              value={String(calendar.daysTrained)}
            />
            <Stat label={t("history.setsLogged")} value={String(calendar.totalSets)} />
            <Stat
              label={t("history.longestStreak")}
              value={t.plural("history.days", calendar.longestStreak)}
            />
            <Stat
              label={t("history.currentStreak")}
              value={t.plural("history.days", calendar.currentStreak)}
            />
          </div>

          {/* Said out loud, because a streak that survives a gap is not what
              the commit graph this borrows its shape from means by one. */}
          <p className="text-xs text-muted-foreground">
            {t("history.streakRule")}
          </p>

          <TrainingHeatmap
            calendar={calendar}
            onSelectDay={setSelected}
            deloadSuggested={suggestsDeload}
          />
        </CardContent>
      </Card>

      <Sheet
        open={selected !== undefined}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
      >
        <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selected ? dayTitle.format(new Date(selected.date)) : ""}
            </SheetTitle>
            <SheetDescription>
              {selected
                ? t("history.daySummary", {
                    sets: t.plural("history.setsOnDay", daySets.length),
                    exercises: t.plural("history.exercises", selected.exercises),
                  })
                : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-6">
            <LoggedSetList sets={daySets} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}
