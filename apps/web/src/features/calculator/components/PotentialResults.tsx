import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useT, type MessageKey } from "@/i18n/use-t";
import {
  REALISTIC_SHARE,
  percentOfPotential,
  type Potential,
} from "../casey-butt";

const GIRTH_LABELS: Array<[keyof Potential["girths"], MessageKey]> = [
  ["neck", "calc.potential.neck"],
  ["chest", "calc.potential.chest"],
  ["biceps", "calc.potential.biceps"],
  ["forearm", "calc.potential.forearm"],
  ["thigh", "calc.potential.thigh"],
  ["calf", "calc.potential.calf"],
];

/**
 * The model's output: a peak lean mass and the girths that come with it.
 *
 * Every figure is shown with its 95% companion, the way the source calculator
 * does, because the peak assumes years where nothing went wrong and the 95%
 * figure is the one worth aiming at.
 */
export function PotentialResults({
  potential,
  currentLeanMassKg,
}: {
  potential: Potential;
  /** From your latest weigh-in, when there is one with a body-fat reading. */
  currentLeanMassKg: number | undefined;
}) {
  const t = useT();
  const progress =
    currentLeanMassKg === undefined
      ? undefined
      : percentOfPotential(currentLeanMassKg, potential);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">
          {t("calc.potential.leanMax")}
        </span>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-4xl font-semibold tabular-nums">
            {potential.leanMassKg.toFixed(1)} kg
          </span>
          <Badge variant="secondary">
            {t("calc.potential.realistic", {
              value: (potential.leanMassKg * REALISTIC_SHARE).toFixed(1),
            })}
          </Badge>
        </div>

        {progress === undefined ? (
          <p className="text-sm text-muted-foreground">
            {t("calc.potential.needWeighIn")}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1">
            {/* Clamped: the bar can't render past full, but the number can and
                should — the model is a population fit, not a wall. */}
            <Progress value={Math.min(progress, 100)} />
            <p className="text-sm text-muted-foreground">
              {t("calc.potential.standing", {
                lean: currentLeanMassKg!.toFixed(1),
                percent: progress.toFixed(0),
                realistic: (progress / REALISTIC_SHARE).toFixed(0),
              })}
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="pb-3 text-sm font-medium">
          {t("calc.potential.girths")}
        </h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          {GIRTH_LABELS.map(([key, labelKey]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{t(labelKey)}</dt>
              <dd className="flex items-baseline gap-2">
                <span className="text-xl font-semibold tabular-nums">
                  {potential.girths[key].toFixed(1)} cm
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {(potential.girths[key] * REALISTIC_SHARE).toFixed(1)}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
