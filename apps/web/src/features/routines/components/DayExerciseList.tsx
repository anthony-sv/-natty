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
import type { ExerciseEntry } from "@/data/routines";
import { PrescriptionBadges } from "./PrescriptionBadges";

export function DayExerciseList({ exercises }: { exercises: ExerciseEntry[] }) {
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
      {exercises.map((exercise, i) => (
        <Item key={i} variant="outline">
          <ItemContent>
            <ItemTitle>
              {exercise.name}
              {exercise.isFinisher ? <Badge variant="default">Finisher</Badge> : null}
              {exercise.kind === "cardio" ? (
                <Badge variant="outline">Cardio</Badge>
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
      ))}
    </ItemGroup>
  );
}
