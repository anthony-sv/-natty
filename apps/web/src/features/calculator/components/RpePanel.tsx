import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { UNITS, type WeightUnit } from "@/lib/units";
import { useT, type Translate } from "@/i18n/use-t";
import {
  CHART_REPS,
  RPE_VALUES,
  loadFor,
  oneRepMaxFrom,
  percentOfMax,
  rirForRpe,
} from "../rpe";
import { parseMeasurement } from "../parse";

/**
 * Built per locale rather than at module scope: `SelectValue` renders the
 * *item's* label for the current value, so a translated `SelectItem` child
 * isn't enough on its own.
 */
const rpeOptions = (t: Translate) =>
  RPE_VALUES.map((rpe) => ({
    value: String(rpe),
    label: `${rpe} — ${t("calc.rpe.inReserve", { count: rirForRpe(rpe) })}`,
  }));

/**
 * The RPE chart, and a one-rep max read off it.
 *
 * Unlike the formula tab this needs no curve fitting: the chart is a lookup,
 * and RPE carries the information the formulas have to guess at — how much was
 * left. A set of 5 at RPE 8 says more about your max than a set of 5 alone.
 */
export function RpePanel() {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("5");
  const [rpe, setRpe] = useState("8");
  const [unit, setUnit] = useState<WeightUnit>("kg");

  const repsValue = parseMeasurement(reps);
  const rpeValue = Number(rpe);
  const percent =
    repsValue === undefined ? undefined : percentOfMax(repsValue, rpeValue);
  const max = oneRepMaxFrom(
    parseMeasurement(weight) ?? 0,
    repsValue ?? 0,
    rpeValue,
  );

  const t = useT();
  const options = useMemo(() => rpeOptions(t), [t]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("calc.setYouDid")}</CardTitle>
          <CardDescription>{t("calc.rpe.setBody")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-4">
          <Field className="w-48">
            <FieldLabel htmlFor="rpe-weight">{t("common.weight")}</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="rpe-weight"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                placeholder={t("calc.example100")}
                className="min-w-0 flex-1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <Select
                items={UNITS}
                value={unit}
                onValueChange={(value) => setUnit(value as WeightUnit)}
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
            </div>
          </Field>

          <Field className="w-32">
            <FieldLabel htmlFor="rpe-reps">{t("common.reps")}</FieldLabel>
            <Input
              id="rpe-reps"
              type="number"
              inputMode="numeric"
              min="1"
              max="12"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
          </Field>

          <Field className="w-56">
            <FieldLabel htmlFor="rpe-rpe">RPE</FieldLabel>
            <Select
              items={options}
              value={rpe}
              onValueChange={(value) => setRpe(value ?? "8")}
            >
              <SelectTrigger id="rpe-rpe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>10 is a set you couldn't extend.</FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("calc.rpe.implies")}</CardTitle>
          <CardDescription>
            {percent === undefined
              ? t("calc.rpe.offChart")
              : t("calc.rpe.impliesBody", { reps, rpe, percent })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {t("calc.rpe.shareOfMax")}
            </span>
            <span className="text-3xl font-semibold tabular-nums">
              {percent === undefined ? t("common.none") : `${percent}%`}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {t("calc.orm.title")}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-3xl font-semibold tabular-nums">
                {max === undefined
                  ? t("common.none")
                  : `${max.toFixed(1)} ${unit}`}
              </span>
              {repsValue !== undefined && percent !== undefined ? (
                <Badge variant="secondary">
                  {t("calc.rpe.inReserve", { count: rirForRpe(rpeValue) })}
                </Badge>
              ) : null}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("calc.rpe.chart")}</CardTitle>
          <CardDescription>
            {max === undefined
              ? t("calc.rpe.percentNote")
              : t("calc.rpe.chartBody", { max: max.toFixed(1), unit })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.reps")}</TableHead>
                {RPE_VALUES.map((value) => (
                  <TableHead key={value} className="text-right">
                    @{value}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CHART_REPS.map((row) => (
                <TableRow key={row}>
                  <TableCell className="font-medium tabular-nums">
                    {row}
                  </TableCell>
                  {RPE_VALUES.map((value) => {
                    const cellPercent = percentOfMax(row, value);
                    const load =
                      max === undefined ? undefined : loadFor(max, row, value);
                    const isCurrent = row === repsValue && value === rpeValue;
                    return (
                      <TableCell
                        key={value}
                        className={cn(
                          "text-right tabular-nums",
                          isCurrent && "bg-muted font-semibold text-foreground",
                          !isCurrent && "text-muted-foreground",
                        )}
                      >
                        {cellPercent === undefined
                          ? "—"
                          : load === undefined
                            ? `${cellPercent}%`
                            : load.toFixed(1)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
