import { useMemo, useState } from "react";
import { PencilLineIcon, PlusIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import { startOfDay } from "@/lib/week";
import { deleteStockItem, restoreStockItem } from "../collection";
import { formatDaysLeft, formatStockAmount } from "../format";
import type { StockItem } from "../schema";
import { dailyPlanAverage, stockStatus, type StockStatus } from "../shopping";
import { useShoppingData } from "../use-shopping";
import { RecountDialog, type RecountMode } from "./RecountDialog";
import { StockForm, type StockPrefill } from "./StockForm";

/**
 * Everything you keep at home, and how far down each one is.
 *
 * The bar is the package going down — one package is a full bar, so a
 * second bag shows as "2.3 packages" in words over a full one rather than a
 * bar that can't go past the end.
 */
export function StockPanel({ now }: { now: number }) {
  const t = useT();
  const { stock, sources, plan, foods, isLoading } = useShoppingData();
  const [editing, setEditing] = useState<
    { item?: StockItem; prefill?: StockPrefill; remaining?: number } | undefined
  >();
  const [recount, setRecount] = useState<{ status: StockStatus; mode: RecountMode }>();

  const statuses = useMemo(() => {
    const planDaily = dailyPlanAverage(plan, foods, sources.recipes, startOfDay(now));
    return stock
      .filter((item) => item.archivedAt === undefined)
      .map((item) => stockStatus(item, sources, planDaily, now))
      .sort((a, b) => a.item.name.localeCompare(b.item.name, t.locale));
  }, [stock, sources, plan, foods, now, t.locale]);

  const remove = (item: StockItem) => {
    // Nothing references a stock item, so it deletes outright — with an undo,
    // the rule every correction list follows.
    const { item: removed } = deleteStockItem(item.id);
    toast.add({
      title: t("shopping.deleted", { name: item.name }),
      type: "info",
      actionProps: removed
        ? { children: t("history.undo"), onClick: () => restoreStockItem(removed) }
        : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">{t("shopping.stockBody")}</p>
        <Button size="sm" onClick={() => setEditing({})}>
          <PlusIcon data-icon="inline-start" />
          {t("shopping.addStock")}
        </Button>
      </div>

      {isLoading ? null : statuses.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t("shopping.stockEmptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("shopping.stockEmpty")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {statuses.map((status) => (
            <StockCard
              key={status.item.id}
              status={status}
              onBought={() => setRecount({ status, mode: "bought" })}
              onLeft={() => setRecount({ status, mode: "left" })}
              onEdit={() => setEditing({ item: status.item, remaining: status.remaining })}
              onRemove={() => remove(status.item)}
            />
          ))}
        </div>
      )}

      <StockFormDialog editing={editing} onClose={() => setEditing(undefined)} />
      <RecountDialog
        status={recount?.status}
        mode={recount?.mode ?? "bought"}
        onClose={() => setRecount(undefined)}
      />
    </div>
  );
}

export function StockFormDialog({
  editing,
  onClose,
}: {
  editing: { item?: StockItem; prefill?: StockPrefill; remaining?: number } | undefined;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <Dialog
      open={editing !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing?.item
              ? t("shopping.editTitle", { name: editing.item.name })
              : t("shopping.addStock")}
          </DialogTitle>
          <DialogDescription>{t("shopping.formBody")}</DialogDescription>
        </DialogHeader>
        {editing !== undefined ? (
          <StockForm
            existing={editing.item}
            prefill={editing.prefill}
            remaining={editing.remaining}
            onDone={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function StockCard({
  status,
  onBought,
  onLeft,
  onEdit,
  onRemove,
}: {
  status: StockStatus;
  onBought: () => void;
  onLeft: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { item, remaining, packages, dailyUse, daysLeft } = status;
  const low = remaining <= 0 || (daysLeft !== undefined && daysLeft <= 7);

  return (
    <Card size="sm" className={cn(low && "ring-destructive/40")}>
      <CardHeader>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{item.name}</CardTitle>
            <CardDescription>
              {remaining <= 0
                ? t("shopping.empty")
                : t("shopping.leftOf", {
                    amount: formatStockAmount(remaining, item.unit, t),
                    size: formatStockAmount(item.packageSize, item.unit, t),
                  })}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("shopping.edit", { name: item.name })}
            onClick={onEdit}
          >
            <PencilLineIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={t("shopping.remove", { name: item.name })}
            onClick={onRemove}
          >
            <Trash2Icon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress
          value={Math.min(100, packages * 100)}
          aria-label={t("shopping.leftOf", {
            amount: formatStockAmount(remaining, item.unit, t),
            size: formatStockAmount(item.packageSize, item.unit, t),
          })}
        />
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {packages > 1.05 ? (
            <Badge variant="secondary">
              {t("shopping.packages", {
                count: new Intl.NumberFormat(t.locale, { maximumFractionDigits: 1 }).format(packages),
              })}
            </Badge>
          ) : null}
          {daysLeft !== undefined ? (
            <Badge variant={low ? "destructive" : "outline"}>{formatDaysLeft(daysLeft, t)}</Badge>
          ) : null}
          <span>
            {dailyUse === undefined
              ? t("shopping.rateUnknown")
              : t(`shopping.rate.${dailyUse.source}`, {
                  amount: formatStockAmount(dailyUse.value, item.unit, t),
                })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onBought}>
            <ShoppingCartIcon data-icon="inline-start" />
            {t("shopping.bought")}
          </Button>
          <Button size="sm" variant="outline" onClick={onLeft}>
            {t("shopping.setLeft")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
