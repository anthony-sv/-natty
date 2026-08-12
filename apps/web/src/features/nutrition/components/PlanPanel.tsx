import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  DropletsIcon,
  FlameIcon,
  PillIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { useWeekdayLabels } from "@/i18n/use-weekdays";
import type { DietPlan, Weekday } from "@/data/diets";
import { useBodyEntries } from "@/features/body/collection";
import { toKilograms } from "@/lib/units";
import {
  dayTotals,
  deficitPerDay,
  effectiveTargetKcal,
  kcalOf,
  proteinPerKg,
  resolveDay,
  weekdayOf,
  weekdays,
  weeklyRateKg,
  type SwapChoices,
} from "../macros";
import {
  CREATINE_ML,
  DEFAULT_TRAINING_HOURS,
  ML_PER_KG,
  ML_PER_TRAINING_HOUR,
  formatLitres,
  hydrationOptions,
  type HydrationRow,
} from "../hydration";
import { MacroSplit } from "./MacroSplit";
import { usePantry } from "@/features/pantry/use-pantry";
import { MealCard } from "./MealCard";

/** The plan, for whichever day you're looking at. */
export function PlanPanel({ plan }: { plan: DietPlan }) {
  // Lazily, not during render — the purity lint rule rejects a `new Date()`
  // there, the same way it rejects `Date.now()`.
  const t = useT();
  const names = useNames();
  const weekdayLabels = useWeekdayLabels();
  const [today] = useState(() => weekdayOf(new Date()));
  const [day, setDay] = useState<Weekday>(today);
  const [choices, setChoices] = useState<SwapChoices>({});

  // Built-ins, your foods and your recipes — so a plan can hold any of them.
  const foods = usePantry();
  const meals = resolveDay(plan, day, foods, choices);
  const macros = dayTotals(meals);
  const kcal = kcalOf(macros);

  const { latest } = useBodyEntries();
  const bodyWeightKg = latest
    ? toKilograms(latest.weight, latest.unit)
    : undefined;
  const perKg = proteinPerKg(macros, bodyWeightKg);

  const deficit = deficitPerDay(plan);
  const rate = weeklyRateKg(plan);
  const target = effectiveTargetKcal(plan);

  // Derived from your latest weigh-in, which the panel already reads for
  // `proteinPerKg` — so this needed no new plumbing.
  const water =
    bodyWeightKg !== undefined ? hydrationOptions(bodyWeightKg) : undefined;

  // Only the macros the plan names, each as its own phrase — built here rather
  // than as one message with three holes, because a plan may fill any subset.
  const statedTargets = (
    [
      ["protein", t("nutrition.protein")],
      ["carbs", t("nutrition.carbs")],
      ["fat", t("nutrition.fat")],
    ] as const
  )
    .filter(([key]) => plan.targets[key] !== undefined)
    .map(([key, label]) => `${plan.targets[key]}g ${label.toLowerCase()}`);

  return (
    <div className="flex flex-col gap-6">
      {/* Each tile appears only when the plan actually says enough to fill it.
          A plan of your own may state no maintenance figure and no target, and
          a row reading "Deficit 0 kcal/day" would be a claim — a missing tile
          isn't. A plan with none of them renders no strip at all. */}
      {plan.tdeeKcal !== undefined || target !== undefined ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {plan.tdeeKcal !== undefined ? (
            <Stat
              icon={FlameIcon}
              label={t("nutrition.tdee")}
              value={plan.tdeeKcal.toLocaleString()}
              unit="kcal"
            />
          ) : null}
          {target !== undefined ? (
            <Stat
              icon={TargetIcon}
              label={t("nutrition.target")}
              value={target.kcal.toLocaleString()}
              unit="kcal"
              // Says where the number came from when it wasn't typed: a target
              // implied by the macro targets is still a target, but presenting
              // it as one you stated would be putting words in your mouth.
              note={target.derived ? t("nutrition.fromMacros") : undefined}
            />
          ) : null}
          {deficit !== undefined && rate !== undefined ? (
            <>
              <Stat
                icon={deficit >= 0 ? TrendingDownIcon : TrendingUpIcon}
                label={
                  deficit >= 0 ? t("nutrition.deficit") : t("nutrition.surplus")
                }
                value={Math.abs(deficit).toLocaleString()}
                unit={t("nutrition.kcalPerDay")}
              />
              <Stat
                icon={deficit >= 0 ? TrendingDownIcon : TrendingUpIcon}
                label={t("nutrition.pace")}
                value={`${Math.abs(rate).toFixed(2)}`}
                unit={t("nutrition.kgPerWeek")}
              />
            </>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("nutrition.dailyTargets")}</CardTitle>
          {/* Lists only the macros the plan actually names, so a
              protein-only goal doesn't read as "0g carbs · 0g fat". The ring
              below always shows what the meals come to, target or not. */}
          {statedTargets.length > 0 ? (
            <CardDescription>
              {statedTargets.join(" · ")}
              {perKg !== undefined
                ? ` · ${t("nutrition.perKg", { perKg: perKg.toFixed(1) })}`
                : ""}
              {" "}
              {t("nutrition.ringNote")}
            </CardDescription>
          ) : (
            <CardDescription>{t("nutrition.noTargets")}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <MacroSplit macros={macros} caption={weekdayLabels[day]} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("nutrition.day")}</span>
        <ToggleGroup
          value={[day]}
          onValueChange={(value) => {
            const next = value[0] as Weekday | undefined;
            if (next) setDay(next);
          }}
          className="flex-wrap"
        >
          {weekdays().map((candidate) => (
            <ToggleGroupItem key={candidate} value={candidate}>
              {weekdayLabels[candidate]}
              {candidate === today ? (
                <span className="ml-1 text-xs opacity-60">
                  {t("nutrition.today")}
                </span>
              ) : null}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {meals.map((meal) => (
        <MealCard
          foods={foods}
          key={meal.name}
          meal={meal}
          dayKcal={kcal}
          onChooseOption={(index) =>
            setChoices((current) => ({ ...current, [meal.name]: index }))
          }
        />
      ))}

      {plan.supplements.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PillIcon className="size-4 text-muted-foreground" />{" "}
              {t("nutrition.supplements")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {plan.supplements.map((supplement) => (
              <div
                key={supplement.name}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
              >
                <span className="font-medium">
                  {names.text(supplement.name)}
                </span>
                <Badge variant="secondary">{names.text(supplement.dose)}</Badge>
                <span className="text-sm text-muted-foreground">
                  {names.text(supplement.timing)}
                  {supplement.note ? ` — ${names.text(supplement.note)}` : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DropletsIcon className="size-4 text-muted-foreground" />{" "}
            {t("nutrition.hydration")}
          </CardTitle>
          <CardDescription>
            {bodyWeightKg !== undefined
              ? t("nutrition.hydrationBody", {
                  weight: `${bodyWeightKg.toFixed(1)} kg`,
                })
              : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* No weigh-in, no number. The whole point of deriving this is that
              it's yours — showing the author's litres to someone who hasn't
              logged a weight would be the exact thing this replaced. */}
          {water === undefined ? (
            <Empty>
              <EmptyTitle>{t("nutrition.hydrationNoWeight")}</EmptyTitle>
              <EmptyDescription>
                <Link to="/progress">{t("nutrition.hydrationLogWeight")}</Link>
              </EmptyDescription>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid gap-6 sm:grid-cols-2">
                <HydrationColumn
                  title={t("nutrition.restDay")}
                  rows={water.restDay}
                />
                <HydrationColumn
                  title={t("nutrition.trainingDay")}
                  rows={water.trainingDay}
                  note={t("nutrition.hydrationHours", {
                    hours: DEFAULT_TRAINING_HOURS,
                  })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("nutrition.hydrationFormula", {
                  perKg: ML_PER_KG,
                  creatine: CREATINE_ML,
                  perHour: ML_PER_TRAINING_HOUR,
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {plan.notes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("nutrition.notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 pl-4 text-sm text-muted-foreground">
              {plan.notes.map((note) => (
                <li key={note}>{names.text(note)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function HydrationColumn({
  title,
  rows,
  note,
}: {
  title: string;
  rows: HydrationRow[];
  /** "assumes 1 hour of training" — only the training column carries one. */
  note?: string;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{title}</span>
      {rows.map((row) => (
        <div key={row.zeroCokes} className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums">
            {formatLitres(row.litres)}
          </span>
          <span className="text-sm text-muted-foreground">
            {row.zeroCokes === 0
              ? t("nutrition.waterOnly")
              : t.plural("nutrition.zeroCokes", row.zeroCokes)}
          </span>
        </div>
      ))}
      {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
  note,
}: {
  icon: typeof FlameIcon;
  label: string;
  value: string;
  unit: string;
  /** Provenance, when the figure was computed rather than stated. */
  note?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold tabular-nums">
          {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
        </span>
        {note ? (
          <span className="text-xs text-muted-foreground">{note}</span>
        ) : null}
      </div>
    </div>
  );
}
