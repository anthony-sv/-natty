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
import {
  backupFilename,
  readBackup,
  scopeMatchesIntent,
  summarise,
  type Backup,
  type ImportIntent,
} from "../backup";
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
  /**
   * Which button opened the picker.
   *
   * A ref rather than state because nothing renders from it until a file comes
   * back, and re-rendering the card between the click and the picker closing
   * would be a wasted pass. Read once in `onFile` and then carried on
   * `pending`, so the dialog can't drift from the click that opened it.
   */
  const intent = useRef<ImportIntent>("merge");
  // Held until confirmed: nothing is written before you've seen what's in the
  // file, because one of the two paths replaces everything you have.
  const [pending, setPending] = useState<
    { backup: Backup; intent: ImportIntent } | undefined
  >();

  function pick(next: ImportIntent) {
    intent.current = next;
    fileInput.current?.click();
  }

  async function onExport() {
    const now = Date.now();
    // Awaited because the collections load lazily — reading them cold writes a
    // backup with nothing in it.
    const backup = await exportEverything(now);
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
    // The file has to be the kind you asked for. Refused rather than quietly
    // switched: the two actions differ by whether your data is deleted.
    const chosen = intent.current;
    if (!scopeMatchesIntent(result.backup.scope, chosen)) {
      toast.add({
        title: chosen === "restore" ? t("data.notABackup") : t("data.notAShare"),
        type: "error",
      });
      return;
    }

    setPending({ backup: result.backup, intent: chosen });
  }

  const rows = pending ? summarise(pending.backup.data) : [];
  // Decided by the button, never by the file — see `scopeMatchesIntent`.
  const isRestore = pending?.intent === "restore";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("data.title")}</CardTitle>
          <CardDescription>{t("data.body")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void onExport()}>
              <DownloadIcon data-icon="inline-start" />
              {t("data.export")}
            </Button>
            {/* Two buttons, because they are two actions — one replaces
                everything you have and the other adds to it. One "Import"
                that read the answer off the file put that choice in the
                file's hands. */}
            <Button variant="outline" onClick={() => pick("merge")}>
              <UploadIcon data-icon="inline-start" />
              {t("data.importShare")}
            </Button>
            <Button variant="outline" onClick={() => pick("restore")}>
              <UploadIcon data-icon="inline-start" />
              {t("data.restoreFile")}
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
            {/* An empty file is a neutral fact on a merge and a warning on a
                restore: "there's nothing in it" sat directly above a button
                that clears every collection, which read as reassurance at the
                exact moment it should alarm. */}
            {rows.length === 0 ? (
              <li className={isRestore ? "text-destructive" : "text-muted-foreground"}>
                {isRestore ? t("data.restoreEmpty") : t("data.empty")}
              </li>
            ) : null}
          </ul>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("data.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending === undefined) return;
                const data = pending.backup.data;
                void (async () => {
                  if (isRestore) await restoreEverything(data);
                  else await importAdditive(data);
                  toast.add({
                    title: isRestore ? t("data.restored") : t("data.merged"),
                    type: "success",
                  });
                })();
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
