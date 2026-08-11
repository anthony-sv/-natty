import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
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
import { PantryPanel } from "@/features/pantry/components/PantryPanel";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/nutrition")({
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
  const [slug, setSlug] = useState(diets[0]!.slug);
  const [tab, setTab] = useState("plan");
  const plan = diets.find((diet) => diet.slug === slug) ?? diets[0]!;
  const t = useT();
  const names = useNames();

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("nutrition.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("nutrition.subtitle")}
          </p>
        </div>

        <Field className="w-60">
          <FieldLabel htmlFor="diet-plan">{t("nutrition.tab.plan")}</FieldLabel>
          <Select
            items={diets.map((diet) => ({
              value: diet.slug,
              label: names.dietPlan(diet.slug, diet.name),
            }))}
            value={plan.slug}
            onValueChange={(value) => setSlug(value ?? diets[0]!.slug)}
          >
            <SelectTrigger id="diet-plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {diets.map((diet) => (
                <SelectItem key={diet.slug} value={diet.slug}>
                  {names.dietPlan(diet.slug, diet.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
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
          {tab === "plan" ? <PlanPanel key={plan.slug} plan={plan} /> : null}
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
