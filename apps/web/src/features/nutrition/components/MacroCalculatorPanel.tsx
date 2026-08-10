import { useState } from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { DietPlan } from "@/data/diets";
import { KCAL_PER_GRAM, KCAL_PER_GRAM_FIBRE, kcalOf, percentSplit } from "../macros";
import { MacroSplit } from "./MacroSplit";

/** Upper ends, generous enough for a big bulk without making the grams fiddly. */
const LIMITS = { protein: 350, carbs: 600, fat: 200, fibre: 80 } as const;

const ROWS = [
  { key: "protein", label: "Protein", color: "var(--macro-protein)" },
  { key: "carbs", label: "Carbs", color: "var(--macro-carbs)" },
  { key: "fat", label: "Fat", color: "var(--macro-fat)" },
] as const;

/**
 * Move the macros, watch the calories.
 *
 * Seeded from the plan's targets rather than from zero, so it opens somewhere
 * meaningful and every drag reads as a change *from the plan* rather than as an
 * abstraction.
 */
export function MacroCalculatorPanel({ plan }: { plan: DietPlan }) {
  const [macros, setMacros] = useState({
    protein: plan.targets.protein,
    carbs: plan.targets.carbs,
    fat: plan.targets.fat,
  });
  const [fibre, setFibre] = useState(25);

  const total = kcalOf(macros);
  const split = percentSplit(macros);
  const isPlan =
    macros.protein === plan.targets.protein &&
    macros.carbs === plan.targets.carbs &&
    macros.fat === plan.targets.fat;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Build a split</CardTitle>
              <CardDescription>
                Starting from {plan.name}. Drag a macro and everything else
                follows.
              </CardDescription>
            </div>
            {isPlan ? null : (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setMacros({
                    protein: plan.targets.protein,
                    carbs: plan.targets.carbs,
                    fat: plan.targets.fat,
                  })
                }
              >
                <RotateCcwIcon data-icon="inline-start" /> Reset to plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {ROWS.map((row) => (
            <div key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="flex w-20 items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                {row.label}
              </span>
              <Slider
                aria-label={`${row.label} in grams`}
                className="min-w-40 flex-1"
                min={0}
                max={LIMITS[row.key]}
                step={1}
                // An array, not a bare number: `ui/slider.tsx` renders a thumb
                // per value and falls back to `[min, max]` for a non-array, so
                // a single number silently draws two thumbs stacked on top of
                // each other.
                value={[macros[row.key]]}
                onValueChange={(value) =>
                  setMacros((current) => ({
                    ...current,
                    [row.key]: Array.isArray(value) ? value[0]! : value,
                  }))
                }
              />
              <span className="w-16 text-right font-semibold tabular-nums">
                {macros[row.key]} g
              </span>
              <span className="w-24 text-right text-sm text-muted-foreground tabular-nums">
                {(macros[row.key] * KCAL_PER_GRAM[row.key]).toLocaleString()} kcal
              </span>
              <span className="w-12 text-right text-sm text-muted-foreground tabular-nums">
                {split[row.key].toFixed(0)}%
              </span>
            </div>
          ))}

          {/*
            Fibre sits below the rule rather than in the ring. It's a share of
            the carbohydrate already counted, not a fourth macro, so adding it
            as a slice would count part of the day twice and inflate the total.
          */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4">
            <span className="w-20 text-sm text-muted-foreground">Fibre</span>
            <Slider
              aria-label="Fibre in grams"
              className="min-w-40 flex-1"
              min={0}
              max={LIMITS.fibre}
              step={1}
              value={[fibre]}
              onValueChange={(value) =>
                setFibre(Array.isArray(value) ? value[0]! : value)
              }
            />
            <span className="w-16 text-right font-semibold tabular-nums">
              {fibre} g
            </span>
            <span className="w-24 text-right text-sm text-muted-foreground tabular-nums">
              ~{(fibre * KCAL_PER_GRAM_FIBRE).toLocaleString()} kcal
            </span>
            <span className="w-12" />
            <p className="basis-full text-xs text-muted-foreground">
              Counted inside the carbs above, at roughly {KCAL_PER_GRAM_FIBRE}{" "}
              kcal a gram rather than {KCAL_PER_GRAM.carbs} — fibre is a
              carbohydrate the body only partly gets at, not a fourth macro.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {Math.round(total).toLocaleString()} kcal a day
          </CardTitle>
          <CardDescription>
            {total > plan.targetKcal
              ? `${Math.round(total - plan.targetKcal).toLocaleString()} kcal above ${plan.name}.`
              : total < plan.targetKcal
                ? `${Math.round(plan.targetKcal - total).toLocaleString()} kcal below ${plan.name}.`
                : `Exactly ${plan.name}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MacroSplit macros={macros} />
        </CardContent>
      </Card>
    </div>
  );
}
