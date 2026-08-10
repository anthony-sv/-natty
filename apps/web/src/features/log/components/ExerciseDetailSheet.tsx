import { ChartLineIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useT } from "@/i18n/use-t";
import type { WeightUnit } from "@/lib/units";
import { useExerciseLog } from "../queries";
import { formatSet } from "../pr";
import { ExerciseCharts } from "./ExerciseCharts";

/**
 * One exercise's history, opened from its heading in the records table.
 *
 * A sheet rather than an expanded row: the table is virtualized and grouped, so
 * a row that changes height mid-list is a measurement the virtualizer has to
 * chase, and a chart wants more width than a table row has anyway.
 */
export function ExerciseDetailSheet({
  exerciseId,
  exerciseName,
  open,
  onOpenChange,
}: {
  /** Undefined while nothing is selected, so the query stays idle. */
  exerciseId: string | undefined;
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { sets, frontier, last, isLoading } = useExerciseLog(exerciseId);

  // Charted in the unit the exercise was last logged in — a pounds-marked
  // machine keeps reading in pounds, the same rule the player follows.
  const unit: WeightUnit = last?.unit ?? "kg";
  const best = frontier[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Wider than the default `sm:max-w-sm`: two charts with axis labels need
          the room, and this one is a reading surface rather than a form. */}
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{exerciseName}</SheetTitle>
          <SheetDescription>
            {isLoading
              ? t("detail.loading")
              : sets.length === 0
                ? t("detail.nothingLogged")
                : best
                  ? t("detail.summary", {
                      sets: t.plural("detail.sets", sets.length),
                      records: t.plural("records.count", frontier.length),
                      best: formatSet(best),
                    })
                  : t("detail.summaryNoBest", {
                      sets: t.plural("detail.sets", sets.length),
                      records: t.plural("records.count", frontier.length),
                    })}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          <ExerciseCharts sets={sets} unit={unit} isLoading={isLoading} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** The control that opens it, for the end of a group heading. */
export function ExerciseDetailTrigger({
  exerciseName,
  onSelect,
}: {
  exerciseName: string;
  onSelect: () => void;
}) {
  const t = useT();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="shrink-0 text-muted-foreground"
      aria-label={t("records.chartAria", { exercise: exerciseName })}
      onClick={onSelect}
    >
      <ChartLineIcon />
    </Button>
  );
}
