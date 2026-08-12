import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PencilLineIcon, PlusIcon } from "lucide-react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { diets } from "@/data/diets";
import { MacroCalculatorPanel } from "@/features/nutrition/components/MacroCalculatorPanel";
import { PlanPanel } from "@/features/nutrition/components/PlanPanel";
import { useDiets } from "@/features/nutrition/use-diets";
import { PantryPanel } from "@/features/pantry/components/PantryPanel";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/nutrition")({
  // `?plan=` is how the builder lands you on the plan you just saved, and it
  // makes a plan linkable. Optional and unvalidated beyond being a string —
  // an unknown slug falls back to the first plan rather than erroring.
  // Returning the key only when it's present keeps it optional at every
  // `<Link to="/nutrition">`; always returning `{ plan: undefined }` makes
  // TanStack Router treat the search object as required and every plain link
  // to this page stops typechecking.
  validateSearch: (
    search: Record<string, unknown>,
  ): { plan?: string } =>
    typeof search.plan === "string" ? { plan: search.plan } : {},
  component: NutritionPage,
});

/**
 * The diet, as a reference rather than a diary.
 *
 * Nothing here is logged — the plan says what to eat and the page shows it
 * well. The plan picker sits above the tabs because it's the one choice both
 * of them read: the calculator opens seeded from whichever plan is selected.
 */
function NutritionPage() {
  const search = Route.useSearch();
  const [slug, setSlug] = useState(search.plan ?? diets[0]!.slug);
  const [tab, setTab] = useState("plan");
  const t = useT();
  const names = useNames();

  // Yours first, then the built-ins — a plan you wrote is the one you follow.
  const { plans } = useDiets();
  const entry = plans.find((p) => p.plan.slug === slug) ?? plans[0]!;
  const { plan, isCustom, isDraft } = entry;
  const options = plans.map((p) => ({
    value: p.plan.slug,
    // The badge can't ride in a Select's value, so the word goes in the label
    // — otherwise the closed trigger gives no hint that it's unfinished.
    label:
      names.dietPlan(p.plan.slug, p.plan.name) +
      (p.isDraft ? ` — ${t("dietBuilder.draft")}` : ""),
  }));

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("nutrition.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("nutrition.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Field className="w-60">
            <FieldLabel htmlFor="diet-plan">{t("nutrition.tab.plan")}</FieldLabel>
            <Select
              items={options}
              value={plan.slug}
              onValueChange={(value) => setSlug(value ?? plans[0]!.plan.slug)}
            >
              <SelectTrigger id="diet-plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {isCustom ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  to="/nutrition/$planSlug/edit"
                  params={{ planSlug: plan.slug }}
                />
              }
            >
              <PencilLineIcon data-icon="inline-start" />
              {t("dietBuilder.edit")}
            </Button>
          ) : null}

          <Button nativeButton={false} render={<Link to="/nutrition/new" />}>
            <PlusIcon data-icon="inline-start" />
            {t("dietBuilder.new")}
          </Button>
        </div>
      </div>

      {/* Controlled and gated on the active tab, for the reason /progress is:
          the pantry owns a Dialog, and Base UI keeps an inactive panel mounted
          so it would stay open across a tab switch. */}
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList>
          <TabsTrigger value="plan">{t("nutrition.tab.plan")}</TabsTrigger>
          <TabsTrigger value="macros">{t("nutrition.tab.macros")}</TabsTrigger>
          <TabsTrigger value="pantry">{t("pantry.tab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="plan">
          {/* Keyed so switching plans resets the day and swap choices rather
              than carrying a selection onto a plan that may not have it. */}
          {tab === "plan" ? (
            <div className="flex flex-col gap-4">
              {/* An unfinished plan should look unfinished. Without this a
                  plan holding one egg reads exactly like a finished one. */}
              {isDraft ? (
                <p className="flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{t("dietBuilder.draft")}</Badge>
                  {t("dietBuilder.draftBody")}
                </p>
              ) : null}
              <PlanPanel key={plan.slug} plan={plan} />
            </div>
          ) : null}
        </TabsContent>
        <TabsContent value="macros">
          {tab === "macros" ? (
            <MacroCalculatorPanel key={plan.slug} plan={plan} />
          ) : null}
        </TabsContent>
        <TabsContent value="pantry">
          {tab === "pantry" ? <PantryPanel /> : null}
        </TabsContent>
      </Tabs>
    </Page>
  );
}
