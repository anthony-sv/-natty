import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CheckIcon, PencilLineIcon, Trash2Icon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useNames } from "@/i18n/names";
import { useDateFormat, useT, type Translate } from "@/i18n/use-t";
import { UNITS, weightUnitSchema, type WeightUnit } from "@/lib/units";
import { deleteSet, restoreSet, updateSet } from "../collection";
import { formatSet } from "../pr";
import type { LoggedSet } from "../schema";

const TIME: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

/** Same shape and the same locale-built messages as the other two log forms. */
const buildSchema = (t: Translate) =>
  z.object({
    unit: weightUnitSchema,
    weight: z
      .string()
      .refine(
        (v) => v.trim() === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
        t("log.weightError"),
      ),
    reps: z
      .string()
      .refine(
        (v) => Number.isInteger(Number(v)) && Number(v) > 0,
        t("log.repsError"),
      ),
  });

/**
 * A list of logged sets you can correct.
 *
 * One component in two places — a day opened from the heatmap, and the
 * per-exercise sheet. The second is the one that matters: a mistyped 1000kg
 * sits on the Pareto frontier as a phantom record, and where you *notice* that
 * is on the exercise's own page, so that has to be where you can fix it.
 */
export function LoggedSetList({
  sets,
  /** Off when the list is already grouped under one exercise. */
  showExercise = true,
}: {
  sets: LoggedSet[];
  showExercise?: boolean;
}) {
  const t = useT();
  const names = useNames();
  const time = useDateFormat(TIME);

  if (sets.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("history.noSets")}</p>;
  }

  return (
    <ul className="divide-y">
      {sets.map((set) => (
        <li key={set.id} className="flex items-center gap-3 py-2">
          <div className="flex min-w-0 flex-1 flex-col">
            {showExercise ? (
              <span className="truncate text-sm font-medium">
                {names.exercise(set.exerciseId)}
              </span>
            ) : null}
            <span className="flex items-center gap-2 text-sm tabular-nums">
              <span className={showExercise ? "text-muted-foreground" : "font-medium"}>
                {formatSet(set)}
              </span>
              <span className="text-xs text-muted-foreground">
                {time.format(new Date(set.performedAt))}
              </span>
            </span>
          </div>

          <EditSetPopover set={set} />

          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label={t("history.deleteSet", { set: formatSet(set) })}
            onClick={() => {
              const { set: removed } = deleteSet(set.id);
              // An undo on the toast rather than a confirmation dialog. This is
              // a small, frequent, fully reversible action — a dialog on every
              // deletion is friction that buys nothing, and undo also covers
              // the misclick you *meant* to make differently.
              toast.add({
                title: t("history.deleted", { set: formatSet(set) }),
                type: "info",
                actionProps: {
                  children: t("history.undo"),
                  onClick: () => {
                    if (removed) restoreSet(removed);
                  },
                },
              });
            }}
          >
            <Trash2Icon />
          </Button>
        </li>
      ))}
    </ul>
  );
}

/**
 * The correction form.
 *
 * Weight, unit and reps only. The exercise isn't editable on purpose: a set
 * logged against the wrong lift is a different set, and moving it would rewrite
 * two exercises' histories at once — delete it and log the right one.
 */
function EditSetPopover({ set }: { set: LoggedSet }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label={t("history.editSet", { set: formatSet(set) })}
          >
            <PencilLineIcon />
          </Button>
        }
      />
      <PopoverContent className="w-72">
        {/* Remounted per open so the fields start from what's stored now, not
            from whatever they held the first time this row was expanded. */}
        <EditSetForm key={String(open)} set={set} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function EditSetForm({ set, onDone }: { set: LoggedSet; onDone: () => void }) {
  const t = useT();

  const form = useForm({
    defaultValues: {
      unit: set.unit,
      weight: set.weight !== undefined ? String(set.weight) : "",
      reps: String(set.reps),
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const transaction = updateSet(set.id, {
        weight: value.weight.trim() === "" ? undefined : Number(value.weight),
        unit: value.unit,
        reps: Number(value.reps),
        // Editing corrects the numbers, never when it happened — the heatmap
        // and the weekly buckets are built on that timestamp.
        performedAt: set.performedAt,
      });
      void toast.promise(transaction.isPersisted.promise, {
        loading: t("history.saving"),
        success: { title: t("history.saved"), type: "success" },
        error: { title: t("history.saveError"), type: "error" },
      });
      onDone();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <PopoverTitle>{t("history.editTitle")}</PopoverTitle>

      <FieldGroup className="mt-3">
        <form.Field name="weight">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`edit-weight-${set.id}`}>
                {t("common.weight")}
              </FieldLabel>
              <div className="flex items-center gap-2">
                {/* `step="any"` — see `SetLogControl`'s own weight input for
                    why a fixed increment silently blocks a value like
                    6.25kg instead of showing a validation error. */}
                <Input
                  id={`edit-weight-${set.id}`}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  placeholder={t("common.optional")}
                  className="min-w-0 flex-1"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <form.Field name="unit">
                  {(unitField) => (
                    <Select
                      items={UNITS}
                      value={unitField.state.value}
                      onValueChange={(value) =>
                        unitField.handleChange(value as WeightUnit)
                      }
                    >
                      <SelectTrigger
                        aria-label={t("common.weightUnit")}
                        className="w-20 shrink-0"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
              </div>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="reps">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`edit-reps-${set.id}`}>
                {t("common.reps")}
              </FieldLabel>
              <Input
                id={`edit-reps-${set.id}`}
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting}
            >
              <CheckIcon data-icon="inline-start" /> {t("history.save")}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
