import { useState } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { hydration } from "@/data/diets";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { useWeekdayLabels } from "@/i18n/use-weekdays";
import type { DietPlan, Weekday } from "@/data/diets";
import { useBodyEntries } from "@/features/body/collection";
import { toKilograms } from "@/lib/units";
import {
  dayTotals,
  deficitPerDay,
  kcalOf,
  proteinPerKg,
  resolveDay,
  weekdayOf,
  weekdays,
  weeklyRateKg,
  type SwapChoices,
} from "../macros";
import { MacroSplit } from "./MacroSplit";
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

  const meals = resolveDay(plan, day, choices);
  const macros = dayTotals(meals);
  const kcal = kcalOf(macros);

  const { latest } = useBodyEntries();
  const bodyWeightKg = latest
    ? toKilograms(latest.weight, latest.unit)
    : undefined;
  const perKg = proteinPerKg(macros, bodyWeightKg);

  const deficit = deficitPerDay(plan);
  const rate = weeklyRateKg(plan);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          icon={FlameIcon}
          label={t("nutrition.tdee")}
          value={plan.tdeeKcal.toLocaleString()}
          unit="kcal"
        />
        <Stat
          icon={TargetIcon}
          label={t("nutrition.target")}
          value={plan.targetKcal.toLocaleString()}
          unit="kcal"
        />
        <Stat
          icon={deficit >= 0 ? TrendingDownIcon : TrendingUpIcon}
          label={deficit >= 0 ? t("nutrition.deficit") : t("nutrition.surplus")}
          value={Math.abs(deficit).toLocaleString()}
          unit={t("nutrition.kcalPerDay")}
        />
        <Stat
          icon={deficit >= 0 ? TrendingDownIcon : TrendingUpIcon}
          label={t("nutrition.pace")}
          value={`${Math.abs(rate).toFixed(2)}`}
          unit={t("nutrition.kgPerWeek")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("nutrition.dailyTargets")}</CardTitle>
          <CardDescription>
            {perKg === undefined
              ? t("nutrition.targetsBody", {
                  protein: plan.targets.protein,
                  carbs: plan.targets.carbs,
                  fat: plan.targets.fat,
                })
              : t("nutrition.targetsBodyPerKg", {
                  protein: plan.targets.protein,
                  carbs: plan.targets.carbs,
                  fat: plan.targets.fat,
                  perKg: perKg.toFixed(1),
                })}
          </CardDescription>
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
          <CardDescription>{t("nutrition.hydrationBody")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <HydrationColumn
            title={t("nutrition.restDay")}
            options={hydration.restDay}
          />
          <HydrationColumn
            title={t("nutrition.trainingDay")}
            options={hydration.trainingDay}
          />
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
  options,
}: {
  title: string;
  options: typeof hydration.restDay;
}) {
  const t = useT();
  const names = useNames();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{title}</span>
      {options.map((option) => (
        <div
          key={`${option.litres}-${option.zeroCokes}`}
          className="flex items-baseline gap-2"
        >
          <span className="text-lg font-semibold tabular-nums">
            {option.litres}L
          </span>
          <span className="text-sm text-muted-foreground">
            {option.zeroCokes === 0
              ? t("nutrition.waterOnly")
              : t.plural("nutrition.zeroCokes", option.zeroCokes)}
            {option.note ? `, ${names.text(option.note)}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof FlameIcon;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-lg font-semibold tabular-nums">
          {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
        </span>
      </div>
    </div>
  );
}
