import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2Icon } from "lucide-react";
import { Page } from "@/components/page";
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
import { toast } from "@/components/ui/toast";
import {
  deleteUserRoutine,
  restoreUserRoutine,
} from "@/features/routines/collection";
import { RoutineBuilder } from "@/features/routines/components/builder/RoutineBuilder";
import { toDraft } from "@/features/routines/components/builder/draft";
import { useRoutine } from "@/features/routines/use-routines";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/routines/$routineSlug/edit")({
  component: EditRoutine,
});

function EditRoutine() {
  const { routineSlug } = Route.useParams();
  const { routine, isLoading, isCustom } = useRoutine(routineSlug);
  const t = useT();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return null;

  // Built-ins are transcribed source material and editing one in place would
  // silently rewrite everyone's reference copy — "start from a copy" on
  // /routines/new is the supported way to change one.
  if (routine === undefined || !isCustom) {
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
        <Button variant="outline" onClick={() => setConfirmDelete(true)}>
          <Trash2Icon data-icon="inline-start" />
          {t("builder.delete")}
        </Button>
      </div>

      <RoutineBuilder initial={toDraft(routine)} existingSlug={routineSlug} />

      {/* A dialog rather than an undo toast, unlike deleting a set: this throws
          away a document you wrote rather than one row, and you'd be navigated
          away from the page the undo was sitting on. */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("builder.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("builder.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("builder.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const { routine: removed } = deleteUserRoutine(routineSlug);
                toast.add({
                  title: t("builder.deleted", { name: routine.name }),
                  type: "info",
                  actionProps: {
                    children: t("history.undo"),
                    onClick: () => {
                      if (removed) restoreUserRoutine(removed);
                    },
                  },
                });
                void navigate({ to: "/routines" });
              }}
            >
              {t("builder.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
