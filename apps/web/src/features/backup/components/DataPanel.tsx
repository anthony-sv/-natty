import { useRef, useState } from "react";
import { DownloadIcon, UploadIcon } from "lucide-react";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { useT } from "@/i18n/use-t";
import { backupFilename, readBackup, summarise, type Backup } from "../backup";
import {
  downloadBackup,
  exportEverything,
  importAdditive,
  restoreEverything,
} from "../use-backup";

/**
 * Taking your data out, and putting it back.
 *
 * Everything lives in localStorage; one cleared browser and it's gone. This is
 * the only route back, and the only way to hand a routine or a recipe to
 * someone else.
 */
export function DataPanel() {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);
  // Held until confirmed: nothing is written before you've seen what's in the
  // file, because one of the two paths replaces everything you have.
  const [pending, setPending] = useState<Backup | undefined>();

  function onExport() {
    const now = Date.now();
    const backup = exportEverything(now);
    downloadBackup(backup, backupFilename(now, "full"));
    toast.add({ title: t("data.exported"), type: "success" });
  }

  async function onFile(file: File | undefined) {
    if (file === undefined) return;
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      // A file that isn't JSON at all never reaches the schema.
      toast.add({ title: t("data.notJson"), type: "error" });
      return;
    }

    const result = readBackup(json);
    if (!result.ok) {
      toast.add({
        title:
          result.reason === "not-natty"
            ? t("data.notOurs")
            : result.reason === "wrong-version"
              ? t("data.wrongVersion", { version: result.detail ?? "?" })
              : t("data.invalid", { detail: result.detail ?? "" }),
        type: "error",
      });
      return;
    }
    setPending(result.backup);
  }

  const rows = pending ? summarise(pending.data) : [];
  // A full backup is your own data going home; anything smaller is a share.
  const isRestore = pending?.scope === "full";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("data.title")}</CardTitle>
          <CardDescription>{t("data.body")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onExport}>
              <DownloadIcon data-icon="inline-start" />
              {t("data.export")}
            </Button>
            <Button variant="outline" onClick={() => fileInput.current?.click()}>
              <UploadIcon data-icon="inline-start" />
              {t("data.import")}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                // Cleared so picking the same file twice fires again.
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("data.localOnly")}</p>
        </CardContent>
      </Card>

      <AlertDialog
        open={pending !== undefined}
        onOpenChange={(open) => {
          if (!open) setPending(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRestore ? t("data.restoreTitle") : t("data.mergeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRestore ? t("data.restoreBody") : t("data.mergeBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* What's actually in the file, before anything is written. */}
          <ul className="flex flex-col gap-1 text-sm tabular-nums">
            {rows.map(({ key, count }) => (
              <li key={key} className="flex justify-between gap-4">
                <span>{t(`data.kind.${key}` as never)}</span>
                <span className="text-muted-foreground">{count}</span>
              </li>
            ))}
            {rows.length === 0 ? (
              <li className="text-muted-foreground">{t("data.empty")}</li>
            ) : null}
          </ul>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("data.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending === undefined) return;
                if (isRestore) restoreEverything(pending.data);
                else importAdditive(pending.data);
                toast.add({
                  title: isRestore ? t("data.restored") : t("data.merged"),
                  type: "success",
                });
                setPending(undefined);
              }}
            >
              {isRestore ? t("data.restoreAction") : t("data.mergeAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
