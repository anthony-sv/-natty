import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useStore } from "@tanstack/react-store";
import { MoonIcon, SunIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useDiets } from "@/features/nutrition/use-diets";
import { useRoutines } from "@/features/routines/use-routines";
import { useActiveSession } from "@/features/routines/lib/use-active-session";
import { themeStore, toggleTheme } from "@/features/theme/theme-store";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";

/**
 * Every tab, paired with the key that names it.
 *
 * Listed here rather than derived from the routes, because the palette shows
 * the *reader's* word for a panel and the route only knows its slug.
 */
const PROGRESS_TABS = [
  ["records", "progress.tab.records"],
  ["volume", "volume.tab"],
  ["history", "history.tab"],
  ["library", "library.tab"],
  ["body", "progress.tab.body"],
  ["measurements", "measure.tab"],
] as const;

const NUTRITION_TABS = [
  ["today", "intake.tab"],
  ["trends", "trends.tab"],
  ["plan", "nutrition.tab.plan"],
  ["macros", "nutrition.tab.macros"],
  ["pantry", "pantry.tab"],
] as const;

// Global ⌘K / Ctrl+K command palette. Scoped for now to the only routes that
// exist — Pages + Routines. Adding a future feature area is just another
// CommandGroup here, not a rework.
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useHotkey("Mod+K", (event) => {
    event.preventDefault();
    setOpen((o) => !o);
  });

  // Plain useQuery, not useSuspenseQuery: the palette can open before any
  // route has fetched routines (e.g. opened from "/"), so it needs its own
  // pending state instead of suspending. Same cache as the route loaders —
  // instant if /routines was already visited, fetched on demand otherwise.
  // Built-ins plus your own — a routine you wrote should be searchable.
  const { routines, isLoading: isPending } = useRoutines();
  const { plans } = useDiets();
  const active = useActiveSession();
  const theme = useStore(themeStore, (s) => s);
  const t = useT();
  const names = useNames();

  function go(
    to: string,
    params?: Record<string, string | number>,
    search?: Record<string, string>,
  ) {
    navigate({ to, params, search });
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("palette.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("palette.empty")}</CommandEmpty>
        {active ? (
          <>
            <CommandGroup heading={t("palette.groupWorkout")}>
              <CommandItem
                value={t("palette.resumeWorkout")}
                onSelect={() =>
                  go("/routines/$routineSlug/week/$weekNumber/day/$dayNumber", {
                    routineSlug: active.state.routineSlug,
                    weekNumber: active.state.weekNumber,
                    dayNumber: active.state.dayNumber,
                  })
                }
              >
                {t("palette.resumeWorkout")} —{" "}
                {names.routine(active.routine.slug, active.routine.name)},{" "}
                {t("routines.day", { number: active.day.dayNumber })}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}
        <CommandGroup heading={t("palette.groupPages")}>
          <CommandItem onSelect={() => go("/")}>{t("nav.home")}</CommandItem>
          <CommandItem onSelect={() => go("/routines")}>
            {t("nav.routines")}
          </CommandItem>
          {/* Tabs are their own entries, not just their parent page. Searching
              "pantry" or "volume" should land you there — that's the whole
              reason the tab moved into the URL. */}
          {PROGRESS_TABS.map(([tab, key]) => (
            <CommandItem
              key={tab}
              value={`${t("nav.progress")} ${t(key)}`}
              onSelect={() => go("/progress", undefined, { tab })}
            >
              {t("nav.progress")} → {t(key)}
            </CommandItem>
          ))}
          {NUTRITION_TABS.map(([tab, key]) => (
            <CommandItem
              key={tab}
              value={`${t("nav.nutrition")} ${t(key)}`}
              onSelect={() => go("/nutrition", undefined, { tab })}
            >
              {t("nav.nutrition")} → {t(key)}
            </CommandItem>
          ))}
          <CommandItem onSelect={() => go("/calculator")}>
            {t("nav.calculators")}
          </CommandItem>
          <CommandItem onSelect={() => go("/plates")}>
            {t("nav.plates")}
          </CommandItem>
          <CommandItem onSelect={() => go("/about")}>
            {t("nav.about")}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        {/* Everything that makes something. These were unreachable from search
            entirely — the builders had no entry and the pantry's dialogs sit
            behind a tab you had to know about. */}
        <CommandGroup heading={t("palette.groupCreate")}>
          <CommandItem onSelect={() => go("/routines/new")}>
            {t("builder.new")}
          </CommandItem>
          <CommandItem onSelect={() => go("/nutrition/new")}>
            {t("dietBuilder.new")}
          </CommandItem>
          <CommandItem
            onSelect={() => go("/progress", undefined, { tab: "library" })}
          >
            {t("library.add")}
          </CommandItem>
          <CommandItem
            onSelect={() => go("/nutrition", undefined, { tab: "pantry" })}
          >
            {t("pantry.addFood")}
          </CommandItem>
          <CommandItem
            onSelect={() => go("/nutrition", undefined, { tab: "pantry" })}
          >
            {t("pantry.addRecipe")}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("palette.groupTheme")}>
          <CommandItem
            value={t("palette.toggleTheme")}
            onSelect={() => {
              toggleTheme();
              setOpen(false);
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            {theme === "dark" ? t("palette.switchLight") : t("palette.switchDark")}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("palette.groupRoutines")}>
          {isPending ? (
            <CommandItem disabled>{t("palette.loading")}</CommandItem>
          ) : (
            routines?.map((routine) => {
              // `value` is what the palette searches, so it has to be the name
              // the reader can see.
              const name = names.routine(routine.slug, routine.name);
              return (
                <CommandItem
                  key={routine.slug}
                  value={name}
                  onSelect={() =>
                    go("/routines/$routineSlug", { routineSlug: routine.slug })
                  }
                >
                  {name}
                </CommandItem>
              );
            })
          )}
        </CommandGroup>
        <CommandSeparator />
        {/* Plans by name, the way routines already were. A plan you wrote is a
            thing you open by name, same as a program. */}
        <CommandGroup heading={t("palette.groupPlans")}>
          {plans.map(({ plan }) => {
            const name = names.dietPlan(plan.slug, plan.name);
            return (
              <CommandItem
                key={plan.slug}
                value={name}
                onSelect={() => go("/nutrition", undefined, { plan: plan.slug })}
              >
                {name}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
