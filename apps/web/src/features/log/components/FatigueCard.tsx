import { useCallback, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRelativeTimeFormat, useT } from "@/i18n/use-t";
import type { MuscleId } from "@/data/exercises";
import { type FatigueState, type MuscleFatigue } from "../fatigue";
import { useFatigue } from "../queries";
import { MuscleBodyFigure3D } from "./MuscleBodyFigure3D";

/**
 * `nearly`/`recovering` are flagged the same way in *both* colour modes —
 * the fixed `--status-*` scale (dataviz skill's good/warning/serious/
 * critical), not an interpolated gradient, since status colour is a
 * reserved, non-continuous scale ("status is fixed... never themed").
 * `recovering` splits across `serious`/`critical` by `entry.fatigue` rather
 * than picking one: two fixed steps read as more of a spectrum than one.
 *
 * Returns `null` for `ready`/`untrained` — "nothing to flag," not a colour of
 * its own. What that `null` *means* differs by mode, which is why it isn't
 * decided here: the default mode leaves those muscles at their real,
 * Blender-authored anatomy colour (`null` passed straight through to
 * `MuscleBodyFigure3D`, which reverts the material rather than skipping it);
 * the spectrum mode below turns that same `null` into `--status-good`.
 */
function colorForFlag(entry: MuscleFatigue): string | null {
  switch (entry.state) {
    case "ready":
    case "untrained":
      return null;
    case "nearly":
      return "var(--status-warning)";
    case "recovering":
      return entry.fatigue >= 0.5 ? "var(--status-critical)" : "var(--status-serious)";
  }
}

/**
 * The alternate colouring: every muscle carries a verdict, including a
 * green "ready" — a muscle with no log history yet is exactly as clear to
 * train as one that's fully recovered, so `untrained` reads the same as
 * `ready` here. The default mode (`colorForFlag` passed straight through,
 * `null` left as the figure's own anatomy colour) keeps the stricter
 * reading, where colour means "still recovering" specifically and nothing
 * else claims a verdict about the rest of the body.
 */
function colorForSpectrum(entry: MuscleFatigue): string {
  return colorForFlag(entry) ?? "var(--status-good)";
}

function relativeLabel(rtf: Intl.RelativeTimeFormat, hours: number): string {
  if (hours < 24) return rtf.format(-Math.round(hours), "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

/**
 * What is recovered right now, as a body map — the question `MuscleVolumeBars`
 * (a ranked list of *how much*) can't answer, because "is my chest ready" is a
 * lookup on a body, not a row in a list.
 */
export function FatigueCard() {
  const t = useT();
  const rtf = useRelativeTimeFormat();
  const [now] = useState(() => Date.now());
  const { muscles, isLoading } = useFatigue(now);
  // Off by default: the figure shows its own real anatomy colour, with only
  // recovering/nearly muscles flagged. The full green/yellow/red spectrum
  // (every muscle carries a verdict, including "ready") is opt-in.
  const [spectrum, setSpectrum] = useState(false);

  const byId = useMemo(
    () => new Map(muscles.map((m) => [m.muscle, m])),
    [muscles],
  );

  const stateLabel = (state: FatigueState) => t(`fatigue.state.${state}`);

  const statusFor = (entry: MuscleFatigue) => {
    const muscleName = t(`muscle.${entry.muscle}`);
    if (entry.hoursSinceDirect === undefined) {
      return t("fatigue.status.untrained", {
        muscle: muscleName,
        state: stateLabel(entry.state),
      });
    }
    return t("fatigue.status", {
      muscle: muscleName,
      state: stateLabel(entry.state),
      time: relativeLabel(rtf, entry.hoursSinceDirect),
    });
  };

  // Stable references, not inline closures: `Figure` (inside the 3D canvas)
  // takes these as props, and a new function identity on every `FatigueCard`
  // render forces it to re-render — and re-render is what re-invokes
  // `useGLTF(MODEL_URL)`, which is the trigger the cache-clearing cleanup
  // above needs to stay rare. `useMemo`-derived `byId` already only changes
  // when `muscles` does, and `t`/`rtf` are stable from their own hooks, so
  // the real inputs here are just `byId` and `spectrum`.
  const colorFor = useCallback(
    (muscle: MuscleId): string | null => {
      const entry = byId.get(muscle);
      if (!entry) return null;
      return spectrum ? colorForSpectrum(entry) : colorForFlag(entry);
    },
    [byId, spectrum],
  );

  const labelFor = useCallback(
    (muscle: MuscleId) => {
      const entry = byId.get(muscle);
      return entry ? statusFor(entry) : t(`muscle.${muscle}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byId, t, rtf],
  );

  // Most fatigued relative to its own window first — the same ranking the
  // colour intensity draws.
  const recovering = useMemo(
    () =>
      muscles
        .filter((m) => m.state === "recovering" || m.state === "nearly")
        .sort((a, b) => b.fatigue - a.fatigue),
    [muscles],
  );

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("fatigue.title")}</CardTitle>
        <CardDescription>{t("fatigue.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex justify-center">
          <MuscleBodyFigure3D
            summary={t("fatigue.figureSummary")}
            colorFor={colorFor}
            labelFor={labelFor}
          />
        </div>

        <div className="flex items-center justify-center gap-2">
          <Checkbox
            id="fatigue-spectrum"
            checked={spectrum}
            onCheckedChange={(checked) => setSpectrum(checked === true)}
          />
          <Label htmlFor="fatigue-spectrum" className="text-sm font-normal">
            {t("fatigue.spectrumToggle")}
          </Label>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {spectrum ? (
            <>
              <LegendSwatch color="var(--status-good)" label={t("fatigue.state.ready")} />
              <LegendSwatch color="var(--status-warning)" label={t("fatigue.state.nearly")} />
              <LegendSwatch
                color="var(--status-critical)"
                label={t("fatigue.state.recovering")}
              />
            </>
          ) : (
            <>
              <LegendSwatch
                color="var(--status-critical)"
                label={t("fatigue.state.recovering")}
              />
              <LegendSwatch color="var(--status-warning)" label={t("fatigue.state.nearly")} />
              <LegendSwatch color="var(--muscle-native)" label={t("fatigue.state.ready")} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium">{t("fatigue.recoveringHeading")}</h3>
          {recovering.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("fatigue.allReady")}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {recovering.map((entry) => (
                <li
                  key={entry.muscle}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-[2px]"
                      style={{
                        // This list only ever holds recovering/nearly entries,
                        // which `colorFor` always resolves to a real flag
                        // colour — the fallback is for the type, not a case
                        // this list actually hits.
                        backgroundColor: colorFor(entry.muscle) ?? "var(--muted)",
                      }}
                    />
                    {t(`muscle.${entry.muscle}`)}
                  </span>
                  <span className="text-right text-muted-foreground tabular-nums">
                    {entry.hoursSinceDirect !== undefined
                      ? relativeLabel(rtf, entry.hoursSinceDirect)
                      : null}
                    {entry.lastIndirectAt !== undefined ? (
                      <span className="block text-xs">
                        {t("fatigue.indirectNote", {
                          time: relativeLabel(
                            rtf,
                            (now - entry.lastIndirectAt) / (60 * 60 * 1000),
                          ),
                        })}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="border-t pt-3 text-xs text-muted-foreground">
          {t("fatigue.footnote")}
        </p>
      </CardContent>
    </Card>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className="size-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
