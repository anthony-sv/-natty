import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Page } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { UNITS, type WeightUnit } from "@/lib/units";
import { parseMeasurement } from "@/features/calculator/parse";
import { BarDiagram } from "@/features/plates/components/BarDiagram";
import { PlateDisc } from "@/features/plates/components/PlateDisc";
import {
  barsFor,
  defaultInventory,
  platesFor,
  type Plate,
} from "@/features/plates/equipment";
import { solveLoading, weightOf, type PlateCount } from "@/features/plates/solve";

export const Route = createFileRoute("/plates")({
  component: PlatesPage,
});

function PlatesPage() {
  const [unit, setUnit] = useState<WeightUnit>("kg");
  const bars = barsFor(unit);
  const plates = platesFor(unit);

  const [barId, setBarId] = useState(bars[0]!.id);
  const bar = bars.find((candidate) => candidate.id === barId) ?? bars[0]!;

  // Pairs per denomination. Reset with the unit, since a kilo rack says
  // nothing about a pound one.
  const [inventory, setInventory] = useState(() => defaultInventory("kg"));
  const [target, setTarget] = useState("100");
  // The reverse direction's hand-built loading, per side.
  const [picked, setPicked] = useState<Record<string, number>>({});

  function changeUnit(next: WeightUnit) {
    setUnit(next);
    setInventory(defaultInventory(next));
    setBarId(barsFor(next)[0]!.id);
    setPicked({});
  }

  // Not wrapped in `useMemo`: `bar` is reassigned above, so the compiler can't
  // preserve a manual memo over it, and the solve is a few milliseconds on a
  // table this size. Letting the compiler decide beats hand-holding it.
  const solved = solveLoading(
    parseMeasurement(target) ?? bar.weight,
    bar.weight,
    plates,
    inventory,
  );

  const pickedPerSide: PlateCount[] = plates
    .filter((plate) => (picked[String(plate.weight)] ?? 0) > 0)
    .map((plate) => ({ plate, pairs: picked[String(plate.weight)]! }));
  const pickedTotal = weightOf(pickedPerSide, bar.weight);

  const adjustPicked = (plate: Plate, by: number) =>
    setPicked((current) => {
      const key = String(plate.weight);
      const next = Math.max(0, (current[key] ?? 0) + by);
      return { ...current, [key]: next };
    });

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">Plate loader</h1>
        <p className="text-sm text-muted-foreground">
          What to hang on each end, from what your gym actually has.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>The bar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-4">
          <Field className="w-32">
            <FieldLabel htmlFor="plates-unit">Units</FieldLabel>
            <Select
              items={UNITS}
              value={unit}
              onValueChange={(value) => changeUnit(value as WeightUnit)}
            >
              <SelectTrigger id="plates-unit">
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
          </Field>

          <Field className="w-64">
            <FieldLabel htmlFor="plates-bar">Bar</FieldLabel>
            <Select
              items={bars.map((candidate) => ({
                value: candidate.id,
                label: candidate.name,
              }))}
              value={bar.id}
              onValueChange={(value) => setBarId(value ?? bars[0]!.id)}
            >
              <SelectTrigger id="plates-bar">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bars.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.name} — {candidate.weight} {candidate.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Every total below includes the bar's {bar.weight} {unit}.
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What's on the rack</CardTitle>
          <CardDescription>
            Pairs of each disc — one for each end. Set a denomination to zero
            and the loader stops using it, which is the point: it will find a
            longer combination that still lands exactly rather than rounding.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {plates.map((plate) => {
            const pairs = inventory[String(plate.weight)] ?? 0;
            return (
              <div
                key={plate.weight}
                className={cn(
                  "flex w-32 flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-opacity",
                  // A denomination you don't have is still listed — you need
                  // somewhere to type when you get one — but it shouldn't read
                  // as part of the rack.
                  pairs === 0 && "opacity-45",
                )}
              >
                <span className="flex h-14 items-center">
                  <PlateDisc plate={plate} size={54} />
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {plate.weight} {unit}
                </span>
                <Input
                  aria-label={`Pairs of ${plate.weight} ${unit}`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="h-7 px-2 text-center"
                  value={pairs}
                  onChange={(e) =>
                    setInventory((current) => ({
                      ...current,
                      [String(plate.weight)]: Math.max(
                        0,
                        Math.floor(Number(e.target.value) || 0),
                      ),
                    }))
                  }
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Tabs defaultValue="load">
        <TabsList>
          <TabsTrigger value="load">Load a weight</TabsTrigger>
          <TabsTrigger value="add">Add plates up</TabsTrigger>
        </TabsList>

        <TabsContent value="load">
          <Card>
            <CardHeader>
              <CardTitle>Load a weight</CardTitle>
              <CardDescription>
                The fewest discs that reach the target without going over.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field className="w-48">
                <FieldLabel htmlFor="plates-target">Target ({unit})</FieldLabel>
                <Input
                  id="plates-target"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </Field>

              {!solved.ok ? (
                <p className="text-sm text-muted-foreground">
                  That's less than the bar on its own ({bar.weight} {unit}).
                </p>
              ) : (
                <>
                  <BarDiagram perSide={solved.loading.perSide} />

                  <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                    <span className="text-3xl font-semibold tabular-nums">
                      {solved.loading.totalWeight} {unit}
                    </span>
                    {solved.loading.isApproximate ? (
                      <Badge variant="destructive">
                        {solved.loading.shortBy} {unit} short — no combination
                        on the rack lands exactly
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Exact</Badge>
                    )}
                  </div>

                  <p className="text-sm">
                    <span className="text-muted-foreground">Per side: </span>
                    {solved.loading.perSide.length === 0
                      ? "nothing, just the bar"
                      : solved.loading.perSide
                          .map(
                            (entry) =>
                              `${entry.pairs} × ${entry.plate.weight}${unit}`,
                          )
                          .join(" + ")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add plates up</CardTitle>
              <CardDescription>
                The same thing backwards: put discs on one end and read the
                total. Tap a disc below to add a pair, or tap one on the bar to
                take a pair off.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <BarDiagram
                perSide={pickedPerSide}
                onRemove={(plate) => adjustPicked(plate, -1)}
              />

              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {pickedTotal} {unit}
                </span>
                <span className="text-sm text-muted-foreground">
                  {bar.weight} {unit} bar +{" "}
                  {(pickedTotal - bar.weight) / 2} {unit} a side
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {plates.map((plate) => (
                  <div
                    key={plate.weight}
                    className="flex items-center gap-1.5 rounded-lg border p-1.5 pr-1"
                  >
                    <span className="flex h-11 items-center">
                      <PlateDisc
                        plate={plate}
                        size={44}
                        title={`Add a pair of ${plate.weight} ${unit}`}
                        onClick={() => adjustPicked(plate, 1)}
                      />
                    </span>
                    <span className="w-5 text-center text-sm tabular-nums">
                      {picked[String(plate.weight)] ?? 0}
                    </span>
                    <div className="flex flex-col">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="size-6"
                        aria-label={`Add a pair of ${plate.weight} ${unit}`}
                        onClick={() => adjustPicked(plate, 1)}
                      >
                        <PlusIcon />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="size-6"
                        aria-label={`Remove a pair of ${plate.weight} ${unit}`}
                        onClick={() => adjustPicked(plate, -1)}
                      >
                        <MinusIcon />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {Object.values(picked).some((pairs) => pairs > 0) ? (
                <div>
                  <Button variant="outline" onClick={() => setPicked({})}>
                    Strip the bar
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
