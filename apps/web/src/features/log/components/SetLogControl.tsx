import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CheckIcon, PencilLineIcon } from "lucide-react";
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
  PopoverDescription,
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
import { logSet, type StepRef } from "../collection";
import { formatSet, prForRepRange } from "../pr";
import { useT, type Translate } from "@/i18n/use-t";
import { UNITS, weightUnitSchema, type WeightUnit } from "@/lib/units";
import type { LoggedSet } from "../schema";

/**
 * Strings in, numbers out — same shape as the backfill form on /progress.
 *
 * Built per locale rather than at module scope: a validation message is a
 * string like any other, and Zod bakes it into the schema.
 */
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
 * The logging control on an active set: a one-line readout of what you've done
 * before, and a popover holding the form.
 *
 * The inputs sit behind a trigger rather than inline so the player card stays
 * short — mid-set the numbers worth a glance are the PR and your last set, not
 * two input boxes.
 *
 * Logging is **explicit**: it happens when you submit this form, never as a
 * side effect of advancing. An earlier version prefilled both fields from your
 * last set and logged on "Done", which meant simply moving through a workout
 * recorded sets you never entered.
 */
export function SetLogControl({
  frontier,
  last,
  targetReps,
  stepRef,
  exerciseName,
  loggedHere,
}: {
  frontier: LoggedSet[];
  last: LoggedSet | undefined;
  /** The set's prescribed reps, which decides *which* record is worth showing. */
  targetReps: number | [number, number] | undefined;
  stepRef: StepRef;
  exerciseName: string;
  /** Sets already recorded against this step — usually none or one. */
  loggedHere: LoggedSet[];
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const pr = prForRepRange(frontier, targetReps);
  const triggerLabel =
    loggedHere.length === 0
      ? t("log.action")
      : loggedHere.length === 1
        ? formatSet(loggedHere[0])
        : t("log.countLogged", { count: loggedHere.length });

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {pr ? (
          <span>
            <span className="text-muted-foreground">{t("log.pr")} </span>
            <span className="font-medium tabular-nums">{formatSet(pr)}</span>
          </span>
        ) : null}
        {pr && last ? (
          <span aria-hidden className="text-muted-foreground">
            ·
          </span>
        ) : null}
        {last ? (
          <span>
            <span className="text-muted-foreground">{t("log.last")} </span>
            <span className="font-medium tabular-nums">{formatSet(last)}</span>
          </span>
        ) : null}
        {!pr && !last ? (
          <span className="text-muted-foreground">{t("log.firstTime")}</span>
        ) : null}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant={loggedHere.length > 0 ? "secondary" : "outline"}
              size="sm"
            >
              {loggedHere.length > 0 ? <CheckIcon /> : <PencilLineIcon />}
              <span className="tabular-nums">{triggerLabel}</span>
            </Button>
          }
        />
        <PopoverContent className="w-72">
          {/* Remounted whenever the log changes so the prefill reflects the
              most recent set rather than the values captured on first open. */}
          <SetLogForm
            key={last?.id ?? "none"}
            last={last}
            loggedHere={loggedHere}
            stepRef={stepRef}
            exerciseName={exerciseName}
            onLogged={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Split out so `defaultValues` can be seeded from the last set: TanStack Form
 * captures them on mount, and the parent only renders this once the log has
 * loaded, so there is no window where the defaults are stale.
 */
function SetLogForm({
  last,
  loggedHere,
  stepRef,
  exerciseName,
  onLogged,
}: {
  last: LoggedSet | undefined;
  loggedHere: LoggedSet[];
  stepRef: StepRef;
  exerciseName: string;
  onLogged: () => void;
}) {
  const t = useT();
  const form = useForm({
    defaultValues: {
      // Prefilled from your last set on this exercise, since the weight
      // usually carries over. Nothing is recorded until you submit.
      unit: (last?.unit ?? "kg") as WeightUnit,
      weight: last?.weight !== undefined ? String(last.weight) : "",
      reps: last ? String(last.reps) : "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const { set, transaction, isRecord } = logSet({
        performedAt: Date.now(),
        weight: value.weight.trim() === "" ? undefined : Number(value.weight),
        unit: value.unit,
        reps: Number(value.reps),
        ...stepRef,
      });
      // A record announces itself instead of the plain confirmation -- two
      // toasts for one action would just be noise.
      void toast.promise(transaction.isPersisted.promise, {
        loading: t("log.saving"),
        success: isRecord
          ? {
              title: t("log.newRecord"),
              description: `${exerciseName} — ${formatSet(set)}`,
              type: "success",
            }
          : { title: t("log.saved", { set: formatSet(set) }), type: "success" },
        error: { title: t("log.saveError"), type: "error" },
      });
      onLogged();
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
      <PopoverTitle>
        {loggedHere.length > 0 ? t("log.another") : t("log.thisSet")}
      </PopoverTitle>
      <PopoverDescription>
        {loggedHere.length > 0
          ? t("log.alreadyHere", {
              sets: loggedHere.map(formatSet).join(", "),
            })
          : t("log.nothingUntilLogged")}
      </PopoverDescription>

      <FieldGroup className="mt-3">
        <form.Field name="weight">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="log-weight">{t("common.weight")}</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="log-weight"
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
                {/* Machines aren't all marked in the same unit -- a pec deck
                    in pounds next to a barbell in kilos is normal. */}
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
              <FieldLabel htmlFor="log-reps">{t("common.reps")}</FieldLabel>
              <Input
                id="log-reps"
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                placeholder="—"
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
              <CheckIcon data-icon="inline-start" /> {t("log.action")}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
