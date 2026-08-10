import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
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
import { UNITS, type WeightUnit } from "@/lib/units";
import { useT, type MessageKey } from "@/i18n/use-t";
import {
  FORMULAS,
  MAX_USEFUL_REPS,
  estimateAll,
  formulaById,
  medianEstimate,
  type FormulaId,
} from "../one-rep-max";
import { parseMeasurement } from "../parse";

const REP_ROWS = Array.from({ length: MAX_USEFUL_REPS }, (_, i) => i + 1);

/**
 * Five one-rep-max estimates, and what the chosen one prescribes.
 *
 * All five are shown rather than one: they disagree by 5kg or more once reps
 * climb, and a single number would hide that. The chosen formula only drives
 * the rep table underneath, where you do have to pick.
 */
export function OneRepMaxPanel() {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("5");
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const [formulaId, setFormulaId] = useState<FormulaId>("epley");

  const estimates = estimateAll(
    parseMeasurement(weight),
    parseMeasurement(reps),
  );
  const formula = formulaById(formulaId);
  const chosen = estimates?.find((e) => e.formula.id === formulaId);

  const t = useT();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("calc.setYouDid")}</CardTitle>
          <CardDescription>{t("calc.setYouDidBody")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-4">
          <Field className="w-48">
            <FieldLabel htmlFor="orm-weight">{t("common.weight")}</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="orm-weight"
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

          <Field className="w-40">
            <FieldLabel htmlFor="orm-reps">{t("common.reps")}</FieldLabel>
            <Input
              id="orm-reps"
              type="number"
              inputMode="numeric"
              min="2"
              max={MAX_USEFUL_REPS}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <FieldDescription>
              {t("calc.orm.repsRange", { max: MAX_USEFUL_REPS })}
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      {estimates === undefined ? (
        <Empty>
          <EmptyTitle>{t("calc.orm.needTwo")}</EmptyTitle>
          <EmptyDescription>
            {t("calc.orm.needTwoBody", { max: MAX_USEFUL_REPS })}
          </EmptyDescription>
        </Empty>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("calc.orm.title")}</CardTitle>
              <CardDescription>
                {t("calc.orm.body")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  {t("calc.orm.median")}
                </span>
                <span className="text-4xl font-semibold tabular-nums">
                  {medianEstimate(estimates).toFixed(1)} {unit}
                </span>
              </div>

              <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {estimates.map(({ formula: f, oneRepMax }) => (
                  <div key={f.id} className="flex flex-col gap-0.5">
                    <dt className="flex items-baseline gap-2">
                      <span className="text-sm font-medium">{f.name}</span>
                      <span className="text-lg font-semibold tabular-nums">
                        {oneRepMax.toFixed(1)} {unit}
                      </span>
                    </dt>
                    <dd className="text-xs text-muted-foreground">
                      {t(`formula.${f.id}` as MessageKey)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("calc.orm.forGivenSet")}</CardTitle>
              <CardDescription>{t("calc.orm.forGivenSetBody")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field className="w-56">
                <FieldLabel htmlFor="orm-formula">{t("calc.orm.formula")}</FieldLabel>
                <Select
                  items={FORMULAS.map((f) => ({ value: f.id, label: f.name }))}
                  value={formulaId}
                  onValueChange={(value) => setFormulaId(value as FormulaId)}
                >
                  <SelectTrigger id="orm-formula">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMULAS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.reps")}</TableHead>
                    <TableHead>{t("calc.orm.load")}</TableHead>
                    <TableHead className="text-right">{t("calc.orm.ofMax")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {REP_ROWS.map((row) => {
                    const load = formula.loadForReps(chosen!.oneRepMax, row);
                    return (
                      <TableRow key={row}>
                        <TableCell className="tabular-nums">{row}</TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {load.toFixed(1)} {unit}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {((load / chosen!.oneRepMax) * 100).toFixed(0)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
