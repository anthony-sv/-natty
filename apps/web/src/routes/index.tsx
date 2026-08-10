import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalculatorIcon,
  ChevronRightIcon,
  CircleDotIcon,
  ListIcon,
  PlayIcon,
  TrendingUpIcon,
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
import { useAllRecords } from "@/features/log/queries";
import { routinesQueryOptions } from "@/features/routines/queries";
import { endSession } from "@/features/routines/session-store";
import { useActiveSession } from "@/features/routines/lib/use-active-session";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(routinesQueryOptions()),
  component: Index,
});

const DESTINATIONS = [
  {
    to: "/routines",
    icon: ListIcon,
    title: "Routines",
    description: "Programs, week by week. Open a day to start the player.",
  },
  {
    to: "/progress",
    icon: TrendingUpIcon,
    title: "Progress",
    description: "Records per exercise, weigh-ins, FFMI and trend charts.",
  },
  {
    to: "/calculator",
    icon: CalculatorIcon,
    title: "Calculators",
    description: "One-rep max, RPE and RIR, and natural potential.",
  },
  {
    to: "/plates",
    icon: CircleDotIcon,
    title: "Plate loader",
    description: "What to hang on each end, from the plates your gym has.",
  },
] as const;

function Index() {
  const active = useActiveSession();

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">!natty</h1>
        <p className="text-sm text-muted-foreground">
          Pick a program, open a day, and hit start — the app walks you through
          every set and times your rest.
        </p>
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
              <ItemTitle>{destination.title}</ItemTitle>
              <ItemDescription>{destination.description}</ItemDescription>
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

  if (loggedSetCount === 0 && entries.length === 0) return null;

  const exercisesTrained = new Set(rows.map((row) => row.exerciseId)).size;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="Sets logged" value={String(loggedSetCount)} />
      <Stat label="Exercises trained" value={String(exercisesTrained)} />
      <Stat label="Records held" value={String(rows.length)} />
      <Stat
        label="Latest weigh-in"
        value={latest ? `${latest.weight} ${latest.unit}` : "—"}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/** Shown when nothing is in progress: one obvious thing to do. */
function StartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nothing in progress</CardTitle>
        <CardDescription>
          Start a workout from any training day, and it'll pick up here if you
          leave the page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Renders an <a>, so opt out of Base UI's native-<button> assertion. */}
        <Button nativeButton={false} render={<Link to="/routines" />}>
          <ListIcon data-icon="inline-start" /> Browse programs
        </Button>
      </CardContent>
    </Card>
  );
}

function ResumeCard() {
  const active = useActiveSession();
  if (active === null) return null;

  const { state, routine, day, steps, currentExerciseName } = active;

  return (
    <Card className="border-primary/40 ring-primary/30">
      <CardHeader>
        <CardTitle>Workout in progress</CardTitle>
        <CardDescription>
          {routine.name} · Day {day.dayNumber} — {day.label}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={(state.stepIndex / steps.length) * 100} />
        <p className="text-sm text-muted-foreground">
          {currentExerciseName
            ? `Up next: ${currentExerciseName}`
            : "All sets done."}
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
            <PlayIcon data-icon="inline-start" /> Resume
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              endSession();
              // Same reasoning as End workout in the player: the card
              // disappearing with no word reads as a misclick.
              toast.add({
                title: "Workout discarded",
                description: `${routine.name} — anything you logged is kept.`,
                type: "info",
              });
            }}
          >
            Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
