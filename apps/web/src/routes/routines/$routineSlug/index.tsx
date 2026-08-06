import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routineQueryOptions } from "@/features/routines/queries";
import { formatDefaultPrescription, formatWeekLabel } from "@/features/routines/lib/format";
import type { TrainingWeek } from "@/data/routines";

export const Route = createFileRoute("/routines/$routineSlug/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(routineQueryOptions(params.routineSlug)),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-6">
      <Empty>
        <EmptyTitle>Routine not found</EmptyTitle>
        <EmptyDescription>
          This program doesn't exist. <Link to="/routines">Back to routines</Link>
        </EmptyDescription>
      </Empty>
    </div>
  ),
  component: RoutineDetail,
});

function RoutineDetail() {
  const { routineSlug } = Route.useParams();
  const { data: routine } = useSuspenseQuery(routineQueryOptions(routineSlug));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{routine.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {routine.source ? <Badge variant="outline">{routine.source}</Badge> : null}
          {routine.style ? <Badge variant="secondary">{routine.style}</Badge> : null}
          {routine.goal ? <Badge>{routine.goal}</Badge> : null}
          {routine.defaultPrescription ? (
            <Badge variant="outline">
              Default: {formatDefaultPrescription(routine.defaultPrescription)}
            </Badge>
          ) : null}
        </div>
      </div>

      {routine.weeks.length > 1 ? (
        <Tabs defaultValue={String(routine.weeks[0].weekNumber)}>
          <TabsList>
            {routine.weeks.map((week) => (
              <TabsTrigger key={week.weekNumber} value={String(week.weekNumber)}>
                {formatWeekLabel(week.weekNumber)}
              </TabsTrigger>
            ))}
          </TabsList>
          {routine.weeks.map((week) => (
            <TabsContent key={week.weekNumber} value={String(week.weekNumber)}>
              <WeekDayList routineSlug={routineSlug} week={week} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <WeekDayList routineSlug={routineSlug} week={routine.weeks[0]} />
      )}
    </div>
  );
}

function WeekDayList({
  routineSlug,
  week,
}: {
  routineSlug: string;
  week: TrainingWeek;
}) {
  return (
    <div className="flex flex-col gap-2">
      {week.days.map((day) => (
        <Link
          key={day.dayNumber}
          to="/routines/$routineSlug/week/$weekNumber/day/$dayNumber"
          params={{
            routineSlug,
            weekNumber: week.weekNumber,
            dayNumber: day.dayNumber,
          }}
        >
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>
                Day {day.dayNumber} — {day.label}
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              {day.isRest ? (
                <Badge variant="outline">Rest</Badge>
              ) : (
                <Badge variant="secondary">{day.exercises.length} exercises</Badge>
              )}
            </ItemActions>
          </Item>
        </Link>
      ))}
    </div>
  );
}
