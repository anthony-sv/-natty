import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
import type { DietPlan, MealItem } from "@/data/diets";
import {
  filterFoodOption,
  useFoodOptions,
  usePantry,
  type FoodOption,
} from "@/features/pantry/use-pantry";
import { useT } from "@/i18n/use-t";
import { createUserDiet, dietSlugFor, updateUserDiet } from "../../collection";
import { kcalOf, totalFor } from "../../macros";
import {
  emptyMeal,
  toDietPlan,
  type DraftMeal,
  type DraftPlan,
} from "./draft";

const GOALS = ["cutting", "bulking", "maintenance"] as const;

export function DietPlanBuilder({
  initial,
  existingSlug,
}: {
  initial: DraftPlan;
  existingSlug?: string;
}) {
  const t = useT();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(initial);
  const pantry = usePantry();

  const plan = toDietPlan(draft, existingSlug ?? "preview");
  const canSave = plan !== undefined;

  function save() {
    if (plan === undefined) return;
    const slug = existingSlug ?? dietSlugFor(draft.name);
    const toSave: DietPlan = { ...plan, slug };

    const transaction = existingSlug
      ? updateUserDiet(existingSlug, toSave)
      : createUserDiet(toSave).transaction;

    void toast.promise(transaction.isPersisted.promise, {
      loading: t("dietBuilder.saving"),
      success: { title: t("dietBuilder.saved", { name: toSave.name }), type: "success" },
      error: { title: t("dietBuilder.saveError"), type: "error" },
    });
    void navigate({ to: "/nutrition", search: { plan: slug } });
  }

  const update = (patch: Partial<DraftPlan>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const goals = GOALS.map((value) => ({
    value,
    label: t(`dietBuilder.goal.${value}` as never),
  }));

  // What the meals actually add to, against what you said you were aiming for.
  // Derived, never stored — the same rule the built-in plans follow.
  const running = plan
    ? plan.meals.reduce(
        (total, meal) => {
          const macros = totalFor(meal.variants[0]!.options[0]!.items, pantry);
          return {
            protein: total.protein + macros.protein,
            carbs: total.carbs + macros.carbs,
            fat: total.fat + macros.fat,
          };
        },
        { protein: 0, carbs: 0, fat: 0 },
      )
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="plan-name">{t("dietBuilder.name")}</FieldLabel>
          <Input
            id="plan-name"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </Field>

        <div className="flex flex-wrap gap-4">
          <Field className="w-40">
            <FieldLabel>{t("dietBuilder.goal")}</FieldLabel>
            <Select
              items={goals}
              value={draft.goal}
              onValueChange={(value) =>
                update({ goal: value as DraftPlan["goal"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>
                    {goal.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field className="w-44">
            <FieldLabel htmlFor="plan-tdee">{t("dietBuilder.tdee")}</FieldLabel>
            <Input
              id="plan-tdee"
              type="number"
              min="1"
              value={draft.tdeeKcal}
              onChange={(e) => update({ tdeeKcal: e.target.value })}
            />
          </Field>

          <Field className="w-44">
            <FieldLabel htmlFor="plan-target">{t("dietBuilder.target")}</FieldLabel>
            <Input
              id="plan-target"
              type="number"
              min="1"
              value={draft.targetKcal}
              onChange={(e) => update({ targetKcal: e.target.value })}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>{t("dietBuilder.targets")}</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["protein", t("pantry.protein")],
                ["carbs", t("pantry.carbs")],
                ["fat", t("pantry.fat")],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex flex-col gap-1">
                <Label htmlFor={`target-${key}`} className="text-xs">
                  {label}
                </Label>
                <Input
                  id={`target-${key}`}
                  type="number"
                  min="0"
                  className="w-28"
                  value={draft.targets[key]}
                  onChange={(e) =>
                    update({ targets: { ...draft.targets, [key]: e.target.value } })
                  }
                />
              </div>
            ))}
          </div>
          <FieldDescription>{t("dietBuilder.targetsHint")}</FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("dietBuilder.meals")}</h2>
          {running ? (
            <span className="text-sm tabular-nums text-muted-foreground">
              {t("dietBuilder.running", {
                macros: `P${running.protein.toFixed(0)} · C${running.carbs.toFixed(0)} · F${running.fat.toFixed(0)} · ${Math.round(kcalOf(running)).toLocaleString()} kcal`,
              })}
            </span>
          ) : null}
        </div>

        {draft.meals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dietBuilder.noMeals")}
          </p>
        ) : null}

        {draft.meals.map((meal, index) => (
          <MealEditor
            key={index}
            meal={meal}
            onChange={(patch) =>
              update({
                meals: draft.meals.map((m, i) =>
                  i === index ? { ...m, ...patch } : m,
                ),
              })
            }
            onRemove={() =>
              update({ meals: draft.meals.filter((_, i) => i !== index) })
            }
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() =>
            update({ meals: [...draft.meals, emptyMeal(draft.meals.length)] })
          }
        >
          <PlusIcon data-icon="inline-start" />
          {t("dietBuilder.addMeal")}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button disabled={!canSave} onClick={save}>
          {t("dietBuilder.save")}
        </Button>
        <Button variant="ghost" onClick={() => void navigate({ to: "/nutrition" })}>
          {t("dietBuilder.cancel")}
        </Button>
      </div>
    </div>
  );
}

function MealEditor({
  meal,
  onChange,
  onRemove,
}: {
  meal: DraftMeal;
  onChange: (patch: Partial<DraftMeal>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const hasSwaps = meal.options.length > 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="max-w-48"
            aria-label={t("dietBuilder.mealName")}
            value={meal.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <Input
            className="max-w-64"
            placeholder={t("dietBuilder.mealNotePlaceholder")}
            aria-label={t("dietBuilder.mealNote")}
            value={meal.note}
            onChange={(e) => onChange({ note: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-muted-foreground"
            aria-label={t("dietBuilder.removeMeal", { name: meal.name })}
            onClick={onRemove}
          >
            <XIcon />
          </Button>
        </div>
        {hasSwaps ? (
          <CardTitle className="text-xs font-normal text-muted-foreground">
            {t("dietBuilder.optionsHint")}
          </CardTitle>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {meal.options.map((option, index) => (
          <div key={index} className="flex flex-col gap-2">
            {hasSwaps ? (
              <div className="flex items-center gap-2">
                <Input
                  className="max-w-48"
                  placeholder={t("dietBuilder.optionLabelPlaceholder")}
                  aria-label={t("dietBuilder.optionLabel")}
                  value={option.label}
                  onChange={(e) =>
                    onChange({
                      options: meal.options.map((o, i) =>
                        i === index ? { ...o, label: e.target.value } : o,
                      ),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto text-muted-foreground"
                  aria-label={t("dietBuilder.removeOption", { number: index + 1 })}
                  onClick={() =>
                    onChange({
                      options: meal.options.filter((_, i) => i !== index),
                    })
                  }
                >
                  <XIcon />
                </Button>
              </div>
            ) : null}

            <ItemList
              items={option.items}
              onChange={(items) =>
                onChange({
                  options: meal.options.map((o, i) =>
                    i === index ? { ...o, items } : o,
                  ),
                })
              }
            />
          </div>
        ))}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() =>
            onChange({ options: [...meal.options, { label: "", items: [] }] })
          }
        >
          <PlusIcon data-icon="inline-start" />
          {t("dietBuilder.addOption")}
        </Button>
      </CardContent>
    </Card>
  );
}

function ItemList({
  items,
  onChange,
}: {
  items: MealItem[];
  onChange: (next: MealItem[]) => void;
}) {
  const t = useT();
  const options = useFoodOptions();
  const pantry = usePantry();

  const macros = totalFor(items, pantry);

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("dietBuilder.nothingIn")}
        </p>
      ) : null}

      {items.map((item, index) => {
        const selected = options.find((o) => o.id === item.foodId) ?? null;
        return (
          <div
            key={index}
            className="flex flex-wrap items-end gap-2 rounded-md border p-2"
          >
            <div className="flex min-w-48 flex-1 flex-col gap-1">
              <Combobox
                items={options}
                filter={filterFoodOption}
                value={selected}
                onValueChange={(option: FoodOption | null) =>
                  onChange(
                    items.map((it, i) =>
                      i === index ? { ...it, foodId: option?.id ?? "" } : it,
                    ),
                  )
                }
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
                          {/* Which half it came from, since a recipe and an
                              ingredient read the same otherwise. */}
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
                  value={String(item.amount)}
                  onChange={(e) =>
                    onChange(
                      items.map((it, i) =>
                        i === index
                          ? { ...it, amount: Number(e.target.value) }
                          : it,
                      ),
                    )
                  }
                />
                <span className="text-xs text-muted-foreground">
                  {selected && selected.unit !== "unit" ? selected.unit : ""}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="ml-auto text-muted-foreground"
              aria-label={t("dietBuilder.removeItem", {
                name: selected?.name ?? t("nutrition.item"),
              })}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <XIcon />
            </Button>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, { foodId: "", amount: 100 }])}
        >
          <PlusIcon data-icon="inline-start" />
          {t("dietBuilder.addItem")}
        </Button>
        {items.length > 0 ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            P{macros.protein.toFixed(0)} · C{macros.carbs.toFixed(0)} · F
            {macros.fat.toFixed(0)} ·{" "}
            {Math.round(kcalOf(macros)).toLocaleString()} kcal
          </span>
        ) : null}
      </div>
    </div>
  );
}
