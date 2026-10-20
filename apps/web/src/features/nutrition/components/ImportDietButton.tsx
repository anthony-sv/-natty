import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { UploadIcon } from "lucide-react";
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
import { toast } from "@/components/ui/toast";
import { readBackup, summarise, type Backup } from "@/features/backup/backup";
import { importAdditive } from "@/features/backup/use-backup";
import { useT } from "@/i18n/use-t";

/**
 * The other half of the plan page's Share button.
 *
 * Importing a shared plan was always *possible* — through the Data tab on
 * /progress, behind a button that accepts any shared file. Nobody would look
 * there from /nutrition, which is where the Share button that made the file
 * lives, so in practice there was an export with no import.
 *
 * Narrower than the Data tab's on purpose: it accepts a **diet** file and
 * nothing else, refusing a routine or a full backup by name rather than
 * merging something unexpected. It always merges — a plan arrives as a new
 * plan of yours, re-keyed, with whatever foods and recipes it carried — and
 * then opens it, since its slug was re-minted and the file's no longer exists.
 */
export function ImportDietButton() {
  const t = useT();
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  // Held until confirmed: nothing is written before you've seen what's in it.
  const [pending, setPending] = useState<Backup | undefined>();

  async function onFile(file: File | undefined) {
    if (file === undefined) return;
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
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
    if (result.backup.scope !== "diet" || result.backup.data.diets.length === 0) {
      toast.add({ title: t("dietImport.notADiet"), type: "error" });
      return;
    }
    setPending(result.backup);
  }

  const plan = pending?.data.diets[0];

  return (
    <>
      <Button variant="outline" onClick={() => input.current?.click()}>
        <UploadIcon data-icon="inline-start" />
        {t("dietImport.button")}
      </Button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          // Cleared so picking the same file twice fires again.
          e.target.value = "";
        }}
      />

      <AlertDialog
        open={pending !== undefined}
        onOpenChange={(open) => {
          if (!open) setPending(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("dietImport.title", { name: plan?.name ?? "" })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("dietImport.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="flex flex-col gap-1 text-sm tabular-nums">
            {(pending ? summarise(pending.data) : []).map(({ key, count }) => (
              <li key={key} className="flex justify-between gap-4">
                <span>{t(`data.kind.${key}` as never)}</span>
                <span className="text-muted-foreground">{count}</span>
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("data.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending === undefined) return;
                const data = pending.data;
                setPending(undefined);
                void (async () => {
                  try {
                    const inserted = await importAdditive(data);
                    const slug = inserted.diets[0]?.slug;
                    toast.add({ title: t("dietImport.done"), type: "success" });
                    if (slug !== undefined) {
                      void navigate({
                        to: "/nutrition",
                        search: { plan: slug, tab: "plan" },
                      });
                    }
                  } catch (error) {
                    toast.add({
                      title: t("dietImport.error"),
                      description:
                        error instanceof Error ? error.message : String(error),
                      type: "error",
                    });
                  }
                })();
              }}
            >
              {t("dietImport.action")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
