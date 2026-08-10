import { useState } from "react";
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
import {
  CHART_REPS,
  RPE_VALUES,
  loadFor,
  oneRepMaxFrom,
  percentOfMax,
  rirForRpe,
} from "../rpe";
import { parseMeasurement } from "../parse";

const RPE_OPTIONS = RPE_VALUES.map((rpe) => ({
  value: String(rpe),
  label: `${rpe} — ${rirForRpe(rpe)} in reserve`,
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>The set you did</CardTitle>
          <CardDescription>
            RPE is how hard the set was out of 10; reps in reserve is the same
            statement counted the other way. RPE 8 and 2 in reserve are one
            thing said twice.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-4">
          <Field className="w-48">
            <FieldLabel htmlFor="rpe-weight">Weight</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="rpe-weight"
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

          <Field className="w-32">
            <FieldLabel htmlFor="rpe-reps">Reps</FieldLabel>
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
              items={RPE_OPTIONS}
              value={rpe}
              onValueChange={(value) => setRpe(value ?? "8")}
            >
              <SelectTrigger id="rpe-rpe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RPE_OPTIONS.map((option) => (
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
          <CardTitle>What that set implies</CardTitle>
          <CardDescription>
            {percent === undefined
              ? "That combination is off the published chart — it stops at twelve reps to failure."
              : `${reps} reps at RPE ${rpe} is ${percent}% of a one-rep max.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Share of max</span>
            <span className="text-3xl font-semibold tabular-nums">
              {percent === undefined ? "—" : `${percent}%`}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              Estimated one-rep max
            </span>
            <span className="flex items-center gap-2">
              <span className="text-3xl font-semibold tabular-nums">
                {max === undefined ? "—" : `${max.toFixed(1)} ${unit}`}
              </span>
              {repsValue !== undefined && percent !== undefined ? (
                <Badge variant="secondary">
                  {rirForRpe(rpeValue)} in reserve
                </Badge>
              ) : null}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>The chart</CardTitle>
          <CardDescription>
            {max === undefined
              ? "Percentages of a one-rep max. Enter a set above to see them as weights."
              : `Loads against the ${max.toFixed(1)} ${unit} estimate above. Your set is highlighted.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reps</TableHead>
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
