import { useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import {
  ArchiveIcon,
  PencilLineIcon,
  PlusIcon,
  RotateCcwIcon,
  Share2Icon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { backupFilename } from "@/features/backup/backup";
import {
  downloadBackup,
  exportExercise,
} from "@/features/backup/use-backup";
import { useT } from "@/i18n/use-t";
import { setsFor } from "@/features/log/collection";
import {
  archiveUserExercise,
  deleteUserExercise,
  restoreUserExercise,
  userExercisesFork,
} from "../collection";
import type { UserExercise } from "../schema";
import { UserExerciseForm } from "./UserExerciseForm";

/** Your own exercises: add, correct, archive, restore. */
export function LibraryPanel() {
  const t = useT();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<UserExercise | undefined>(undefined);
  const [isAdding, setIsAdding] = useState(false);

  const userExercises = userExercisesFork.useActive();
  const { data } = useLiveQuery(
    (q) => q.from({ e: userExercises }),
    [userExercises],
  );
  const all = data ?? [];
  const visible = all
    .filter((e) => showArchived || e.archivedAt === undefined)
    .sort((a, b) => a.name.localeCompare(b.name, t.locale));

  const archivedCount = all.filter((e) => e.archivedAt !== undefined).length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("library.title")}</CardTitle>
          <CardDescription>{t("library.body")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={() => setIsAdding(true)}>
              <PlusIcon data-icon="inline-start" />
              {t("library.add")}
            </Button>
            {archivedCount > 0 ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="show-archived"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
                <Label htmlFor="show-archived" className="text-sm font-normal">
                  {t("library.showArchived")}
                </Label>
              </div>
            ) : null}
          </div>

          {all.length === 0 ? (
            <Empty>
              <EmptyTitle>{t("library.empty.title")}</EmptyTitle>
              <EmptyDescription>{t("library.empty.body")}</EmptyDescription>
            </Empty>
          ) : (
            <ul className="divide-y">
              {visible.map((exercise) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={() => setEditing(exercise)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isAdding || editing !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setIsAdding(false);
            setEditing(undefined);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("library.edit", { name: editing.name }) : t("library.add")}
            </DialogTitle>
            <DialogDescription>{t("library.body")}</DialogDescription>
          </DialogHeader>
          {/* Keyed so the fields start from what's stored now rather than from
              whatever the dialog held last time it was opened. */}
          <UserExerciseForm
            key={editing?.id ?? "new"}
            existing={editing}
            onDone={() => {
              setIsAdding(false);
              setEditing(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExerciseRow({
  exercise,
  onEdit,
}: {
  exercise: UserExercise;
  onEdit: () => void;
}) {
  const t = useT();
  const isArchived = exercise.archivedAt !== undefined;

  // Read synchronously rather than from a live query: this decides whether
  // deleting is safe, and a stale snapshot would let it orphan real history.
  const loggedCount = setsFor(exercise.id).length;

  return (
    <li className="flex items-center gap-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{exercise.name}</span>
          {isArchived ? (
            <Badge variant="outline">{t("library.archived")}</Badge>
          ) : null}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {[
            t(`pattern.${exercise.pattern}` as never),
            exercise.primaryMuscles
              .map((muscle) => t(`muscle.${muscle}` as never))
              .join(", "),
            loggedCount > 0
              ? t.plural("library.setsLogged", loggedCount)
              : undefined,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>

      {/* A lift is a leaf, like a food: it names its own muscles and pattern,
          so nothing has to travel with it. */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground"
        aria-label={t("data.share")}
        onClick={() => {
          void (async () => {
            const now = Date.now();
            const backup = await exportExercise(exercise.id, now);
            if (backup === undefined) return;
            downloadBackup(backup, backupFilename(now, "exercise"));
            toast.add({ title: t("data.shared"), type: "success" });
          })();
        }}
      >
        <Share2Icon />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground"
        aria-label={t("library.edit", { name: exercise.name })}
        onClick={onEdit}
      >
        <PencilLineIcon />
      </Button>

      {isArchived ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          aria-label={t("library.restore")}
          onClick={() => {
            restoreUserExercise(exercise.id);
            toast.add({
              title: t("library.restored", { name: exercise.name }),
              type: "success",
            });
          }}
        >
          <RotateCcwIcon />
        </Button>
      ) : loggedCount > 0 ? (
        // Archive rather than delete, because deleting would leave every one of
        // those sets showing a raw id in the records table, both charts and the
        // heatmap. The button says archive, so nothing has to be refused.
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          aria-label={t("library.archive")}
          title={t("library.archiveHint")}
          onClick={() => {
            archiveUserExercise(exercise.id);
            toast.add({
              title: t("library.archivedNotice", { name: exercise.name }),
              type: "info",
              actionProps: {
                children: t("history.undo"),
                onClick: () => restoreUserExercise(exercise.id),
              },
            });
          }}
        >
          <ArchiveIcon />
        </Button>
      ) : (
        // Nothing logged against it, so there is nothing to orphan and nothing
        // to warn about — an exercise with no sets is just a name.
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          aria-label={t("library.delete")}
          onClick={() => {
            deleteUserExercise(exercise.id);
            toast.add({
              title: t("library.deleted", { name: exercise.name }),
              type: "info",
            });
          }}
        >
          <Trash2Icon />
        </Button>
      )}
    </li>
  );
}
