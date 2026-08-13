import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useRouterState } from "@tanstack/react-router";

/** `/routines/$routineSlug/` → `/routines/[routineSlug]`, the shape Vercel's
 *  dashboard expects for a dynamic segment. */
function toRoutePattern(routeId: string): string {
  const pattern = routeId
    .split("/")
    .map((segment) =>
      segment.startsWith("$") ? `[${segment.slice(1)}]` : segment,
    )
    .join("/");
  return pattern.length > 1 ? pattern.replace(/\/$/, "") : pattern;
}

/**
 * Vercel Web Analytics and Speed Insights, both fed the *matched route*
 * rather than left to read `location.pathname` themselves. Without that every
 * routine and every day of it is its own row —
 * `/routines/push-a1b2/week/3/day/2` — so a page that gets plenty of traffic
 * reads as a hundred pages that get none, and Speed Insights has no page with
 * enough samples to score.
 *
 * Renders nothing. Mounted inside the router, which is the only place the
 * matched route exists.
 */
export function Analytics() {
  const routeId = useRouterState({
    select: (state) => state.matches.at(-1)?.routeId,
  });
  const path = useRouterState({ select: (state) => state.location.pathname });
  const route = routeId ? toRoutePattern(routeId) : null;

  return (
    <>
      <VercelAnalytics
        // `mode` is normally sniffed from `process.env.NODE_ENV`, which
        // doesn't exist in the browser under Vite — the package falls back to
        // "production", which in dev means requesting a script only a Vercel
        // deployment serves and logging a 404. Told explicitly, dev logs each
        // event to the console instead, which is how you check these route
        // names are the ones you want.
        mode={import.meta.env.DEV ? "development" : "production"}
        // Passing `route` also turns the script's own pushState tracking off;
        // the component reports each navigation instead.
        route={route}
        path={path}
      />
      <SpeedInsights
        // Same `process.env` problem, but this package has no `mode` — the
        // script URL is the only way in. Empty in production, where its own
        // default (`/_vercel/speed-insights/script.js`) is right.
        scriptSrc={
          import.meta.env.DEV
            ? "https://va.vercel-scripts.com/v1/speed-insights/script.debug.js"
            : undefined
        }
        // A null route holds the script back rather than reporting one
        // vital against the wrong page; it injects on the first match.
        route={route}
      />
    </>
  );
}
