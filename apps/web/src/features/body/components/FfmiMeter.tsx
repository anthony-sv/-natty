import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { ffmiScale } from "../ffmi";
import type { Profile } from "@/features/profile/profile-store";

/**
 * Where a normalized FFMI sits on the population scale.
 *
 * The spectrum track is the conventional look for this particular chart, and
 * is what was asked for. Worth knowing it breaks a rule the `dataviz` skill
 * otherwise holds: hue carries no inherent order, so a multi-hue ramp for
 * ordered magnitude relies on the reader learning the sequence. Here the seven
 * bands are directly labelled and the axis is numbered, so the colour is
 * decoration over an already-readable scale rather than the sole encoding —
 * which is the condition that makes it defensible.
 *
 * Labels are white with a dark shadow so they stay legible over every hue,
 * including the yellows where white alone would fail.
 */
export function FfmiMeter({
  value,
  sex,
}: {
  value: number;
  sex: NonNullable<Profile["sex"]>;
}) {
  const t = useT();
  const names = useNames();
  const scale = ffmiScale(sex);
  const span = scale.max - scale.min;
  const percentOf = (n: number) => ((n - scale.min) / span) * 100;

  const clamped = Math.min(Math.max(value, scale.min), scale.max);
  const markerPercent = percentOf(clamped);

  const ticks: number[] = [];
  for (let tick = scale.min; tick <= scale.max; tick += 1) ticks.push(tick);

  return (
    <figure className="m-0 flex flex-col gap-1">
      <div className="relative pt-4">
        <div
          className="absolute top-0 -translate-x-1/2 transition-[left] duration-300"
          style={{ left: `${markerPercent}%` }}
        >
          <div
            aria-hidden
            className="size-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-foreground"
          />
        </div>

        <div
          className="relative flex h-7 overflow-hidden rounded"
          style={{ background: "var(--ffmi-spectrum)" }}
        >
          {scale.bands.map((band) => (
            <div
              key={band.label}
              title={`${names.text(band.label)} — ${band.from} – ${band.to}`}
              className="flex items-center justify-center overflow-hidden"
              style={{ flexGrow: band.to - band.from }}
            >
              <span
                className="truncate px-1 text-[11px] font-semibold text-white"
                // A shadow rather than a per-band ink: the track is a
                // continuous gradient, so there is no one flat colour behind
                // any label to contrast against.
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.65)" }}
              >
                {names.text(band.label)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-4 text-[10px] text-muted-foreground">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute -translate-x-1/2 tabular-nums"
            style={{ left: `${percentOf(tick)}%` }}
          >
            {tick}
          </span>
        ))}
      </div>

      <figcaption className="text-xs text-muted-foreground">
        {t("body.chart.ffmiCaption", {
          sex:
            sex === "male"
              ? t("body.profile.maleAdj")
              : t("body.profile.femaleAdj"),
        })}
      </figcaption>
    </figure>
  );
}
