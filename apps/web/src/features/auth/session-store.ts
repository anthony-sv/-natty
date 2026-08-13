import { Store } from "@tanstack/store";
import { useStore } from "@tanstack/react-store";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

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

// Seeded at import time, browser only — the SPA-shell prerender evaluates
// this module in Node, where there is no session to resolve.
if (typeof document !== "undefined") {
  const supabase = getSupabaseBrowserClient();
  void supabase.auth.getSession().then(({ data }) => apply(data.session));
  supabase.auth.onAuthStateChange((_event, session) => apply(session));
}

export function useSession(): SessionState {
  return useStore(sessionStore);
}
