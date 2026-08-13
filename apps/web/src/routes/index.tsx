import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpenIcon,
  CalculatorIcon,
  CircleDotIcon,
  ListIcon,
  PlayIcon,
  TrendingUpIcon,
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
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { HomeCards } from "@/features/home/components/HomeCards";
import { useNames } from "@/i18n/names";
import { useT, type MessageKey } from "@/i18n/use-t";
import { endSession } from "@/features/routines/session-store";
import { useActiveSession } from "@/features/routines/lib/use-active-session";

export const Route = createFileRoute("/")({
  // No loader. The resume card resolves through `useRoutines`, a live query
  // that has to include routines you wrote — which a compiled-in-only fetch
  // could never do.
  component: Index,
});

/**
 * Places with nothing to report, so nothing to put on a card.
 *
 * A plate loader has no state — it's a tool you open at the rack. Giving these
 * the same card as training or body would be a card whose whole content is a
 * sentence describing the route, which is what the page used to be made of.
 */
const TOOLS: Array<{ to: string; icon: typeof ListIcon; titleKey: MessageKey }> = [
  { to: "/routines", icon: ListIcon, titleKey: "nav.routines" },
  { to: "/nutrition", icon: UtensilsIcon, titleKey: "nav.nutrition" },
  { to: "/progress", icon: TrendingUpIcon, titleKey: "nav.progress" },
  { to: "/plates", icon: CircleDotIcon, titleKey: "nav.plates" },
  { to: "/calculator", icon: CalculatorIcon, titleKey: "nav.calculators" },
  { to: "/about", icon: BookOpenIcon, titleKey: "nav.about" },
];

function Index() {
  const active = useActiveSession();
  const t = useT();

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">{t("index.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("index.subtitle")}</p>
      </div>

      {active ? <ResumeCard /> : <StartCard />}

      <HomeCards />

      {/* Every route still reachable in one press, but as a row of chips
          rather than six cards of prose. The cards above already carry the
          three that have anything to say. */}
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((tool) => (
          <Button
            key={tool.to}
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link to={tool.to} />}
          >
            <tool.icon data-icon="inline-start" />
            {t(tool.titleKey)}
          </Button>
        ))}
      </div>
    </Page>
  );
}

/** Shown when nothing is in progress: one obvious thing to do. */
function StartCard() {
  const t = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("index.start.title")}</CardTitle>
        <CardDescription>{t("index.start.body")}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Renders an <a>, so opt out of Base UI's native-<button> assertion. */}
        <Button nativeButton={false} render={<Link to="/routines" />}>
          <ListIcon data-icon="inline-start" /> {t("index.start.action")}
        </Button>
      </CardContent>
    </Card>
  );
}

function ResumeCard() {
  const active = useActiveSession();
  const t = useT();
  const names = useNames();
  if (active === null) return null;

  const { state, routine, day, steps, currentExerciseName } = active;
  const routineName = names.routine(routine.slug, routine.name);

  return (
    <Card className="border-primary/40 ring-primary/30">
      <CardHeader>
        <CardTitle>{t("index.resume.title")}</CardTitle>
        <CardDescription>
          {routineName} ·{" "}
          {t("routines.dayLabel", {
            number: day.dayNumber,
            label: names.text(day.label) ?? day.label,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={(state.stepIndex / steps.length) * 100} />
        <p className="text-sm text-muted-foreground">
          {currentExerciseName
            ? t("index.resume.upNext", { exercise: currentExerciseName })
            : t("index.resume.allDone")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            nativeButton={false}
            render={
              <Link
                to="/routines/$routineSlug/week/$weekNumber/day/$dayNumber"
                params={{
                  routineSlug: state.routineSlug,
                  weekNumber: state.weekNumber,
                  dayNumber: state.dayNumber,
                }}
              />
            }
          >
            <PlayIcon data-icon="inline-start" /> {t("index.resume.action")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              endSession();
              // Same reasoning as End workout in the player: the card
              // disappearing with no word reads as a misclick.
              toast.add({
                title: t("index.resume.discarded"),
                description: t("player.endedBody", { day: routineName }),
                type: "info",
              });
            }}
          >
            {t("index.resume.discard")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
