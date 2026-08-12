import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  emptyDay,
  emptyPhase,
  toRoutine,
  type DraftDay,
  type DraftExercise,
  type DraftPhase,
  type DraftRoutine,
} from "./draft";
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

  const updateDay = (index: number, patch: Partial<DraftDay>) =>
    setDraft((current) => ({
      ...current,
      days: current.days.map((day, i) =>
        i === index ? { ...day, ...patch } : day,
      ),
    }));

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

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t("builder.days")}</h2>

        {draft.days.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("builder.noDays")}</p>
        ) : null}

        {draft.days.map((day, index) => (
          <DayEditor
            key={index}
            day={day}
            index={index}
            onChange={(patch) => updateDay(index, patch)}
            onRemove={() =>
              update({ days: draft.days.filter((_, i) => i !== index) })
            }
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => update({ days: [...draft.days, emptyDay()] })}
        >
          <PlusIcon data-icon="inline-start" />
          {t("builder.addDay")}
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

function DayEditor({
  day,
  index,
  onChange,
  onRemove,
}: {
  day: DraftDay;
  index: number;
  onChange: (patch: Partial<DraftDay>) => void;
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-muted-foreground"
            aria-label={t("builder.removeDay", { number: index + 1 })}
            onClick={onRemove}
          >
            <XIcon />
          </Button>
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
            <ExerciseEditor
              key={i}
              exercise={exercise}
              onChange={(patch) => updateExercise(i, patch)}
              onRemove={() =>
                onChange({
                  exercises: day.exercises.filter((_, j) => j !== i),
                })
              }
            />
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
          note to yourself. */}
      <AlternativesEditor
        exerciseId={exercise.exerciseId}
        value={exercise.orAlternatives}
        onChange={(orAlternatives) => onChange({ orAlternatives })}
      />

      <PhaseEditor
        phases={exercise.phases}
        kind={exercise.kind}
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
    phase.durationSeconds !== undefined
      ? phase
      : { ...phase, durationSeconds: "1200", segments: undefined },
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
