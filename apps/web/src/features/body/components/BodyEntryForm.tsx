import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CalendarIcon, CheckIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { UNITS, weightUnitSchema, type WeightUnit, formatWeightValue } from "@/lib/units";
import { useDateFormat, useT, type Translate } from "@/i18n/use-t";
import { logBodyEntry } from "../collection";
import type { BodyEntry } from "../schema";

/**
 * Strings in, numbers out — same convention as the set-logging forms, and built
 * per locale for the same reason: Zod bakes the messages into the schema.
 */
const buildSchema = (t: Translate) =>
  z.object({
    measuredAt: z.number().int().positive(),
    unit: weightUnitSchema,
    weight: z
      .string()
      .refine(
        (v) => Number.isFinite(Number(v)) && Number(v) > 0,
        t("body.logEntry.weightError"),
      ),
    bodyFatPercent: z
      .string()
      .refine(
        (v) =>
          v.trim() === "" ||
          (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
        t("body.logEntry.bodyFatError"),
      ),
  });

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

export function BodyEntryForm({ latest }: { latest: BodyEntry | undefined }) {
  const t = useT();
  const dateFormat = useDateFormat(DATE_OPTIONS);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  // Lazily, not during render -- the purity lint rule rejects Date.now() there.
  const [defaultDate] = useState(() => Date.now());

  const form = useForm({
    defaultValues: {
      measuredAt: defaultDate,
      // Carried from your last weigh-in: the unit never changes, and body fat
      // moves slowly enough that the previous figure is a sane starting point.
      unit: (latest?.unit ?? "kg") as WeightUnit,
      weight: latest ? String(latest.weight) : "",
      bodyFatPercent:
        latest?.bodyFatPercent !== undefined ? String(latest.bodyFatPercent) : "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const { entry, transaction } = logBodyEntry({
        measuredAt: value.measuredAt,
        weight: Number(value.weight),
        unit: value.unit,
        bodyFatPercent:
          value.bodyFatPercent.trim() === ""
            ? undefined
            : Number(value.bodyFatPercent),
      });
      void toast.promise(transaction.isPersisted.promise, {
        loading: t("body.logEntry.saving"),
        success: {
          title: t("body.logEntry.saved", {
            weight: `${formatWeightValue(entry.weight)}${entry.unit}`,
          }),
          description:
            entry.bodyFatPercent === undefined
              ? undefined
              : t("body.logEntry.savedBodyFat", {
                  percent: entry.bodyFatPercent,
                }),
          type: "success",
        },
        error: { title: t("body.logEntry.saveError"), type: "error" },
      });
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
      <form.Field name="measuredAt">
        {(field) => (
          <Field>
            <FieldLabel htmlFor="body-date">{t("common.date")}</FieldLabel>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger
                render={
                  <Button
                    id="body-date"
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
              <FieldLabel htmlFor="body-weight">
                {t("common.weight")}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="body-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
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

        <form.Field name="bodyFatPercent">
          {(field) => (
            <Field className="flex-1">
              <FieldLabel htmlFor="body-fat">
                {t("common.bodyFatPercent")}
              </FieldLabel>
              <Input
                id="body-fat"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="100"
                placeholder={t("common.optional")}
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
          <div>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              <CheckIcon data-icon="inline-start" />{" "}
              {t("body.logEntry.action")}
            </Button>
          </div>
        )}
      </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
