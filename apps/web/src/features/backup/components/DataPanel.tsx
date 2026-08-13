import { Fragment, useRef, useState } from "react";
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
  compareCounts,
  readBackup,
  scopeMatchesIntent,
  summarise,
  type Backup,
  type ImportIntent,
} from "../backup";
import {
  currentData,
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
    | {
        backup: Backup;
        intent: ImportIntent;
        /**
         * Restores only. Read once here rather than in an effect — `onFile` is
         * already async, and `set-state-in-effect` is enforced outside `ui/`.
         */
        comparison?: ReturnType<typeof compareCounts>;
      }
    | undefined
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

    // A restore is asked about in terms of what it *removes*, so it needs the
    // current counts too. `currentData` wakes every collection first — reading
    // them cold would report zero across the board and make the dialog claim
    // there's nothing to lose.
    const comparison =
      chosen === "restore"
        ? compareCounts(await currentData(), result.backup.data)
        : undefined;

    setPending({ backup: result.backup, intent: chosen, comparison });
  }

  const rows = pending ? summarise(pending.backup.data) : [];
  const comparison = pending?.comparison;
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

          {/* A restore is asked about as a before-and-after, because listing
              only the file's contents answers the wrong question: the dialog
              replaces everything, so the number that matters is the one you
              lose. A merge takes nothing away, so there it really is just
              what's arriving. */}
          {comparison ? (
            // Nothing on either side: a header row over no rows is worse than
            // the sentence, which is the one case that says more than a table.
            comparison.length === 0 ? (
              <p className="text-sm text-destructive">{t("data.restoreEmpty")}</p>
            ) : (
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-1 text-sm tabular-nums">
                <span />
                <span className="text-right text-xs text-muted-foreground">
                  {t("data.countNow")}
                </span>
                <span />
                <span className="text-right text-xs text-muted-foreground">
                  {t("data.countAfter")}
                </span>
                {comparison.map(({ key, from, to }) => (
                  <Fragment key={key}>
                    <span>{t(`data.kind.${key}` as never)}</span>
                    <span className="text-right text-muted-foreground">{from}</span>
                    <span className="text-muted-foreground">→</span>
                    {/* Losing rows are marked. A restore that drops 74 sets to
                        0 shouldn't read the same as one that leaves them
                        alone. */}
                    <span
                      className={
                        to < from ? "text-right text-destructive" : "text-right"
                      }
                    >
                      {to}
                    </span>
                  </Fragment>
                ))}
              </div>
            )
          ) : (
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
          )}

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
