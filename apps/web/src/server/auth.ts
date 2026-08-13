import { createMiddleware } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./supabase";

/**
 * Every data server function runs behind this. `getUser()` revalidates the
 * JWT against Supabase rather than trusting the cookie's claims, and the
 * `userId` it injects is the *only* user id handlers may scope by — ids
 * arriving in payloads are client-minted and only unique per user.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Error("UNAUTHENTICATED");
    }
    return next({ context: { userId: data.user.id } });
  },
);
