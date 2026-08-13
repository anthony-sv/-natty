import type { ReactNode } from "react";
import {
  ClientOnly,
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import { HotkeysDevtoolsPanel } from "@tanstack/react-hotkeys-devtools";
import { PacerDevtoolsPanel } from "@tanstack/react-pacer-devtools";
import { TableDevtoolsPanel } from "@tanstack/react-table-devtools";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { Analytics } from "@/components/analytics";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import appCss from "@/styles.css?url";
// Imported for the side effect: resolves the stored theme onto <html> before
// first paint, so there's no flash of the wrong one.
import "@/features/theme/theme-store";
// Likewise: mirrors the profile to the account while signed in. Height and sex
// aren't a collection, so nothing else would carry them across devices — and
// without height every synced weigh-in shows an FFMI of nothing.
import "@/features/profile/sync";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "!natty" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // There was never a favicon — not since `index.html`, which didn't
      // declare one either — so every page load 404'd on `/favicon.ico` and
      // the tab wore a blank sheet. SVG so one file covers every size and can
      // follow the browser chrome's own light/dark.
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: theme-store toggles `.dark` and locale-store
    // sets `lang` by direct DOM mutation before hydration, so these attributes
    // legitimately differ from what the prerendered shell carries.
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    // ClientOnly because the SPA-mode shell prerender renders this component
    // in Node, and the chrome reads live queries (`CommandPalette` lists
    // routines) whose collections are browser-only. An empty shell is also
    // simply what this app has always shipped — index.html was blank until
    // the bundle loaded — so nothing is lost by keeping it that way.
    <ClientOnly>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Supplies the toast provider, portal and viewport in one. The
              `toast` manager it drives is a module singleton, so anything can
              raise a toast without a hook. */}
          <Toaster>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <AppHeader />
                <Outlet />
              </SidebarInset>
              <CommandPalette />
              {/* Reports the matched route's *pattern*, never the real path —
                  that's a privacy rule. Renders nothing. */}
              <Analytics />
            </SidebarProvider>
          </Toaster>
        </TooltipProvider>
        {/* No environment guard: `@tanstack/devtools-vite` strips this import
            and the JSX it produces out of the production build, which is the
            sanctioned setup and beats hand-rolling the condition. */}
        <TanStackDevtools
          plugins={[
            { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
            {
              // Inside the route tree now, so the panel finds the router
              // through context — no explicit prop needed.
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            { name: "TanStack Form", render: <FormDevtoolsPanel /> },
            {
              // Every mounted DataTable registers itself, so the panel lists
              // them by key — no single instance to hand it.
              name: "TanStack Table",
              render: <TableDevtoolsPanel />,
            },
            {
              name: "TanStack Hotkeys",
              render: (_el, props) => <HotkeysDevtoolsPanel {...props} />,
            },
            { name: "TanStack Pacer", render: <PacerDevtoolsPanel /> },
          ]}
        />
      </QueryClientProvider>
    </ClientOnly>
  );
}
