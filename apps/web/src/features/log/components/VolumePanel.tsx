import { useMemo, useState } from "react";
import { CircleSlashIcon, InfoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateFormat, useT } from "@/i18n/use-t";
import { useVolume } from "../queries";
import { RESISTANCE_SPLITS, totalsFor, type MuscleGapReason } from "../volume";
import { MuscleVolumeBars } from "./MuscleVolumeBars";
import { TonnageCard } from "./TonnageCard";
import { SplitTrendChart } from "./SplitTrendChart";

/** Long enough to see a pattern, short enough that old habits don't skew it. */
const TREND_WEEKS = 8;

const WEEK_LABEL: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/** The order the gaps read in: the surprising cases before the obvious one. */
const REASON_ORDER: MuscleGapReason[] = [
  "indirect-only",
  "never-direct",
  "not-trained",
];

/**
 * What your training actually adds up to.
 *
 * The muscle data has been sitting in the exercise library since it was written
 * and nothing read it. This is what reads it: sets per muscle per week is the
 * figure programming runs on, and every set logged already carries enough to
 * derive it.
 */
export function VolumePanel() {
  const t = useT();
  const weekLabel = useDateFormat(WEEK_LABEL);

  // Read once on mount rather than during render, per `react-hooks/purity` —
  // and so "the current week" doesn't shift under you mid-read.
  const [now] = useState(() => Date.now());
  const { weeks, gaps, isLoading, loggedSetCount } = useVolume(now);

  const recent = useMemo(() => weeks.slice(-TREND_WEEKS), [weeks]);
  const latest = recent[recent.length - 1];
  const totals = useMemo(() => totalsFor(recent), [recent]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (loggedSetCount === 0 || latest === undefined) {
    return (
      <Empty>
        <EmptyTitle>{t("volume.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("volume.empty.body")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tonnage leads: it's the number people come to look at, and the set
          counts below are the ones that actually inform training. */}
      <TonnageCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span>{t("volume.thisWeek")}</span>
            {latest.isPartial ? (
              <Badge variant="outline">{t("volume.partial")}</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            {t("volume.thisWeekBody", {
              week: weekLabel.format(new Date(latest.weekStart)),
              sets: latest.totalSets,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MuscleVolumeBars muscles={latest.muscles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("volume.split")}</CardTitle>
          <CardDescription>
            {t("volume.splitBody", {
              weeks: recent.length,
              push: totals.split.push,
              pull: totals.split.pull,
              legs: totals.split.legs,
              core: totals.split.core,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {recent.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              {t("volume.needTwoWeeks")}
            </p>
          ) : (
            <SplitTrendChart weeks={recent} />
          )}

          <div className="grid grid-cols-3 gap-2">
            {RESISTANCE_SPLITS.map((split) => (
              <div
                key={split}
                className="flex flex-col gap-0.5 rounded-lg border px-3 py-2"
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ backgroundColor: `var(--split-${split})` }}
                  />
                  {t(`split.${split}`)}
                </span>
                <span className="text-xl font-semibold tabular-nums">
                  {totals.split[split]}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {totals.totalSets === 0
                    ? "—"
                    : `${Math.round((totals.split[split] / totals.totalSets) * 100)}%`}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {gaps.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleSlashIcon className="size-4 text-muted-foreground" />
              {t("volume.gaps")}
            </CardTitle>
            <CardDescription>
              {t("volume.gapsBody", { weeks: recent.length })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {REASON_ORDER.map((reason) => {
              const forReason = gaps.filter((gap) => gap.reason === reason);
              if (forReason.length === 0) return null;
              return (
                <div key={reason} className="flex flex-col gap-1.5">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium">
                    {t(`volume.reason.${reason}`)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t(`volume.reasonBody.${reason}`)}
                  </p>
                  <ul className="flex flex-wrap gap-1.5 pt-0.5">
                    {forReason.map((gap) => (
                      <li key={gap.muscle}>
                        <Badge variant="secondary" className="font-normal">
                          {t(`muscle.${gap.muscle}`)}
                          {gap.indirectSets > 0 ? (
                            <span className="text-muted-foreground tabular-nums">
                              {" "}
                              {t("volume.indirectCount", {
                                count: gap.indirectSets,
                              })}
                            </span>
                          ) : null}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <p className="flex items-start gap-1.5 border-t pt-3 text-xs text-muted-foreground">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
              {t("volume.gapsNote")}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
