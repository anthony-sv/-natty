import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CalendarIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
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
import {
  filterExerciseOption,
  useExerciseOptions,
  type ExerciseOption,
} from "@/features/library/use-exercise-options";
import { useDateFormat, useT, type Translate } from "@/i18n/use-t";
import { logSet } from "../collection";
import { formatSet } from "../pr";
import { UNITS, weightUnitSchema, type WeightUnit } from "@/lib/units";

/**
 * Form values stay strings, because that is what number inputs produce and
 * coercing mid-validation makes the error messages worse. They're converted
 * once, on submit.
 *
 * Built per locale rather than at module scope: a validation message is a
 * string like any other, and Zod bakes it into the schema.
 */
const buildSchema = (t: Translate) =>
  z.object({
    exerciseId: z.string().min(1, t("log.pickExercise")),
    performedAt: z.number().int().positive(),
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

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

export function LogEntryForm() {
  const t = useT();
  const dateFormat = useDateFormat(DATE_OPTIONS);
  // Built-ins and your own, sorted for the reader's locale — see
  // `useExerciseOptions`, which every picker in the app shares.
  const options = useExerciseOptions();
  const [justLogged, setJustLogged] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Read once via a lazy initialiser rather than during render -- the purity
  // lint rule rejects Date.now() mid-render, and a form's default date should
  // be fixed when it mounts anyway.
  const [defaultDate] = useState(() => Date.now());

  const form = useForm({
    defaultValues: {
      exerciseId: "",
      performedAt: defaultDate,
      unit: "kg" as WeightUnit,
      weight: "",
      reps: "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const { set, transaction, isRecord } = logSet({
        performedAt: value.performedAt,
        exerciseId: value.exerciseId,
        weight: value.weight.trim() === "" ? undefined : Number(value.weight),
        unit: value.unit,
        reps: Number(value.reps),
      });
      const name = options.find((o) => o.id === value.exerciseId)?.name;
      // Same rule as the player: a record announces itself instead of the
      // plain confirmation. Backdating can set a record too -- the frontier is
      // ranked by load and reps, not by when the set happened.
      void toast.promise(transaction.isPersisted.promise, {
        loading: t("log.saving"),
        success: isRecord
          ? {
              title: t("log.newRecord"),
              description: `${name ?? value.exerciseId} — ${formatSet(set)}`,
              type: "success",
            }
          : {
              title: t("log.saved", { set: formatSet(set) }),
              description: name,
              type: "success",
            },
        error: { title: t("log.saveError"), type: "error" },
      });
      setJustLogged(name ?? value.exerciseId);
      // Keep the exercise and date: logging several sets of the same thing in
      // a row is the common case when catching up on a missed session.
      // resetField, not setFieldValue -- the latter leaves the field marked
      // touched, so an empty reps box would immediately show its own error
      // straight after a successful save.
      form.resetField("weight");
      form.resetField("reps");
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
      <FieldGroup>
      <form.Field name="exerciseId">
        {(field) => (
          <Field>
            <FieldLabel htmlFor="backfill-exercise">
              {t("common.exercise")}
            </FieldLabel>
            <Combobox
              items={options}
              itemToStringLabel={(item: ExerciseOption) => item.name}
              filter={filterExerciseOption}
              value={options.find((o) => o.id === field.state.value) ?? null}
              onValueChange={(item: ExerciseOption | null) =>
                field.handleChange(item?.id ?? "")
              }
            >
              <ComboboxInput
                id="backfill-exercise"
                placeholder={t("common.searchExercises")}
              />
              <ComboboxContent>
                <ComboboxEmpty>{t("common.noExerciseFound")}</ComboboxEmpty>
                <ComboboxList>
                  {(item: ExerciseOption) => (
                    <ComboboxItem key={item.id} value={item}>
                      {item.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <form.Field name="performedAt">
        {(field) => (
          <Field>
            <FieldLabel htmlFor="backfill-date">{t("common.date")}</FieldLabel>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id="backfill-date"
                    variant="outline"
                    className="justify-start font-normal"
                  >
                    <CalendarIcon data-icon="inline-start" />
                    {dateFormat.format(new Date(field.state.value))}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={new Date(field.state.value)}
                  // Future-dating a set you have not done yet is always a slip.
                  disabled={{ after: new Date() }}
                  onSelect={(date) => {
                    if (date) field.handleChange(date.getTime());
                    setDatePickerOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </Field>
        )}
      </form.Field>

      <div className="flex gap-3">
        <form.Field name="weight">
          {(field) => (
            <Field className="flex-1">
              <FieldLabel htmlFor="backfill-weight">
                {t("common.weight")}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="backfill-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
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
            <Field className="flex-1">
              <FieldLabel htmlFor="backfill-reps">{t("common.reps")}</FieldLabel>
              <Input
                id="backfill-reps"
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
      </div>

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {t("log.action")}
            </Button>
            {justLogged ? (
              <span className="text-sm text-muted-foreground">
                {t("log.saved", { set: justLogged })}
              </span>
            ) : null}
          </div>
        )}
      </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
