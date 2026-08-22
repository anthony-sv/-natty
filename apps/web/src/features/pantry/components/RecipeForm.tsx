import { useMemo, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComboboxOptionGroup } from "@/components/combobox-option-group";
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
import type { MealItem } from "@/data/diets";
import { CreateFoodDialog, CreateFoodTrigger } from "./CreateFoodButton";
import {
  kcalOf,
  macrosForItem,
  type FoodSource,
} from "@/features/nutrition/macros";
import { useT } from "@/i18n/use-t";
import { createRecipe, updateRecipe } from "../collection";
import { recipeAsFood, recipeTotal } from "../pantry";
import { cookingMethodSchema, FAT_ADDING_METHODS, type Recipe } from "../schema";
import {
  filterFoodOption,
  useFoodOptions,
  useGroupedFoodOptions,
  usePantry,
  type FoodOption,
  type FoodOptionGroup,
} from "../use-pantry";

const METHODS = cookingMethodSchema.options;

/**
 * A recipe: what's in it, how it was cooked, and how it's measured out.
 *
 * Held as plain state and validated on save rather than as a TanStack Form,
 * for the same reason `RoutineBuilder` is — the ingredient list is a dynamic
 * array where nearly every interaction is structural, and `recipeSchema` is the
 * authority either way.
 */
export function RecipeForm({
  existing,
  initialName,
  initialIngredients,
  onDone,
}: {
  existing?: Recipe;
  /** Seeds the name and ingredient list — only when creating fresh, the same
      way `UserFoodForm.initialName` works. What "make a recipe from these
      ingredients" (a meal's `ItemList`) hands over. */
  initialName?: string;
  initialIngredients?: MealItem[];
  /** The recipe just created, so a caller can fold the meal it came from
      down to a single line that references it. */
  onDone: (recipe?: Recipe) => void;
}) {
  const t = useT();
  const pantry = usePantry();
  const options = useFoodOptions();

  const [name, setName] = useState(existing?.name ?? initialName ?? "");
  const [method, setMethod] = useState(existing?.method ?? "none");
  const [ingredients, setIngredients] = useState<MealItem[]>(
    existing?.ingredients ?? initialIngredients ?? [],
  );
  const [kind, setKind] = useState<"servings" | "weight">(
    existing?.portioning.kind ?? "servings",
  );
  const [servings, setServings] = useState(
    existing?.portioning.kind === "servings"
      ? String(existing.portioning.servings)
      : "4",
  );
  const [cookedGrams, setCookedGrams] = useState(
    existing?.portioning.kind === "weight"
      ? String(existing.portioning.cookedGrams)
      : "",
  );

  const portioning =
    kind === "servings"
      ? Number(servings) > 0
        ? ({ kind: "servings", servings: Math.round(Number(servings)) } as const)
        : undefined
      : Number(cookedGrams) > 0
        ? ({ kind: "weight", cookedGrams: Number(cookedGrams) } as const)
        : undefined;

  const canSave =
    name.trim() !== "" && ingredients.length > 0 && portioning !== undefined;

  // Previewed live off the same functions the meal model will use, so what the
  // form shows and what a plan computes can't disagree.
  const draft: Recipe | undefined = portioning && {
    id: existing?.id ?? "recipe:preview",
    name: name.trim() || "…",
    ingredients,
    method: method === "none" ? undefined : method,
    portioning,
    createdAt: existing?.createdAt ?? 0,
  };
  const total = draft ? recipeTotal(draft, pantry.ingredientSource) : undefined;
  const portion = draft ? recipeAsFood(draft, pantry.ingredientSource) : undefined;

  const methods = METHODS.map((value) => ({
    value,
    label: t(`method.${value}` as never),
  }));

  function save() {
    if (draft === undefined || !canSave) return;
    const input = {
      name: draft.name,
      ingredients: draft.ingredients,
      method: draft.method,
      portioning: draft.portioning,
    };
    // Same reasoning as `UserFoodForm`: `createRecipe` hands back the recipe
    // synchronously, which is what a caller selecting it right away needs —
    // the insert itself resolves in the background.
    const created = existing ? undefined : createRecipe(input);
    const transaction = existing
      ? updateRecipe(existing.id, input)
      : created!.transaction;

    void toast.promise(transaction.isPersisted.promise, {
      loading: t("pantry.saving"),
      success: { title: t("pantry.saved", { name: input.name }), type: "success" },
      error: { title: t("pantry.saveError"), type: "error" },
    });
    onDone(created?.recipe);
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="recipe-name">{t("pantry.name")}</FieldLabel>
        <Input
          id="recipe-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel>{t("pantry.method")}</FieldLabel>
        <Select
          items={methods}
          value={method}
          onValueChange={(value) => setMethod(value as typeof method)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {methods.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>{t("pantry.methodHint")}</FieldDescription>
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("pantry.ingredients")}</span>

        {ingredients.map((item, index) => (
          <IngredientRow
            key={index}
            item={item}
            options={options}
            foods={pantry.ingredientSource}
            onChange={(next) =>
              setIngredients(ingredients.map((it, i) => (i === index ? next : it)))
            }
            onRemove={() =>
              setIngredients(ingredients.filter((_, i) => i !== index))
            }
          />
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setIngredients([...ingredients, { foodId: "", amount: 100 }])
            }
          >
            <PlusIcon data-icon="inline-start" />
            {t("pantry.addIngredient")}
          </Button>
          {/* A nudge rather than a calculation. The method needs fat; how much
              of it ends up in the food is yours to say. */}
          {FAT_ADDING_METHODS.includes(method) ? (
            <span className="text-xs text-muted-foreground">
              {t("pantry.addFat")}
            </span>
          ) : null}
          {ingredients.length === 0 ? (
            <span className="text-xs text-destructive">
              {t("pantry.needIngredient")}
            </span>
          ) : null}
        </div>
      </div>

      <Field>
        <FieldLabel>{t("pantry.portioning")}</FieldLabel>
        <div className="flex flex-wrap items-end gap-2">
          <Select
            items={[
              { value: "servings", label: t("pantry.portioning.servings") },
              { value: "weight", label: t("pantry.portioning.weight") },
            ]}
            value={kind}
            onValueChange={(value) => setKind(value as typeof kind)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="servings">
                {t("pantry.portioning.servings")}
              </SelectItem>
              <SelectItem value="weight">
                {t("pantry.portioning.weight")}
              </SelectItem>
            </SelectContent>
          </Select>

          {kind === "servings" ? (
            <div className="flex flex-col gap-1">
              <Label htmlFor="recipe-servings" className="text-xs">
                {t("pantry.servings")}
              </Label>
              <Input
                id="recipe-servings"
                type="number"
                min="1"
                className="w-24"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Label htmlFor="recipe-cooked" className="text-xs">
                {t("pantry.cookedGrams")}
              </Label>
              <Input
                id="recipe-cooked"
                type="number"
                min="1"
                className="w-32"
                value={cookedGrams}
                onChange={(e) => setCookedGrams(e.target.value)}
              />
            </div>
          )}
        </div>
        {kind === "weight" ? (
          <FieldDescription>{t("pantry.cookedGramsHint")}</FieldDescription>
        ) : null}
      </Field>

      {total && portion ? (
        <div className="flex flex-col gap-1 rounded-md border p-3 text-sm tabular-nums">
          <span className="flex justify-between">
            <span className="text-muted-foreground">
              {t("pantry.recipeTotal")}
            </span>
            <span>
              P{total.protein.toFixed(0)} · C{total.carbs.toFixed(0)} · F
              {total.fat.toFixed(0)} ·{" "}
              {Math.round(kcalOf(total)).toLocaleString()} kcal
            </span>
          </span>
          <span className="flex justify-between">
            <span className="text-muted-foreground">
              {kind === "servings"
                ? t("pantry.perServing")
                : t("pantry.per100Cooked")}
            </span>
            <span>
              P{portion.macros.protein.toFixed(1)} · C
              {portion.macros.carbs.toFixed(1)} · F{portion.macros.fat.toFixed(1)}{" "}
              · {Math.round(kcalOf(portion.macros)).toLocaleString()} kcal
            </span>
          </span>
        </div>
      ) : null}

      <Button disabled={!canSave} onClick={save}>
        {t("pantry.save")}
      </Button>
    </FieldGroup>
  );
}

function IngredientRow({
  item,
  options,
  foods,
  onChange,
  onRemove,
}: {
  item: MealItem;
  options: FoodOption[];
  foods: FoodSource;
  onChange: (next: MealItem) => void;
  onRemove: () => void;
}) {
  const t = useT();
  // Recipes are excluded: an ingredient can't be another recipe in v1.
  // Memoised because it feeds the grouping, which would otherwise rebuild —
  // and hand the Combobox fresh `items` — on every keystroke in the amount box.
  const selectable = useMemo(
    () => options.filter((option) => option.kind !== "recipe"),
    [options],
  );
  const groups = useGroupedFoodOptions(selectable);
  const selected = selectable.find((option) => option.id === item.foodId) ?? null;
  const itemMacros = macrosForItem(item, foods);
  // Watched rather than left uncontrolled, so a search with no matches can
  // offer to add what was typed.
  const [query, setQuery] = useState("");
  const [creatingFood, setCreatingFood] = useState(false);
  // Captured at the moment "add it" is pressed — see `DietPlanBuilder`'s
  // `MealItemRow` for why this can't just read `query` live.
  const [createName, setCreateName] = useState("");

  const selectFood = (option: { id: string; unit: "g" | "ml" | "unit" }) =>
    onChange({
      ...item,
      foodId: option.id,
      // Same reasoning as the diet plan builder's item picker: a unit
      // food (an egg, a scoop) should start at one of it, not the 100
      // that makes sense for a gram or millilitre.
      amount: option.unit === "unit" ? 1 : 100,
    });

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border p-2">
      <div className="flex min-w-48 flex-1 flex-col gap-1">
        <Combobox
          items={groups}
          filter={filterFoodOption}
          value={selected}
          onValueChange={(option: FoodOption | null) =>
            option === null ? onChange({ ...item, foodId: "" }) : selectFood(option)
          }
          onInputValueChange={setQuery}
          itemToStringLabel={(option: FoodOption) => option.name}
        >
          <ComboboxInput placeholder={t("nutrition.item")} />
          <ComboboxContent>
            <ComboboxEmpty>
              <div className="flex flex-col items-center gap-1 py-1">
                <span>{t("common.noFoodFound")}</span>
                <CreateFoodTrigger
                  query={query}
                  onClick={() => {
                    setCreateName(query.trim());
                    setCreatingFood(true);
                  }}
                />
              </div>
            </ComboboxEmpty>
            <ComboboxList>
              {(group: FoodOptionGroup, index: number) => (
                <ComboboxOptionGroup
                  key={group.key}
                  group={group}
                  index={index}
                >
                  {(option) => (
                    <ComboboxItem key={option.id} value={option}>
                      {option.name}
                    </ComboboxItem>
                  )}
                </ComboboxOptionGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* A sibling of the `Combobox`, not nested inside its popover content —
          see `CreateFoodButton`'s own comment for why that split is load-
          bearing rather than tidiness. */}
      <CreateFoodDialog
        open={creatingFood}
        onOpenChange={setCreatingFood}
        initialName={createName}
        onCreated={(food) => {
          setCreatingFood(false);
          selectFood(food);
        }}
      />

      <div className="flex flex-col gap-1">
        <Label className="text-xs">{t("nutrition.amount")}</Label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            step="1"
            className="w-24"
            value={String(item.amount)}
            onChange={(e) => onChange({ ...item, amount: Number(e.target.value) })}
          />
          <span className="text-xs text-muted-foreground">
            {selected && selected.unit !== "unit" ? selected.unit : ""}
          </span>
        </div>
      </div>

      {/* What this ingredient alone contributes to the recipe total below. */}
      {selected ? (
        <span className="pb-1.5 text-xs tabular-nums text-muted-foreground">
          P{itemMacros.protein.toFixed(0)} · C{itemMacros.carbs.toFixed(0)} · F
          {itemMacros.fat.toFixed(0)} ·{" "}
          {Math.round(kcalOf(itemMacros)).toLocaleString()} kcal
        </span>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="ml-auto text-muted-foreground"
        aria-label={t("pantry.removeIngredient", {
          name: selected?.name ?? t("nutrition.item"),
        })}
        onClick={onRemove}
      >
        <XIcon />
      </Button>
    </div>
  );
}
