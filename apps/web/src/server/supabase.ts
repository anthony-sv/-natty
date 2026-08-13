import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";

/**
 * Server-side Supabase client, bound to the calling request's cookies — the
 * browser client (features/auth/client.ts) writes the session into cookies
 * precisely so this can read it here.
 *
 * The env fallbacks mirror the DB client's: the Supabase↔Vercel integration
 * writes SUPABASE_URL / SUPABASE_ANON_KEY, while local .env carries the
 * VITE_-prefixed pair (which Vite also exposes to server code via
 * import.meta.env). Both values are client-safe by design — the secret keys
 * (service role) are deliberately never read anywhere in this app.
 */
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL / publishable key are not configured");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll: () =>
        Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          setCookie(name, value, options);
        }
      },
    },
  });
}
