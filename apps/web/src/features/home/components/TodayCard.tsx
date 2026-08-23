import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLiveQuery } from "@tanstack/react-db";
import { PlayIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@tanstack/react-store";
import { AddExtraWorkDialog } from "@/features/extras/components/AddExtraWorkDialog";
import { composeDay, lastCompletionFor } from "@/features/extras/extras";
import { useExtras } from "@/features/extras/use-extras";
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
  const { extras } = useExtras();
  const [now] = useState(() => Date.now());
  const [addingExtra, setAddingExtra] = useState(false);

  if (isLoading || routine === undefined) return null;

  const sets = data ?? [];
  const next = nextTrainingDay(routine, sets, completions, startAt, now);
  if (next === undefined) return null;

  const target = {
    routineSlug: routine.slug,
    weekNumber: next.weekNumber,
    dayNumber: next.day.dayNumber,
  };
  // A rest day carrying pending extra work is a real trainable day now — see
  // `composeDay` — which is what makes "I went to the gym on my rest day"
  // reachable from home without navigating anywhere first.
  const { day: composedDay } = composeDay(
    next.day,
    extras,
    target,
    lastCompletionFor(completions, target),
  );

  const routineName = f.names.routine(routine.slug, routine.name);
  const dayLabel = t("routines.dayLabel", {
    number: next.day.dayNumber,
    label: f.names.text(next.day.label) ?? next.day.label,
  });

  const addExtraButton = (
    <Button variant="outline" onClick={() => setAddingExtra(true)}>
      <PlusIcon data-icon="inline-start" /> {t("extras.addButton")}
    </Button>
  );
  const dialog = (
    <AddExtraWorkDialog
      target={target}
      dayLabel={dayLabel}
      open={addingExtra}
      onOpenChange={setAddingExtra}
    />
  );

  if (next.day.isRest && composedDay.exercises.length === 0) {
    const after = dayAfter(routine, next);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("index.today.title")}</CardTitle>
          <CardDescription>
            {routineName} · {dayLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
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
          {addExtraButton}
        </CardContent>
        {dialog}
      </Card>
    );
  }

  // Three or four names, the same preview length `WeekDayList` uses on the
  // program page — enough to recognize the day, not the whole list.
  const preview = composedDay.exercises
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
        {/* The "Rest day" badge lives on the day page itself; here the point
            is just that there's something to do despite the schedule. */}
        {next.day.isRest ? (
          <p className="text-sm text-muted-foreground">
            {t("extras.restDayBody")}
          </p>
        ) : null}
        {preview.length > 0 ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {preview}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
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
          {addExtraButton}
        </div>
      </CardContent>
      {dialog}
    </Card>
  );
}
