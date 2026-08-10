import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { getExercise, getMovement } from "@/data/exercises";
import { LogEntryForm } from "./LogEntryForm";
import { PrTable } from "./PrTable";
import { useLogByExercise } from "../queries";

/** The records half of /progress: per-exercise PRs, plus backfill logging. */
export function RecordsPanel() {
  const { groups, isLoading } = useLogByExercise();

  return (
    <div className="flex flex-col gap-6">
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
