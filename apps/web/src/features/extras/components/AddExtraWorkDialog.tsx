import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/i18n/use-t";
import type { DayTarget } from "../extras";
import { ExtraWorkForm } from "./ExtraWorkForm";

/**
 * "Log something outside today's plan" — one component, three homes: the
 * session player's header, the day page, and the home Today card. Same call
 * `LoggedSetList` and `DeleteRoutineButton` make for a control that belongs
 * in more than one place.
 */
export function AddExtraWorkDialog({
  target,
  dayLabel,
  open,
  onOpenChange,
}: {
  target: DayTarget;
  dayLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Wider than the standard dialog — the form now embeds `PhaseEditor`,
          the same multi-phase editor the routine builder uses full-page, and
          `sm:max-w-lg` squeezed its rows (reps, load, rest, pose) onto too
          little width even for one phase. */}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("extras.title")}</DialogTitle>
          <DialogDescription>
            {t("extras.description", { day: dayLabel })}
          </DialogDescription>
        </DialogHeader>
        <ExtraWorkForm
          target={target}
          dayLabel={dayLabel}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
