import { useMemo } from "react";
import { HeatmapGrid, HeatmapLegend } from "@/components/heatmap-grid";
import { useT } from "@/i18n/use-t";
import { calendarWeeks, type GridDay } from "@/lib/calendar";
import { adherenceStep, calorieStep, type DayIntake } from "../trends";

/** Adherence is a share of a stated number, so it reuses the sequential ramp. */
const ADHERENCE_COLOUR = [
  "var(--muted)",
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-4)",
] as const;

/**
 * Calories, from two meals under to two meals over.
 *
 * Diverging, so the middle is the pale one — see the note in `styles.css`.
 * Ordered under → over so the legend reads left to right the way the numbers
 * do.
 */
const CALORIE_COLOUR = [
  "var(--kcal-under-2)",
  "var(--kcal-under-1)",
  "var(--kcal-on)",
  "var(--kcal-over-1)",
  "var(--kcal-over-2)",
] as const;

type IntakeDay = GridDay & { intake: DayIntake | undefined };

/**
 * Two grids over the same window, answering two questions that can disagree.
 *
 * **Did you follow the plan** and **did you hit the numbers** are not the same
 * thing: a day of ticking every meal and then eating a second dinner is 100%
 * adherence and 700 kcal over. One grid would have to pick which of those it
 * meant, so there are two.
 */
export function IntakeHeatmaps({
  days,
  weeks,
  now,
  hasTarget,
}: {
  days: DayIntake[];
  weeks: number;
  now: number;
  /** Without one, the calorie grid has nothing to measure against. */
  hasTarget: boolean;
}) {
  const t = useT();

  // The grid's shape comes from the same helper the data did, so the cells and
  // the days line up by construction rather than by both counting to 28.
  const grid = useMemo(() => {
    const byDay = new Map(days.map((day) => [day.day, day]));
    return calendarWeeks({ weeks, now }).map((week) =>
      week.map((cell): IntakeDay => ({ ...cell, intake: byDay.get(cell.date) })),
    );
  }, [days, weeks, now]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("trends.adherence")}</h3>
        <HeatmapGrid
          weeks={grid}
          colourFor={(day) =>
            ADHERENCE_COLOUR[
              adherenceStep(
                day.intake?.mealsTicked ?? 0,
                day.intake?.mealsAvailable ?? 0,
              )
            ]
          }
          titleFor={(day) =>
            day.intake === undefined || day.intake.mealsTicked === 0
              ? t("trends.nothingTicked")
              : t("trends.mealsOf", {
                  ticked: day.intake.mealsTicked,
                  total: day.intake.mealsAvailable,
                })
          }
          caption={t("trends.adherenceCaption")}
          legend={
            <HeatmapLegend
              from={t("history.less")}
              to={t("history.more")}
              colours={ADHERENCE_COLOUR}
            />
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t("trends.calories")}</h3>
        {hasTarget ? (
          <HeatmapGrid
            weeks={grid}
            colourFor={(day) => {
              const step = calorieStep(day.intake?.kcalDelta);
              // `null` is "no target, or nothing logged" — which is not the
              // same as landing on target, and must not be drawn as it.
              return step === null ? "var(--kcal-none)" : CALORIE_COLOUR[step + 2];
            }}
            titleFor={(day) => {
              const delta = day.intake?.kcalDelta;
              if (delta === undefined) return t("trends.noKcal");
              const rounded = Math.round(delta);
              return rounded === 0
                ? t("trends.onTarget")
                : t("trends.kcalOff", {
                    delta: `${rounded > 0 ? "+" : ""}${rounded.toLocaleString()}`,
                  });
            }}
            caption={t("trends.caloriesCaption")}
            legend={
              <HeatmapLegend
                from={t("trends.under")}
                to={t("trends.over")}
                colours={CALORIE_COLOUR}
              />
            }
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t("trends.needTarget")}</p>
        )}
      </section>
    </div>
  );
}
