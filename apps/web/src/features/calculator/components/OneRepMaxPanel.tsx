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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>The set you did</CardTitle>
          <CardDescription>
            A hard set, taken close to failure. A set with three left in the tank
            estimates a max you don't have — use the RPE tab for those.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-4">
          <Field className="w-48">
            <FieldLabel htmlFor="orm-weight">Weight</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="orm-weight"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                placeholder="e.g. 100"
                className="min-w-0 flex-1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <Select
                items={UNITS}
                value={unit}
                onValueChange={(value) => setUnit(value as WeightUnit)}
              >
                <SelectTrigger aria-label="Weight unit" className="w-20 shrink-0">
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
            <FieldLabel htmlFor="orm-reps">Reps</FieldLabel>
            <Input
              id="orm-reps"
              type="number"
              inputMode="numeric"
              min="2"
              max={MAX_USEFUL_REPS}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <FieldDescription>2 to {MAX_USEFUL_REPS}.</FieldDescription>
          </Field>
        </CardContent>
      </Card>

      {estimates === undefined ? (
        <Empty>
          <EmptyTitle>Enter a set of two or more</EmptyTitle>
          <EmptyDescription>
            A single already is your one-rep max, and past {MAX_USEFUL_REPS}{" "}
            reps these curves stop agreeing with reality.
          </EmptyDescription>
        </Empty>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Estimated one-rep max</CardTitle>
              <CardDescription>
                Five fits of the same data. The spread between them is the
                honest error bar on any single one.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Median of the five
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
                    <dd className="text-xs text-muted-foreground">{f.note}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to lift for a given set</CardTitle>
              <CardDescription>
                The same formula run backwards, off its own estimate — so the
                row matching the set you entered reads back as the weight you
                lifted.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field className="w-56">
                <FieldLabel htmlFor="orm-formula">Formula</FieldLabel>
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
                    <TableHead>Reps</TableHead>
                    <TableHead>Load</TableHead>
                    <TableHead className="text-right">Of max</TableHead>
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
