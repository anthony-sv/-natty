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
import { DISTANCE_UNITS, distanceUnitSchema, type DistanceUnit } from "@/lib/units";
import { deleteCardio, restoreCardio, updateCardio } from "../cardio-collection";
import { formatCardio } from "../cardio";
import type { CardioEntry } from "../cardio-schema";

const TIME: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

/** Same shape as `SetLogControl`'s schema, distance in place of weight/reps. */
const buildSchema = (t: Translate) =>
  z.object({
    unit: distanceUnitSchema,
    distance: z
      .string()
      .refine(
        (v) => Number.isFinite(Number(v)) && Number(v) > 0,
        t("cardio.distanceError"),
      ),
    durationMinutes: z
      .string()
      .refine(
        (v) => v.trim() === "" || (Number.isFinite(Number(v)) && Number(v) > 0),
        t("cardio.durationError"),
      ),
  });

/**
 * A list of cardio entries you can correct — the cardio equivalent of
 * `LoggedSetList`, same edit/delete-with-undo pattern every log type here
 * gets.
 */
export function CardioEntryList({
  entries,
  showExercise = true,
}: {
  entries: CardioEntry[];
  showExercise?: boolean;
}) {
  const t = useT();
  const names = useNames();
  const time = useDateFormat(TIME);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("cardio.history.noEntries")}</p>;
  }

  return (
    <ul className="divide-y">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center gap-3 py-2">
          <div className="flex min-w-0 flex-1 flex-col">
            {showExercise ? (
              <span className="truncate text-sm font-medium">
                {names.exercise(entry.exerciseId)}
              </span>
            ) : null}
            <span className="flex items-center gap-2 text-sm tabular-nums">
              <span className={showExercise ? "text-muted-foreground" : "font-medium"}>
                {formatCardio(entry)}
              </span>
              <span className="text-xs text-muted-foreground">
                {time.format(new Date(entry.performedAt))}
              </span>
            </span>
          </div>

          <EditCardioPopover entry={entry} />

          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label={t("cardio.history.deleteEntry", { entry: formatCardio(entry) })}
            onClick={() => {
              const { entry: removed } = deleteCardio(entry.id);
              toast.add({
                title: t("cardio.history.deleted", { entry: formatCardio(entry) }),
                type: "info",
                actionProps: {
                  children: t("history.undo"),
                  onClick: () => {
                    if (removed) restoreCardio(removed);
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

function EditCardioPopover({ entry }: { entry: CardioEntry }) {
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
            aria-label={t("cardio.history.editEntry", { entry: formatCardio(entry) })}
          >
            <PencilLineIcon />
          </Button>
        }
      />
      <PopoverContent className="w-72">
        <EditCardioForm
          key={String(open)}
          entry={entry}
          onDone={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

function EditCardioForm({
  entry,
  onDone,
}: {
  entry: CardioEntry;
  onDone: () => void;
}) {
  const t = useT();

  const form = useForm({
    defaultValues: {
      unit: entry.unit,
      distance: String(entry.distance),
      durationMinutes:
        entry.durationSeconds !== undefined
          ? String(Math.round(entry.durationSeconds / 60))
          : "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const transaction = updateCardio(entry.id, {
        distance: Number(value.distance),
        unit: value.unit,
        durationSeconds:
          value.durationMinutes.trim() === ""
            ? undefined
            : Math.round(Number(value.durationMinutes) * 60),
        // Editing corrects the numbers, never when it happened.
        performedAt: entry.performedAt,
      });
      void toast.promise(transaction.isPersisted.promise, {
        loading: t("history.saving"),
        success: { title: t("cardio.history.saved"), type: "success" },
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
      <PopoverTitle>{t("cardio.history.editTitle")}</PopoverTitle>

      <FieldGroup className="mt-3">
        <form.Field name="distance">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`edit-distance-${entry.id}`}>
                {t("common.distance")}
              </FieldLabel>
              <div className="flex items-center gap-2">
                {/* `step="any"` — a stepped input rejects a value that isn't a
                    multiple of the step with no error, just a submit that
                    silently does nothing. See `SetLogControl`'s weight input
                    for the same fix. */}
                <Input
                  id={`edit-distance-${entry.id}`}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  className="min-w-0 flex-1"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <form.Field name="unit">
                  {(unitField) => (
                    <Select
                      items={DISTANCE_UNITS}
                      value={unitField.state.value}
                      onValueChange={(value) =>
                        unitField.handleChange(value as DistanceUnit)
                      }
                    >
                      <SelectTrigger
                        aria-label={t("common.distanceUnit")}
                        className="w-20 shrink-0"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTANCE_UNITS.map((option) => (
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

        <form.Field name="durationMinutes">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`edit-duration-${entry.id}`}>
                {t("cardio.log.durationMinutes")}
              </FieldLabel>
              <Input
                id={`edit-duration-${entry.id}`}
                type="number"
                inputMode="decimal"
                step="1"
                min="0"
                placeholder={t("common.optional")}
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
