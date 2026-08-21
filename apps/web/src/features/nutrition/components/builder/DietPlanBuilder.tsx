import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { PlusIcon, XIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import type { DietPlan, MealItem } from "@/data/diets";
import { ComboboxOptionGroup } from "@/components/combobox-option-group";
import { useBodyEntries } from "@/features/body/collection";
import { ageFromBirthDate } from "@/features/log/heart-rate";
import { profileStore } from "@/features/profile/profile-store";
import { useRoutine } from "@/features/routines/use-routines";
import { summariseRoutine } from "@/features/routines/lib/summary";
import {
  filterFoodOption,
  useFoodOptions,
  useGroupedFoodOptions,
  usePantry,
  type FoodOption,
  type FoodOptionGroup,
} from "@/features/pantry/use-pantry";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";
import { toKilograms } from "@/lib/units";
import {
  createUserDiet,
  dietSlugFor,
  isBuiltInDietSlug,
  saveBuiltInDietOverride,
  updateUserDiet,
} from "../../collection";
import {
  TARGET_TOLERANCE_G,
  compareToTargets,
  effectiveTargetKcal,
  kcalOf,
  targetsSelfCheck,
  TARGET_TOLERANCE_KCAL,
  totalFor,
} from "../../macros";
import {
  activityFactorForTrainingDays,
  estimatedBmr,
  estimatedTdee,
  suggestedTargetKcal,
} from "../../tdee";
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
  const formatting = useFormatting();
  const [draft, setDraft] = useState(initial);
  const [confirmGaps, setConfirmGaps] = useState(false);
  const pantry = usePantry();
  // Read once on mount rather than during render, per `react-hooks/purity`.
  const [now] = useState(() => Date.now());

  const plan = toDietPlan(draft, existingSlug ?? "preview");
  const canSave = plan !== undefined;

  // What TDEE and target-calorie figures we can offer to fill in for you —
  // never written until you press "Use", since these fields are already
  // free-text and silently overwriting what you typed would fight you.
  const profile = useStore(profileStore, (s) => s);
  const { latest: latestBodyEntry } = useBodyEntries();
  const { routine: activeRoutine } = useRoutine(profile.activeRoutineSlug ?? "");

  const bodyWeightKg =
    latestBodyEntry !== undefined
      ? toKilograms(latestBodyEntry.weight, latestBodyEntry.unit)
      : undefined;
  const age =
    profile.birthDate !== undefined
      ? ageFromBirthDate(profile.birthDate, now)
      : undefined;
  const trainingDays =
    activeRoutine !== undefined
      ? summariseRoutine(activeRoutine, formatting).trainingDays
      : undefined;

  const bmr =
    bodyWeightKg !== undefined &&
    profile.heightCm !== undefined &&
    age !== undefined &&
    profile.sex !== undefined
      ? estimatedBmr({
          weightKg: bodyWeightKg,
          heightCm: profile.heightCm,
          age,
          sex: profile.sex,
        })
      : undefined;

  const suggestedTdee =
    bmr !== undefined && trainingDays !== undefined
      ? Math.round(estimatedTdee(bmr, activityFactorForTrainingDays(trainingDays)))
      : undefined;

  // The target follows whatever TDEE is actually in the field — typed or
  // already filled from the suggestion above — falling back to the estimate
  // only while that field is still blank.
  const typedTdee = Number(draft.tdeeKcal);
  const tdeeForTarget =
    draft.tdeeKcal.trim() !== "" && Number.isFinite(typedTdee)
      ? typedTdee
      : suggestedTdee;
  const suggestedTarget =
    tdeeForTarget !== undefined
      ? suggestedTargetKcal(tdeeForTarget, draft.goal)
      : undefined;

  function save(asDraft: boolean) {
    if (plan === undefined) return;
    const slug = existingSlug ?? dietSlugFor(draft.name);
    const toSave: DietPlan = { ...plan, slug };

    // Editing a built-in saves your version at its slug, so it replaces the
    // shipped plan in the picker — see `saveBuiltInDietOverride`. There's no
    // row to update the first time, which is why `updateUserDiet` can't do it.
    const transaction =
      existingSlug === undefined
        ? createUserDiet(toSave, asDraft).transaction
        : isBuiltInDietSlug(existingSlug)
          ? saveBuiltInDietOverride(toSave, asDraft)
          : updateUserDiet(existingSlug, toSave, asDraft);

    void toast.promise(transaction.isPersisted.promise, {
      loading: t("dietBuilder.saving"),
      success: { title: t("dietBuilder.saved", { name: toSave.name }), type: "success" },
      error: { title: t("dietBuilder.saveError"), type: "error" },
    });
    // `?plan=` lands you on the plan you just saved without touching which
    // one is *active* — setting `activeDietSlug` here used to mean fixing a
    // typo in an old plan silently swapped your standing pick out from under
    // you, the same mistake `ActivateProgramButton` deliberately avoids by
    // keeping activation its own explicit gesture, separate from editing.
    void navigate({ to: "/nutrition", search: { plan: slug } });
  }

  /** Off-target saves ask first; a plan that lands just saves. */
  function attemptSave() {
    if (gaps.length > 0) setConfirmGaps(true);
    else save(false);
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

  // What the day's first option of every meal comes to, against what the plan
  // says it's aiming for. Empty when it lands, and also when no targets were
  // stated — both mean "nothing to warn about".
  const gaps =
    plan && running ? compareToTargets(running, plan.targets) : [];

  // Whether the plan's two statements of its own calorie target agree — the
  // daily figure you typed, and what your macro targets multiply out to.
  const selfCheck = plan ? targetsSelfCheck(plan) : undefined;

  // The meals' calories against the target. Absent from this row entirely
  // until now, so a day 79 kcal over read exactly like one that landed.
  const targetKcal = plan ? effectiveTargetKcal(plan) : undefined;
  const kcalDelta =
    running && targetKcal ? kcalOf(running) - targetKcal.kcal : undefined;

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
              placeholder={t("common.optional")}
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
              placeholder={t("common.optional")}
              value={draft.targetKcal}
              onChange={(e) => update({ targetKcal: e.target.value })}
            />
          </Field>
        </div>

        {/* Estimated from the profile, latest weigh-in and the active
            routine's training days — visible before you commit to it, the
            same reasoning `SetLogControl`'s "Try" badge shows a suggestion
            before the popover opens. Never written until "Use" is pressed:
            these fields already take free text, and silently overwriting a
            typed value would fight whoever's editing it. */}
        <FieldDescription>
          {suggestedTdee !== undefined ? (
            <span className="flex flex-wrap items-center gap-x-1.5">
              {t("dietBuilder.tdeeSuggested", { kcal: suggestedTdee })}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => update({ tdeeKcal: String(suggestedTdee) })}
              >
                {t("dietBuilder.useSuggested")}
              </button>
            </span>
          ) : (
            <span className="flex flex-wrap items-center gap-x-1.5">
              {t("dietBuilder.tdeeMissing")}
              <Link
                to="/profile"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {t("dietBuilder.tdeeMissingProfileLink")}
              </Link>
              {t("dietBuilder.tdeeMissingAnd")}
              <Link
                to="/routines"
                className="underline underline-offset-2 hover:text-foreground"
              >
                {t("dietBuilder.tdeeMissingRoutineLink")}
              </Link>
              {t("dietBuilder.tdeeMissingEnd")}
            </span>
          )}
        </FieldDescription>
        <FieldDescription>
          {suggestedTarget !== undefined ? (
            <span className="flex flex-wrap items-center gap-x-1.5">
              {t("dietBuilder.targetSuggested", { kcal: suggestedTarget })}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => update({ targetKcal: String(suggestedTarget) })}
              >
                {t("dietBuilder.useSuggested")}
              </button>
            </span>
          ) : null}
        </FieldDescription>

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
                  placeholder={t("common.optional")}
                  value={draft.targets[key]}
                  onChange={(e) =>
                    update({ targets: { ...draft.targets, [key]: e.target.value } })
                  }
                />
              </div>
            ))}
          </div>
          <FieldDescription>{t("dietBuilder.targetsHint")}</FieldDescription>
          {/* Sits under the macro boxes rather than beside the totals, because
              this is a contradiction between two things *you typed* — the
              meals below have nothing to do with it and can't fix it. */}
          {selfCheck ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-muted-foreground">
              {t("dietBuilder.targetsDisagree", {
                fromMacros: Math.round(selfCheck.fromMacros).toLocaleString(),
                statedKcal: selfCheck.statedKcal.toLocaleString(),
                delta: `${selfCheck.delta > 0 ? "+" : ""}${Math.round(selfCheck.delta).toLocaleString()}`,
              })}
            </p>
          ) : null}
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("dietBuilder.meals")}</h2>
          {/* Live, per macro, with the shortfall beside each — so the gap is
              visible while you're still adding food rather than only in a
              dialog at the end. */}
          {running ? (
            <span className="flex flex-wrap items-baseline gap-x-3 text-sm tabular-nums text-muted-foreground">
              {(
                [
                  ["protein", "P"],
                  ["carbs", "C"],
                  ["fat", "F"],
                ] as const
              ).map(([macro, letter]) => {
                const target = plan?.targets[macro];
                const delta =
                  target === undefined ? undefined : running[macro] - target;
                return (
                  <span key={macro}>
                    {letter}
                    {running[macro].toFixed(0)}
                    {delta !== undefined &&
                    Math.abs(delta) > TARGET_TOLERANCE_G ? (
                      // Both directions read as off-target. Only a shortfall
                      // used to, so being 30g of fat *over* was drawn in
                      // body ink and looked deliberate.
                      <span className="text-destructive">
                        {" "}
                        {delta > 0 ? "+" : ""}
                        {delta.toFixed(0)}
                      </span>
                    ) : null}
                  </span>
                );
              })}
              <span>
                {Math.round(kcalOf(running)).toLocaleString()} kcal
                {kcalDelta !== undefined &&
                Math.abs(kcalDelta) > TARGET_TOLERANCE_KCAL ? (
                  <span className="text-destructive">
                    {" "}
                    {kcalDelta > 0 ? "+" : ""}
                    {Math.round(kcalDelta).toLocaleString()}
                  </span>
                ) : null}
              </span>
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

      {/* Notes were dropped on save before this existed — so editing a plan's
          name silently deleted whatever you'd written under it. */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("dietBuilder.notes")}</h2>
        {draft.notes.map((note, index) => (
          <div key={index} className="flex items-start gap-2">
            <Textarea
              value={note}
              rows={2}
              className="min-w-0 flex-1"
              placeholder={t("dietBuilder.notePlaceholder")}
              onChange={(e) =>
                update({
                  notes: draft.notes.map((n, i) =>
                    i === index ? e.target.value : n,
                  ),
                })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("dietBuilder.removeNote")}
              onClick={() =>
                update({ notes: draft.notes.filter((_, i) => i !== index) })
              }
            >
              <XIcon />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => update({ notes: [...draft.notes, ""] })}
        >
          <PlusIcon data-icon="inline-start" />
          {t("dietBuilder.addNote")}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button disabled={!canSave} onClick={attemptSave}>
          {t("dietBuilder.save")}
        </Button>
        <Button variant="ghost" onClick={() => void navigate({ to: "/nutrition" })}>
          {t("dietBuilder.cancel")}
        </Button>
      </div>

      {/* Not a blocker — an unfinished plan is a normal thing to have, and the
          old behaviour of saving silently made one look finished. Saving from
          here flags it as a draft so it's visibly unfinished afterwards. */}
      <AlertDialog open={confirmGaps} onOpenChange={setConfirmGaps}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dietBuilder.gapsTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dietBuilder.gapsBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ul className="flex flex-col gap-1 text-sm tabular-nums">
            {gaps.map((gap) => (
              <li key={gap.macro} className="flex justify-between gap-4">
                <span>{t(`nutrition.${gap.macro}` as never)}</span>
                <span className="text-muted-foreground">
                  {gap.actual.toFixed(0)}g / {gap.target.toFixed(0)}g
                  <span
                    className={
                      gap.delta < 0
                        ? "ml-2 text-destructive"
                        : "ml-2 text-foreground"
                    }
                  >
                    {gap.delta > 0 ? "+" : ""}
                    {gap.delta.toFixed(0)}g
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("dietBuilder.keepEditing")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => save(true)}>
              {t("dietBuilder.saveDraft")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const groups = useGroupedFoodOptions(options);
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
                items={groups}
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
                    {(group: FoodOptionGroup, index: number) => (
                      <ComboboxOptionGroup
                        key={group.key}
                        group={group}
                        index={index}
                      >
                        {(option) => (
                          <ComboboxItem key={option.id} value={option}>
                            <span className="flex items-center gap-2">
                              {option.name}
                              {/* A dish you cooked reads the same as an
                                  ingredient otherwise, and the heading now
                                  says what kind of food it is instead. */}
                              {option.kind === "recipe" ? (
                                <Badge variant="outline">
                                  {t("pantry.recipe")}
                                </Badge>
                              ) : null}
                            </span>
                          </ComboboxItem>
                        )}
                      </ComboboxOptionGroup>
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
