import { useMemo } from "react";
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
        }))
        .sort((a, b) => a.name.localeCompare(b.name, t.locale)),
    [selectable, names, t.locale],
  );
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
