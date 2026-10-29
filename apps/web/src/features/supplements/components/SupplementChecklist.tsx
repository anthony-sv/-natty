import { useMemo, useState } from "react";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ChevronDownIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
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
import {
  allIntake,
  logSupplementServing,
  removeIntake,
  restoreIntake,
} from "@/features/intake/collection";
import { useIntake } from "@/features/intake/use-intake";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import {
  archiveSupplement,
  deleteSupplement,
  deleteSupplementAndTicks,
  restoreSupplement,
  restoreSupplementAndTicks,
} from "../collection";
import {
  hasHistory,
  supplementDay,
  ticksOf,
  type SupplementRow,
} from "../supplements";
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
  const [showArchived, setShowArchived] = useState(false);
  const [deleting, setDeleting] = useState<Supplement | undefined>();

  // Every archived one, not just those ticked today: this is the only place
  // to bring one back, or to be rid of it for good.
  const archived = useMemo(
    () =>
      supplements
        .filter((supplement) => supplement.archivedAt !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name, t.locale)),
    [supplements, t.locale],
  );

  const summary = useMemo(
    () => supplementDay(supplements, entries, day, t.locale),
    [supplements, entries, day, t.locale],
  );

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

  const restore = (supplement: Supplement) => {
    restoreSupplement(supplement.id);
    toast.add({
      title: t("supplements.restored", { name: supplement.name }),
      type: "success",
    });
  };

  // Behind a confirm rather than only an Undo: it reaches back through every
  // day you ticked it, which is a different size of thing from unticking one.
  const deleteForGood = (supplement: Supplement) => {
    const { supplement: removed, ticks } = deleteSupplementAndTicks(supplement.id);
    if (removed === undefined) return;
    toast.add({
      title: t("supplements.deleted", { name: removed.name }),
      type: "info",
      actionProps: {
        children: t("history.undo"),
        onClick: () => restoreSupplementAndTicks(removed, ticks),
      },
    });
  };

  const deletingTicks =
    deleting !== undefined ? ticksOf(entries, deleting.id).length : 0;

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
          summary.rows.map((row) => (
            <SupplementRowView
              key={row.supplement.id}
              row={row}
              day={day}
              hasHistory={hasHistory(entries, row.supplement.id)}
              onEdit={() => setEditing(row.supplement)}
              onRemove={() => remove(row.supplement)}
              onRestore={() => restore(row.supplement)}
            />
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

        {/* Archived ones used to have no way back once the toast was gone. */}
        {archived.length > 0 ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground"
              aria-expanded={showArchived}
              onClick={() => setShowArchived((open) => !open)}
            >
              <ChevronDownIcon
                data-icon="inline-start"
                className={cn("transition-transform", !showArchived && "-rotate-90")}
              />
              {t("supplements.archivedList", { count: archived.length })}
            </Button>
            {showArchived
              ? archived.map((supplement) => (
                  <div
                    key={supplement.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-dashed px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {supplement.name}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restore(supplement)}
                    >
                      <ArchiveRestoreIcon data-icon="inline-start" />
                      {t("supplements.restore")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      aria-label={t("supplements.deleteName", {
                        name: supplement.name,
                      })}
                      onClick={() => setDeleting(supplement)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))
              : null}
          </div>
        ) : null}
      </CardContent>

      <AlertDialog
        open={deleting !== undefined}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("supplements.deleteTitle", { name: deleting?.name ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.plural("supplements.deleteBody", deletingTicks, {
                count: deletingTicks,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleting !== undefined) deleteForGood(deleting);
                setDeleting(undefined);
              }}
            >
              {t("supplements.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              day={day}
              onDone={() => setEditing(undefined)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * One supplement's row: the name and its dose, then one checkbox per serving.
 *
 * **A row of boxes, not one box for the whole dose.** Two magnesium pills
 * taken together are a single serving and tick as one; three fish-oil
 * capsules taken across the day are three separate servings, and forcing them
 * into one checkbox would either round three real doses down to a single tick
 * or make someone who takes theirs together tick twice for nothing. `slots`
 * already accounts for a day that logged more servings than the supplement
 * currently prescribes, so a lowered `servingsPerDay` never orphans a real row.
 */
function SupplementRowView({
  row,
  day,
  hasHistory,
  onEdit,
  onRemove,
  onRestore,
}: {
  row: SupplementRow;
  day: number;
  hasHistory: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onRestore: () => void;
}) {
  const t = useT();
  const { supplement, entryIds, slots } = row;

  const tickServing = () => {
    logSupplementServing(day, supplement.id);
  };

  const untickServing = (entryId: string) => {
    const removed = removeIntake(entryId);
    if (removed === undefined) return;
    // Unticking gets an Undo rather than a confirm, like `deleteSet` and like
    // unticking a meal: small, frequent, and completely reversible.
    toast.add({
      title: t("supplements.unticked", { name: supplement.name }),
      type: "info",
      actionProps: {
        children: t("history.undo"),
        onClick: () => restoreIntake(removed),
      },
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* `min-w-0`, never `shrink-0`: a flex child holding text that refuses
            to shrink prints over its neighbour rather than wrapping. */}
        <span className="min-w-0 flex-1 truncate font-medium">
          {supplement.name}
        </span>
        {/* An archived one still shows on the days you took it, and says why
            it can't be ticked on any other. */}
        {supplement.archivedAt !== undefined ? (
          <Badge variant="secondary">{t("supplements.archivedTag")}</Badge>
        ) : null}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("supplements.edit", { name: supplement.name })}
            onClick={onEdit}
          >
            <PencilLineIcon />
          </Button>
          {/* Archived and still showing (it was ticked this day): the button
              brings it back rather than archiving it a second time. */}
          {supplement.archivedAt !== undefined ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={t("supplements.restoreName", { name: supplement.name })}
              onClick={onRestore}
            >
              <ArchiveRestoreIcon />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={t("supplements.remove", { name: supplement.name })}
              onClick={onRemove}
            >
              {hasHistory ? <ArchiveIcon /> : <Trash2Icon />}
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("supplements.dose", {
          amount: supplement.amount.toLocaleString(),
          unit: t.plural(`supplements.unit.${supplement.unit}`, supplement.amount),
        })}
        {supplement.timing ? ` · ${supplement.timing}` : ""}
      </p>

      {/* Each box is its own tap target — wrapped in a bordered pill rather
          than a bare checkbox, which is what made a row of them read as
          "hyper small" on a phone: nothing to distinguish one from the next
          and barely anything to press. */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: slots }, (_, i) => {
          const entryId = entryIds[i];
          const taken = entryId !== undefined;
          return (
            <Label
              key={i}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-normal",
                taken && "border-primary bg-primary/10",
              )}
            >
              <Checkbox
                checked={taken}
                aria-label={
                  slots > 1
                    ? t("supplements.servingOf", {
                        number: i + 1,
                        total: slots,
                      })
                    : t("supplements.taken", { name: supplement.name })
                }
                onCheckedChange={() =>
                  taken ? untickServing(entryId) : tickServing()
                }
              />
              {slots > 1 ? <span className="tabular-nums">{i + 1}</span> : null}
            </Label>
          );
        })}
      </div>
    </div>
  );
}
