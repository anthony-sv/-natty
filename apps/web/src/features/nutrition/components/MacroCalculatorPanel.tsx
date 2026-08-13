import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RotateCcwIcon, TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/toast";
import type { DietPlan } from "@/data/diets";
import {
  KCAL_PER_GRAM,
  KCAL_PER_GRAM_FIBRE,
  ZERO,
  effectiveTargetKcal,
  kcalOf,
  macrosFromTargets,
  percentSplit,
} from "../macros";
import { updateUserDiet } from "../collection";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { MacroSplit } from "./MacroSplit";

/** Upper ends, generous enough for a big bulk without making the grams fiddly. */
const LIMITS = { protein: 350, carbs: 600, fat: 200, fibre: 80 } as const;

/**
 * Slider rows. **Labels are message keys, not text** — built at module scope,
 * they were three hard-coded English words that stayed English in Spanish,
 * directly above a legend on the same card rendering the same three macros
 * translated. `i18n.test.ts` can't catch this: both dictionaries have the keys,
 * nothing here ever asked for them.
 */
const ROWS = [
  { key: "protein", labelKey: "nutrition.protein", color: "var(--macro-protein)" },
  { key: "carbs", labelKey: "nutrition.carbs", color: "var(--macro-carbs)" },
  { key: "fat", labelKey: "nutrition.fat", color: "var(--macro-fat)" },
] as const;

/**
 * Move the macros, watch the calories.
 *
 * Seeded from the plan's targets rather than from zero, so it opens somewhere
 * meaningful and every drag reads as a change *from the plan* rather than as an
 * abstraction.
 */
export function MacroCalculatorPanel({
  plan,
  /** Yours can take these targets in place; a built-in can only seed a copy. */
  isCustom = false,
  isDraft = false,
}: {
  plan: DietPlan;
  isCustom?: boolean;
  isDraft?: boolean;
}) {
  const t = useT();
  const names = useNames();
  const navigate = useNavigate();
  const planName = names.dietPlan(plan.slug, plan.name);

  // The plan's targets as a full `Macros`, since the sliders need a number for
  // each. A plan that states none opens at zero — the point of this tab is to
  // build a split, and zero is the honest place to start from.
  const seed = macrosFromTargets(plan.targets) ?? ZERO;
  const [macros, setMacros] = useState(seed);
  const [fibre, setFibre] = useState(25);

  const total = kcalOf(macros);
  const split = percentSplit(macros);
  const isPlan =
    macros.protein === seed.protein &&
    macros.carbs === seed.carbs &&
    macros.fat === seed.fat;

  // Stated or implied by the macro targets; undefined for a plan with no goal,
  // which is what hides the comparison below rather than comparing against 0.
  const target = effectiveTargetKcal(plan);

  /** Write the split onto the plan you're looking at. */
  function applyToPlan() {
    // `targetKcal` is deliberately left alone rather than set to `total`:
    // `effectiveTargetKcal` derives it from these macros, so writing it too
    // would create a second copy that could drift from them.
    const transaction = updateUserDiet(
      plan.slug,
      { ...plan, targets: macros },
      // Saving targets doesn't finish a plan's meals, so a draft stays a draft
      // — `compareToTargets` will have more to say, not less.
      isDraft,
    );
    void toast.promise(transaction.isPersisted.promise, {
      loading: t("dietBuilder.saving"),
      success: { title: t("nutrition.targetsSaved"), type: "success" },
      error: { title: t("dietBuilder.saveError"), type: "error" },
    });
  }

  /** Carry the split into a new plan, since a built-in can't take it. */
  function startPlanWith() {
    void navigate({
      to: "/nutrition/new",
      search: {
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="flex flex-col gap-1.5">
              <CardTitle>{t("nutrition.buildSplit")}</CardTitle>
              <CardDescription>
                {t("nutrition.splitBody", {
                  plan: planName,
                })}
              </CardDescription>
            </div>
            {/* The reason this tab exists: you move three sliders until the
                split reads right, and then the numbers have to go somewhere.
                Retyping them into the builder was the only route before. */}
            {isPlan ? null : (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setMacros(seed)}>
                  <RotateCcwIcon data-icon="inline-start" />{" "}
                  {t("nutrition.resetToPlan")}
                </Button>
                {isCustom ? (
                  <Button size="sm" onClick={applyToPlan}>
                    <TargetIcon data-icon="inline-start" />
                    {t("nutrition.useAsTargets")}
                  </Button>
                ) : (
                  // A built-in is transcribed source material and isn't edited
                  // in place — the same rule the plan and routine editors
                  // follow. These seed a new plan instead.
                  <Button size="sm" onClick={startPlanWith}>
                    <TargetIcon data-icon="inline-start" />
                    {t("nutrition.startPlanWith")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {ROWS.map((row) => (
            <div key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {/* Full width on a phone, a fixed column on a laptop. `w-20` was
                  sized to the word "Carbs"; "Carbohidratos" is half again as
                  wide and would push the slider out of the card. The fixed
                  column is only there to line the sliders up with each other,
                  which is a thing worth having only once they're side by side. */}
              <span className="flex w-full items-center gap-2 text-sm sm:w-32">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                {t(row.labelKey)}
              </span>
              <Slider
                aria-label={t("nutrition.gramsOf", { macro: t(row.labelKey) })}
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
            <span className="w-20 text-sm text-muted-foreground">
              {t("nutrition.fibre")}
            </span>
            <Slider
              aria-label={t("nutrition.fibreAria")}
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
              {t("nutrition.fibreNote", {
                fibreKcal: KCAL_PER_GRAM_FIBRE,
                carbKcal: KCAL_PER_GRAM.carbs,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("nutrition.kcalADay", {
              kcal: Math.round(total).toLocaleString(t.locale),
            })}
          </CardTitle>
          {/* Only when there's something to compare against. A plan with no
              goal would otherwise read as "1,240 kcal above" a target of zero. */}
          {target ? (
            <CardDescription>
              {total > target.kcal
                ? t("nutrition.above", {
                    kcal: Math.round(total - target.kcal).toLocaleString(t.locale),
                    plan: planName,
                  })
                : total < target.kcal
                  ? t("nutrition.below", {
                      kcal: Math.round(target.kcal - total).toLocaleString(
                        t.locale,
                      ),
                      plan: planName,
                    })
                  : t("nutrition.exactly", { plan: planName })}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <MacroSplit macros={macros} />
        </CardContent>
      </Card>
    </div>
  );
}
