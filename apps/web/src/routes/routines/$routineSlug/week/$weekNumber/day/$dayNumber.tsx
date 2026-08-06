import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { DayExerciseList } from "@/features/routines/components/DayExerciseList";
import { WarmupBlock } from "@/features/routines/components/WarmupBlock";
import { routineQueryOptions } from "@/features/routines/queries";
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
    <div className="mx-auto max-w-3xl p-6">
      <Empty>
        <EmptyTitle>Day not found</EmptyTitle>
        <EmptyDescription>
          That week/day doesn't exist in this program.
        </EmptyDescription>
      </Empty>
    </div>
  ),
  component: DayDetail,
});

function DayDetail() {
  const { routineSlug, weekNumber, dayNumber } = Route.useParams();
  const { data: routine } = useSuspenseQuery(routineQueryOptions(routineSlug));
  const week = routine.weeks.find((w) => w.weekNumber === weekNumber)!;
  const day = week.days.find((d) => d.dayNumber === dayNumber)!;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <Link to="/routines/$routineSlug" params={{ routineSlug }}>
          ← {routine.name}
        </Link>
        {routine.weeks.length > 1 ? <span>{formatWeekLabel(weekNumber)}</span> : null}
      </div>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">
          Day {day.dayNumber} — {day.label}
        </h1>
        {day.isRest ? <Badge variant="outline">Rest</Badge> : null}
      </div>

      {day.isRest ? (
        <Empty>
          <EmptyTitle>Rest day</EmptyTitle>
          <EmptyDescription>No training scheduled — recovery day.</EmptyDescription>
        </Empty>
      ) : (
        <>
          <DayExerciseList exercises={day.exercises} />
          <WarmupBlock warmupRefs={day.warmupRefs} />
        </>
      )}
    </div>
  );
}
