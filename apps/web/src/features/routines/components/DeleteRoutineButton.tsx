import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RotateCcwIcon, Trash2Icon } from "lucide-react";
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
import { useT } from "@/i18n/use-t";
import { deleteUserRoutine, restoreUserRoutine } from "../collection";

/**
 * Throwing away a routine you wrote, or your edit of a built-in.
 *
 * **One component in two homes**, the way `LoggedSetList` is: the editor, where
 * it always lived, and the program page — which is where you actually look for
 * it. Reaching a delete button meant opening the editor first, so a routine you
 * only wanted rid of asked you to start editing it, and the button that would
 * have said so was on a page you had no reason to open. Two copies of a
 * confirm dialog is two wordings to drift apart, hence one component.
 *
 * Resetting and deleting are the same gesture on different things — one gives
 * you the shipped program back, the other throws away something that only ever
 * existed here — so they share everything but their words. Never both at once.
 */
export function DeleteRoutineButton({
  routineSlug,
  name,
  isOverridden,
  size,
}: {
  routineSlug: string;
  name: string;
  /** This slug names a built-in you've edited, so this is a reset. */
  isOverridden: boolean;
  size?: "sm";
}) {
  const t = useT();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <Button variant="outline" size={size} onClick={() => setConfirm(true)}>
        {isOverridden ? (
          <RotateCcwIcon data-icon="inline-start" />
        ) : (
          <Trash2Icon data-icon="inline-start" />
        )}
        {isOverridden ? t("builder.reset") : t("builder.delete")}
      </Button>

      {/* A dialog rather than an undo toast alone, unlike deleting a set: this
          throws away a document you wrote, and you're navigated off the page
          the undo would have been sitting on. The toast still carries one. */}
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isOverridden ? t("builder.resetTitle") : t("builder.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isOverridden ? t("builder.resetBody") : t("builder.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("builder.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const { routine: removed } = deleteUserRoutine(routineSlug);
                toast.add({
                  title: isOverridden
                    ? t("builder.reset.done", { name })
                    : t("builder.deleted", { name }),
                  type: "info",
                  actionProps: {
                    children: t("history.undo"),
                    onClick: () => {
                      if (removed) restoreUserRoutine(removed);
                    },
                  },
                });
                // A reset leaves the built-in at this url, so stay on it;
                // a delete leaves nothing here at all.
                void navigate(
                  isOverridden
                    ? { to: "/routines/$routineSlug", params: { routineSlug } }
                    : { to: "/routines" },
                );
              }}
            >
              {isOverridden ? t("builder.reset") : t("builder.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
