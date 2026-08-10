import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { routinesQueryOptions } from "@/features/routines/queries";
import { useActiveSession } from "@/features/routines/lib/use-active-session";
import { themeStore, toggleTheme } from "@/features/theme/theme-store";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";

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
  const { data: routines, isPending } = useQuery(routinesQueryOptions());
  const active = useActiveSession();
  const theme = useStore(themeStore, (s) => s);
  const t = useT();
  const names = useNames();

  function go(to: string, params?: Record<string, string | number>) {
    navigate({ to, params });
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
          <CommandItem onSelect={() => go("/progress")}>
            {t("nav.progress")}
          </CommandItem>
          <CommandItem onSelect={() => go("/nutrition")}>
            {t("nav.nutrition")}
          </CommandItem>
          <CommandItem onSelect={() => go("/calculator")}>
            {t("nav.calculators")}
          </CommandItem>
          <CommandItem onSelect={() => go("/plates")}>
            {t("nav.plates")}
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
      </CommandList>
    </CommandDialog>
  );
}
