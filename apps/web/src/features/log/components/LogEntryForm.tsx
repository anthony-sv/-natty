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
import { exercises } from "@/data/exercises";
import { matchesAllWords } from "@/lib/search";
import { logSet } from "../collection";
import { formatSet } from "../pr";
import { UNITS, weightUnitSchema, type WeightUnit } from "@/lib/units";

/**
 * Form values stay strings, because that is what number inputs produce and
 * coercing mid-validation makes the error messages worse. They're converted
 * once, on submit.
 */
const formSchema = z.object({
  exerciseId: z.string().min(1, "Pick an exercise"),
  performedAt: z.number().int().positive(),
  unit: weightUnitSchema,
  weight: z
    .string()
    .refine(
      (v) => v.trim() === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
      "Enter a weight in kg, or leave it blank for bodyweight",
    ),
  reps: z
    .string()
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) > 0,
      "Enter how many reps you did",
    ),
});

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface ExerciseOption {
  id: string;
  name: string;
  /** Everything this lift answers to, for the filter below. */
  search: string;
}

/** Exercise options, sorted by display name so the combobox reads alphabetically. */
const options: ExerciseOption[] = [...exercises]
  .map((e) => ({
    id: e.id,
    name: e.name,
    search: [e.name, ...e.aliases].join(" "),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/**
 * The Combobox filters on its label by default, which is the same blind spot
 * the records table had: 113 curated names, and none of the spellings you'd
 * actually type. This searches the aliases too, through the house matcher — so
 * "pec deck", "flat db press" and "bench incline" all land.
 */
function filterOption(item: ExerciseOption, query: string): boolean {
  return matchesAllWords(item.search, query);
}

export function LogEntryForm() {
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
    validators: { onChange: formSchema },
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
        loading: "Saving set...",
        success: isRecord
          ? {
              title: "New record",
              description: `${name ?? value.exerciseId} — ${formatSet(set)}`,
              type: "success",
            }
          : {
              title: `Logged ${formatSet(set)}`,
              description: name,
              type: "success",
            },
        error: { title: "Couldn't save that set", type: "error" },
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
            <FieldLabel htmlFor="backfill-exercise">Exercise</FieldLabel>
            <Combobox
              items={options}
              itemToStringLabel={(item: ExerciseOption) => item.name}
              filter={filterOption}
              value={options.find((o) => o.id === field.state.value) ?? null}
              onValueChange={(item: ExerciseOption | null) =>
                field.handleChange(item?.id ?? "")
              }
            >
              <ComboboxInput
                id="backfill-exercise"
                placeholder="Search exercises..."
              />
              <ComboboxContent>
                <ComboboxEmpty>No exercise found.</ComboboxEmpty>
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
            <FieldLabel htmlFor="backfill-date">Date</FieldLabel>
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
              <FieldLabel htmlFor="backfill-weight">Weight</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="backfill-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  placeholder="Optional"
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
                        aria-label="Weight unit"
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
              <FieldLabel htmlFor="backfill-reps">Reps</FieldLabel>
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
              Log set
            </Button>
            {justLogged ? (
              <span className="text-sm text-muted-foreground">
                Logged {justLogged}.
              </span>
            ) : null}
          </div>
        )}
      </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
