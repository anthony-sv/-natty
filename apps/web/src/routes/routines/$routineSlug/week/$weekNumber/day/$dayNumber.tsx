import { useMemo, useState } from "react";
import { Page } from "@/components/page";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { PlayIcon, PlusIcon } from "lucide-react";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { AddExtraWorkDialog } from "@/features/extras/components/AddExtraWorkDialog";
import { deleteExtra, restoreExtra } from "@/features/extras/collection";
import { composeDay, lastCompletionFor } from "@/features/extras/extras";
import { useExtras } from "@/features/extras/use-extras";
import { useCompletions } from "@/features/log/completion-collection";
import { DayExerciseList } from "@/features/routines/components/DayExerciseList";
import { DaySummaryStrip } from "@/features/routines/components/DaySummaryStrip";
import { SessionPlayer } from "@/features/routines/components/SessionPlayer";
import { WarmupBlock } from "@/features/routines/components/WarmupBlock";
import { useRoutine } from "@/features/routines/use-routines";
import { buildSteps } from "@/features/routines/lib/session";
import {
  isSessionFor,
  sessionStore,
  startSession,
} from "@/features/routines/session-store";
import { toast } from "@/components/ui/toast";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";
import type { Routine, TrainingDay } from "@/data/routines";

const positiveInt = z.coerce.number().int().positive();

export const Route = createFileRoute(
  "/routines/$routineSlug/week/$weekNumber/day/$dayNumber",
)({
  params: {
    parse: (raw) => ({
      routineSlug: raw.routineSlug,
      weekNumber: positiveInt.parse(raw.weekNumber),
      dayNumber: positiveInt.parse(raw.dayNumber),
    }),
    stringify: (params) => ({
      routineSlug: params.routineSlug,
      weekNumber: String(params.weekNumber),
      dayNumber: String(params.dayNumber),
    }),
  },
  // No loader. It used to resolve the routine here and `throw notFound()`,
  // which 404s every user routine — the compiled-in list has never heard of one
  // and the collection may not have loaded when a loader runs. The component
  // decides, once the answer is actually knowable.
  component: DayDetail,
});

/** Split out so it can call hooks — `notFoundComponent` takes a component. */
function DayNotFound() {
  const t = useT();
  return (
    <Page>
      <Empty>
        <EmptyTitle>{t("routines.dayNotFound")}</EmptyTitle>
        <EmptyDescription>{t("routines.dayNotFoundBody")}</EmptyDescription>
      </Empty>
    </Page>
  );
}

function DayDetail() {
  const { routineSlug, weekNumber, dayNumber } = Route.useParams();
  const { routine, isLoading } = useRoutine(routineSlug);

  if (isLoading) return null;

  const week = routine?.weeks.find((w) => w.weekNumber === weekNumber);
  const day = week?.days.find((d) => d.dayNumber === dayNumber);
  if (routine === undefined || week === undefined || day === undefined) {
    return <DayNotFound />;
  }

  return (
    <DayBody
      routine={routine}
      day={day}
      params={{ routineSlug, weekNumber, dayNumber }}
    />
  );
}

function DayBody({
  routine,
  day,
  params: { routineSlug, weekNumber, dayNumber },
}: {
  routine: Routine;
  day: TrainingDay;
  params: { routineSlug: string; weekNumber: number; dayNumber: number };
}) {
  // Hoisted into a memo, not a fresh literal every render — `composeDay`'s
  // own memo below takes it as a dep, and an object literal there would
  // rebuild the day's steps on every unrelated render.
  const target = useMemo(
    () => ({ routineSlug, weekNumber, dayNumber }),
    [routineSlug, weekNumber, dayNumber],
  );
  const session = useStore(sessionStore, (s) => s);
  const isActiveHere = isSessionFor(session, target);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [addingExtra, setAddingExtra] = useState(false);

  const t = useT();
  const f = useFormatting();
  const { extras } = useExtras();
  const completions = useCompletions();
  // Pending extras worked into the day before anything downstream sees it —
  // `buildSteps`, `DaySummaryStrip` and `DayExerciseList` all read the
  // composed day and none of them need to know an entry arrived this way.
  //
  // Placement is `"append"` while a session is actively running here:
  // `"beforeCardio"` can insert ahead of an existing cardio block, which
  // would shift step indices the session has already shown or passed. Not
  // playing yet (or playing a different day) gets the gym-order placement,
  // since there's no running session for it to disturb.
  const { day: composed, extraIndices, extraMeta } = useMemo(
    () =>
      composeDay(
        day,
        extras,
        target,
        lastCompletionFor(completions, target),
        isActiveHere ? "append" : "beforeCardio",
      ),
    [day, extras, target, completions, isActiveHere],
  );
  const steps = useMemo(() => buildSteps(composed, f), [composed, f]);
  const dayLabel = t("routines.dayLabel", {
    number: day.dayNumber,
    label: f.names.text(day.label) ?? day.label,
  });
  // The `!day.isRest` guard this used to carry is now provably redundant: an
  // untouched rest day has `composed.exercises.length === 0`, so `steps` is
  // already empty without checking `isRest` a second time — and a rest day
  // carrying pending extras is exactly the case this is meant to allow.
  const canStart = steps.length > 0;

  const handleRemoveExtra = isActiveHere
    ? undefined
    : (id: string, name: string) => {
        // Withheld while a session is running on this day (see the ternary
        // above): an extra whose steps sit before the live step index would
        // shift every later index out from under it.
        const { extra: removed } = deleteExtra(id);
        toast.add({
          title: t("extras.removed", { name }),
          type: "info",
          actionProps: {
            children: t("extras.undo"),
            onClick: () => {
              if (removed) restoreExtra(removed);
            },
          },
        });
      };

  const currentStep = isActiveHere ? steps[session!.stepIndex] : undefined;
  const activeExercise =
    currentStep?.type === "work"
      ? {
          index: currentStep.exerciseIndex,
          label: t("routines.setOf", {
            number: currentStep.setNumber,
            total: currentStep.setsInExercise,
          }),
        }
      : currentStep?.type === "pose"
        ? { index: currentStep.exerciseIndex, label: t("routines.holding") }
        : currentStep?.type === "rest"
          ? { index: currentStep.exerciseIndex, label: t("routines.resting") }
          : undefined;

  function handleStart() {
    // A session elsewhere would be silently discarded — confirm first.
    if (session !== null && !isActiveHere) setConfirmReplace(true);
    else startSession(target);
  }

  return (
    <Page>
      {/* The full trail, matching the program page — a bare "← name" told you
          where you'd come from but not where you were. */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/routines" />}>
              {t("nav.routines")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link to="/routines/$routineSlug" params={{ routineSlug }} />
              }
            >
              {f.names.routine(routine.slug, routine.name)}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{dayLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{dayLabel}</h1>
        {routine.weeks.length > 1 ? (
          <Badge variant="secondary">
            {t("routines.week", { number: weekNumber })}
          </Badge>
        ) : null}
        {day.isRest ? (
          <Badge variant="outline">{t("routines.restDay")}</Badge>
        ) : null}
        {/* Hidden mid-session, same as Start always was — the player's own
            header already offers this, and two "add extra work" controls on
            one screen is one too many. */}
        {!isActiveHere ? (
          <div className="ml-auto flex items-center gap-2">
            {canStart ? (
              <Button onClick={handleStart}>
                <PlayIcon data-icon="inline-start" />{" "}
                {t("routines.startWorkout")}
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setAddingExtra(true)}>
              <PlusIcon data-icon="inline-start" /> {t("extras.addButton")}
            </Button>
          </div>
        ) : null}
      </div>

      {/* A rest day with pending extra work is a real trainable day now —
          `composed.exercises` says so — so the empty state only fires for
          one that's still untouched. The "Rest day" badge above already
          says what kind of day this officially is; nothing further to add
          here once it has real work on it. */}
      {day.isRest && composed.exercises.length === 0 ? (
        <Empty>
          <EmptyTitle>{t("routines.restDayTitle")}</EmptyTitle>
          <EmptyDescription>{t("routines.restDayBody")}</EmptyDescription>
        </Empty>
      ) : (
        <>
          {isActiveHere ? (
            <SessionPlayer
              steps={steps}
              dayLabel={dayLabel}
              extraIndices={extraIndices}
            />
          ) : (
            // Hidden mid-session: the player already reports where you are,
            // and a "rough time" for a workout you're inside of is noise.
            <DaySummaryStrip day={composed} />
          )}
          <DayExerciseList
            exercises={composed.exercises}
            activeExerciseIndex={activeExercise?.index}
            activeSetLabel={activeExercise?.label}
            extraIndices={extraIndices}
            extraMeta={extraMeta}
            onRemoveExtra={handleRemoveExtra}
          />
          <WarmupBlock warmupRefs={day.warmupRefs} />
        </>
      )}

      <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("routines.replace.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("routines.replace.body")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                startSession(target);
                setConfirmReplace(false);
              }}
            >
              {t("routines.replace.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddExtraWorkDialog
        target={target}
        dayLabel={dayLabel}
        open={addingExtra}
        onOpenChange={setAddingExtra}
      />
    </Page>
  );
}
