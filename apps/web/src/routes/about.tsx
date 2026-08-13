import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalculatorIcon,
  CircleDotIcon,
  ClipboardListIcon,
  DatabaseIcon,
  DumbbellIcon,
  KeyboardIcon,
  ListIcon,
  PlayIcon,
  RulerIcon,
  ShoppingBasketIcon,
  TrendingUpIcon,
  TrophyIcon,
  UserIcon,
  UtensilsIcon,
} from "lucide-react";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useT, type MessageKey } from "@/i18n/use-t";

export const Route = createFileRoute("/about")({
  component: About,
});

interface Section {
  id: string;
  icon: typeof ListIcon;
  titleKey: MessageKey;
  bodyKey: MessageKey;
  /** The two or three things worth knowing that aren't obvious from using it. */
  points: MessageKey[];
  /** Where to go and try it. */
  to?: string;
  search?: Record<string, string>;
  linkKey?: MessageKey;
}

/**
 * The guide, as data.
 *
 * **Add a section whenever a feature lands**, the same standing rule the
 * index's destination cards follow — a guide that documents two thirds of the
 * app is worse than none, because it reads as a complete list. The order is
 * the order you meet things in: what the app is, then training, then the
 * record it keeps, then food, then the tools, then your data.
 */
const GUIDE: Section[] = [
  {
    id: "storage",
    icon: DatabaseIcon,
    titleKey: "about.storage.title",
    bodyKey: "about.storage.body",
    points: [
      "about.storage.p1",
      "about.storage.p2",
      "about.storage.p3",
    ],
    to: "/progress",
    search: { tab: "data" },
    linkKey: "about.storage.link",
  },
  {
    id: "account",
    icon: UserIcon,
    titleKey: "about.account.title",
    bodyKey: "about.account.body",
    points: ["about.account.p1", "about.account.p2", "about.account.p3"],
    to: "/account",
    linkKey: "about.account.link",
  },
  {
    id: "routines",
    icon: ListIcon,
    titleKey: "about.routines.title",
    bodyKey: "about.routines.body",
    points: ["about.routines.p1", "about.routines.p2", "about.routines.p3"],
    to: "/routines",
    linkKey: "about.routines.link",
  },
  {
    id: "player",
    icon: PlayIcon,
    titleKey: "about.player.title",
    bodyKey: "about.player.body",
    points: [
      "about.player.p1",
      "about.player.p2",
      "about.player.p3",
      "about.player.p4",
      "about.player.p5",
      "about.player.p6",
      "about.player.p7",
    ],
  },
  {
    id: "logging",
    icon: TrophyIcon,
    titleKey: "about.logging.title",
    bodyKey: "about.logging.body",
    points: ["about.logging.p1", "about.logging.p2", "about.logging.p3"],
    to: "/progress",
    search: { tab: "records" },
    linkKey: "about.logging.link",
  },
  {
    id: "exercises",
    icon: DumbbellIcon,
    titleKey: "about.exercises.title",
    bodyKey: "about.exercises.body",
    points: ["about.exercises.p1", "about.exercises.p2"],
    to: "/progress",
    search: { tab: "library" },
    linkKey: "about.exercises.link",
  },
  {
    id: "builder",
    icon: ClipboardListIcon,
    titleKey: "about.builder.title",
    bodyKey: "about.builder.body",
    points: [
      "about.builder.p1",
      "about.builder.p2",
      "about.builder.p3",
      "about.builder.p4",
      "about.builder.p5",
    ],
    to: "/routines/new",
    linkKey: "about.builder.link",
  },
  {
    id: "progress",
    icon: TrendingUpIcon,
    titleKey: "about.progress.title",
    bodyKey: "about.progress.body",
    points: [
      "about.progress.p1",
      "about.progress.p2",
      "about.progress.p3",
      "about.progress.p4",
      "about.progress.p5",
    ],
    to: "/progress",
    linkKey: "about.progress.link",
  },
  {
    id: "measurements",
    icon: RulerIcon,
    titleKey: "about.measurements.title",
    bodyKey: "about.measurements.body",
    points: [
      "about.measurements.p1",
      "about.measurements.p2",
      "about.measurements.p3",
    ],
    to: "/progress",
    search: { tab: "measurements" },
    linkKey: "about.measurements.link",
  },
  {
    id: "nutrition",
    icon: UtensilsIcon,
    titleKey: "about.nutrition.title",
    bodyKey: "about.nutrition.body",
    points: [
      "about.nutrition.p1",
      "about.nutrition.p2",
      "about.nutrition.p3",
      "about.nutrition.p4",
      "about.nutrition.p5",
    ],
    to: "/nutrition",
    linkKey: "about.nutrition.link",
  },
  {
    id: "trends",
    icon: TrendingUpIcon,
    titleKey: "about.trends.title",
    bodyKey: "about.trends.body",
    points: ["about.trends.p1", "about.trends.p2", "about.trends.p3"],
    to: "/nutrition",
    search: { tab: "trends" },
    linkKey: "about.trends.link",
  },
  {
    id: "pantry",
    icon: ShoppingBasketIcon,
    titleKey: "about.pantry.title",
    bodyKey: "about.pantry.body",
    points: ["about.pantry.p1", "about.pantry.p2", "about.pantry.p3"],
    to: "/nutrition",
    search: { tab: "pantry" },
    linkKey: "about.pantry.link",
  },
  {
    id: "calculators",
    icon: CalculatorIcon,
    titleKey: "about.calculators.title",
    bodyKey: "about.calculators.body",
    points: [
      "about.calculators.p1",
      "about.calculators.p2",
      "about.calculators.p3",
    ],
    to: "/calculator",
    linkKey: "about.calculators.link",
  },
  {
    id: "plates",
    icon: CircleDotIcon,
    titleKey: "about.plates.title",
    bodyKey: "about.plates.body",
    points: ["about.plates.p1", "about.plates.p2"],
    to: "/plates",
    linkKey: "about.plates.link",
  },
  {
    id: "sharing",
    icon: BookOpenIcon,
    titleKey: "about.sharing.title",
    bodyKey: "about.sharing.body",
    points: ["about.sharing.p1", "about.sharing.p2", "about.sharing.p3"],
    to: "/progress",
    search: { tab: "data" },
    linkKey: "about.sharing.link",
  },
  {
    id: "getting-around",
    icon: KeyboardIcon,
    titleKey: "about.gettingAround.title",
    bodyKey: "about.gettingAround.body",
    points: [
      "about.gettingAround.p1",
      "about.gettingAround.p2",
      "about.gettingAround.p3",
    ],
  },
];

/**
 * How the app works, one card per feature.
 *
 * A page rather than tooltips scattered through the UI: most of what's worth
 * knowing here is a *decision* — why a PR is a frontier rather than a single
 * number, why a ticked meal follows the plan when you edit it — and a decision
 * needs a sentence, not a hover.
 */
function About() {
  const t = useT();

  return (
    <Page>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t("about.title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("about.subtitle")}
        </p>
      </div>

      {/* Thirteen cards is a lot of scrolling to find one answer. */}
      <nav className="flex flex-wrap gap-1.5">
        {GUIDE.map((section) => (
          <Button
            key={section.id}
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={`#${section.id}`} />}
          >
            {t(section.titleKey)}
          </Button>
        ))}
      </nav>

      <div className="flex flex-col gap-4">
        {GUIDE.map((section) => (
          <Card key={section.id} id={section.id} className="scroll-mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="size-4 shrink-0 text-muted-foreground" />
                {t(section.titleKey)}
              </CardTitle>
              <CardDescription>{t(section.bodyKey)}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              <ul className="flex list-disc flex-col gap-2 pl-4 text-sm text-muted-foreground">
                {section.points.map((point) => (
                  <li key={point}>{t(point)}</li>
                ))}
              </ul>

              {section.to !== undefined ? (
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={
                    <Link
                      to={section.to}
                      search={section.search as never}
                      params={{}}
                    />
                  }
                >
                  {t(section.linkKey ?? section.titleKey)}
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  );
}
