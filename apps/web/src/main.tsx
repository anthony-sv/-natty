import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import { HotkeysDevtoolsPanel } from "@tanstack/react-hotkeys-devtools";
import { PacerDevtoolsPanel } from "@tanstack/react-pacer-devtools";
import { TableDevtoolsPanel } from "@tanstack/react-table-devtools";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const queryClient = new QueryClient();

const router = createRouter({ routeTree, context: { queryClient } });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Supplies the toast provider, portal and viewport in one. The
              `toast` manager it drives is a module singleton, so anything can
              raise a toast without a hook. */}
          <Toaster>
            <RouterProvider router={router} />
          </Toaster>
        </TooltipProvider>
        {/* No environment guard: `@tanstack/devtools-vite` strips this import
            and the JSX it produces out of the production build, which is the
            sanctioned setup and beats hand-rolling the condition. */}
        <TanStackDevtools
          plugins={[
            { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
            {
              name: "TanStack Router",
              // Rendered outside RouterProvider, so pass the router
              // explicitly — context lookup returns null here.
              render: <TanStackRouterDevtoolsPanel router={router} />,
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
    </StrictMode>,
  );
}
