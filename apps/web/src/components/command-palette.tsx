import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useHotkey } from "@tanstack/react-hotkeys";
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

  function go(to: string, params?: Record<string, string | number>) {
    navigate({ to, params });
    setOpen(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages and routines..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {active ? (
          <>
            <CommandGroup heading="Workout">
              <CommandItem
                value="Resume workout"
                onSelect={() =>
                  go("/routines/$routineSlug/week/$weekNumber/day/$dayNumber", {
                    routineSlug: active.state.routineSlug,
                    weekNumber: active.state.weekNumber,
                    dayNumber: active.state.dayNumber,
                  })
                }
              >
                Resume workout — {active.routine.name}, Day {active.day.dayNumber}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go("/")}>Home</CommandItem>
          <CommandItem onSelect={() => go("/routines")}>Routines</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Routines">
          {isPending ? (
            <CommandItem disabled>Loading routines...</CommandItem>
          ) : (
            routines?.map((routine) => (
              <CommandItem
                key={routine.slug}
                value={routine.name}
                onSelect={() =>
                  go("/routines/$routineSlug", { routineSlug: routine.slug })
                }
              >
                {routine.name}
              </CommandItem>
            ))
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
