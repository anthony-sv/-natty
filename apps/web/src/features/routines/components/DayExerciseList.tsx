import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Marker } from "@/components/ui/marker";
import { cn } from "@/lib/utils";
import type { ExerciseEntry } from "@/data/routines";
import { exerciseDisplayName, formatAlternatives } from "../lib/format";
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

  const phases = groupIntoPhases(exercises);

  return (
    <ItemGroup>
      {phases.map((phase) => (
        <Fragment key={phase.label}>
          {/* A single phase needs no heading -- "Main work" on a day that is
              nothing but main work is noise. */}
          {phases.length > 1 ? (
            <Marker variant="separator" className="my-1">
              {phase.label}
            </Marker>
          ) : null}
          {phase.entries.map(({ exercise, index: i }) => {
            const isActive = i === activeExerciseIndex;
            return (
          <Item
            key={i}
            variant="outline"
            className={cn(isActive && "bg-muted/60 ring-2 ring-primary")}
          >
            <ItemContent>
              <ItemTitle>
                {exerciseDisplayName(exercise)}
                {exercise.isFinisher ? <Badge variant="default">Finisher</Badge> : null}
                {exercise.kind === "cardio" ? (
                  <Badge variant="outline">Cardio</Badge>
                ) : null}
                {isActive && activeSetLabel ? (
                  <Badge variant="default">{activeSetLabel}</Badge>
                ) : null}
              </ItemTitle>
              {formatAlternatives(exercise) ? (
                <ItemDescription>
                  {formatAlternatives(exercise)}
                </ItemDescription>
              ) : null}
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
        </Fragment>
      ))}
    </ItemGroup>
  );
}

/** Display order and wording for the parts of a session. */
const PHASES: Array<{ label: string; kinds: ExerciseEntry["kind"][] }> = [
  { label: "Main work", kinds: ["resistance"] },
  { label: "Mobility", kinds: ["mobility"] },
  { label: "Stretch", kinds: ["stretch"] },
  { label: "Cardio", kinds: ["cardio"] },
];

/**
 * Split a day into its parts, keeping each entry's original index.
 *
 * The index matters: `activeExerciseIndex` refers to a position in the day's
 * own `exercises` array, so renumbering here would put the active-set
 * highlight on the wrong row. Phases with nothing in them are dropped, which
 * is why today's data yields just "Main work" and "Cardio".
 */
function groupIntoPhases(exercises: ExerciseEntry[]) {
  return PHASES.map((phase) => ({
    label: phase.label,
    entries: exercises
      .map((exercise, index) => ({ exercise, index }))
      .filter(({ exercise }) => phase.kinds.includes(exercise.kind)),
  })).filter((phase) => phase.entries.length > 0);
}
