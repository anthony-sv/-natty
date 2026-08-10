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
import type { DietPlan, Weekday } from "@/data/diets";
import { useBodyEntries } from "@/features/body/collection";
import { toKilograms } from "@/lib/units";
import {
  WEEKDAY_LABELS,
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
        <Stat icon={FlameIcon} label="TDEE" value={plan.tdeeKcal.toLocaleString()} unit="kcal" />
        <Stat icon={TargetIcon} label="Target" value={plan.targetKcal.toLocaleString()} unit="kcal" />
        <Stat
          icon={deficit >= 0 ? TrendingDownIcon : TrendingUpIcon}
          label={deficit >= 0 ? "Deficit" : "Surplus"}
          value={Math.abs(deficit).toLocaleString()}
          unit="kcal/day"
        />
        <Stat
          icon={deficit >= 0 ? TrendingDownIcon : TrendingUpIcon}
          label="Rough pace"
          value={`${Math.abs(rate).toFixed(2)}`}
          unit="kg/week"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily targets</CardTitle>
          <CardDescription>
            {plan.targets.protein}g protein · {plan.targets.carbs}g carbs ·{" "}
            {plan.targets.fat}g fat
            {perKg !== undefined
              ? ` — ${perKg.toFixed(1)}g of protein per kg at your last weigh-in`
              : ""}
            . The ring shows what the meals below actually add to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MacroSplit macros={macros} caption={WEEKDAY_LABELS[day]} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Day</span>
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
              {WEEKDAY_LABELS[candidate]}
              {candidate === today ? (
                <span className="ml-1 text-xs opacity-60">today</span>
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
              <PillIcon className="size-4 text-muted-foreground" /> Supplements
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {plan.supplements.map((supplement) => (
              <div
                key={supplement.name}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
              >
                <span className="font-medium">{supplement.name}</span>
                <Badge variant="secondary">{supplement.dose}</Badge>
                <span className="text-sm text-muted-foreground">
                  {supplement.timing}
                  {supplement.note ? ` — ${supplement.note}` : ""}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DropletsIcon className="size-4 text-muted-foreground" /> Hydration
          </CardTitle>
          <CardDescription>
            A zero-sugar coke counts toward the total, but not one for one — the
            alternatives are listed rather than calculated.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <HydrationColumn title="Rest day" options={hydration.restDay} />
          <HydrationColumn title="Training day" options={hydration.trainingDay} />
        </CardContent>
      </Card>

      {plan.notes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 pl-4 text-sm text-muted-foreground">
              {plan.notes.map((note) => (
                <li key={note}>{note}</li>
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
              ? "water only"
              : `+ ${option.zeroCokes} zero coke${option.zeroCokes === 1 ? "" : "s"}`}
            {option.note ? `, ${option.note}` : ""}
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
