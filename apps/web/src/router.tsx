import { createRouter } from "@tanstack/react-router";
import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";

/**
 * Start's router factory — the framework calls this from its own client and
 * server entries, so this file replaces the hand-rolled `main.tsx` bootstrap.
 *
 * The QueryClient is the module singleton from `lib/query-client` (synced
 * collections need it outside the component tree); route loaders reach it
 * through router context (`Route.useRouteContext()`), and the root component
 * hands the same instance to `QueryClientProvider`.
 */
export function getRouter() {
  return createRouter({ routeTree, context: { queryClient } });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
