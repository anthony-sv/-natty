import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Start's router factory — the framework calls this from its own client and
 * server entries, so this file replaces the hand-rolled `main.tsx` bootstrap.
 *
 * One QueryClient per router: route loaders reach it through router context
 * (`Route.useRouteContext()`), and the root component hands the same instance
 * to `QueryClientProvider`.
 */
export function getRouter() {
  const queryClient = new QueryClient();
  return createRouter({ routeTree, context: { queryClient } });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
