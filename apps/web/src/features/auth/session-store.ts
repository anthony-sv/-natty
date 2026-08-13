import { Store } from "@tanstack/store";
import { useStore } from "@tanstack/react-store";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./client";

/**
 * Who is signed in, as a plain store — the same shape as `theme-store` and
 * `locale-store`, because it answers the same kind of question ("what is the
 * standing state of this browser") and is read from plain functions as well
 * as components.
 *
 * `loading` matters: collections will fork on signed-in vs signed-out, and
 * deciding that off a store that simply hasn't resolved yet would flash the
 * wrong data source on every boot.
 */
export interface SessionState {
  status: "loading" | "signed-out" | "signed-in";
  userId: string | null;
  email: string | null;
}

export const sessionStore = new Store<SessionState>({
  status: "loading",
  userId: null,
  email: null,
});

function apply(session: Session | null): void {
  sessionStore.setState(() =>
    session
      ? {
          status: "signed-in",
          userId: session.user.id,
          email: session.user.email ?? null,
        }
      : { status: "signed-out", userId: null, email: null },
  );
}

/**
 * Take the spent OAuth code out of the address bar.
 *
 * The provider redirect lands carrying `?code=`, which the client has already
 * exchanged by the time a session exists — leaving it on screen shows the
 * user a URL full of credential-looking noise, and re-sharing or reloading
 * that URL tries to spend a code that's gone. `replaceState` rather than a
 * router navigation: this is tidying the current entry, not a new one to go
 * back to. It also runs wherever the redirect landed, which matters because
 * Supabase falls back to the project's Site URL when `redirectTo` isn't in
 * the allow-list, and that's a config mistake the app shouldn't break on.
 */
function stripAuthParams(): void {
  const url = new URL(window.location.href);
  const spent = ["code", "error", "error_description"].filter((key) =>
    url.searchParams.has(key),
  );
  if (spent.length === 0) return;
  for (const key of spent) url.searchParams.delete(key);
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}

// Seeded at import time, browser only — the SPA-shell prerender evaluates
// this module in Node, where there is no session to resolve. A build with no
// Supabase project settles straight to signed-out, so every collection reads
// its local backing and the app is exactly what it was before accounts.
if (typeof document !== "undefined") {
  if (isSupabaseConfigured) {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => apply(data.session));
    supabase.auth.onAuthStateChange((_event, session) => {
      apply(session);
      if (session) stripAuthParams();
    });
  } else {
    apply(null);
  }
}

export function useSession(): SessionState {
  return useStore(sessionStore);
}
