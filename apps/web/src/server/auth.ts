import { createMiddleware } from "@tanstack/react-start";
import { getSupabaseServerClient } from "./supabase";

/**
 * What a call with no valid session gets back.
 *
 * **A thrown `Response` is returned verbatim** by Start's server-function
 * handler (`if (error instanceof Response) return error`), where a thrown
 * `Error` is run through seroval and reported as a 500. This used to throw an
 * `Error`, so an expired cookie — the ordinary, expected failure — arrived as
 * a serialized "Seroval Error" with a 500, indistinguishable in a network tab
 * or an error report from the server actually falling over.
 *
 * 401 rather than 403: there is no usable session, not a session that isn't
 * allowed. The CSRF middleware in `src/start.ts` owns 403, so the two stay
 * tellable apart — "sign in again" versus "that request came from the wrong
 * origin" are different problems with different fixes.
 */
function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "UNAUTHENTICATED" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

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
      throw unauthorized();
    }
    return next({ context: { userId: data.user.id } });
  },
);
