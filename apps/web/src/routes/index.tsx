import { createFileRoute, Link } from "@tanstack/react-router";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
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
    </div>
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
            <PlayIcon /> Resume
          </Button>
          <Button variant="ghost" onClick={endSession}>
            Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
