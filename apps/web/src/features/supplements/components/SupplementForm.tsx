import { useForm } from "@tanstack/react-form";
import { CheckIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useT, type MessageKey, type Translate } from "@/i18n/use-t";
import { createSupplement, updateSupplement } from "../collection";
import { supplementUnitSchema, type Supplement } from "../schema";

/** Built per locale, like every form here — Zod bakes its messages in. */
const buildSchema = (t: Translate) =>
  z.object({
    name: z.string().trim().min(1, t("supplements.nameRequired")),
    // A string in the field and coerced on submit, the house rule for number
    // inputs: coercing mid-edit turns a half-typed "1" into 1 and fights you.
    amount: z.string().refine((value) => Number(value) > 0, {
      message: t("supplements.amountRequired"),
    }),
    unit: supplementUnitSchema,
    servingsPerDay: z.string().refine((value) => Number.isInteger(Number(value)) && Number(value) >= 1, {
      message: t("supplements.servingsRequired"),
    }),
    timing: z.string(),
  });

export function SupplementForm({
  existing,
  onDone,
}: {
  existing?: Supplement;
  onDone: () => void;
}) {
  const t = useT();

  // The `.other` plural form, always — this is the Select's generic label for
  // the unit ("Pills"), not a count-specific one, so it doesn't need to shift
  // as the amount field changes. The bug this replaces cast a bare
  // `supplements.unit.pill` — a key that doesn't exist, only `.one`/`.other`
  // do — through `as never`, which suppressed the type error and made `t()`
  // return `undefined` for every unit: the Select rendered no label at all,
  // trigger and open list alike.
  const units = supplementUnitSchema.options.map((value) => ({
    value,
    label: t(`supplements.unit.${value}.other` as MessageKey),
  }));

  const form = useForm({
    defaultValues: {
      name: existing?.name ?? "",
      amount: existing !== undefined ? String(existing.amount) : "1",
      unit: existing?.unit ?? ("pill" as const),
      servingsPerDay:
        existing !== undefined ? String(existing.servingsPerDay) : "1",
      timing: existing?.timing ?? "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const input = {
        name: value.name.trim(),
        amount: Number(value.amount),
        unit: value.unit,
        servingsPerDay: Number(value.servingsPerDay),
        timing: value.timing.trim() === "" ? undefined : value.timing.trim(),
      };

      const transaction = existing
        ? updateSupplement(existing.id, input)
        : createSupplement(input).transaction;

      void toast.promise(transaction.isPersisted.promise, {
        loading: t("supplements.saving"),
        success: {
          title: t("supplements.saved", { name: input.name }),
          type: "success",
        },
        error: { title: t("supplements.saveError"), type: "error" },
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
      <FieldGroup>
        <form.Field name="name">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="supp-name">
                {t("supplements.name")}
              </FieldLabel>
              <Input
                id="supp-name"
                placeholder={t("supplements.namePlaceholder")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        {/* Amount and unit side by side from `sm` up: they are one answer
            ("three pills"), and a fixed label column below that width would be
            sized to whichever language got there first. */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <form.Field name="amount">
            {(field) => (
              <Field className="sm:w-28">
                <FieldLabel htmlFor="supp-amount">
                  {t("supplements.amount")}
                </FieldLabel>
                <Input
                  id="supp-amount"
                  type="number"
                  min="0"
                  step="any"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <form.Field name="unit">
            {(field) => (
              <Field className="sm:flex-1">
                <FieldLabel>{t("supplements.unit")}</FieldLabel>
                {/* `items` carries the translated label, or the closed trigger
                    renders the English one — `SelectValue` reads the item. */}
                <Select
                  items={units}
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as typeof field.state.value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="servingsPerDay">
          {(field) => (
            <Field className="sm:w-40">
              <FieldLabel htmlFor="supp-servings">
                {t("supplements.servingsPerDay")}
              </FieldLabel>
              <Input
                id="supp-servings"
                type="number"
                min="1"
                step="1"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>
                {t("supplements.servingsHint")}
              </FieldDescription>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="timing">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="supp-timing">
                {t("supplements.timing")}
              </FieldLabel>
              <Input
                id="supp-timing"
                placeholder={t("supplements.timingPlaceholder")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>{t("supplements.timingHint")}</FieldDescription>
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              <CheckIcon data-icon="inline-start" />
              {existing ? t("supplements.save") : t("supplements.create")}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
