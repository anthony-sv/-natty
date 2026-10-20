import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { z } from "zod";
import { ComboboxOptionGroup } from "@/components/combobox-option-group";
import { Button } from "@/components/ui/button";
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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useHabits } from "@/features/habits/use-habits";
import {
  filterFoodOption,
  useFoodOptions,
  useGroupedFoodOptions,
  type FoodOption,
  type FoodOptionGroup,
} from "@/features/pantry/use-pantry";
import { useSupplements } from "@/features/supplements/use-supplements";
import { useT, type Translate } from "@/i18n/use-t";
import { createStockItem, updateStockItem } from "../collection";
import { stockUnitSchema, type StockItem, type StockUnit, type StockUse } from "../schema";

/**
 * A use as the form holds it: the amount stays a string until save, the
 * house rule for number inputs, and the referenced id is blank until picked.
 */
interface DraftUse {
  kind: StockUse["kind"];
  refId: string;
  amount: string;
}

function toDraft(use: StockUse): DraftUse {
  if (use.kind === "food") return { kind: "food", refId: use.foodId, amount: String(use.factor) };
  if (use.kind === "supplement")
    return { kind: "supplement", refId: use.supplementId, amount: String(use.perServing) };
  return { kind: "habit", refId: use.habitId, amount: String(use.perTime) };
}

/** Half-filled rows are dropped rather than blocking the save. */
function fromDrafts(drafts: DraftUse[]): StockUse[] {
  return drafts.flatMap((draft): StockUse[] => {
    const amount = Number(draft.amount);
    if (draft.refId === "" || !(amount > 0)) return [];
    if (draft.kind === "food") return [{ kind: "food", foodId: draft.refId, factor: amount }];
    if (draft.kind === "supplement")
      return [{ kind: "supplement", supplementId: draft.refId, perServing: amount }];
    return [{ kind: "habit", habitId: draft.refId, perTime: amount }];
  });
}

const positive = (message: string) =>
  z.string().refine((value) => Number(value) > 0, { message });

const buildSchema = (t: Translate) =>
  z.object({
    name: z.string().trim().min(1, t("shopping.nameRequired")),
    unit: stockUnitSchema,
    packageSize: positive(t("shopping.numberRequired")),
    onHand: z.string().refine((value) => value.trim() !== "" && Number(value) >= 0, {
      message: t("shopping.numberRequired"),
    }),
    dailyUse: z.string().refine((value) => value.trim() === "" || Number(value) > 0, {
      message: t("shopping.numberRequired"),
    }),
  });

/** What "track it" from a plan row hands over: the food, already linked. */
export interface StockPrefill {
  name: string;
  unit: StockUnit;
  foodId: string;
}

export function StockForm({
  existing,
  prefill,
  remaining,
  onDone,
}: {
  existing?: StockItem;
  prefill?: StockPrefill;
  /** What the app thinks is left now, so editing doesn't rewind the count. */
  remaining?: number;
  onDone: () => void;
}) {
  const t = useT();
  const [uses, setUses] = useState<DraftUse[]>(() =>
    existing
      ? existing.uses.map(toDraft)
      : prefill
        ? [{ kind: "food", refId: prefill.foodId, amount: "1" }]
        : [],
  );

  const units = stockUnitSchema.options.map((value) => ({
    value,
    label: t(`shopping.unit.${value}`),
  }));

  const form = useForm({
    defaultValues: {
      name: existing?.name ?? prefill?.name ?? "",
      unit: existing?.unit ?? prefill?.unit ?? ("g" as StockUnit),
      packageSize: existing ? String(existing.packageSize) : "",
      onHand:
        existing !== undefined
          ? String(Math.round((remaining ?? existing.onHand) * 10) / 10)
          : "",
      dailyUse: existing?.dailyUse !== undefined ? String(existing.dailyUse) : "",
    },
    validators: { onChange: buildSchema(t) },
    onSubmit: ({ value }) => {
      const onHand = Number(value.onHand);
      const input = {
        name: value.name.trim(),
        unit: value.unit,
        packageSize: Number(value.packageSize),
        onHand,
        // An edit that didn't change the amount keeps counting from the
        // original moment, so the meals since aren't forgiven.
        countedAt:
          existing !== undefined &&
          remaining !== undefined &&
          Math.abs(onHand - remaining) < 0.05
            ? existing.countedAt
            : Date.now(),
        uses: fromDrafts(uses),
        dailyUse: value.dailyUse.trim() === "" ? undefined : Number(value.dailyUse),
      };
      if (existing !== undefined && input.countedAt === existing.countedAt) {
        input.onHand = existing.onHand;
      }
      const transaction = existing
        ? updateStockItem(existing.id, input)
        : createStockItem(input).transaction;
      void toast.promise(transaction.isPersisted.promise, {
        loading: t("shopping.saving"),
        success: { title: t("shopping.saved", { name: input.name }), type: "success" },
        error: { title: t("shopping.saveError"), type: "error" },
      });
      onDone();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="name">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="stock-name">{t("shopping.name")}</FieldLabel>
              <Input
                id="stock-name"
                placeholder={t("shopping.namePlaceholder")}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <div className="flex flex-col gap-4 sm:flex-row">
          <form.Field name="unit">
            {(field) => (
              <Field className="sm:w-40">
                <FieldLabel>{t("shopping.unit")}</FieldLabel>
                <Select
                  items={units}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as StockUnit)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>
          <form.Field name="packageSize">
            {(field) => (
              <Field className="sm:flex-1">
                <FieldLabel htmlFor="stock-package">{t("shopping.packageSize")}</FieldLabel>
                <Input
                  id="stock-package"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1000"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="onHand">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="stock-on-hand">{t("shopping.onHand")}</FieldLabel>
              <Input
                id="stock-on-hand"
                type="number"
                min="0"
                step="any"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>{t("shopping.onHandHint")}</FieldDescription>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.values.unit}>
          {(unit) => <UsesEditor uses={uses} unit={unit} onChange={setUses} />}
        </form.Subscribe>

        <form.Field name="dailyUse">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="stock-daily">{t("shopping.dailyUse")}</FieldLabel>
              <Input
                id="stock-daily"
                type="number"
                min="0"
                step="any"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>{t("shopping.dailyUseHint")}</FieldDescription>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              <CheckIcon data-icon="inline-start" />
              {existing ? t("shopping.save") : t("shopping.create")}
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}

/**
 * What uses this item up. A list of its own rather than form fields, because
 * every interaction with it is structural — add a row, change what kind it
 * is — which is the line `draft.ts` draws for the routine builder too.
 */
function UsesEditor({
  uses,
  unit,
  onChange,
}: {
  uses: DraftUse[];
  unit: StockUnit;
  onChange: (next: DraftUse[]) => void;
}) {
  const t = useT();
  const kinds = [
    { value: "food", label: t("shopping.use.food") },
    { value: "supplement", label: t("shopping.use.supplement") },
    { value: "habit", label: t("shopping.use.habit") },
  ];
  const update = (index: number, patch: Partial<DraftUse>) =>
    onChange(uses.map((use, i) => (i === index ? { ...use, ...patch } : use)));

  return (
    <FieldSet>
      <FieldLegend variant="label">{t("shopping.uses")}</FieldLegend>
      <FieldDescription>{t("shopping.usesHint")}</FieldDescription>
      <div className="flex flex-col gap-3">
        {uses.map((use, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Select
                items={kinds}
                value={use.kind}
                onValueChange={(value) =>
                  update(index, {
                    kind: value as DraftUse["kind"],
                    refId: "",
                    amount: value === "food" ? "1" : "",
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kinds.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="min-w-0 flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("shopping.removeUse")}
                onClick={() => onChange(uses.filter((_, i) => i !== index))}
              >
                <Trash2Icon />
              </Button>
            </div>
            <UseRow use={use} unit={unit} onChange={(patch) => update(index, patch)} />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onChange([...uses, { kind: "food", refId: "", amount: "1" }])}
        >
          <PlusIcon data-icon="inline-start" />
          {t("shopping.addUse")}
        </Button>
      </div>
    </FieldSet>
  );
}

function UseRow({
  use,
  unit,
  onChange,
}: {
  use: DraftUse;
  unit: StockUnit;
  onChange: (patch: Partial<DraftUse>) => void;
}) {
  const t = useT();
  const unitLabel = t(`shopping.unit.${unit}`);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {use.kind === "food" ? (
          <FoodPicker value={use.refId} onChange={(refId) => onChange({ refId })} />
        ) : use.kind === "supplement" ? (
          <SupplementPicker value={use.refId} onChange={(refId) => onChange({ refId })} />
        ) : (
          <HabitPicker value={use.refId} onChange={(refId) => onChange({ refId })} />
        )}
      </div>
      <Field className="sm:w-44">
        <FieldLabel className="text-xs">
          {use.kind === "food"
            ? t("shopping.factor", { unit: unitLabel })
            : use.kind === "supplement"
              ? t("shopping.perServing", { unit: unitLabel })
              : t("shopping.perTime", { unit: unitLabel })}
        </FieldLabel>
        <Input
          type="number"
          min="0"
          step="any"
          value={use.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
        />
      </Field>
    </div>
  );
}

function FoodPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const t = useT();
  const options = useFoodOptions();
  // Recipes are left out: eating one takes from its ingredients, so linking
  // the recipe itself would never move anything.
  const selectable = useMemo(
    () => options.filter((option) => option.kind !== "recipe"),
    [options],
  );
  const groups = useGroupedFoodOptions(selectable);
  const selected = selectable.find((option) => option.id === value) ?? null;

  return (
    <Combobox
      items={groups}
      filter={filterFoodOption}
      value={selected}
      onValueChange={(option: FoodOption | null) => onChange(option?.id ?? "")}
      itemToStringLabel={(option: FoodOption) => option.name}
    >
      <ComboboxInput placeholder={t("shopping.pickFood")} />
      <ComboboxContent>
        <ComboboxEmpty>{t("common.noFoodFound")}</ComboboxEmpty>
        <ComboboxList>
          {(group: FoodOptionGroup, index: number) => (
            <ComboboxOptionGroup key={group.key} group={group} index={index}>
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
  );
}

function SupplementPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const t = useT();
  const { supplements } = useSupplements();
  const items = supplements
    .filter((s) => s.archivedAt === undefined || s.id === value)
    .map((s) => ({ value: s.id, label: s.name }));
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("shopping.noSupplements")}</p>;
  }
  return (
    <Select items={items} value={value === "" ? null : value} onValueChange={(v) => onChange(String(v))}>
      <SelectTrigger>
        <SelectValue placeholder={t("shopping.pickSupplement")} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function HabitPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const t = useT();
  const { habits } = useHabits();
  const items = habits
    .filter((h) => h.archivedAt === undefined || h.id === value)
    .map((h) => ({ value: h.id, label: h.name }));
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("shopping.noHabits")}</p>;
  }
  return (
    <Select items={items} value={value === "" ? null : value} onValueChange={(v) => onChange(String(v))}>
      <SelectTrigger>
        <SelectValue placeholder={t("shopping.pickHabit")} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
