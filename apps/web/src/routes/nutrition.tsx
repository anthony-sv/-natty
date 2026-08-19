import { useStore } from "@tanstack/react-store";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PencilLineIcon, PlusIcon, Share2Icon } from "lucide-react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { exportDiet } from "@/features/backup/use-backup";
import { useShare } from "@/features/backup/use-share";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ScrollingTabsList } from "@/components/scrolling-tabs-list";
import { MacroCalculatorPanel } from "@/features/nutrition/components/MacroCalculatorPanel";
import { PlanPanel } from "@/features/nutrition/components/PlanPanel";
import { useDiets } from "@/features/nutrition/use-diets";
import { TodayPanel } from "@/features/intake/components/TodayPanel";
import { TrendsPanel } from "@/features/intake/components/TrendsPanel";
import { PantryPanel } from "@/features/pantry/components/PantryPanel";
import { profileStore, setProfile } from "@/features/profile/profile-store";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";

// Most-used first — Plan (the reference you check mid-week) ranks above
// Trends (a periodic look-back), the same reasoning `/progress` reorders on.
const TABS = ["today", "plan", "trends", "macros", "pantry"] as const;
type Tab = (typeof TABS)[number];

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
  ): { plan?: string; tab?: Tab } => ({
    ...(typeof search.plan === "string" ? { plan: search.plan } : {}),
    ...(TABS.includes(search.tab as Tab) ? { tab: search.tab as Tab } : {}),
  }),
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
  const navigate = useNavigate();
  // In the URL, so a panel is linkable and survives a refresh. `replace` keeps
  // tab switches out of the back button.
  const tab = search.tab ?? "today";
  const setTab = (next: string) =>
    void navigate({
      to: "/nutrition",
      // The plan selection rides along, or switching tabs would drop it.
      search: { plan: search.plan, tab: next as Tab },
      replace: true,
    });
  const t = useT();
  const share = useShare();
  const names = useNames();

  // Yours first, then the built-ins — a plan you wrote is the one you follow.
  const { plans } = useDiets();
  // `?plan=` is a one-time "show me this one" — from the builder, or a
  // bookmarked link — that doesn't disturb your standing pick. The picker
  // itself writes `activeDietSlug` directly (see its `onValueChange`), the
  // same way `ActivateProgramButton` owns `activeRoutineSlug`, rather than
  // living in local component state: a plain `useState` seeded once from the
  // URL meant switching plans in the picker only stuck until this component
  // next remounted, at which point it silently reverted to whichever plan the
  // URL still named — always the one you'd most recently created or edited.
  const activeDietSlug = useStore(profileStore, (state) => state.activeDietSlug);
  const slug = search.plan ?? activeDietSlug ?? plans[0]!.plan.slug;
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
              onValueChange={(value) => {
                setProfile({
                  activeDietSlug: value ?? plans[0]!.plan.slug,
                });
                // Clears a lingering `?plan=` from a prior deep link — that
                // param outranks the stored pick (see `slug` above), so
                // without this a choice made here couldn't override it.
                if (search.plan !== undefined) {
                  void navigate({
                    to: "/nutrition",
                    search: { tab: search.tab },
                    replace: true,
                  });
                }
              }}
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

          {/* Every plan is editable, built-in or not: saving a built-in writes
              your version at its slug and it replaces the shipped one in this
              picker, which stays compiled in and recoverable. */}
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

          {/* Not gated on `isCustom` — a transcribed plan is as shareable as
              one you wrote, and it arrives as the recipient's own copy. */}
          <Button
            variant="outline"
            onClick={() => {
              void share((now) => exportDiet(plan.slug, now), "diet");
            }}
          >
            <Share2Icon data-icon="inline-start" />
            {t("data.share")}
          </Button>

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
        <ScrollingTabsList>
          <TabsTrigger value="today">{t("intake.tab")}</TabsTrigger>
          <TabsTrigger value="plan">{t("nutrition.tab.plan")}</TabsTrigger>
          <TabsTrigger value="trends">{t("trends.tab")}</TabsTrigger>
          <TabsTrigger value="macros">{t("nutrition.tab.macros")}</TabsTrigger>
          <TabsTrigger value="pantry">{t("pantry.tab")}</TabsTrigger>
        </ScrollingTabsList>
        <TabsContent value="today">
          {tab === "today" ? <TodayPanel key={plan.slug} plan={plan} /> : null}
        </TabsContent>
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
        <TabsContent value="trends">
          {tab === "trends" ? <TrendsPanel key={plan.slug} plan={plan} /> : null}
        </TabsContent>
        <TabsContent value="macros">
          {tab === "macros" ? (
            <MacroCalculatorPanel
              key={plan.slug}
              plan={plan}
              isCustom={isCustom}
              isDraft={isDraft}
            />
          ) : null}
        </TabsContent>
        <TabsContent value="pantry">
          {tab === "pantry" ? <PantryPanel /> : null}
        </TabsContent>
      </Tabs>
    </Page>
  );
}
