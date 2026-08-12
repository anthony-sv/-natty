import { useMemo } from "react";
import { muscleSchema, type MuscleId } from "@/data/exercises";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { matchesAllWords } from "@/lib/search";
import { useLibrary } from "./use-library";

export interface ExerciseOption {
  id: string;
  name: string;
  /** Name plus every alias, so the filter sees the spellings you'd type. */
  search: string;
  isCustom: boolean;
  /**
   * First muscle the lift works directly, which is what the picker groups on.
   *
   * Undefined only for cardio — it's the one movement in the library with no
   * muscles at all, and `userExerciseSchema` requires at least one.
   */
  primaryMuscle: MuscleId | undefined;
}

/**
 * The options every exercise picker shows — built-ins and your own.
 *
 * Shared rather than rebuilt per form, because getting it wrong is invisible:
 * a picker built off `exercises` alone still works, still filters, and simply
 * never offers a lift you added. That was the whole failure mode of the last
 * i18n round, in a different costume.
 *
 * Sorted per locale, since an alphabetical list of English names is not
 * alphabetical in Spanish, and archived lifts are excluded — that's what
 * archiving is for.
 */
export function useExerciseOptions(): ExerciseOption[] {
  const names = useNames();
  const t = useT();
  const { selectable } = useLibrary();

  return useMemo(
    () =>
      selectable
        .map((entry) => ({
          id: entry.id,
          name: names.exercise(entry.id),
          search: [names.exercise(entry.id), entry.name, ...entry.aliases].join(
            " ",
          ),
          isCustom: entry.isCustom,
          primaryMuscle: entry.primaryMuscles[0],
        }))
        .sort((a, b) => a.name.localeCompare(b.name, t.locale)),
    [selectable, names, t.locale],
  );
}

/** The key the muscle-less tail groups under. Not a `MuscleId`, deliberately. */
const CARDIO_GROUP = "cardio";

export interface ExerciseOptionGroup {
  /** A `MuscleId`, or `"cardio"`. */
  key: string;
  label: string;
  items: ExerciseOption[];
}

/**
 * The same options, split into labelled sections by the muscle they work.
 *
 * Takes the flat list rather than calling `useExerciseOptions` itself, because
 * every call site already holds it — resolving the Combobox's `value` needs a
 * flat `find`, and one site filters before grouping.
 *
 * **Group order is the muscle enum's own order, not alphabetical.**
 * `muscleSchema` already lists muscles anatomically, so the three delts sit
 * together and the leg muscles sit together; sorting the headings by name would
 * scatter them, and differently in each language. The names *inside* a group
 * are still locale-sorted, which `useExerciseOptions` has already done.
 */
export function useGroupedExerciseOptions(
  options: ExerciseOption[],
): ExerciseOptionGroup[] {
  const t = useT();

  return useMemo(() => {
    const byMuscle = new Map<string, ExerciseOption[]>();
    for (const option of options) {
      const key = option.primaryMuscle ?? CARDIO_GROUP;
      const bucket = byMuscle.get(key);
      if (bucket) bucket.push(option);
      else byMuscle.set(key, [option]);
    }

    return [...muscleSchema.options, CARDIO_GROUP].flatMap((key) => {
      const items = byMuscle.get(key);
      if (items === undefined) return [];
      return [
        {
          key,
          label:
            key === CARDIO_GROUP
              ? t("common.cardio")
              : t(`muscle.${key}` as never),
          items,
        },
      ];
    });
  }, [options, t]);
}

/**
 * The Combobox filters on its label by default, which is the same blind spot
 * the records table had: curated names, and none of the spellings you'd
 * actually type. This searches the aliases too, through the house matcher — so
 * "pec deck", "flat db press" and "bench incline" all land.
 */
export function filterExerciseOption(
  item: ExerciseOption,
  query: string,
): boolean {
  return matchesAllWords(item.search, query);
}
