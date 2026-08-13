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

/**
 * The identity providers the account page offers.
 *
 * Google only. Apple's is the other one people expect, and it requires a paid
 * developer account to issue the Services ID and signing key — not worth it
 * until someone actually asks. Adding a provider is this list plus a mark and
 * a label in `ProviderButtons.tsx`; the rest of the flow is provider-agnostic.
 */
export const OAUTH_PROVIDERS = ["google"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/**
 * Hand off to an identity provider.
 *
 * The redirect comes back to `/account` carrying a `?code=`, which the
 * browser client exchanges for a session on its own (`detectSessionInUrl`) —
 * no callback route needed, because `@supabase/ssr`'s browser client keeps
 * the PKCE verifier in a cookie this same client can read. `redirectTo` must
 * be listed in Supabase's redirect allow-list or the provider bounces back
 * to the project's Site URL instead.
 */
export async function signInWithProvider(provider: OAuthProvider) {
  return getSupabaseBrowserClient().auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/account` },
  });
}
