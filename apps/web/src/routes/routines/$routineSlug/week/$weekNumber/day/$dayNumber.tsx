import { useMemo, useState } from "react";
import { Page } from "@/components/page";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { PlayIcon } from "lucide-react";
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
  const target = { routineSlug, weekNumber, dayNumber };
  const session = useStore(sessionStore, (s) => s);
  const isActiveHere = isSessionFor(session, target);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const t = useT();
  const f = useFormatting();
  const steps = useMemo(() => buildSteps(day, f), [day, f]);
  const dayLabel = t("routines.dayLabel", {
    number: day.dayNumber,
    label: f.names.text(day.label) ?? day.label,
  });
  const canStart = !day.isRest && steps.length > 0;

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
        {canStart && !isActiveHere ? (
          <Button className="ml-auto" onClick={handleStart}>
            <PlayIcon data-icon="inline-start" /> {t("routines.startWorkout")}
          </Button>
        ) : null}
      </div>

      {day.isRest ? (
        <Empty>
          <EmptyTitle>{t("routines.restDayTitle")}</EmptyTitle>
          <EmptyDescription>{t("routines.restDayBody")}</EmptyDescription>
        </Empty>
      ) : (
        <>
          {isActiveHere ? (
            <SessionPlayer steps={steps} dayLabel={dayLabel} />
          ) : (
            // Hidden mid-session: the player already reports where you are,
            // and a "rough time" for a workout you're inside of is noise.
            <DaySummaryStrip day={day} />
          )}
          <DayExerciseList
            exercises={day.exercises}
            activeExerciseIndex={activeExercise?.index}
            activeSetLabel={activeExercise?.label}
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
    </Page>
  );
}
