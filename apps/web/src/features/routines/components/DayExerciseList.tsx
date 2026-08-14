import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Marker } from "@/components/ui/marker";
import { cn } from "@/lib/utils";
import type { ExerciseEntry } from "@/data/routines";
import { useFormatting } from "@/i18n/use-formatting";
import { useT, type MessageKey } from "@/i18n/use-t";
import { exerciseDisplayName, formatAlternatives } from "../lib/format";
import { groupMembership } from "../lib/session";
import { PrescriptionBadges } from "./PrescriptionBadges";
import { SetDots } from "./SetDots";

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
  const t = useT();
  const f = useFormatting();

  if (exercises.length === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("routines.noExercises")}</EmptyTitle>
        <EmptyDescription>{t("routines.noExercisesBody")}</EmptyDescription>
      </Empty>
    );
  }

  const phases = groupIntoPhases(exercises);
  // The same runs the player interleaves, so the list and the session can't
  // disagree about what a superset is.
  const membership = groupMembership(exercises);

  return (
    <ItemGroup>
      {phases.map((phase) => (
        <Fragment key={phase.labelKey}>
          {/* A single phase needs no heading -- "Main work" on a day that is
              nothing but main work is noise. */}
          {phases.length > 1 ? (
            <Marker variant="separator" className="my-1">
              {t(phase.labelKey)}
            </Marker>
          ) : null}
          {phase.entries.map(({ exercise, index: i }) => {
            const isActive = i === activeExerciseIndex;
            const group = membership[i];
            return (
          <Item
            key={i}
            variant="outline"
            className={cn(
              "items-start gap-x-3",
              isActive && "bg-muted/60 ring-2 ring-primary",
              // A bracket down the left, and the rows pulled together: a
              // superset is one block of work, and two rows spaced like any
              // other pair is exactly what made it invisible.
              group !== undefined &&
                "border-l-2 border-l-primary/60 rounded-l-none",
              group !== undefined && !group.isFirst && "mt-0",
            )}
          >
            {/* Position in the day. Small, but it gives the list a spine and
                turns "the third one" into something you can point at. */}
            <ItemMedia>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
            </ItemMedia>
            <ItemContent className="gap-1">
              <ItemTitle className="flex-wrap">
                {exerciseDisplayName(exercise, f)}
                {/* Named once, on the row that opens it — a badge on every
                    member would say the same thing three times and still not
                    say where the block starts. */}
                {group?.isFirst === true ? (
                  <Badge variant="secondary">
                    {group.size > 2
                      ? t("routines.circuitOf", { count: group.size })
                      : t("routines.superset")}
                  </Badge>
                ) : null}
                {exercise.isFinisher ? (
                  <Badge variant="default">{t("common.finisher")}</Badge>
                ) : null}
                {exercise.kind === "cardio" ? (
                  <Badge variant="outline">{t("common.cardio")}</Badge>
                ) : null}
                {isActive && activeSetLabel ? (
                  <Badge variant="default">{activeSetLabel}</Badge>
                ) : null}
              </ItemTitle>
              {formatAlternatives(exercise, f) ? (
                <ItemDescription>
                  {formatAlternatives(exercise, f)}
                </ItemDescription>
              ) : null}
              {exercise.notes ? (
                <ItemDescription>{exercise.notes}</ItemDescription>
              ) : null}
              {exercise.kind === "cardio" ? null : (
                <SetDots
                  prescriptions={exercise.prescriptions}
                  isFinisher={exercise.isFinisher}
                />
              )}
            </ItemContent>
            <ItemActions className="self-start">
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
const PHASES: Array<{ labelKey: MessageKey; kinds: ExerciseEntry["kind"][] }> = [
  { labelKey: "routines.phase.main", kinds: ["resistance"] },
  { labelKey: "routines.phase.mobility", kinds: ["mobility"] },
  { labelKey: "routines.phase.stretch", kinds: ["stretch"] },
  { labelKey: "routines.phase.cardio", kinds: ["cardio"] },
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
    labelKey: phase.labelKey,
    entries: exercises
      .map((exercise, index) => ({ exercise, index }))
      .filter(({ exercise }) => phase.kinds.includes(exercise.kind)),
  })).filter((phase) => phase.entries.length > 0);
}
