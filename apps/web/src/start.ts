import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

/**
 * App-wide Start configuration. Picked up by convention as `src/start.ts`.
 *
 * ## Why CSRF middleware, given the cookies are `SameSite=Lax`
 *
 * Server functions are cookie-authenticated: `server/auth.ts` reads the
 * session Supabase put in cookies, so the browser attaches credentials to any
 * request it decides to send — which is the shape a CSRF attack needs.
 * `@supabase/ssr` writes those cookies `SameSite=Lax`, and that is what
 * currently stops a cross-site POST carrying them; nothing in this app was
 * checking. Lax is one cookie-policy change, one same-site subdomain, or one
 * library default away from not being true, and the check costs a header
 * comparison — so the app now enforces it itself rather than inheriting it.
 *
 * ## The filter is not optional
 *
 * `createCsrfMiddleware` validates **every** request it's given, with no
 * method check: a plain cross-site GET navigation sends
 * `Sec-Fetch-Site: cross-site` and a URL typed into the address bar sends
 * `none`, and the default `secFetchSite: 'same-origin'` rejects both with a
 * 403. Registered unfiltered it would refuse every inbound link to the app,
 * and the SPA shell prerender — which fetches `/` with none of those headers
 * — would fail the build.
 *
 * So it's scoped to server functions, which is also exactly the surface that
 * needs it: they are the only thing that reads or writes account data, and
 * documents and assets carry nothing an attacker could trigger. Both GET and
 * POST server functions are covered, since a cross-site read is worth
 * refusing too.
 *
 * The remaining defaults are the strict ones and are left alone: unknown
 * `Sec-Fetch-Site` values fail, `Referer` is the fallback when the header is
 * absent, and a request with none of the three is **refused** rather than
 * allowed (`allowRequestsWithoutOriginCheck` stays false).
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({
      filter: ({ handlerType }) => handlerType === "serverFn",
    }),
  ],
}));
