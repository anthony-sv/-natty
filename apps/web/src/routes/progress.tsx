import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { getExercise, getMovement } from "@/data/exercises";
import { LogEntryForm } from "@/features/log/components/LogEntryForm";
import { PrTable } from "@/features/log/components/PrTable";
import { useLogByExercise } from "@/features/log/queries";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const { groups, isLoading } = useLogByExercise();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="text-sm text-muted-foreground">
          Your records for every exercise you've logged. A set counts as a
          record when nothing else beat it on both weight and reps.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log a set</CardTitle>
          <CardDescription>
            For work done outside the player, or to catch up on a session you
            didn't log at the time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogEntryForm />
        </CardContent>
      </Card>

      {isLoading ? null : groups.length === 0 ? (
        <Empty>
          <EmptyTitle>Nothing logged yet</EmptyTitle>
          <EmptyDescription>
            Log a set above, or start a workout and record your sets as you go.
          </EmptyDescription>
        </Empty>
      ) : (
        groups.map((group) => {
          const exercise = getExercise(group.exerciseId);
          const movement = exercise
            ? getMovement(exercise.movementId)
            : undefined;
          return (
            <Card key={group.exerciseId}>
              <CardHeader>
                <CardTitle>{exercise?.name ?? group.exerciseId}</CardTitle>
                <CardDescription>
                  {movement ? `${movement.name} · ` : ""}
                  {group.sets.length} set
                  {group.sets.length === 1 ? "" : "s"} logged
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrTable frontier={group.frontier} />
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
