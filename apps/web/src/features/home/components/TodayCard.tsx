import { Link } from "@tanstack/react-router";
import { useLiveQuery } from "@tanstack/react-db";
import { PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@tanstack/react-store";
import { loggedSetsFork } from "@/features/log/collection";
import { useCompletions } from "@/features/log/completion-collection";
import { profileStore } from "@/features/profile/profile-store";
import { useActiveRoutine } from "@/features/routines/use-active-routine";
import { dayAfter, nextTrainingDay } from "@/features/routines/lib/next-day";
import { exerciseDisplayName } from "@/features/routines/lib/format";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";

/**
 * What "pick a program" was missing: a card that says what today actually is.
 *
 * Only renders once an active program is resolved *and* it has a next day to
 * show — the caller (`/`) falls back to `StartCard` for every other case
 * (no active program, or the collection still loading), so there's exactly
 * one "nothing to do yet" card rather than two disagreeing about wording.
 */
export function TodayCard() {
  const t = useT();
  const f = useFormatting();
  const { routine, isLoading } = useActiveRoutine();
  const startAt = useStore(
    profileStore,
    (state) => state.activeRoutineStartDay,
  );
  const loggedSets = loggedSetsFork.useActive();
  const { data } = useLiveQuery(
    (q) => q.from({ set: loggedSets }),
    [loggedSets],
  );
  const completions = useCompletions();

  if (isLoading || routine === undefined) return null;

  const sets = data ?? [];
  const next = nextTrainingDay(routine, sets, completions, startAt);
  if (next === undefined) return null;

  const routineName = f.names.routine(routine.slug, routine.name);
  const dayLabel = t("routines.dayLabel", {
    number: next.day.dayNumber,
    label: f.names.text(next.day.label) ?? next.day.label,
  });

  if (next.day.isRest) {
    const after = dayAfter(routine, next);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("index.today.title")}</CardTitle>
          <CardDescription>
            {routineName} · {dayLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            {t("index.today.restBody")}
          </p>
          {after !== undefined ? (
            <p className="text-sm text-muted-foreground">
              {t("index.today.upNext", {
                day: t("routines.dayLabel", {
                  number: after.day.dayNumber,
                  label: f.names.text(after.day.label) ?? after.day.label,
                }),
              })}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  // Three or four names, the same preview length `WeekDayList` uses on the
  // program page — enough to recognize the day, not the whole list.
  const preview = next.day.exercises
    .slice(0, 4)
    .map((entry) => exerciseDisplayName(entry, f))
    .join(" · ");

  return (
    <Card className="border-primary/40 ring-primary/30">
      <CardHeader>
        <CardTitle>{t("index.today.title")}</CardTitle>
        <CardDescription>
          {routineName} · {dayLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {preview.length > 0 ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {preview}
          </p>
        ) : null}
        <Button
          nativeButton={false}
          render={
            <Link
              to="/routines/$routineSlug/week/$weekNumber/day/$dayNumber"
              params={{
                routineSlug: routine.slug,
                weekNumber: next.weekNumber,
                dayNumber: next.day.dayNumber,
              }}
            />
          }
        >
          <PlayIcon data-icon="inline-start" /> {t("routines.startWorkout")}
        </Button>
      </CardContent>
    </Card>
  );
}
