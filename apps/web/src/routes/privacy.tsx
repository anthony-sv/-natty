import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

/**
 * What the app knows about you, and where it goes.
 *
 * Written against what the code actually does rather than from a template —
 * the analytics section describes the route-pattern rule that
 * `components/analytics.tsx` enforces, and the "without an account" section
 * is true because collections fork on the session rather than as a promise.
 * If any of that changes, this page is wrong and has to change with it.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "summary",
    titleKey: "privacy.summary.title",
    bodyKeys: ["privacy.summary.p1", "privacy.summary.p2"],
  },
  {
    id: "without-account",
    titleKey: "privacy.local.title",
    bodyKeys: ["privacy.local.p1", "privacy.local.p2"],
  },
  {
    id: "with-account",
    titleKey: "privacy.account.title",
    bodyKeys: ["privacy.account.p1", "privacy.account.p2", "privacy.account.p3"],
  },
  {
    id: "where",
    titleKey: "privacy.where.title",
    bodyKeys: ["privacy.where.p1", "privacy.where.p2"],
  },
  {
    id: "analytics",
    titleKey: "privacy.analytics.title",
    bodyKeys: ["privacy.analytics.p1", "privacy.analytics.p2"],
  },
  {
    id: "cookies",
    titleKey: "privacy.cookies.title",
    bodyKeys: ["privacy.cookies.p1"],
  },
  {
    id: "control",
    titleKey: "privacy.control.title",
    bodyKeys: ["privacy.control.p1", "privacy.control.p2", "privacy.control.p3"],
  },
  {
    id: "contact",
    titleKey: "privacy.contact.title",
    bodyKeys: ["privacy.contact.p1"],
  },
];

function Privacy() {
  return (
    <LegalPage
      titleKey="privacy.title"
      subtitleKey="privacy.subtitle"
      sections={SECTIONS}
    />
  );
}
