import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PackagePlusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import {
  addManualItem,
  removeShoppingItems,
  setManualChecked,
  setPlanFoodChecked,
} from "../collection";
import { formatDaysLeft, formatStockAmount } from "../format";
import { shoppingList, type LowStockRow } from "../shopping";
import { useShoppingData } from "../use-shopping";
import { RecountDialog } from "./RecountDialog";
import type { StockPrefill } from "./StockForm";
import { StockFormDialog } from "./StockPanel";

/**
 * What to buy for the next `horizonDays`.
 *
 * Derived every render from stock, the plan and the log — the only thing
 * stored is what you typed and what you've ticked. **Buying a stock item is
 * a recount, not a tick**: "Bought" asks how many packages, and the row
 * leaves the list because the stock now lasts, not because a box was set.
 */
export function ShoppingListPanel({ now, horizonDays }: { now: number; horizonDays: number }) {
  const t = useT();
  const names = useNames();
  const { stock, shoppingItems, sources, plan, foods, isLoading } = useShoppingData();
  const [buying, setBuying] = useState<LowStockRow>();
  const [tracking, setTracking] = useState<StockPrefill>();
  const [draft, setDraft] = useState("");

  const list = useMemo(
    () => shoppingList({ stock, sources, plan, foods, shoppingItems, now, horizonDays }),
    [stock, sources, plan, foods, shoppingItems, now, horizonDays],
  );
  // Alphabetical in the reader's language, unticked first — the order you
  // walk a list in, with what's done sinking out of the way.
  const planRows = useMemo(
    () =>
      list.plan
        .map((row) => ({ ...row, name: names.food(row.foodId), food: foods.get(row.foodId) }))
        .sort(
          (a, b) =>
            Number(a.checked) - Number(b.checked) || a.name.localeCompare(b.name, t.locale),
        ),
    [list.plan, names, foods, t.locale],
  );
  const checkedManual = list.manual.filter((row) => row.checkedAt !== undefined);

  if (isLoading) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("shopping.lowTitle")}</CardTitle>
          <CardDescription>
            {stock.length === 0
              ? t("shopping.lowNoStock")
              : t("shopping.lowBody", { count: horizonDays })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {stock.length === 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              nativeButton={false}
              render={<Link to="/shopping" search={{ tab: "stock" }} />}
            >
              <PackagePlusIcon data-icon="inline-start" />
              {t("shopping.goToStock")}
            </Button>
          ) : list.low.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("shopping.lowNone")}</p>
          ) : (
            list.low.map((row) => (
              <div
                key={row.item.id}
                className="flex flex-wrap items-center gap-2 rounded-md border p-3"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{row.item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.remaining <= 0
                      ? t("shopping.empty")
                      : t("shopping.leftShort", {
                          amount: formatStockAmount(row.remaining, row.item.unit, t),
                        })}
                    {row.daysLeft !== undefined && row.remaining > 0
                      ? ` · ${formatDaysLeft(row.daysLeft, t)}`
                      : ""}
                  </span>
                </div>
                <Badge variant="secondary" className="tabular-nums">
                  {t("shopping.buyPackages", {
                    count: row.suggestedPackages,
                    size: formatStockAmount(row.item.packageSize, row.item.unit, t),
                  })}
                </Badge>
                <Button size="sm" onClick={() => setBuying(row)}>
                  <ShoppingCartIcon data-icon="inline-start" />
                  {t("shopping.bought")}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("shopping.planTitle")}</CardTitle>
          <CardDescription>
            {plan === undefined
              ? t("shopping.planNone")
              : t("shopping.planBody", {
                  plan: names.dietPlan(plan.slug, plan.name),
                  count: horizonDays,
                })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {planRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("shopping.planEmpty")}</p>
          ) : (
            planRows.map((row) => (
              <div key={row.foodId} className="flex items-center gap-2 py-1">
                <Label
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 font-normal",
                    row.checked && "text-muted-foreground line-through",
                  )}
                >
                  <Checkbox
                    checked={row.checked}
                    onCheckedChange={(checked) => setPlanFoodChecked(row.foodId, checked)}
                  />
                  <span className="min-w-0 flex-1 truncate">{row.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatStockAmount(row.amount, row.food?.unit ?? "g", t)}
                  </span>
                </Label>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("shopping.trackFood", { name: row.name })}
                  onClick={() =>
                    setTracking({ name: row.name, unit: row.food?.unit ?? "g", foodId: row.foodId })
                  }
                >
                  <PackagePlusIcon />
                </Button>
              </div>
            ))
          )}
          {planRows.length > 0 ? (
            <p className="pt-2 text-xs text-muted-foreground">{t("shopping.planHint")}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("shopping.otherTitle")}</CardTitle>
          <CardDescription>{t("shopping.otherBody")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = draft.trim();
              if (name === "") return;
              addManualItem(name);
              setDraft("");
            }}
          >
            <Input
              aria-label={t("shopping.otherPlaceholder")}
              placeholder={t("shopping.otherPlaceholder")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" variant="outline" disabled={draft.trim() === ""}>
              <PlusIcon data-icon="inline-start" />
              {t("shopping.addItem")}
            </Button>
          </form>
          {list.manual.map((row) =>
            row.source.kind === "manual" ? (
              <Label
                key={row.id}
                className={cn(
                  "flex items-center gap-2 py-1 font-normal",
                  row.checkedAt !== undefined && "text-muted-foreground line-through",
                )}
              >
                <Checkbox
                  checked={row.checkedAt !== undefined}
                  onCheckedChange={(checked) => setManualChecked(row.id, checked)}
                />
                <span className="min-w-0 flex-1 truncate">{row.source.name}</span>
              </Label>
            ) : null,
          )}
          {checkedManual.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground"
              onClick={() => removeShoppingItems(checkedManual.map((row) => row.id))}
            >
              <Trash2Icon data-icon="inline-start" />
              {t("shopping.clearChecked")}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <RecountDialog
        status={buying}
        mode="bought"
        suggestedPackages={buying?.suggestedPackages}
        onClose={() => setBuying(undefined)}
      />
      <StockFormDialog
        editing={tracking === undefined ? undefined : { prefill: tracking }}
        onClose={() => setTracking(undefined)}
      />
    </div>
  );
}
