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
import { movementPatternSchema, muscleSchema } from "@/data/exercises";
import { useT, type Translate } from "@/i18n/use-t";
import { createUserExercise, updateUserExercise } from "../collection";
import type { UserExercise } from "../schema";
import { MuscleChecklist } from "./MuscleChecklist";

/**
 * Built per locale, like every other form in the app — Zod bakes its messages
 * into the schema, so a module-scope one would be stuck in whatever language
 * happened to be active at import.
 */
const buildSchema = (t: Translate) =>
  z.object({
    name: z.string().trim().min(1, t("library.nameRequired")),
    // Comma-separated in the field, split on submit. A repeater for what is
    // usually zero or one alternate spelling would be more UI than the job.
    aliases: z.string(),
    pattern: movementPatternSchema,
    primaryMuscles: z.array(muscleSchema).min(1, t("library.primaryRequired")),
    secondaryMuscles: z.array(muscleSchema),
    notes: z.string(),
  });

export function UserExerciseForm({
  existing,
  onDone,
}: {
  existing?: UserExercise;
  onDone: () => void;
}) {
  const t = useT();

  const form = useForm({
    defaultValues: {
      name: existing?.name ?? "",
      aliases: existing?.aliases.join(", ") ?? "",
      pattern: existing?.pattern ?? ("horizontal-press" as const),
      primaryMuscles: existing?.primaryMuscles ?? [],
      secondaryMuscles: existing?.secondaryMuscles ?? [],
      notes: existing?.notes ?? "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const input = {
        name: value.name.trim(),
        aliases: value.aliases
          .split(",")
          .map((alias) => alias.trim())
          .filter(Boolean),
        pattern: value.pattern,
        primaryMuscles: value.primaryMuscles,
        // A muscle listed both ways is a contradiction, and `volume.ts` already
        // resolves it as direct — so drop it here rather than store it twice.
        secondaryMuscles: value.secondaryMuscles.filter(
          (muscle) => !value.primaryMuscles.includes(muscle),
        ),
        notes: value.notes.trim() === "" ? undefined : value.notes.trim(),
      };

      const transaction = existing
        ? updateUserExercise(existing.id, input)
        : createUserExercise(input).transaction;

      void toast.promise(transaction.isPersisted.promise, {
        loading: t("library.saving"),
        success: { title: t("library.saved", { name: input.name }), type: "success" },
        error: { title: t("library.saveError"), type: "error" },
      });
      onDone();
    },
  });

  const patterns = movementPatternSchema.options.map((value) => ({
    value,
    label: t(`pattern.${value}` as never),
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
              <FieldLabel htmlFor="ux-name">{t("library.name")}</FieldLabel>
              <Input
                id="ux-name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="aliases">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="ux-aliases">{t("library.aliases")}</FieldLabel>
              <Input
                id="ux-aliases"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>{t("library.aliasesHint")}</FieldDescription>
            </Field>
          )}
        </form.Field>

        <form.Field name="pattern">
          {(field) => (
            <Field>
              <FieldLabel>{t("library.pattern")}</FieldLabel>
              {/* `items` carries the translated label too, not just the open
                  list — `SelectValue` renders the *item's* label for the current
                  value, so translating only the children leaves the closed
                  trigger in English. */}
              <Select
                items={patterns}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {patterns.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>{t("library.patternHint")}</FieldDescription>
            </Field>
          )}
        </form.Field>

        <form.Field name="primaryMuscles">
          {(field) => (
            <Field>
              <FieldLabel>{t("library.primaryMuscles")}</FieldLabel>
              <MuscleChecklist
                value={field.state.value}
                onChange={field.handleChange}
              />
              <FieldDescription>{t("library.primaryHint")}</FieldDescription>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="secondaryMuscles">
          {(field) => (
            <Field>
              <FieldLabel>{t("library.secondaryMuscles")}</FieldLabel>
              <MuscleChecklist
                value={field.state.value}
                onChange={field.handleChange}
              />
              <FieldDescription>{t("library.secondaryHint")}</FieldDescription>
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              <CheckIcon data-icon="inline-start" />
              {existing ? t("library.save") : t("library.create")}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
