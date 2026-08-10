import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  REALISTIC_SHARE,
  percentOfPotential,
  type Potential,
} from "../casey-butt";

const GIRTH_LABELS: Array<[keyof Potential["girths"], string]> = [
  ["neck", "Neck"],
  ["chest", "Chest"],
  ["biceps", "Biceps"],
  ["forearm", "Forearm"],
  ["thigh", "Thigh"],
  ["calf", "Calf"],
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
  const progress =
    currentLeanMassKg === undefined
      ? undefined
      : percentOfPotential(currentLeanMassKg, potential);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">
          Maximum lean body mass
        </span>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-4xl font-semibold tabular-nums">
            {potential.leanMassKg.toFixed(1)} kg
          </span>
          <Badge variant="secondary">
            {(potential.leanMassKg * REALISTIC_SHARE).toFixed(1)} kg realistic
          </Badge>
        </div>

        {progress === undefined ? (
          <p className="text-sm text-muted-foreground">
            Log a weigh-in with a body-fat reading to see where you are against
            it.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1">
            {/* Clamped: the bar can't render past full, but the number can and
                should — the model is a population fit, not a wall. */}
            <Progress value={Math.min(progress, 100)} />
            <p className="text-sm text-muted-foreground">
              You're at {currentLeanMassKg!.toFixed(1)} kg lean —{" "}
              <span className="font-medium text-foreground tabular-nums">
                {progress.toFixed(0)}%
              </span>{" "}
              of the maximum, {(progress / REALISTIC_SHARE).toFixed(0)}% of the
              realistic figure.
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="pb-3 text-sm font-medium">Girths at that size</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          {GIRTH_LABELS.map(([key, label]) => (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
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
