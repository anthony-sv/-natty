import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { addDays, daysBetween, startOfDay } from "@/lib/week";
import { useNames } from "@/i18n/names";
import { useDateFormat, useT } from "@/i18n/use-t";
import {
  effectiveTargetKcal,
  kcalOf,
  resolveDay,
  totalFor,
  weekdayOf,
} from "@/features/nutrition/macros";
import { MacroSplit } from "@/features/nutrition/components/MacroSplit";
import {
  filterFoodOption,
  useFoodOptions,
  usePantry,
  type FoodOption,
} from "@/features/pantry/use-pantry";
import {
  allIntake,
  logItem,
  logMeal,
  removeIntake,
  restoreIntake,
  setMealOption,
} from "../collection";
import { resolveIntake, tickedMeals } from "../intake";
import { useIntake } from "../use-intake";
import type { DietPlan } from "@/data/diets";

/**
 * What you actually ate today, against the plan.
 *
 * The plan tab describes the day; this one records it. **Nothing auto-logs** —
 * opening this panel writes nothing, the same lesson `logSet` learned when
 * advancing through a workout recorded sets nobody performed.
 */
export function TodayPanel({ plan }: { plan: DietPlan }) {
  const t = useT();
  const names = useNames();
  // Lazily — `Date.now()` during render trips `react-hooks/purity`.
  const [today] = useState(() => startOfDay(Date.now()));
  const [day, setDay] = useState(today);

  const pantry = usePantry();
  const { entries } = useIntake();
  const intake = resolveIntake(entries, plan, pantry, day);
  const ticked = tickedMeals(entries, plan.slug, day);

  // The plan's own meals for this weekday — the checklist is over these, not
  // over what's logged, so an untouched meal still has a row to tick.
  const planned = resolveDay(plan, weekdayOf(new Date(day)), pantry);
  const target = effectiveTargetKcal(plan);

  const offset = daysBetween(today, day);
  const dateLabel = useDateFormat({
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(day));

  return (
    <div className="flex flex-col gap-6">
      {/* Day navigation rather than a heatmap. A year grid answers "how
          consistent have I been", which is a training question; the question
          about food is "what have I eaten today". */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label={t("intake.previousDay")}
          onClick={() => setDay((current) => addDays(current, -1))}
        >
          <ChevronLeftIcon />
        </Button>

        <div className="flex flex-col items-center">
          <span className="font-medium">
            {offset === 0
              ? t("intake.today")
              : offset === -1
                ? t("intake.yesterday")
                : dateLabel}
          </span>
          {offset !== 0 ? (
            <span className="text-xs text-muted-foreground">{dateLabel}</span>
          ) : null}
        </div>

        <Button
          variant="outline"
          size="icon"
          aria-label={t("intake.nextDay")}
          // This is a record of what happened, so there is no forward past
          // today to record. Pre-planning is what the plan tab is.
          disabled={offset >= 0}
          onClick={() => setDay((current) => addDays(current, 1))}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("intake.eaten")}</CardTitle>
          <CardDescription>
            {target !== undefined
              ? t("intake.ofTarget", {
                  kcal: Math.round(intake.kcal).toLocaleString(),
                  target: target.kcal.toLocaleString(),
                })
              : t("intake.noTarget", {
                  kcal: Math.round(intake.kcal).toLocaleString(),
                })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <MacroSplit
            macros={intake.totals}
            caption={offset === 0 ? t("intake.today") : dateLabel}
          />

          {/* The same `compareToTargets` the builder's save dialog uses, so the
              two can't disagree about what "off target" means. */}
          {intake.vsTargets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {intake.vsTargets.map((gap) => (
                <Badge key={gap.macro} variant="outline">
                  {t(`nutrition.${gap.macro}`)}{" "}
                  {gap.delta > 0 ? "+" : "−"}
                  {Math.abs(Math.round(gap.delta))}g
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("intake.planMeals")}</CardTitle>
          <CardDescription>{t("intake.planMealsBody")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {planned.map((meal) => {
            const entry = ticked.get(meal.name);
            const variant = meal.variant;
            // The swap shown is the one logged, not the panel's own choice —
            // ticking a meal records which of the four lunches you ate.
            const optionIndex = entry?.optionIndex ?? 0;
            const items = variant.options[optionIndex]?.items ?? meal.items;
            const kcal = kcalOf(totalFor(items, pantry));

            return (
              <div
                key={meal.name}
                className="flex flex-wrap items-center gap-3 rounded-md border p-3"
              >
                <Checkbox
                  id={`meal-${meal.name}`}
                  checked={entry !== undefined}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      logMeal(day, plan.slug, meal.name, optionIndex);
                      return;
                    }
                    // Read the collection, never the render snapshot — the
                    // rule `setsFor` exists for.
                    const current = tickedMeals(allIntake(), plan.slug, day).get(
                      meal.name,
                    );
                    if (current) removeIntake(current.entryId);
                  }}
                />
                <Label
                  htmlFor={`meal-${meal.name}`}
                  className="flex-1 cursor-pointer"
                >
                  {names.text(meal.name)}
                </Label>

                {/* Only where there's a choice to record. */}
                {variant.options.length > 1 ? (
                  <Select
                    items={variant.options.map((option, index) => ({
                      value: String(index),
                      label:
                        option.label !== undefined && option.label !== ""
                          ? names.text(option.label)
                          : t("nutrition.option", { number: index + 1 }),
                    }))}
                    value={String(optionIndex)}
                    onValueChange={(value) => {
                      const next = Number(value ?? 0);
                      if (entry) setMealOption(entry.entryId, next);
                      else logMeal(day, plan.slug, meal.name, next);
                    }}
                  >
                    <SelectTrigger className="w-44" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {variant.options.map((option, index) => (
                        <SelectItem key={index} value={String(index)}>
                          {option.label !== undefined && option.label !== ""
                            ? names.text(option.label)
                            : t("nutrition.option", { number: index + 1 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                <span className="text-sm tabular-nums text-muted-foreground">
                  {Math.round(kcal).toLocaleString()} kcal
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("intake.extras")}</CardTitle>
          <CardDescription>{t("intake.extrasBody")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {intake.extras.map((extra) => (
            <div
              key={extra.entryId}
              className="flex flex-wrap items-center gap-3 rounded-md border p-3"
            >
              <span className="flex-1">
                {extra.food ? names.food(extra.foodId) : t("intake.gone")}{" "}
                <span className="text-muted-foreground">
                  {extra.amount}
                  {extra.food && extra.food.unit !== "unit"
                    ? extra.food.unit
                    : ""}
                </span>
              </span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.round(extra.kcal).toLocaleString()} kcal
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("intake.remove")}
                onClick={() => {
                  const removed = removeIntake(extra.entryId);
                  if (removed === undefined) return;
                  // Immediate with an Undo, the way `deleteSet` is: small,
                  // frequent and fully reversible, so a confirm buys nothing.
                  toast.add({
                    title: t("intake.removed"),
                    type: "success",
                    actionProps: {
                      children: t("history.undo"),
                      onClick: () => void restoreIntake(removed),
                    },
                  });
                }}
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}

          <AddExtra day={day} />
        </CardContent>
      </Card>
    </div>
  );
}

/** One row that logs a food you ate that the plan doesn't name. */
function AddExtra({ day }: { day: number }) {
  const t = useT();
  const options = useFoodOptions();
  const [food, setFood] = useState<FoodOption | null>(null);
  const [amount, setAmount] = useState("");

  const parsed = Number(amount);
  const canAdd = food !== null && Number.isFinite(parsed) && parsed > 0;

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <Label className="text-xs">{t("nutrition.item")}</Label>
        <Combobox
          items={options}
          filter={filterFoodOption}
          value={food}
          onValueChange={(option: FoodOption | null) => setFood(option)}
          itemToStringLabel={(option: FoodOption) => option.name}
        >
          <ComboboxInput placeholder={t("nutrition.item")} />
          <ComboboxContent>
            <ComboboxEmpty>{t("common.noExerciseFound")}</ComboboxEmpty>
            <ComboboxList>
              {(option: FoodOption) => (
                <ComboboxItem key={option.id} value={option}>
                  <span className="flex items-center gap-2">
                    {option.name}
                    {option.kind === "recipe" ? (
                      <Badge variant="outline">{t("pantry.recipe")}</Badge>
                    ) : option.kind === "food" ? (
                      <Badge variant="secondary">{t("pantry.yours")}</Badge>
                    ) : null}
                  </span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("nutrition.amount")}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            className="w-24"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <span className="text-xs text-muted-foreground">
            {food && food.unit !== "unit" ? food.unit : ""}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        disabled={!canAdd}
        onClick={() => {
          if (!canAdd) return;
          logItem(day, food.id, parsed);
          setFood(null);
          setAmount("");
        }}
      >
        <PlusIcon data-icon="inline-start" />
        {t("intake.add")}
      </Button>
    </div>
  );
}
