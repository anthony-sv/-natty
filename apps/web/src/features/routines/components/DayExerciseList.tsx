import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Marker } from "@/components/ui/marker";
import { ExercisePreviewButton } from "@/features/library/components/ExerciseMedia";
import { cn } from "@/lib/utils";
import type { ExerciseEntry } from "@/data/routines";
import { useFormatting } from "@/i18n/use-formatting";
import { useDateFormat, useT, type MessageKey } from "@/i18n/use-t";
import {
  exerciseDisplayName,
  formatAlternatives,
  type Formatting,
} from "../lib/format";
import { groupMembership, type GroupMembership } from "../lib/session";
import { PrescriptionBadges } from "./PrescriptionBadges";
import { SetDots } from "./SetDots";

type PositionedEntry = { exercise: ExerciseEntry; index: number };

const EXTRA_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
};

export function DayExerciseList({
  exercises,
  activeExerciseIndex,
  activeSetLabel,
  extraIndices,
  extraMeta,
  onRemoveExtra,
}: {
  exercises: ExerciseEntry[];
  /** Index of the exercise the running session is on, if any. */
  activeExerciseIndex?: number;
  /** "set 2 of 3" for the active exercise. */
  activeSetLabel?: string;
  /** Which indices are extra work rather than a prescription — see
   * `composeDay`. Not necessarily a trailing range: `"beforeCardio"`
   * placement can put a non-cardio extra ahead of the day's own cardio, so
   * membership is the only test that stays correct. */
  extraIndices?: Set<number>;
  /** `id`/`createdAt` per extra index, for the "Added {date}" caption. */
  extraMeta?: Map<number, { id: string; createdAt: number }>;
  /** Absent while a session is running on this day — removing an extra
   * whose steps sit before the live step index would shift it out from
   * under a running session. */
  onRemoveExtra?: (id: string, name: string) => void;
}) {
  const t = useT();
  const f = useFormatting();
  const dateFormat = useDateFormat(EXTRA_DATE);

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
          {/* Each run is one child of `ItemGroup` — a lone exercise or a
              whole superset/circuit block — so the group's own `gap-4`
              lands *between* blocks and never inside one. A `mt-0` on an
              inner row can't cancel a flex `gap`, which is what made the
              old bracket read as touching cards rather than one block. */}
          {runsWithExtraMarker(phase.entries, membership, extraIndices).map(
            ({ run, marker }) => (
              <Fragment key={run[0]!.index}>
                {/* Marks every transition into a run of extra work, not just
                    the first — `"beforeCardio"` placement can put a
                    prescribed cardio entry *after* a non-cardio extra
                    within the same array, so a phase can in principle carry
                    more than one such transition. Deliberately **outside**
                    the `phases.length > 1` gate above: a day that's entirely
                    main work plus one extra is one phase and still needs
                    this marker, since that gate only makes sense for the
                    kind-based phases. */}
                {marker ? (
                  <Marker variant="separator" className="my-1">
                    {t("extras.marker")}
                  </Marker>
                ) : null}
                {run.length === 1 ? (
                  <ExerciseRow
                    exercise={run[0]!.exercise}
                    index={run[0]!.index}
                    isActive={run[0]!.index === activeExerciseIndex}
                    activeSetLabel={activeSetLabel}
                    f={f}
                    t={t}
                    extra={extraMeta?.get(run[0]!.index)}
                    dateFormat={dateFormat}
                    onRemoveExtra={onRemoveExtra}
                  />
                ) : (
                  <div className="flex flex-col overflow-hidden rounded-lg border border-l-2 border-l-primary/60">
                    {run.map((entry, position) => (
                      <div key={entry.index} className="relative">
                        <ExerciseRow
                          exercise={entry.exercise}
                          index={entry.index}
                          isActive={entry.index === activeExerciseIndex}
                          activeSetLabel={activeSetLabel}
                          f={f}
                          t={t}
                          group={membership[entry.index]}
                          className="rounded-none border-none"
                        />
                        {/* Sits right on the seam with the next member — a
                            small break in the accent bar rather than a
                            badge, so "these run together" reads at a glance
                            instead of needing the eyebrow text parsed. */}
                        {position < run.length - 1 ? (
                          <div className="absolute bottom-0 left-4 z-10 flex -translate-x-1/2 translate-y-1/2 items-center gap-1 rounded-full border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            <ChevronDownIcon className="size-3" />
                            {entry.exercise.group?.transitionSeconds !== undefined
                              ? t("routines.transitionSeconds", {
                                  seconds: entry.exercise.group.transitionSeconds,
                                })
                              : null}
                          </div>
                        ) : null}
                        {position < run.length - 1 ? (
                          <div className="h-px bg-border" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </Fragment>
            ),
          )}
        </Fragment>
      ))}
    </ItemGroup>
  );
}

function ExerciseRow({
  exercise,
  index: i,
  isActive,
  activeSetLabel,
  f,
  t,
  group,
  className,
  extra,
  dateFormat,
  onRemoveExtra,
}: {
  exercise: ExerciseEntry;
  index: number;
  isActive: boolean;
  activeSetLabel?: string;
  f: Formatting;
  t: ReturnType<typeof useT>;
  group?: GroupMembership;
  className?: string;
  /** Present only for an appended extra — see `DayExerciseList`. */
  extra?: { id: string; createdAt: number };
  dateFormat?: Intl.DateTimeFormat;
  onRemoveExtra?: (id: string, name: string) => void;
}) {
  const name = exerciseDisplayName(exercise, f);

  return (
    <Item
      variant="outline"
      className={cn(
        "items-start gap-x-3",
        isActive && "bg-muted/60 ring-2 ring-primary",
        className,
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
          {name}
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
          {/* A finisher whose phases never got a pose picked in the
              builder runs silently as a plain set — no hold, no cue.
              This is the one place that would have caught it before
              the gym. */}
          {exercise.isFinisher &&
          exercise.prescriptions.every((p) => p.pose === undefined) ? (
            <Badge variant="outline" className="text-muted-foreground">
              {t("routines.finisherNoPose")}
            </Badge>
          ) : null}
          {exercise.kind === "cardio" ? (
            <Badge variant="outline">{t("common.cardio")}</Badge>
          ) : null}
          {isActive && activeSetLabel ? (
            <Badge variant="default">{activeSetLabel}</Badge>
          ) : null}
        </ItemTitle>
        {formatAlternatives(exercise, f) ? (
          <ItemDescription>{formatAlternatives(exercise, f)}</ItemDescription>
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
        {/* Says this row won't stand: it clears itself once the day is
            finished again, which is easy to assume away otherwise. */}
        {extra !== undefined && dateFormat !== undefined ? (
          <ItemDescription>
            {t("extras.addedOn", {
              date: dateFormat.format(new Date(extra.createdAt)),
            })}
          </ItemDescription>
        ) : null}
      </ItemContent>
      <ItemActions className="self-start">
        {/* Only renders when this exercise actually has media — an
            uncovered exercise (roughly a third of the library) grows no
            dead button. */}
        <ExercisePreviewButton exerciseId={exercise.exerciseId} exerciseName={name} />
        <PrescriptionBadges
          prescriptions={exercise.prescriptions}
          isFinisher={exercise.isFinisher}
        />
        {/* Withheld while a session is running on this day — see
            `onRemoveExtra`'s own doc comment on `DayExerciseList`. */}
        {extra !== undefined && onRemoveExtra !== undefined ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={t("extras.remove", { name })}
            onClick={() => onRemoveExtra(extra.id, name)}
          >
            <XIcon />
          </Button>
        ) : null}
      </ItemActions>
    </Item>
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

/**
 * Collapse a phase's entries into runs — a lone exercise, or a whole
 * supersetted/circuited block — using the same membership `groupMembership`
 * already computed, rather than re-deriving adjacency here.
 */
function toRuns(
  entries: PositionedEntry[],
  membership: Array<GroupMembership | undefined>,
): PositionedEntry[][] {
  const runs: PositionedEntry[][] = [];
  for (const entry of entries) {
    const group = membership[entry.index];
    const startsNewRun = group === undefined || group.isFirst;
    const current = runs[runs.length - 1];
    if (startsNewRun || current === undefined) {
      runs.push([entry]);
    } else {
      current.push(entry);
    }
  }
  return runs;
}

/**
 * `toRuns`, plus which runs open a stretch of extra work, so the caller
 * knows exactly where to drop the "Extra work" marker.
 *
 * Markers a *transition* into extra membership rather than only the first
 * one seen: extras are usually one contiguous trailing block, but
 * `"beforeCardio"` placement (`composeDay`) can put a non-cardio extra
 * ahead of the day's own cardio, so a phase can in principle see more than
 * one such transition if cardio ever splits a phase's own entries.
 */
function runsWithExtraMarker(
  entries: PositionedEntry[],
  membership: Array<GroupMembership | undefined>,
  extraIndices: Set<number> | undefined,
): Array<{ run: PositionedEntry[]; marker: boolean }> {
  let previousWasExtra = false;
  return toRuns(entries, membership).map((run) => {
    const isExtra = extraIndices?.has(run[0]!.index) ?? false;
    const marker = isExtra && !previousWasExtra;
    previousWasExtra = isExtra;
    return { run, marker };
  });
}
