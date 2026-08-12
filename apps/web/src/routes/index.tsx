import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpenIcon,
  CalculatorIcon,
  ChevronRightIcon,
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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { useBodyEntries } from "@/features/body/collection";
import { weeklyAverages, weekOverWeek } from "@/features/body/weekly";
import { useAllRecords } from "@/features/log/queries";
import type { WeightUnit } from "@/lib/units";
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

const DESTINATIONS: Array<{
  to: string;
  icon: typeof ListIcon;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
}> = [
  {
    to: "/routines",
    icon: ListIcon,
    titleKey: "nav.routines",
    descriptionKey: "index.dest.routines",
  },
  {
    to: "/progress",
    icon: TrendingUpIcon,
    titleKey: "nav.progress",
    descriptionKey: "index.dest.progress",
  },
  {
    to: "/nutrition",
    icon: UtensilsIcon,
    titleKey: "nav.nutrition",
    descriptionKey: "index.dest.nutrition",
  },
  {
    to: "/calculator",
    icon: CalculatorIcon,
    titleKey: "nav.calculators",
    descriptionKey: "index.dest.calculators",
  },
  {
    to: "/plates",
    icon: CircleDotIcon,
    titleKey: "nav.plates",
    descriptionKey: "index.dest.plates",
  },
  {
    to: "/about",
    icon: BookOpenIcon,
    titleKey: "nav.about",
    descriptionKey: "index.dest.about",
  },
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

      <Stats />

      <div className="grid gap-2 sm:grid-cols-2">
        {DESTINATIONS.map((destination) => (
          <Item
            key={destination.to}
            variant="outline"
            render={<Link to={destination.to} />}
          >
            <ItemMedia variant="icon">
              <destination.icon />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t(destination.titleKey)}</ItemTitle>
              <ItemDescription>{t(destination.descriptionKey)}</ItemDescription>
            </ItemContent>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </Item>
        ))}
      </div>
    </Page>
  );
}

/**
 * What the app knows about you so far.
 *
 * Deliberately absent until there's something to report — a row of zeroes on a
 * first run is noise, and it's the one screen where the app has nothing to say.
 */
function Stats() {
  const { rows, loggedSetCount } = useAllRecords();
  const { entries, latest } = useBodyEntries();
  const t = useT();

  // Read once on mount rather than during render, per `react-hooks/purity`.
  const [now] = useState(() => Date.now());
  const unit: WeightUnit = latest?.unit ?? "kg";
  const change = useMemo(
    () => weekOverWeek(weeklyAverages(entries, unit, now)),
    [entries, unit, now],
  );

  if (loggedSetCount === 0 && entries.length === 0) return null;

  const exercisesTrained = new Set(rows.map((row) => row.exerciseId)).size;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label={t("index.stats.setsLogged")} value={String(loggedSetCount)} />
      <Stat
        label={t("index.stats.exercisesTrained")}
        value={String(exercisesTrained)}
      />
      <Stat label={t("index.stats.recordsHeld")} value={String(rows.length)} />
      <Stat
        label={t("index.stats.latestWeighIn")}
        value={latest ? `${latest.weight} ${latest.unit}` : "—"}
        // The tile that matters most is the average, not the morning: a single
        // weigh-in is mostly water. It rides as a hint rather than a fifth tile
        // so the four-column grid stays whole.
        hint={
          change === undefined
            ? undefined
            : change.deltaWeight === undefined
              ? t("index.stats.weekAverage", {
                  weight: `${change.latest.weight.toFixed(1)} ${unit}`,
                })
              : t("index.stats.weekAverageDelta", {
                  weight: `${change.latest.weight.toFixed(1)} ${unit}`,
                  delta: `${change.deltaWeight > 0 ? "+" : change.deltaWeight < 0 ? "−" : ""}${Math.abs(change.deltaWeight).toFixed(1)}`,
                })
        }
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      {hint ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          {hint}
        </span>
      ) : null}
    </div>
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
