import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client, lazily created — a module-scope instance would be
 * constructed during the SPA-shell prerender in Node, where there are no
 * cookies to bind to. `@supabase/ssr`'s browser client keeps the session in
 * cookies rather than localStorage, which is what lets server functions see
 * it (server/supabase.ts reads the same cookies).
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  client ??= createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  );
  return client;
}
