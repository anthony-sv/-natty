import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { DeleteRoutineButton } from "@/features/routines/components/DeleteRoutineButton";
import { RoutineBuilder } from "@/features/routines/components/builder/RoutineBuilder";
import { toDraft } from "@/features/routines/components/builder/draft";
import { useRoutine } from "@/features/routines/use-routines";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/routines/$routineSlug/edit")({
  component: EditRoutine,
});

function EditRoutine() {
  const { routineSlug } = Route.useParams();
  const { routine, isLoading, isCustom, isOverridden } = useRoutine(routineSlug);
  const t = useT();

  if (isLoading) return null;

  // A built-in is editable now: saving writes your version at the same slug,
  // which replaces it in every list. Nothing is lost — the shipped program is
  // compiled in and untouched, so the button below offers it back.
  const isBuiltIn = !isCustom || isOverridden;

  if (routine === undefined) {
    return (
      <Page>
        <Empty>
          <EmptyTitle>{t("builder.notFound")}</EmptyTitle>
          <EmptyDescription>
            <Link to="/routines">{t("routines.backToList")}</Link>
          </EmptyDescription>
        </Empty>
      </Page>
    );
  }

  return (
    <Page>
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
              {routine.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("builder.edit")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {t("builder.editTitle", { name: routine.name })}
        </h1>
        {/* An untouched built-in has nothing here to remove: it isn't yours to
            delete and there's no edit of it to reset. */}
        {isBuiltIn && !isOverridden ? null : (
          <DeleteRoutineButton
            routineSlug={routineSlug}
            name={routine.name}
            isOverridden={isOverridden}
          />
        )}
      </div>

      {isBuiltIn && !isOverridden ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          {t("builder.editingBuiltIn")}
        </p>
      ) : null}

      <RoutineBuilder initial={toDraft(routine)} existingSlug={routineSlug} />
    </Page>
  );
}
