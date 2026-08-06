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
          <RouterProvider router={router} />
        </TooltipProvider>
        {import.meta.env.DEV ? (
          <TanStackDevtools
            plugins={[
              { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
              {
                name: "TanStack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              { name: "TanStack Form", render: <FormDevtoolsPanel /> },
              {
                name: "TanStack Hotkeys",
                render: (_el, props) => <HotkeysDevtoolsPanel {...props} />,
              },
              { name: "TanStack Pacer", render: <PacerDevtoolsPanel /> },
            ]}
          />
        ) : null}
      </QueryClientProvider>
    </StrictMode>,
  );
}
