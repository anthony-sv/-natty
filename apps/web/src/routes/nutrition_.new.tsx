import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { diets } from "@/data/diets";
import { DietPlanBuilder } from "@/features/nutrition/components/builder/DietPlanBuilder";
import {
  emptyPlan,
  hasWeekdayVariants,
  toDraftPlan,
  type DraftPlan,
} from "@/features/nutrition/components/builder/draft";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/nutrition_/new")({
  component: NewDietPlan,
});

function NewDietPlan() {
  const t = useT();
  const names = useNames();
  const [draft, setDraft] = useState<DraftPlan>(emptyPlan);
  const [seed, setSeed] = useState(0);
  const [copiedVariants, setCopiedVariants] = useState(false);

  const templates = diets.map((plan) => ({
    value: plan.slug,
    label: names.dietPlan(plan.slug, plan.name),
  }));

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
            <BreadcrumbPage>{t("dietBuilder.newTitle")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("dietBuilder.newTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("dietBuilder.newBody")}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            {t("dietBuilder.duplicateHint")}
          </span>
          <Select
            items={templates}
            value={null}
            onValueChange={(value) => {
              const source = diets.find((plan) => plan.slug === value);
              if (source === undefined) return;
              const copy = toDraftPlan(source);
              setDraft({
                ...copy,
                name: t("dietBuilder.duplicateOf", {
                  name: names.dietPlan(source.slug, source.name),
                }),
              });
              // Both built-ins split office days from home days, and the
              // builder writes one version per meal. Say so now rather than
              // let it be discovered after saving.
              setCopiedVariants(hasWeekdayVariants(source));
              setSeed((n) => n + 1);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t("dietBuilder.duplicate")} />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {copiedVariants ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
          {t("dietBuilder.variantWarning")}
        </p>
      ) : null}

      <DietPlanBuilder key={seed} initial={draft} />
    </Page>
  );
}
