import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { Analytics } from "@/components/analytics";
// Imported for the side effect: resolves the stored theme onto <html> before
// first paint, so there's no flash of the wrong one.
import "@/features/theme/theme-store";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* The trigger is the only chrome left at the top — it collapses the
            sidebar and is the sole nav affordance on small screens. */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <Outlet />
      </SidebarInset>
      <CommandPalette />
      {/* Inside the router on purpose: it reports the matched route, which
          only exists here. Renders nothing. */}
      <Analytics />
    </SidebarProvider>
  );
}
