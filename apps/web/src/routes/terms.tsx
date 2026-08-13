import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

/**
 * The health disclaimer is the section that earns this page.
 *
 * The app hands out calorie targets, a creatine dose, an FFMI reading against
 * population bands, one-rep-max estimates and a "natural potential" figure.
 * Every one of those is a published formula applied to numbers you typed —
 * useful, and not a clinician looking at you. The app says so where each
 * number appears; saying it once, plainly, in one place is the other half.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "what",
    titleKey: "terms.what.title",
    bodyKeys: ["terms.what.p1"],
  },
  {
    id: "health",
    titleKey: "terms.health.title",
    bodyKeys: ["terms.health.p1", "terms.health.p2", "terms.health.p3"],
  },
  {
    id: "estimates",
    titleKey: "terms.estimates.title",
    bodyKeys: ["terms.estimates.p1", "terms.estimates.p2"],
  },
  {
    id: "account",
    titleKey: "terms.account.title",
    bodyKeys: ["terms.account.p1", "terms.account.p2"],
  },
  {
    id: "content",
    titleKey: "terms.content.title",
    bodyKeys: ["terms.content.p1", "terms.content.p2"],
  },
  {
    id: "availability",
    titleKey: "terms.availability.title",
    bodyKeys: ["terms.availability.p1", "terms.availability.p2"],
  },
  {
    id: "changes",
    titleKey: "terms.changes.title",
    bodyKeys: ["terms.changes.p1"],
  },
];

function Terms() {
  return (
    <LegalPage
      titleKey="terms.title"
      subtitleKey="terms.subtitle"
      sections={SECTIONS}
    />
  );
}
