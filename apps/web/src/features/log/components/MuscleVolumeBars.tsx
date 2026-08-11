import { useT } from "@/i18n/use-t";
import type { MuscleVolume } from "../volume";

/**
 * The lower and upper end of the range usually quoted for weekly sets per
 * muscle. Deliberately shown as a band and captioned as a rule of thumb —
 * published figures vary between sources and none of them knows what you
 * recover from, so drawing it as a target would imply a precision nobody has.
 */
export const REFERENCE_MIN = 10;
export const REFERENCE_MAX = 20;

/**
 * One hue for every row.
 *
 * Muscles aren't categories to tell apart — the ranking is the comparison, and
 * eighteen hues would be the anti-pattern the `dataviz` skill names. Direct and
 * indirect separate by opacity within the row instead.
 */
const BAR_COLOUR = "var(--split-push)";

/**
 * Sets per muscle for a week, ranked.
 *
 * Plain HTML rather than a chart: a horizontal ranked bar needs its labels
 * aligned to its rows and no axis at all, which is exactly the case the
 * `dataviz` skill says to build by hand. It also keeps the two segments
 * honest — direct work is solid, indirect is the lighter one beside it, and
 * they are never added into a single number.
 */
export function MuscleVolumeBars({ muscles }: { muscles: MuscleVolume[] }) {
  const t = useT();

  // The axis every row shares. The reference band has to fit even on a light
  // week, or the bars would rescale under it and it would stop meaning
  // anything from one week to the next.
  const busiest = Math.max(
    REFERENCE_MAX,
    ...muscles.map((m) => m.directSets + m.indirectSets),
  );

  if (muscles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("volume.noSetsThisWeek")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {muscles.map((entry) => {
          const total = entry.directSets + entry.indirectSets;
          return (
            <li key={entry.muscle} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-sm">
                {/* A message key, not a catalog entry: the muscle list is a
                    closed enum, so a new one should fail the build in both
                    languages rather than quietly fall back to English. */}
                {t(`muscle.${entry.muscle}`)}
              </span>

              <div className="relative h-5 min-w-0 flex-1 overflow-hidden rounded bg-muted">
                {/* The band sits behind the bar, so a bar that reaches it
                    visibly lands inside rather than covering it up. */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 border-x border-dashed border-foreground/20 bg-foreground/[0.04]"
                  style={{
                    left: `${(REFERENCE_MIN / busiest) * 100}%`,
                    width: `${((REFERENCE_MAX - REFERENCE_MIN) / busiest) * 100}%`,
                  }}
                />
                {/* In normal flow, not absolutely positioned: an absolute box
                    with no right edge shrink-wraps, and a percentage width
                    inside one resolves against nothing and collapses. */}
                <span className="relative flex h-full">
                  <span
                    style={{
                      width: `${(entry.directSets / busiest) * 100}%`,
                      backgroundColor: BAR_COLOUR,
                    }}
                  />
                  {/* The same hue at a third of the strength: indirect work is
                      the same measure, not a different category. */}
                  <span
                    className="opacity-35"
                    style={{
                      width: `${(entry.indirectSets / busiest) * 100}%`,
                      backgroundColor: BAR_COLOUR,
                    }}
                  />
                </span>
              </div>

              {/* Written out, because the two numbers are the point and a
                  stacked bar alone can't say which part is which. */}
              <span className="w-24 shrink-0 text-right text-sm tabular-nums">
                <span className="font-medium">{entry.directSets}</span>
                {entry.indirectSets > 0 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    + {entry.indirectSets}
                  </span>
                ) : null}
                <span className="sr-only"> {t("volume.setsSuffix", { total })}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <LegendSwatch label={t("volume.direct")} />
        <LegendSwatch label={t("volume.indirect")} faded />
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2.5 w-4 rounded-[2px] border-x border-dashed border-foreground/30 bg-foreground/[0.06]"
          />
          {t("volume.referenceBand", { min: REFERENCE_MIN, max: REFERENCE_MAX })}
        </span>
      </div>
    </div>
  );
}

function LegendSwatch({ label, faded }: { label: string; faded?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="size-2.5 rounded-[2px]"
        style={{ backgroundColor: BAR_COLOUR, opacity: faded ? 0.35 : undefined }}
      />
      {label}
    </span>
  );
}
