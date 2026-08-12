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
  deleteUserDiet,
  restoreUserDiet,
} from "@/features/nutrition/collection";
import { DietPlanBuilder } from "@/features/nutrition/components/builder/DietPlanBuilder";
import { toDraftPlan } from "@/features/nutrition/components/builder/draft";
import { useDietPlan } from "@/features/nutrition/use-diets";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/nutrition_/$planSlug/edit")({
  component: EditDietPlan,
});

function EditDietPlan() {
  const { planSlug } = Route.useParams();
  const { plan, isLoading, isCustom } = useDietPlan(planSlug);
  const t = useT();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return null;

  // Built-ins are transcribed source material; editing one in place would
  // rewrite the reference copy. "Start from a copy" is the supported route.
  if (plan === undefined || !isCustom) {
    return (
      <Page>
        <Empty>
          <EmptyTitle>{t("dietBuilder.notFound")}</EmptyTitle>
          <EmptyDescription>
            <Link to="/nutrition">{t("nav.nutrition")}</Link>
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
            <BreadcrumbLink render={<Link to="/nutrition" />}>
              {t("nav.nutrition")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{plan.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {t("dietBuilder.editTitle", { name: plan.name })}
        </h1>
        <Button variant="outline" onClick={() => setConfirmDelete(true)}>
          <Trash2Icon data-icon="inline-start" />
          {t("dietBuilder.delete")}
        </Button>
      </div>

      <DietPlanBuilder initial={toDraftPlan(plan)} existingSlug={planSlug} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dietBuilder.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dietBuilder.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dietBuilder.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const { plan: removed } = deleteUserDiet(planSlug);
                toast.add({
                  title: t("dietBuilder.deleted", { name: plan.name }),
                  type: "info",
                  actionProps: {
                    children: t("history.undo"),
                    onClick: () => {
                      if (removed) restoreUserDiet(removed);
                    },
                  },
                });
                void navigate({ to: "/nutrition" });
              }}
            >
              {t("dietBuilder.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
