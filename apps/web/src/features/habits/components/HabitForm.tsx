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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/components/ui/toast";
import { useWeekdayLabels } from "@/i18n/use-weekdays";
import { useT, type Translate } from "@/i18n/use-t";
import { createHabit, updateHabit } from "../collection";
import { toHabitInput } from "../input";
import type { Habit } from "../schema";

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type Kind = "count" | "minutes";
type ScheduleKind = "daily" | "weekdays" | "weekly";

const positiveInt = (max: number, message: string) =>
  z.string().refine((value) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= max;
  }, message);

/** Built per locale, like every form here — Zod bakes its messages in. */
const buildSchema = (t: Translate) =>
  z
    .object({
      name: z.string().trim().min(1, t("habits.nameRequired")),
      kind: z.enum(["count", "minutes"]),
      // Strings in the fields and coerced on submit, the house rule for
      // number inputs: coercing mid-edit fights a half-typed value.
      perDay: z.string(),
      scheduleKind: z.enum(["daily", "weekdays", "weekly"]),
      days: z.array(z.string()),
      timesPerWeek: positiveInt(7, t("habits.timesRequired")),
      timing: z.string(),
    })
    .superRefine((value, ctx) => {
      const max = value.kind === "count" ? 24 : 1440;
      const n = Number(value.perDay);
      if (!Number.isInteger(n) || n < 1 || n > max) {
        ctx.addIssue({
          code: "custom",
          path: ["perDay"],
          message: t("habits.targetRequired"),
        });
      }
      if (value.scheduleKind === "weekdays" && value.days.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["days"],
          message: t("habits.daysRequired"),
        });
      }
    });

export function HabitForm({
  existing,
  onDone,
}: {
  existing?: Habit;
  onDone: () => void;
}) {
  const t = useT();
  const weekdayLabels = useWeekdayLabels();

  // `items` carries the translated labels, or the closed trigger renders the
  // English one — `SelectValue` reads the item, not the open list.
  const kinds = [
    { value: "count", label: t("habits.kind.count") },
    { value: "minutes", label: t("habits.kind.minutes") },
  ];
  const schedules = [
    { value: "daily", label: t("habits.schedule.daily") },
    { value: "weekdays", label: t("habits.schedule.weekdays") },
    { value: "weekly", label: t("habits.schedule.weekly") },
  ];

  const schedule = existing?.schedule;
  const form = useForm({
    defaultValues: {
      name: existing?.name ?? "",
      kind: (existing?.target.kind ?? "count") as Kind,
      perDay: String(existing?.target.perDay ?? 1),
      scheduleKind: (schedule?.kind ?? "daily") as ScheduleKind,
      days:
        schedule?.kind === "weekdays"
          ? schedule.days.map(String)
          : ["0", "1", "2", "3", "4"],
      timesPerWeek: String(
        schedule?.kind === "weekly" ? schedule.timesPerWeek : 3,
      ),
      timing: existing?.timing ?? "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const input = toHabitInput({
        ...value,
        perDay: Number(value.perDay),
        days: value.days.map(Number),
        timesPerWeek: Number(value.timesPerWeek),
      });
      const transaction = existing
        ? updateHabit(existing.id, input)
        : createHabit(input).transaction;
      void toast.promise(transaction.isPersisted.promise, {
        loading: t("habits.saving"),
        success: { title: t("habits.saved", { name: input.name }), type: "success" },
        error: { title: t("habits.saveError"), type: "error" },
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
              <FieldLabel htmlFor="habit-name">{t("habits.name")}</FieldLabel>
              <Input
                id="habit-name"
                placeholder={t("habits.namePlaceholder")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        {/* Kind and amount side by side from `sm` up: they're one answer
            ("15 minutes", "3 times"). */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <form.Field name="kind">
            {(field) => (
              <Field className="sm:flex-1">
                <FieldLabel>{t("habits.kind")}</FieldLabel>
                <Select
                  items={kinds}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as Kind)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kinds.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => s.values.kind}>
            {(kind) => (
              <form.Field name="perDay">
                {(field) => (
                  <Field className="sm:w-36">
                    <FieldLabel htmlFor="habit-target">
                      {kind === "count"
                        ? t("habits.timesPerDay")
                        : t("habits.minutesPerDay")}
                    </FieldLabel>
                    <Input
                      id="habit-target"
                      type="number"
                      min="1"
                      step="1"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            )}
          </form.Subscribe>
        </div>

        <form.Field name="scheduleKind">
          {(field) => (
            <Field>
              <FieldLabel>{t("habits.schedule")}</FieldLabel>
              <Select
                items={schedules}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as ScheduleKind)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.values.scheduleKind}>
          {(scheduleKind) =>
            scheduleKind === "weekdays" ? (
              <form.Field name="days">
                {(field) => (
                  <Field>
                    <FieldLabel>{t("habits.days")}</FieldLabel>
                    <ToggleGroup
                      multiple
                      variant="outline"
                      size="sm"
                      spacing={1}
                      className="flex-wrap"
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as string[])}
                    >
                      {WEEKDAYS.map((day, index) => (
                        <ToggleGroupItem key={day} value={String(index)}>
                          {weekdayLabels[day]}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            ) : scheduleKind === "weekly" ? (
              <form.Field name="timesPerWeek">
                {(field) => (
                  <Field className="sm:w-40">
                    <FieldLabel htmlFor="habit-weekly">
                      {t("habits.timesPerWeek")}
                    </FieldLabel>
                    <Input
                      id="habit-weekly"
                      type="number"
                      min="1"
                      max="7"
                      step="1"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldDescription>{t("habits.weeklyHint")}</FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            ) : null
          }
        </form.Subscribe>

        <form.Field name="timing">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="habit-timing">{t("habits.timing")}</FieldLabel>
              <Input
                id="habit-timing"
                placeholder={t("habits.timingPlaceholder")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>{t("habits.timingHint")}</FieldDescription>
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              <CheckIcon data-icon="inline-start" />
              {existing ? t("habits.save") : t("habits.create")}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
