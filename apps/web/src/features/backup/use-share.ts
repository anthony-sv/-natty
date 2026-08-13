import { useCallback } from "react";
import { toast } from "@/components/ui/toast";
import { useT } from "@/i18n/use-t";
import { backupFilename, type Backup } from "./backup";
import { downloadBackup } from "./use-backup";

/**
 * Handing someone a file, and saying so when it doesn't happen.
 *
 * Every share button was the same six lines, and all of them failed the same
 * way: `if (backup === undefined) return;` inside a `void (async () => …)()`,
 * so a missing item did nothing and a *thrown* error did nothing more
 * quietly still — an unhandled rejection in a floating promise, no toast, no
 * console line anyone would look at. Pressing the button and having the app
 * sit there is indistinguishable from pressing it wrong.
 *
 * The three outcomes are now all reported: a file, a "couldn't find it", or
 * the error. Written once here rather than five times at the call sites.
 */
export function useShare(): (
  build: (now: number) => Promise<Backup | undefined>,
  scope: Backup["scope"],
) => Promise<void> {
  const t = useT();

  return useCallback(
    async (build, scope) => {
      // One timestamp for both the envelope and the filename, so a file's
      // name matches what's inside it.
      const now = Date.now();
      try {
        const backup = await build(now);
        if (backup === undefined) {
          toast.add({ title: t("data.shareMissing"), type: "error" });
          return;
        }
        downloadBackup(backup, backupFilename(now, scope));
        toast.add({ title: t("data.shared"), type: "success" });
      } catch (error) {
        toast.add({
          title: t("data.shareError"),
          // The message matters here: the likely causes are a collection that
          // wouldn't load and a server that refused, and those want different
          // responses from whoever reads it.
          description: error instanceof Error ? error.message : String(error),
          type: "error",
        });
      }
    },
    [t],
  );
}
