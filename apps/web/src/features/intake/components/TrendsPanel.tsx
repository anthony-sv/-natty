import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { DietPlan } from "@/data/diets";
import { effectiveTargetKcal, kcalOf } from "@/features/nutrition/macros";
import { usePantry } from "@/features/pantry/use-pantry";
import { useT } from "@/i18n/use-t";
import { useIntake } from "../use-intake";
import { dailyIntake, summariseIntake } from "../trends";
import { IntakeHeatmaps } from "./IntakeHeatmaps";
import { MacroTrendCharts } from "./MacroTrendCharts";

/**
 * Twelve weeks.
 *
 * Shorter than the training heatmap's year on purpose: a year of food is a
 * grid you scroll past, and the useful question about eating is about the
 * block you're in rather than about last spring.
 */
const WEEKS = 12;

/**
 * What you ate, over time.
 *
 * The Today tab answers "what have I eaten today"; this answers the two that
 * only make sense over a run of days — how the macros moved, and how often you
 * actually did what the plan said.
 */
export function TrendsPanel({ plan }: { plan: DietPlan }) {
  const t = useT();
  const { entries, isLoading } = useIntake();
  const pantry = usePantry();

  // Read once on mount rather than during render — the purity lint rule
  // rejects Date.now() there, and the window shouldn't shift mid-session.
  const [now] = useState(() => Date.now());

  const days = useMemo(
    () => dailyIntake(entries, plan, pantry, { weeks: WEEKS, now }),
    [entries, plan, pantry, now],
  );
  const summary = useMemo(() => summariseIntake(days), [days]);
  const target = effectiveTargetKcal(plan);

  if (isLoading || pantry.isLoading) return null;

  if (summary.daysLogged === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("trends.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("trends.empty.body")}</EmptyDescription>
      </Empty>
    );
  }

  const average = summary.averageMacros;

  return (
    <div className="flex flex-col gap-6">
      {/* Averaged over the days you logged, not the window — a fortnight you
          didn't open the app would otherwise read as a crash diet. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label={t("trends.daysLogged")}
          value={`${summary.daysLogged} / ${WEEKS * 7}`}
        />
        <Stat
          label={t("trends.daysComplete")}
          value={String(summary.daysComplete)}
        />
        <Stat
          label={t("trends.averageKcal")}
          value={
            summary.averageKcal === undefined
              ? "—"
              : Math.round(summary.averageKcal).toLocaleString()
          }
        />
        <Stat
          label={t("trends.averageProtein")}
          value={average === undefined ? "—" : `${Math.round(average.protein)} g`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("trends.overTime")}</CardTitle>
          <CardDescription>{t("trends.overTimeBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <MacroTrendCharts
            days={days}
            targetKcal={target?.kcal}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("trends.consistency")}</CardTitle>
          <CardDescription>{t("trends.consistencyBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <IntakeHeatmaps
            days={days}
            weeks={WEEKS}
            now={now}
            hasTarget={target !== undefined}
          />
        </CardContent>
      </Card>

      {average !== undefined ? (
        <p className="text-xs text-muted-foreground">
          {t("trends.averageNote", {
            protein: Math.round(average.protein),
            carbs: Math.round(average.carbs),
            fat: Math.round(average.fat),
            kcal: Math.round(kcalOf(average)).toLocaleString(),
            days: summary.daysLogged,
          })}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
