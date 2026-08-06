import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Kbd } from "@/components/ui/kbd";
import { CommandPalette } from "@/components/command-palette";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="[&.active]:text-foreground text-foreground/70 hover:text-foreground">
            natty
          </Link>
          <Link
            to="/routines"
            className="[&.active]:text-foreground text-foreground/70 hover:text-foreground"
          >
            Routines
          </Link>
        </nav>
        <Kbd>⌘K</Kbd>
      </header>
      <Outlet />
      <CommandPalette />
    </>
  );
}
