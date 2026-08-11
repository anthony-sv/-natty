import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRightIcon, PencilLineIcon } from "lucide-react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoutine } from "@/features/routines/use-routines";
import {
  exerciseDisplayName,
  formatDefaultPrescription,
} from "@/features/routines/lib/format";
import { summariseRoutine } from "@/features/routines/lib/summary";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";
import type { Routine, TrainingWeek } from "@/data/routines";

export const Route = createFileRoute("/routines/$routineSlug/")({
  component: RoutineDetail,
});

/** Split out so it can call hooks — `notFoundComponent` takes a component. */
function RoutineNotFound() {
  const t = useT();
  return (
    <Page>
      <Empty>
        <EmptyTitle>{t("routines.notFound")}</EmptyTitle>
        <EmptyDescription>
          {t("routines.notFoundBody")}{" "}
          <Link to="/routines">{t("routines.backToList")}</Link>
        </EmptyDescription>
      </Empty>
    </Page>
  );
}

function RoutineDetail() {
  const { routineSlug } = Route.useParams();
  const { routine, isLoading, isCustom } = useRoutine(routineSlug);

  // "Not found" is only true once the collection has answered. Deciding it in a
  // loader — which is what this used to do — 404s every user routine, because
  // the compiled-in list has never heard of one.
  if (isLoading) return null;
  if (routine === undefined) return <RoutineNotFound />;

  return <RoutineBody routine={routine} isCustom={isCustom} />;
}

function RoutineBody({
  routine,
  isCustom,
}: {
  routine: Routine;
  isCustom: boolean;
}) {
  const t = useT();
  const f = useFormatting();
  const summary = summariseRoutine(routine, f);
  const routineName = f.names.routine(routine.slug, routine.name);

  return (
    <Page>
      {/* The only way back up until now was the browser button — this page had
          no link to the list it came from. */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/routines" />}>
              {t("nav.routines")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{routineName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-2xl font-semibold">{routineName}</h1>
          <p className="text-sm text-muted-foreground">
            {summary.length} ·{" "}
            {t.plural("routines.trainingDays", summary.trainingDays)}
            {summary.restDays > 0
              ? ` · ${t("routines.restDays", { count: summary.restDays })}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {isCustom ? (
            <>
              <Badge variant="secondary">{t("builder.yours")}</Badge>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={
                  <Link
                    to="/routines/$routineSlug/edit"
                    params={{ routineSlug: routine.slug }}
                  />
                }
              >
                <PencilLineIcon data-icon="inline-start" />
                {t("builder.edit")}
              </Button>
            </>
          ) : null}
          {routine.source ? <Badge variant="outline">{routine.source}</Badge> : null}
          {routine.style ? (
            <Badge variant="secondary">{f.names.text(routine.style)}</Badge>
          ) : null}
          {routine.goal ? <Badge>{f.names.text(routine.goal)}</Badge> : null}
          {routine.defaultPrescription ? (
            <Badge variant="outline">
              {t("routines.defaultPrescription", {
                value: formatDefaultPrescription(routine.defaultPrescription, f),
              })}
            </Badge>
          ) : null}
        </div>
      </div>

      {routine.weeks.length > 1 ? (
        <Tabs defaultValue={String(routine.weeks[0].weekNumber)}>
          <TabsList>
            {routine.weeks.map((week) => (
              <TabsTrigger key={week.weekNumber} value={String(week.weekNumber)}>
                {t("routines.week", { number: week.weekNumber })}
              </TabsTrigger>
            ))}
          </TabsList>
          {routine.weeks.map((week) => (
            <TabsContent key={week.weekNumber} value={String(week.weekNumber)}>
              <WeekDayList routineSlug={routine.slug} week={week} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <WeekDayList routineSlug={routine.slug} week={routine.weeks[0]} />
      )}
    </Page>
  );
}

function WeekDayList({
  routineSlug,
  week,
}: {
  routineSlug: string;
  week: TrainingWeek;
}) {
  const t = useT();
  const f = useFormatting();

  return (
    <ItemGroup className="gap-2">
      {week.days.map((day) => (
        <Item
          key={day.dayNumber}
          variant="outline"
          className="items-start gap-x-4 gap-y-1"
          render={
            <Link
              to="/routines/$routineSlug/week/$weekNumber/day/$dayNumber"
              params={{
                routineSlug,
                weekNumber: week.weekNumber,
                dayNumber: day.dayNumber,
              }}
            />
          }
        >
          <ItemContent className="gap-1">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <ItemTitle className={day.isRest ? "text-muted-foreground" : ""}>
                {t("routines.dayLabel", {
                  number: day.dayNumber,
                  label: f.names.text(day.label) ?? day.label,
                })}
              </ItemTitle>
              {day.isRest ? (
                <Badge variant="outline">{t("routines.restDay")}</Badge>
              ) : (
                <Badge variant="secondary">
                  {t.plural("routines.exerciseCount", day.exercises.length)}
                </Badge>
              )}
            </div>

            {/* What the day actually is. A row saying only "Day 3 —
                Shoulder/Traps" made every program look the same from here, and
                left two thirds of itself empty saying it. */}
            {day.exercises.length > 0 ? (
              <ItemDescription className="line-clamp-2">
                {day.exercises
                  .map((entry) => exerciseDisplayName(entry, f))
                  .join(" · ")}
              </ItemDescription>
            ) : null}
          </ItemContent>

          <ItemActions>
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}
