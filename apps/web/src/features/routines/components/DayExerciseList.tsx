import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { ExerciseEntry } from "@/data/routines";
import { PrescriptionBadges } from "./PrescriptionBadges";

export function DayExerciseList({
  exercises,
  activeExerciseIndex,
  activeSetLabel,
}: {
  exercises: ExerciseEntry[];
  /** Index of the exercise the running session is on, if any. */
  activeExerciseIndex?: number;
  /** "set 2 of 3" for the active exercise. */
  activeSetLabel?: string;
}) {
  if (exercises.length === 0) {
    return (
      <Empty>
        <EmptyTitle>No exercises listed</EmptyTitle>
        <EmptyDescription>This day has no exercises recorded.</EmptyDescription>
      </Empty>
    );
  }

  return (
    <ItemGroup>
      {exercises.map((exercise, i) => {
        const isActive = i === activeExerciseIndex;
        return (
          <Item
            key={i}
            variant="outline"
            className={cn(isActive && "bg-muted/60 ring-2 ring-primary")}
          >
            <ItemContent>
              <ItemTitle>
                {exercise.name}
                {exercise.isFinisher ? <Badge variant="default">Finisher</Badge> : null}
                {exercise.kind === "cardio" ? (
                  <Badge variant="outline">Cardio</Badge>
                ) : null}
                {isActive && activeSetLabel ? (
                  <Badge variant="default">{activeSetLabel}</Badge>
                ) : null}
              </ItemTitle>
              {exercise.notes ? (
                <ItemDescription>{exercise.notes}</ItemDescription>
              ) : null}
            </ItemContent>
            <ItemActions>
              <PrescriptionBadges
                prescriptions={exercise.prescriptions}
                isFinisher={exercise.isFinisher}
              />
            </ItemActions>
          </Item>
        );
      })}
    </ItemGroup>
  );
}
