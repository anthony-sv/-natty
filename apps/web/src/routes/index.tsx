import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { PlayIcon } from "lucide-react";
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
import { routinesQueryOptions } from "@/features/routines/queries";
import { endSession } from "@/features/routines/session-store";
import { useActiveSession } from "@/features/routines/lib/use-active-session";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(routinesQueryOptions()),
  component: Index,
});

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

      {active ? (
        <ResumeCard />
      ) : (
        <div>
          <Button
            nativeButton={false}
            render={<Link to="/routines" />}
            variant="outline"
          >
            Browse programs
          </Button>
        </div>
      )}
    </Page>
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
          {/* Renders an <a>, so opt out of Base UI's native-<button> assertion. */}
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
