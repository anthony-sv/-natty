import { useMemo, useState } from "react";
import { Page } from "@/components/page";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
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
import { routineQueryOptions } from "@/features/routines/queries";
import { buildSteps } from "@/features/routines/lib/session";
import {
  isSessionFor,
  sessionStore,
  startSession,
} from "@/features/routines/session-store";
import { formatWeekLabel } from "@/features/routines/lib/format";

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
  loader: async ({ context, params }) => {
    const routine = await context.queryClient.ensureQueryData(
      routineQueryOptions(params.routineSlug),
    );
    const week = routine.weeks.find((w) => w.weekNumber === params.weekNumber);
    const day = week?.days.find((d) => d.dayNumber === params.dayNumber);
    if (!week || !day) throw notFound();
  },
  notFoundComponent: () => (
    <Page>
      <Empty>
        <EmptyTitle>Day not found</EmptyTitle>
        <EmptyDescription>
          That week/day doesn't exist in this program.
        </EmptyDescription>
      </Empty>
    </Page>
  ),
  component: DayDetail,
});

function DayDetail() {
  const { routineSlug, weekNumber, dayNumber } = Route.useParams();
  const { data: routine } = useSuspenseQuery(routineQueryOptions(routineSlug));
  const week = routine.weeks.find((w) => w.weekNumber === weekNumber)!;
  const day = week.days.find((d) => d.dayNumber === dayNumber)!;

  const target = { routineSlug, weekNumber, dayNumber };
  const session = useStore(sessionStore, (s) => s);
  const isActiveHere = isSessionFor(session, target);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const steps = useMemo(() => buildSteps(day), [day]);
  const dayLabel = `Day ${day.dayNumber} — ${day.label}`;
  const canStart = !day.isRest && steps.length > 0;

  const currentStep = isActiveHere ? steps[session!.stepIndex] : undefined;
  const activeExercise =
    currentStep?.type === "work"
      ? {
          index: currentStep.exerciseIndex,
          label: `set ${currentStep.setNumber} of ${currentStep.setsInExercise}`,
        }
      : currentStep?.type === "pose"
        ? { index: currentStep.exerciseIndex, label: "holding" }
        : currentStep?.type === "rest"
          ? { index: currentStep.exerciseIndex, label: "resting" }
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
              Routines
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={
                <Link to="/routines/$routineSlug" params={{ routineSlug }} />
              }
            >
              {routine.name}
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
          <Badge variant="secondary">{formatWeekLabel(weekNumber)}</Badge>
        ) : null}
        {day.isRest ? <Badge variant="outline">Rest</Badge> : null}
        {canStart && !isActiveHere ? (
          <Button className="ml-auto" onClick={handleStart}>
            <PlayIcon data-icon="inline-start" /> Start workout
          </Button>
        ) : null}
      </div>

      {day.isRest ? (
        <Empty>
          <EmptyTitle>Rest day</EmptyTitle>
          <EmptyDescription>No training scheduled — recovery day.</EmptyDescription>
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
            <AlertDialogTitle>Replace current workout?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a workout in progress on another day. Starting this one
              discards that progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                startSession(target);
                setConfirmReplace(false);
              }}
            >
              Start anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
