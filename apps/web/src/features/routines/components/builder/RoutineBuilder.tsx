import { Fragment, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  FilePlusIcon,
  Link2OffIcon,
  LinkIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import type { ExerciseEntry, Routine } from "@/data/routines";
import { ComboboxOptionGroup } from "@/components/combobox-option-group";
import { createUserExercise } from "@/features/library/collection";
import {
  filterExerciseOption,
  useExerciseOptions,
  useGroupedExerciseOptions,
  type ExerciseOption,
  type ExerciseOptionGroup,
} from "@/features/library/use-exercise-options";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import {
  createUserRoutine,
  isBuiltInSlug,
  saveBuiltInOverride,
  slugFor,
  updateUserRoutine,
} from "../../collection";
import {
  duplicateWeek,
  emptyDay,
  emptyPhase,
  emptyWeek,
  applyFinisher,
  finisherKindOf,
  isLinkedToPrevious,
  linkToPrevious,
  unlinkFromPrevious,
  moveDay,
  toRoutine,
  type DraftDay,
  type DraftExercise,
  type DraftPhase,
  type DraftRoutine,
  type DraftWeek,
} from "./draft";
import { FinisherPicker } from "./FinisherPicker";
import { PhaseEditor } from "./PhaseEditor";

/**
 * The four exercise kinds, with the message key each one renders under.
 *
 * `resistance` reads as "Main work" rather than "Resistance" — that's the
 * existing vocabulary from `DayExerciseList`'s phase separators, and having the
 * builder invent a second word for the same thing is how two names for one
 * concept start.
 */
const KINDS: { value: ExerciseEntry["kind"]; key: string }[] = [
  { value: "resistance", key: "routines.phase.main" },
  { value: "cardio", key: "routines.phase.cardio" },
  { value: "mobility", key: "routines.phase.mobility" },
  { value: "stretch", key: "routines.phase.stretch" },
];

export function RoutineBuilder({
  initial,
  /** Set when editing; absent means this is a new routine. */
  existingSlug,
}: {
  initial: DraftRoutine;
  existingSlug?: string;
}) {
  const t = useT();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(initial);

  const routine = toRoutine(draft, existingSlug ?? "preview");
  const canSave = routine !== undefined;

  function save() {
    if (routine === undefined) return;
    const slug = existingSlug ?? slugFor(draft.name);
    const toSave: Routine = { ...routine, slug };

    // Editing a built-in writes your version at *its* slug, which is what
    // makes it replace the shipped one in every list rather than sit beside
    // it. `updateUserRoutine` can't do that job — there's no row to update the
    // first time you edit one.
    const transaction =
      existingSlug === undefined
        ? createUserRoutine(toSave).transaction
        : isBuiltInSlug(existingSlug)
          ? saveBuiltInOverride(toSave)
          : updateUserRoutine(existingSlug, toSave);

    void toast.promise(transaction.isPersisted.promise, {
      loading: t("builder.saving"),
      success: { title: t("builder.saved", { name: toSave.name }), type: "success" },
      error: { title: t("builder.saveError"), type: "error" },
    });
    void navigate({
      to: "/routines/$routineSlug",
      params: { routineSlug: slug },
    });
  }

  const update = (patch: Partial<DraftRoutine>) =>
    setDraft((current) => ({ ...current, ...patch }));

  /**
   * Which week is on screen. Clamped on render rather than adjusted on delete,
   * because removing the last week would otherwise leave this pointing past
   * the end of the array.
   */
  const [weekIndex, setWeekIndex] = useState(0);
  const activeWeek = Math.min(weekIndex, draft.weeks.length - 1);
  const days = draft.weeks[activeWeek]?.days ?? [];

  /** Replace the days of the week being edited, leaving the others alone. */
  const updateDays = (next: DraftDay[]) =>
    setDraft((current) => ({
      ...current,
      weeks: current.weeks.map((week, i) =>
        i === activeWeek ? { ...week, days: next } : week,
      ),
    }));

  const updateDay = (index: number, patch: Partial<DraftDay>) =>
    updateDays(days.map((day, i) => (i === index ? { ...day, ...patch } : day)));

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="routine-name">{t("builder.name")}</FieldLabel>
          <Input
            id="routine-name"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="routine-style">{t("builder.style")}</FieldLabel>
          <Input
            id="routine-style"
            placeholder={t("builder.stylePlaceholder")}
            value={draft.style}
            onChange={(e) => update({ style: e.target.value })}
          />
          <FieldDescription>{t("builder.newBody")}</FieldDescription>
        </Field>
      </FieldGroup>

      {/* The switcher only exists once there's a second week, so a routine
          that repeats one cycle — which is most of them — looks exactly as it
          did before any of this. */}
      <WeekBar
        weeks={draft.weeks}
        active={activeWeek}
        onSelect={setWeekIndex}
        onAdd={(week) => {
          update({ weeks: [...draft.weeks, week] });
          setWeekIndex(draft.weeks.length);
        }}
        onRemove={() =>
          update({ weeks: draft.weeks.filter((_, i) => i !== activeWeek) })
        }
      />

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          {draft.weeks.length > 1
            ? t("builder.daysInWeek", { week: activeWeek + 1 })
            : t("builder.days")}
        </h2>

        {days.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("builder.noDays")}</p>
        ) : null}

        {days.map((day, index) => (
          <DayEditor
            // Keyed by week too: without it, switching weeks reuses each
            // DayEditor's subtree for a different week's day.
            key={`${activeWeek}-${index}`}
            day={day}
            index={index}
            dayCount={days.length}
            onChange={(patch) => updateDay(index, patch)}
            onMove={(to) => updateDays(moveDay(days, index, to))}
            onRemove={() => updateDays(days.filter((_, i) => i !== index))}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => updateDays([...days, emptyDay()])}
        >
          <PlusIcon data-icon="inline-start" />
          {t("builder.addDay")}
        </Button>
      </div>

      {/* The same section the diet builder has, and for the same reason: a
          program usually comes with a couple of standing instructions that
          don't belong on any one exercise. */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("dietBuilder.notes")}</h2>
        {draft.notes.map((note, index) => (
          <div key={index} className="flex items-start gap-2">
            <Textarea
              value={note}
              rows={2}
              className="min-w-0 flex-1"
              placeholder={t("builder.notePlaceholder")}
              onChange={(e) =>
                update({
                  notes: draft.notes.map((n, i) =>
                    i === index ? e.target.value : n,
                  ),
                })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("dietBuilder.removeNote")}
              onClick={() =>
                update({ notes: draft.notes.filter((_, i) => i !== index) })
              }
            >
              <XIcon />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => update({ notes: [...draft.notes, ""] })}
        >
          <PlusIcon data-icon="inline-start" />
          {t("dietBuilder.addNote")}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button disabled={!canSave} onClick={save}>
          {t("builder.save")}
        </Button>
        <Button variant="ghost" onClick={() => void navigate({ to: "/routines" })}>
          {t("builder.cancel")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Pick a week, add one, or throw one away.
 *
 * Hidden entirely at one week, which is the case for most routines and every
 * one the builder could write until now — a switcher over a single tab is
 * furniture. "Add a week" then appears as a plain button, so the feature is
 * discoverable without being in the way.
 */
function WeekBar({
  weeks,
  active,
  onSelect,
  onAdd,
  onRemove,
}: {
  weeks: DraftWeek[];
  active: number;
  onSelect: (index: number) => void;
  onAdd: (week: DraftWeek) => void;
  onRemove: () => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {weeks.length > 1
          ? weeks.map((_, index) => (
              <Button
                key={index}
                type="button"
                size="sm"
                variant={index === active ? "default" : "outline"}
                onClick={() => onSelect(index)}
              >
                {t("builder.weekNumber", { number: index + 1 })}
              </Button>
            ))
          : null}

        {/* Every existing week is offered as the starting point, not just the
            one you happen to be looking at. On a program that ramps, week 5
            is usually a copy of week 4 — but week 5 of a *new* block is far
            more likely a copy of week 1, and having to navigate there first
            just to press this is a step with no purpose. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" size="sm" variant="outline">
                <PlusIcon data-icon="inline-start" />
                {weeks.length > 1
                  ? t("builder.duplicateWeek")
                  : t("builder.addWeek")}
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="w-auto min-w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("builder.weekFromCopy")}</DropdownMenuLabel>
              {weeks.map((week, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => onAdd(duplicateWeek(week))}
                >
                  <CopyIcon />
                  {t("builder.weekNumber", { number: index + 1 })}
                  {index === active ? (
                    <span className="text-xs text-muted-foreground">
                      {t("builder.weekOpen")}
                    </span>
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onAdd(emptyWeek())}>
                <FilePlusIcon />
                <div className="flex flex-col">
                  <span>{t("builder.weekFromEmpty")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("builder.weekFromEmptyHint")}
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {weeks.length > 1 ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={onRemove}
          >
            <XIcon data-icon="inline-start" />
            {t("builder.removeWeek", { number: active + 1 })}
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {weeks.length > 1
          ? t("builder.weeksHint", { count: weeks.length })
          : t("builder.oneWeekHint")}
      </p>
    </div>
  );
}

function DayEditor({
  day,
  index,
  dayCount,
  onChange,
  onMove,
  onRemove,
}: {
  day: DraftDay;
  index: number;
  dayCount: number;
  onChange: (patch: Partial<DraftDay>) => void;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const t = useT();

  const updateExercise = (i: number, patch: Partial<DraftExercise>) =>
    onChange({
      exercises: day.exercises.map((exercise, j) =>
        j === i ? { ...exercise, ...patch } : exercise,
      ),
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="shrink-0 text-base">{index + 1}</CardTitle>
          <Input
            className="max-w-64"
            placeholder={t("builder.dayLabelPlaceholder")}
            aria-label={t("builder.dayLabel")}
            value={day.label}
            onChange={(e) => onChange({ label: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Switch
              id={`rest-${index}`}
              checked={day.isRest}
              onCheckedChange={(checked) => onChange({ isRest: checked })}
            />
            <Label htmlFor={`rest-${index}`} className="text-sm font-normal">
              {t("builder.restDay")}
            </Label>
          </div>
          {/* Buttons rather than drag-and-drop, and not as a stopgap: a
              week is five to seven rows and each one is a tall card, so a
              drag is a scroll-while-holding on the phone this is used on.
              Two taps move a day anywhere in the week. */}
          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              disabled={index === 0}
              aria-label={t("builder.moveDayUp", { number: index + 1 })}
              onClick={() => onMove(index - 1)}
            >
              <ChevronUpIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              disabled={index === dayCount - 1}
              aria-label={t("builder.moveDayDown", { number: index + 1 })}
              onClick={() => onMove(index + 1)}
            >
              <ChevronDownIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={t("builder.removeDay", { number: index + 1 })}
              onClick={onRemove}
            >
              <XIcon />
            </Button>
          </div>
        </div>
      </CardHeader>

      {day.isRest ? null : (
        <CardContent className="flex flex-col gap-4">
          {day.exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("builder.noExercises")}
            </p>
          ) : null}

          {day.exercises.map((exercise, i) => (
            <Fragment key={i}>
              {/* The gap between two exercises is where a superset lives, so
                  the control sits there rather than inside either card — and
                  the transition it owns belongs to the exercise *above* it,
                  which is the one you're leaving. */}
              {i > 0 ? (
                <LinkRow
                  exercises={day.exercises}
                  index={i}
                  onChange={(exercises) => onChange({ exercises })}
                />
              ) : null}
              <ExerciseEditor
                exercise={exercise}
                onChange={(patch) => updateExercise(i, patch)}
                onRemove={() =>
                  onChange({
                    exercises: day.exercises.filter((_, j) => j !== i),
                  })
                }
              />
            </Fragment>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              onChange({
                exercises: [
                  ...day.exercises,
                  {
                    exerciseId: "",
                    orAlternatives: [],
                    kind: "resistance",
                    isFinisher: false,
                    phases: [emptyPhase()],
                  },
                ],
              })
            }
          >
            <PlusIcon data-icon="inline-start" />
            {t("builder.addExercise")}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * "Run this one straight after the one above" — the superset control.
 *
 * A row in the gap rather than a field on either card, because that gap is
 * exactly what a superset changes: the rest that would have gone there stops
 * being emitted. It also gives the transition an obvious home, since the pause
 * between two stations belongs to neither exercise on its own.
 */
function LinkRow({
  exercises,
  index,
  onChange,
}: {
  exercises: DraftExercise[];
  index: number;
  onChange: (next: DraftExercise[]) => void;
}) {
  const t = useT();
  const linked = isLinkedToPrevious(exercises, index);
  const previous = exercises[index - 1];

  if (!linked) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-center text-muted-foreground"
        onClick={() =>
          onChange(linkToPrevious(exercises, index, () => crypto.randomUUID()))
        }
      >
        <LinkIcon data-icon="inline-start" />
        {t("builder.linkSuperset")}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <LinkIcon className="size-3.5" />
        {t("routines.superset")}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {t("builder.transition")}
        <Input
          type="number"
          min="0"
          className="h-8 w-16"
          placeholder="0"
          aria-label={t("builder.transition")}
          value={previous.transitionSeconds ?? ""}
          onChange={(e) =>
            onChange(
              exercises.map((exercise, i) =>
                i === index - 1
                  ? { ...exercise, transitionSeconds: e.target.value }
                  : exercise,
              ),
            )
          }
        />
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() =>
          onChange(
            unlinkFromPrevious(exercises, index, () => crypto.randomUUID()),
          )
        }
      >
        <Link2OffIcon data-icon="inline-start" />
        {t("builder.unlink")}
      </Button>
    </div>
  );
}

function ExerciseEditor({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: DraftExercise;
  onChange: (patch: Partial<DraftExercise>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const names = useNames();
  const options = useExerciseOptions();
  const groups = useGroupedExerciseOptions(options);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.id === exercise.exerciseId) ?? null;
  const kinds = KINDS.map(({ value, key }) => ({
    value,
    label: t(key as never),
  }));

  // Typing a lift the library doesn't have is the moment you find out it's
  // missing, so that's where adding one belongs — not on another page you'd
  // have to know about first.
  const canCreate =
    query.trim().length > 1 &&
    !options.some((o) => filterExerciseOption(o, query));

  function createFromQuery() {
    const name = query.trim();
    const { exercise: created } = createUserExercise({
      name,
      aliases: [],
      // Sensible defaults it can be corrected from — the Library tab owns the
      // real editor, and blocking the routine you're mid-way through writing to
      // fill in muscles is the wrong trade.
      pattern: "horizontal-press",
      primaryMuscles: ["chest"],
      secondaryMuscles: [],
    });
    onChange({ exerciseId: created.id });
    toast.add({ title: t("library.saved", { name }), type: "success" });
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-56 flex-1 flex-col gap-1">
          <Label className="text-xs">{t("builder.pickExercise")}</Label>
          <Combobox
            items={groups}
            filter={filterExerciseOption}
            value={selected}
            onValueChange={(option: ExerciseOption | null) =>
              // The library already knows conditioning from lifting, so picking
              // one settles the kind rather than leaving you to notice the
              // select still says "Main work" and the phase still asks for reps.
              onChange(
                option?.isCardio === true
                  ? { exerciseId: option.id, kind: "cardio", phases: timed(exercise.phases) }
                  : { exerciseId: option?.id ?? "" },
              )
            }
            // Watched rather than left uncontrolled, so "no match" can offer to
            // create what you typed. The query lives on the root, not the input.
            onInputValueChange={setQuery}
            itemToStringLabel={(option: ExerciseOption) => option.name}
          >
            <ComboboxInput placeholder={t("common.searchExercises")} />
            <ComboboxContent>
              <ComboboxEmpty>
                {canCreate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={createFromQuery}
                  >
                    <PlusIcon data-icon="inline-start" />
                    {t("builder.createNamed", { name: query.trim() })}
                  </Button>
                ) : (
                  t("common.noExerciseFound")
                )}
              </ComboboxEmpty>
              <ComboboxList>
                {(group: ExerciseOptionGroup, index: number) => (
                  <ComboboxOptionGroup
                    key={group.key}
                    group={group}
                    index={index}
                  >
                    {(option) => (
                      <ComboboxItem key={option.id} value={option}>
                        <span className="flex items-center gap-2">
                          {option.name}
                          {/* The heading says which muscle, not whose — a lift
                              you added still needs marking as yours. */}
                          {option.isCustom ? (
                            <Badge variant="secondary">
                              {t("library.custom")}
                            </Badge>
                          ) : null}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxOptionGroup>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">{t("builder.exerciseKind")}</Label>
          <Select
            items={kinds}
            value={exercise.kind}
            onValueChange={(value) => {
              const kind = value as ExerciseEntry["kind"];
              // Switching to cardio by hand does the same conversion picking a
              // cardio exercise does — otherwise the form would still be
              // asking for reps under a select that says Cardio, which is the
              // exact state this is fixing.
              onChange(
                kind === "cardio"
                  ? { kind, phases: timed(exercise.phases) }
                  : { kind },
              );
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {kinds.map((kind) => (
                <SelectItem key={kind.value} value={kind.value}>
                  {kind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* `isFinisher` round-tripped through the editor from the day this
            existed, but nothing could *set* it — a copied routine kept the
            flag it arrived with and there was no way to add or clear one.
            Cardio can't be a finisher: a finisher is what closes a lifting
            muscle group, and `buildSteps` only reads the flag for resistance
            work.

            Picking one changes the *phases*, not just the flag. On its own the
            flag is a badge and a count — it shipped that way once, and the
            toggle it belonged to did nothing you could see. */}
        {exercise.kind !== "cardio" ? (
          <FinisherPicker
            value={finisherKindOf(exercise)}
            phases={exercise.phases}
            onChange={(kind) =>
              onChange({
                isFinisher: kind !== "none",
                phases: applyFinisher(exercise.phases, kind),
              })
            }
          />
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="ml-auto text-muted-foreground"
          aria-label={t("builder.removeExercise", {
            name: exercise.exerciseId
              ? names.exercise(exercise.exerciseId)
              : t("builder.pickExercise"),
          })}
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      </div>

      {/* Substitutes, in your own order of preference. Ids rather than free
          text, because the player offers them as a swap and logs against
          whichever you actually did — a substitute you can't log against is a
          note to yourself.

          Not offered for cardio: the library holds one conditioning entry, so
          the picker would open on a list with nothing in it. */}
      {exercise.kind === "cardio" ? null : (
        <AlternativesEditor
          exerciseId={exercise.exerciseId}
          value={exercise.orAlternatives}
          onChange={(orAlternatives) => onChange({ orAlternatives })}
        />
      )}

      <PhaseEditor
        phases={exercise.phases}
        kind={exercise.kind}
        isFinisher={exercise.isFinisher}
        onChange={(phases) => onChange({ phases })}
      />
    </div>
  );
}

/**
 * Turn a set of phases into timed ones, keeping the sets and rest you'd
 * already typed.
 *
 * A cardio block is a duration, and the model has said so since the beginning
 * (`durationSeconds`) — the builder simply never switched to it, so picking
 * "Low-intensity steady-state cardio" left you looking at "3 sets of 8-12
 * reps" with a Forced reps checkbox underneath. Anything already timed is left
 * alone so an existing routine's numbers survive a re-pick.
 */
function timed(phases: DraftPhase[]): DraftPhase[] {
  return phases.map((phase) =>
    phase.duration !== undefined
      ? phase
      : {
          ...phase,
          duration: "20",
          durationUnit: "min",
          segments: undefined,
          // One block, not three. A cardio phase is "twenty minutes", and the
          // resistance default of three sets turned that into an hour of it.
          sets: "1",
          // And a single block has nothing to rest between, so it carries no
          // rest at all rather than the resistance default of 90 seconds.
          restSeconds: "",
        },
  );
}

function AlternativesEditor({
  exerciseId,
  value,
  onChange,
}: {
  exerciseId: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const t = useT();
  const names = useNames();
  const options = useExerciseOptions();
  const groups = useGroupedExerciseOptions(options);

  // The lift itself, and anything already listed — offering either would only
  // produce a row reading "or <the same lift>".
  const taken = new Set([exerciseId, ...value]);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs">{t("builder.alternatives")}</Label>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <li key={id}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {names.exercise(id)}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("builder.removeAlternative", {
                    name: names.exercise(id),
                  })}
                  onClick={() => onChange(value.filter((entry) => entry !== id))}
                >
                  <XIcon />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <Combobox
        items={groups}
        filter={filterExerciseOption}
        // Held at null rather than showing the last pick: this control adds to
        // a list, so a selection is an action, not a state.
        value={null}
        onValueChange={(option: ExerciseOption | null) => {
          if (option !== null && !taken.has(option.id)) {
            onChange([...value, option.id]);
          }
        }}
        itemToStringLabel={(option: ExerciseOption) => option.name}
      >
        <ComboboxInput placeholder={t("builder.addAlternative")} />
        <ComboboxContent>
          <ComboboxEmpty>{t("common.noExerciseFound")}</ComboboxEmpty>
          <ComboboxList>
            {(group: ExerciseOptionGroup, index: number) => (
              <ComboboxOptionGroup key={group.key} group={group} index={index}>
                {(option) => (
                  <ComboboxItem
                    key={option.id}
                    value={option}
                    disabled={taken.has(option.id)}
                  >
                    {option.name}
                  </ComboboxItem>
                )}
              </ComboboxOptionGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <FieldDescription>{t("builder.alternativesHint")}</FieldDescription>
    </div>
  );
}
