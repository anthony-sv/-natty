import { formatWeightValue } from "@/lib/units";
import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CalendarIcon, CheckIcon, PencilLineIcon, Trash2Icon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DataTable } from "@/components/data-table";
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
import { createAppColumnHelper } from "@/lib/table";
import { UNITS, weightUnitSchema, type WeightUnit } from "@/lib/units";
import { useDateFormat, useT, type Translate } from "@/i18n/use-t";
import { deleteBodyEntry, restoreBodyEntry, updateBodyEntry } from "../collection";
import { ffmi, formatIndex, normalizedFfmi } from "../ffmi";
import type { BodyEntry } from "../schema";

/**
 * The weekday, not just the date — a plain "Aug 4" reads as whatever day of
 * the week the reader happens to guess, and the weekly average groups Monday
 * to Sunday, so a row that doesn't say which one invites exactly the
 * off-by-one mismatch a glance at the calendar would have caught.
 */
const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
};

/**
 * Height comes from the profile, not the row, so the columns are built inside
 * a memo rather than at module scope — changing your height reworks every
 * row's FFMI, which is the point of storing it once.
 */
function buildColumns(
  heightCm: number | undefined,
  t: Translate,
  dateFormat: Intl.DateTimeFormat,
) {
  const column = createAppColumnHelper<BodyEntry>();
  return column.columns([
    column.accessor("measuredAt", {
      header: t("common.date"),
      sortFn: "datetime",
      cell: (info) => (
        <span className="text-muted-foreground">
          {dateFormat.format(new Date(info.getValue()))}
        </span>
      ),
    }),
    column.accessor("weight", {
      header: t("common.weight"),
      sortFn: "basic",
      cell: (info) => (
        <span className="font-medium tabular-nums">
          {formatWeightValue(info.getValue())} {info.row.original.unit}
        </span>
      ),
    }),
    column.accessor("bodyFatPercent", {
      header: t("body.stat.bodyFat"),
      sortFn: "basic",
      sortUndefined: "last",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className="tabular-nums">
            {value === undefined ? t("common.none") : `${value}%`}
          </span>
        );
      },
    }),
    column.accessor("visceralFat", {
      header: t("body.stat.visceralFat"),
      sortFn: "basic",
      sortUndefined: "last",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className="tabular-nums">
            {value === undefined ? t("common.none") : value}
          </span>
        );
      },
    }),
    // Display columns have no value to compare, so neither is sortable — FFMI
    // tracks weight and body fat anyway, both of which are.
    column.display({
      id: "ffmi",
      header: t("body.stat.ffmi"),
      cell: (info) => (
        <span className="tabular-nums">
          {formatIndex(ffmi(info.row.original, heightCm))}
        </span>
      ),
    }),
    column.display({
      id: "normalized",
      header: t("body.stat.normalized"),
      // Alignment on the column def rather than hand-rolled into both the
      // header and the cell, which is what `columnMeta` is for.
      meta: { align: "end" },
      cell: (info) => (
        <span className="tabular-nums">
          {formatIndex(normalizedFfmi(info.row.original, heightCm))}
        </span>
      ),
    }),
    column.display({
      id: "actions",
      header: "",
      meta: { align: "end" },
      cell: (info) => <RowActions entry={info.row.original} />,
    }),
  ]);
}

export function BodyHistoryTable({
  entries,
  heightCm,
  isLoading,
}: {
  entries: BodyEntry[];
  heightCm: number | undefined;
  /** Optional, like `DataTable`'s own — an omitted one just isn't loading. */
  isLoading?: boolean;
}) {
  const t = useT();
  const dateFormat = useDateFormat(DATE_OPTIONS);
  const columns = useMemo(
    () => buildColumns(heightCm, t, dateFormat),
    [heightCm, t, dateFormat],
  );
  return (
    <DataTable
      columns={columns}
      data={entries}
      isLoading={isLoading}
      getRowId={(entry) => entry.id}
      devtoolsKey="body-history"
      empty={t("body.history.empty")}
    />
  );
}

/**
 * Edit and delete, for a row that was never correctable.
 *
 * The rest of the page already reads every number here off the rows on each
 * render — FFMI is derived, never stored — so fixing a mistyped weight or
 * dropping today's reading needs nothing fixed up afterward. Delete is
 * immediate with an Undo on the toast, the same call every other correction
 * list in the app makes: small, frequent, fully reversible, so a confirm
 * dialog would only add friction the undo already covers.
 */
function RowActions({ entry }: { entry: BodyEntry }) {
  const t = useT();

  return (
    <div className="flex items-center justify-end gap-1">
      <EditEntryPopover entry={entry} />
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground"
        aria-label={t("body.history.deleteEntry", {
          weight: `${formatWeightValue(entry.weight)}${entry.unit}`,
        })}
        onClick={() => {
          const removed = deleteBodyEntry(entry.id);
          if (removed === undefined) return;
          toast.add({
            title: t("body.history.deleted"),
            type: "info",
            actionProps: {
              children: t("history.undo"),
              onClick: () => restoreBodyEntry(removed),
            },
          });
        }}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}

function EditEntryPopover({ entry }: { entry: BodyEntry }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={t("body.history.editEntry", {
              weight: `${formatWeightValue(entry.weight)}${entry.unit}`,
            })}
          >
            <PencilLineIcon />
          </Button>
        }
      />
      <PopoverContent className="w-72">
        {/* Remounted per open so the fields start from what's stored now, not
            from whatever they held the first time this row was opened. */}
        <EditEntryForm key={String(open)} entry={entry} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

/** Same fields and the same validation as the log form — this is that form,
 * pointed at an existing row instead of a new one. */
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
    visceralFat: z
      .string()
      .refine(
        (v) =>
          v.trim() === "" ||
          (Number.isFinite(Number(v)) && Number(v) >= 1 && Number(v) <= 59),
        t("body.logEntry.visceralFatError"),
      ),
  });

function EditEntryForm({
  entry,
  onDone,
}: {
  entry: BodyEntry;
  onDone: () => void;
}) {
  const t = useT();
  const dateFormat = useDateFormat(DATE_OPTIONS);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      measuredAt: entry.measuredAt,
      unit: entry.unit,
      weight: String(entry.weight),
      bodyFatPercent:
        entry.bodyFatPercent !== undefined ? String(entry.bodyFatPercent) : "",
      visceralFat:
        entry.visceralFat !== undefined ? String(entry.visceralFat) : "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      updateBodyEntry(entry.id, {
        measuredAt: value.measuredAt,
        weight: Number(value.weight),
        unit: value.unit,
        bodyFatPercent:
          value.bodyFatPercent.trim() === ""
            ? undefined
            : Number(value.bodyFatPercent),
        visceralFat:
          value.visceralFat.trim() === "" ? undefined : Number(value.visceralFat),
      });
      toast.add({ title: t("body.history.saved"), type: "success" });
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
      <PopoverTitle>{t("body.history.editTitle")}</PopoverTitle>

      <FieldGroup className="mt-3">
        <form.Field name="measuredAt">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`edit-body-date-${entry.id}`}>
                {t("common.date")}
              </FieldLabel>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      id={`edit-body-date-${entry.id}`}
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

        <form.Field name="weight">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`edit-body-weight-${entry.id}`}>
                {t("common.weight")}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id={`edit-body-weight-${entry.id}`}
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
            <Field>
              <FieldLabel htmlFor={`edit-body-fat-${entry.id}`}>
                {t("common.bodyFatPercent")}
              </FieldLabel>
              <Input
                id={`edit-body-fat-${entry.id}`}
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

        <form.Field name="visceralFat">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={`edit-body-visceral-fat-${entry.id}`}>
                {t("common.visceralFat")}
              </FieldLabel>
              <Input
                id={`edit-body-visceral-fat-${entry.id}`}
                type="number"
                inputMode="decimal"
                step="1"
                min="1"
                max="59"
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
