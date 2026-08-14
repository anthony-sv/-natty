import { CheckIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useT } from "@/i18n/use-t";
import { allSupplements, createSupplement } from "../collection";
import { useSupplements } from "../use-supplements";

/**
 * Put creatine on the daily checklist, at the dose the card just worked out.
 *
 * The card is a calculator and the Today tab is the log, so this is the one
 * line between them. It seeds the stack rather than ticking anything: nothing
 * in this app auto-logs, and "add it" on a card you opened to read a number is
 * not consent to record that you took it.
 *
 * Matching is by name, case-insensitively, because the alternative — a
 * reserved id for creatine — would make one supplement special everywhere it
 * is read, to save a duplicate the button can simply refuse to create.
 */
const CREATINE = "creatine";

export function TrackCreatineButton({ grams }: { grams: number }) {
  const t = useT();
  const { supplements } = useSupplements();

  const existing = supplements.find(
    (supplement) => supplement.name.trim().toLowerCase() === CREATINE,
  );

  if (existing !== undefined) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckIcon className="size-3.5" />
        {t("supplements.creatineTracked")}
      </p>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="self-start"
      onClick={() => {
        // `allSupplements()` rather than the render's snapshot, the rule
        // `setsFor` exists for: a double press would otherwise add two.
        if (
          allSupplements().some(
            (supplement) => supplement.name.trim().toLowerCase() === CREATINE,
          )
        ) {
          return;
        }
        const { supplement } = createSupplement({
          name: t("supplements.creatine"),
          amount: grams,
          unit: "g",
          // Loading phases exist but this button seeds the maintenance dose,
          // taken once — the card's own loading note stays informational
          // rather than becoming a second checklist entry.
          servingsPerDay: 1,
        });
        toast.add({
          title: t("supplements.saved", { name: supplement.name }),
          type: "success",
        });
      }}
    >
      <PlusIcon data-icon="inline-start" />
      {t("supplements.trackCreatine")}
    </Button>
  );
}
