import { QueryClient } from "@tanstack/react-query";

/**
 * The app's one QueryClient, at module scope so synced collections can reach
 * it — `queryCollectionOptions` needs the client at collection-creation time,
 * and collections live outside the component tree.
 *
 * A module singleton would be wrong under real SSR (state would leak across
 * requests), but this app runs Start in SPA mode where a page load is exactly
 * one client — and the standing rule is that full SSR never gets enabled.
 * `getRouter()` passes this same instance into router context.
 */
export const queryClient = new QueryClient();
