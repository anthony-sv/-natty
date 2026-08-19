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
import { logCardio, type CardioStepRef } from "../cardio-collection";
import { formatCardio } from "../cardio";
import { useT, type Translate } from "@/i18n/use-t";
import { DISTANCE_UNITS, distanceUnitSchema, type DistanceUnit } from "@/lib/units";
import type { CardioEntry } from "../cardio-schema";

/**
 * The cardio equivalent of `SetLogControl` — same shape, same "logging is
 * explicit" rule, distance and an optional actual duration instead of
 * weight and reps.
 */
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

export function CardioLogControl({
  last,
  stepRef,
  loggedHere,
}: {
  last: CardioEntry | undefined;
  stepRef: CardioStepRef;
  /** Entries already recorded against this step — usually none or one. */
  loggedHere: CardioEntry[];
}) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const triggerLabel =
    loggedHere.length === 0
      ? t("cardio.log.action")
      : loggedHere.length === 1
        ? formatCardio(loggedHere[0])
        : t("log.countLogged", { count: loggedHere.length });

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {last ? (
          <span>
            <span className="text-muted-foreground">{t("log.last")} </span>
            <span className="font-medium tabular-nums">{formatCardio(last)}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{t("log.firstTime")}</span>
        )}
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
          <CardioLogForm
            key={last?.id ?? "none"}
            last={last}
            loggedHere={loggedHere}
            stepRef={stepRef}
            onLogged={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CardioLogForm({
  last,
  loggedHere,
  stepRef,
  onLogged,
}: {
  last: CardioEntry | undefined;
  loggedHere: CardioEntry[];
  stepRef: CardioStepRef;
  onLogged: () => void;
}) {
  const t = useT();
  const form = useForm({
    defaultValues: {
      unit: (last?.unit ?? "km") as DistanceUnit,
      distance: last ? String(last.distance) : "",
      durationMinutes:
        last?.durationSeconds !== undefined
          ? String(Math.round(last.durationSeconds / 60))
          : "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const { entry, transaction } = logCardio({
        performedAt: Date.now(),
        distance: Number(value.distance),
        unit: value.unit,
        durationSeconds:
          value.durationMinutes.trim() === ""
            ? undefined
            : Math.round(Number(value.durationMinutes) * 60),
        ...stepRef,
      });
      void toast.promise(transaction.isPersisted.promise, {
        loading: t("cardio.log.saving"),
        success: { title: t("cardio.log.saved", { entry: formatCardio(entry) }), type: "success" },
        error: { title: t("cardio.log.saveError"), type: "error" },
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
        {loggedHere.length > 0 ? t("log.another") : t("cardio.log.thisSession")}
      </PopoverTitle>
      <PopoverDescription>
        {loggedHere.length > 0
          ? t("log.alreadyHere", {
              sets: loggedHere.map(formatCardio).join(", "),
            })
          : t("log.nothingUntilLogged")}
      </PopoverDescription>

      <FieldGroup className="mt-3">
        <form.Field name="distance">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="log-distance">{t("common.distance")}</FieldLabel>
              <div className="flex items-center gap-2">
                {/* `step="any"` — a stepped input rejects a value that isn't a
                    multiple of the step with no error, just a submit that
                    silently does nothing. See `SetLogControl`'s weight input
                    for the same fix. */}
                <Input
                  id="log-distance"
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
              <FieldLabel htmlFor="log-duration">
                {t("cardio.log.durationMinutes")}
              </FieldLabel>
              <Input
                id="log-duration"
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
              <CheckIcon data-icon="inline-start" /> {t("cardio.log.action")}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
