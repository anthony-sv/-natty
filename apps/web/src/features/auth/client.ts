import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Whether this build has a Supabase project to talk to at all.
 *
 * **Check this before reaching for the client.** Accounts are optional by
 * design, so a build without the keys must still run — every screen works,
 * you simply can't sign in. Letting the client throw instead took the whole
 * app down with a router error boundary on a deploy whose env vars hadn't
 * landed yet, which is the opposite of "usable signed out".
 */
export const isSupabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client, lazily created — a module-scope instance would be
 * constructed during the SPA-shell prerender in Node, where there are no
 * cookies to bind to. `@supabase/ssr`'s browser client keeps the session in
 * cookies rather than localStorage, which is what lets server functions see
 * it (server/supabase.ts reads the same cookies).
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured in this build");
  }
  client ??= createBrowserClient(url, key);
  return client;
}
