import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRelativeTimeFormat, useT } from "@/i18n/use-t";
import type { MuscleId } from "@/data/exercises";
import { fatigueStep, type FatigueState, type MuscleFatigue } from "../fatigue";
import { useFatigue } from "../queries";
import { MuscleBodyFigure } from "./MuscleBodyMap";

const FATIGUE_RAMP = ["--fatigue-1", "--fatigue-2", "--fatigue-3", "--fatigue-4"];

function colorForStep(step: 0 | 1 | 2 | 3 | 4): string {
  return step === 0 ? "var(--muted)" : `var(${FATIGUE_RAMP[step - 1]})`;
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

  const colorFor = (muscle: MuscleId) => {
    const entry = byId.get(muscle);
    return entry ? colorForStep(fatigueStep(entry)) : "var(--muted)";
  };

  const labelFor = (muscle: MuscleId) => {
    const entry = byId.get(muscle);
    return entry ? statusFor(entry) : t(`muscle.${muscle}`);
  };

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
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex flex-col items-center gap-1.5">
            <MuscleBodyFigure
              view="front"
              summary={t("fatigue.figureAlt", { view: t("fatigue.view.front") })}
              colorFor={colorFor}
              labelFor={labelFor}
            />
            <span className="text-xs text-muted-foreground">
              {t("fatigue.view.front")}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <MuscleBodyFigure
              view="back"
              summary={t("fatigue.figureAlt", { view: t("fatigue.view.back") })}
              colorFor={colorFor}
              labelFor={labelFor}
            />
            <span className="text-xs text-muted-foreground">
              {t("fatigue.view.back")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <LegendSwatch color="var(--fatigue-4)" label={t("fatigue.state.recovering")} />
          <LegendSwatch color="var(--fatigue-1)" label={t("fatigue.state.nearly")} />
          <LegendSwatch color="var(--muted)" label={t("fatigue.state.ready")} />
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
                      style={{ backgroundColor: colorForStep(fatigueStep(entry)) }}
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
