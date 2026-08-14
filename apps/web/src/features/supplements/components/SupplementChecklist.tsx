import { useMemo, useState } from "react";
import { ArchiveIcon, PencilLineIcon, PlusIcon, Trash2Icon } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { allIntake, restoreIntake, toggleSupplement } from "@/features/intake/collection";
import { useIntake } from "@/features/intake/use-intake";
import { useT } from "@/i18n/use-t";
import {
  archiveSupplement,
  deleteSupplement,
  restoreSupplement,
} from "../collection";
import { hasHistory, supplementDay } from "../supplements";
import { useSupplements } from "../use-supplements";
import type { Supplement } from "../schema";
import { SupplementForm } from "./SupplementForm";

/**
 * What you take, and whether you've taken it.
 *
 * On the Today tab beside the meals, because it answers the same question on
 * the same day and reuses the same collection — a supplement tick is an
 * `intake` row with no macros. **Nothing auto-ticks**, the rule the whole tab
 * follows.
 */
export function SupplementChecklist({ day }: { day: number }) {
  const t = useT();
  const { supplements, isLoading } = useSupplements();
  const { entries } = useIntake();
  const [editing, setEditing] = useState<Supplement | "new" | undefined>();

  const summary = useMemo(
    () => supplementDay(supplements, entries, day, t.locale),
    [supplements, entries, day, t.locale],
  );

  const toggle = (supplement: Supplement) => {
    const result = toggleSupplement(day, supplement.id);
    if (!("removed" in result)) return;
    // Unticking gets an Undo rather than a confirm, like `deleteSet` and like
    // unticking a meal: small, frequent, and completely reversible.
    const removed = result.removed;
    toast.add({
      title: t("supplements.unticked", { name: supplement.name }),
      type: "info",
      actionProps: {
        children: t("history.undo"),
        onClick: () => restoreIntake(removed),
      },
    });
  };

  const remove = (supplement: Supplement) => {
    // Archive once anything was ticked against it, the same rule a custom
    // exercise follows: deleting would leave a raw id on every day you took it.
    if (hasHistory(allIntake(), supplement.id)) {
      archiveSupplement(supplement.id);
      toast.add({
        title: t("supplements.archived", { name: supplement.name }),
        type: "info",
        actionProps: {
          children: t("history.undo"),
          onClick: () => restoreSupplement(supplement.id),
        },
      });
      return;
    }
    deleteSupplement(supplement.id);
    toast.add({
      title: t("supplements.deleted", { name: supplement.name }),
      type: "info",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t("supplements.title")}</CardTitle>
            <CardDescription>
              {summary.total > 0
                ? t("supplements.takenOf", {
                    taken: summary.taken,
                    total: summary.total,
                  })
                : t("supplements.body")}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing("new")}>
            <PlusIcon data-icon="inline-start" />
            {t("supplements.add")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {isLoading ? null : summary.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("supplements.empty")}
          </p>
        ) : (
          summary.rows.map(({ supplement, taken }) => (
            <div
              key={supplement.id}
              className="flex flex-wrap items-center gap-3 rounded-md border p-3"
            >
              <Checkbox
                id={`supp-${supplement.id}`}
                checked={taken}
                onCheckedChange={() => toggle(supplement)}
              />
              {/* `min-w-0`, never `shrink-0`: a flex child holding text that
                  refuses to shrink prints over its neighbour rather than
                  wrapping. */}
              <Label
                htmlFor={`supp-${supplement.id}`}
                className="min-w-0 flex-1 flex-col items-start gap-0.5 font-normal"
              >
                <span className="font-medium">{supplement.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t("supplements.dose", {
                    amount: supplement.amount.toLocaleString(),
                    unit: t.plural(
                      `supplements.unit.${supplement.unit}` as never,
                      supplement.amount,
                    ),
                  })}
                  {supplement.timing ? ` · ${supplement.timing}` : ""}
                </span>
              </Label>

              {/* An archived one still shows on the days you took it, and says
                  why it can't be ticked on any other. */}
              {supplement.archivedAt !== undefined ? (
                <Badge variant="secondary">{t("supplements.archivedTag")}</Badge>
              ) : null}

              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("supplements.edit", { name: supplement.name })}
                  onClick={() => setEditing(supplement)}
                >
                  <PencilLineIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label={t("supplements.remove", { name: supplement.name })}
                  onClick={() => remove(supplement)}
                >
                  {hasHistory(entries, supplement.id) ? (
                    <ArchiveIcon />
                  ) : (
                    <Trash2Icon />
                  )}
                </Button>
              </div>
            </div>
          ))
        )}

        {/* The count has to reconcile: a tick against something no longer in
            the stack has no name to render, and dropping it silently would
            make the day read as one supplement short. */}
        {summary.orphaned > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t.plural("supplements.orphaned", summary.orphaned, {
              count: summary.orphaned,
            })}
          </p>
        ) : null}
      </CardContent>

      <Dialog
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" || editing === undefined
                ? t("supplements.add")
                : t("supplements.editTitle", { name: editing.name })}
            </DialogTitle>
            <DialogDescription>{t("supplements.formBody")}</DialogDescription>
          </DialogHeader>
          {editing !== undefined ? (
            <SupplementForm
              existing={editing === "new" ? undefined : editing}
              onDone={() => setEditing(undefined)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
