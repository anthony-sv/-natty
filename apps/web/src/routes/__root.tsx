import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Kbd } from "@/components/ui/kbd";
import { CommandPalette } from "@/components/command-palette";

export interface RouterContext {
  queryClient: QueryClient;
}

/**
 * The palette binds Mod+K, which is Cmd on Apple hardware and Ctrl everywhere
 * else — so the cue has to match, rather than always showing the Mac glyph.
 * Read once at module scope: touching `navigator` during render would trip the
 * `react-hooks/purity` rule.
 */
const MOD_KEY =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
    ? "⌘"
    : "Ctrl";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="[&.active]:text-foreground text-foreground/70 hover:text-foreground">
            !natty
          </Link>
          <Link
            to="/routines"
            className="[&.active]:text-foreground text-foreground/70 hover:text-foreground"
          >
            Routines
          </Link>
          <Link
            to="/progress"
            className="[&.active]:text-foreground text-foreground/70 hover:text-foreground"
          >
            Progress
          </Link>
        </nav>
        <Kbd>{MOD_KEY}K</Kbd>
      </header>
      <Outlet />
      <CommandPalette />
    </>
  );
}
