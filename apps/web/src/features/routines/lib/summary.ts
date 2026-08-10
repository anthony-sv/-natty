import type { Routine } from "@/data/routines";
import type { Formatting } from "./format";

/**
 * The at-a-glance shape of a program: how long it runs, and what the split is.
 *
 * Pulled out of the card because "8 weeks" alone said almost nothing about a
 * program — two of them read identically while training completely different
 * things. The split is the part you actually choose between.
 */
export interface RoutineSummary {
  /** "8 weeks" or "7-day cycle". */
  length: string;
  trainingDays: number;
  restDays: number;
  /** Training day labels in order, from the first week. */
  split: string[];
}

export function summariseRoutine(
  routine: Routine,
  { names, t }: Formatting,
): RoutineSummary {
  // The first week stands for the program. Later weeks in these routines
  // repeat the same split with different prescriptions, so listing every week
  // would just say "Chest, Back, ..." eight times.
  const days = routine.weeks[0]?.days ?? [];
  const training = days.filter((day) => !day.isRest);

  return {
    length:
      routine.weeks.length > 1
        ? t.plural("routines.weeks", routine.weeks.length)
        : t("routines.dayCycle", { count: days.length }),
    trainingDays: training.length,
    restDays: days.length - training.length,
    // Day labels are muscle groups, so they translate like any other authored
    // name — through the catalog, keyed by their English wording.
    split: training.map((day) => names.text(day.label) ?? day.label),
  };
}
