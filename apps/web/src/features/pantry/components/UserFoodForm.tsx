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
import { foodCategorySchema } from "@/data/diets";
import { kcalOf } from "@/features/nutrition/macros";
import { useT, type Translate } from "@/i18n/use-t";
import { createUserFood, updateUserFood } from "../collection";
import type { UserFood } from "../schema";

const UNITS = ["g", "ml", "unit"] as const;
const STATES = ["none", "raw", "cooked"] as const;
/**
 * "none" is a real answer, not an empty one: leaving it blank groups the food
 * by whichever macro dominates it, which is usually the heading you'd have
 * picked anyway. A Select has no null, so the choice is spelled out.
 */
const CATEGORIES = ["none", ...foodCategorySchema.options] as const;

/** Built per locale, like every other form here — Zod bakes its messages in. */
const buildSchema = (t: Translate) => {
  const macro = z
    .string()
    .refine(
      (v) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0,
      t("log.weightError"),
    );
  return z.object({
    name: z.string().trim().min(1, t("pantry.nameRequired")),
    unit: z.enum(UNITS),
    state: z.enum(STATES),
    category: z.enum(CATEGORIES),
    unitNote: z.string(),
    protein: macro,
    carbs: macro,
    fat: macro,
  });
};

export function UserFoodForm({
  existing,
  onDone,
}: {
  existing?: UserFood;
  onDone: () => void;
}) {
  const t = useT();

  const form = useForm({
    defaultValues: {
      name: existing?.name ?? "",
      unit: existing?.unit ?? ("g" as const),
      state: existing?.state ?? ("none" as const),
      category: existing?.category ?? ("none" as const),
      unitNote: existing?.unitNote ?? "",
      protein: String(existing?.macros.protein ?? ""),
      carbs: String(existing?.macros.carbs ?? ""),
      fat: String(existing?.macros.fat ?? ""),
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const input = {
        name: value.name.trim(),
        unit: value.unit,
        macros: {
          protein: Number(value.protein),
          carbs: Number(value.carbs),
          fat: Number(value.fat),
        },
        state: value.state === "none" ? undefined : value.state,
        category: value.category === "none" ? undefined : value.category,
        unitNote: value.unitNote.trim() === "" ? undefined : value.unitNote.trim(),
      };

      const transaction = existing
        ? updateUserFood(existing.id, input)
        : createUserFood(input).transaction;

      void toast.promise(transaction.isPersisted.promise, {
        loading: t("pantry.saving"),
        success: { title: t("pantry.saved", { name: input.name }), type: "success" },
        error: { title: t("pantry.saveError"), type: "error" },
      });
      onDone();
    },
  });

  const units = UNITS.map((value) => ({
    value,
    label: t(`pantry.unit.${value}` as never),
  }));
  const states = STATES.map((value) => ({
    value,
    label: t(`pantry.state.${value}` as never),
  }));
  // Built per locale, and the labels have to be here rather than only on the
  // SelectItems: SelectValue renders the *item's* label for the current value,
  // so translating only the open list leaves the closed trigger in English.
  const categories = CATEGORIES.map((value) => ({
    value,
    label:
      value === "none"
        ? t("pantry.category.none")
        : t(`foodGroup.${value}` as never),
  }));

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
              <FieldLabel htmlFor="food-name">{t("pantry.name")}</FieldLabel>
              <Input
                id="food-name"
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
            <Field>
              <FieldLabel>{t("pantry.unit")}</FieldLabel>
              <Select
                items={units}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as (typeof UNITS)[number])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        {/* Live, because the three numbers you're typing are only meaningful
            once you see what they come to — and a label's kcal is the number
            people sanity-check against. */}
        <form.Subscribe
          selector={(s) => [s.values.unit, s.values.protein, s.values.carbs, s.values.fat]}
        >
          {([unit, protein, carbs, fat]) => (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">
                {unit === "unit" ? t("pantry.perUnit") : t("pantry.per100")}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["protein", t("pantry.protein")],
                    ["carbs", t("pantry.carbs")],
                    ["fat", t("pantry.fat")],
                  ] as const
                ).map(([name, label]) => (
                  <form.Field key={name} name={name}>
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={`food-${name}`} className="text-xs">
                          {label}
                        </FieldLabel>
                        <Input
                          id={`food-${name}`}
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>
                ))}
              </div>
              <span className="text-sm tabular-nums text-muted-foreground">
                {t("pantry.kcal", {
                  kcal: Math.round(
                    kcalOf({
                      protein: Number(protein) || 0,
                      carbs: Number(carbs) || 0,
                      fat: Number(fat) || 0,
                    }),
                  ).toLocaleString(),
                })}
              </span>
            </div>
          )}
        </form.Subscribe>

        <form.Field name="state">
          {(field) => (
            <Field>
              <FieldLabel>{t("pantry.state")}</FieldLabel>
              <Select
                items={states}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as (typeof STATES)[number])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{t("pantry.stateHint")}</FieldDescription>
            </Field>
          )}
        </form.Field>

        <form.Field name="category">
          {(field) => (
            <Field>
              <FieldLabel>{t("pantry.category")}</FieldLabel>
              <Select
                items={categories}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as (typeof CATEGORIES)[number])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{t("pantry.categoryHint")}</FieldDescription>
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.values.unit}>
          {(unit) =>
            unit === "unit" ? (
              <form.Field name="unitNote">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="food-unit-note">
                      {t("pantry.unitNote")}
                    </FieldLabel>
                    <Input
                      id="food-unit-note"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldDescription>{t("pantry.unitNoteHint")}</FieldDescription>
                  </Field>
                )}
              </form.Field>
            ) : null
          }
        </form.Subscribe>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              <CheckIcon data-icon="inline-start" />
              {t("pantry.save")}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}

