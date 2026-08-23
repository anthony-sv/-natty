import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { ComboboxOptionGroup } from "@/components/combobox-option-group";
import { toast } from "@/components/ui/toast";
import { useT } from "@/i18n/use-t";
import { createUserExercise } from "../collection";
import {
  filterExerciseOption,
  useExerciseOptions,
  useGroupedExerciseOptions,
  type ExerciseOption,
  type ExerciseOptionGroup,
} from "../use-exercise-options";

/**
 * The exercise-picking Combobox, extracted from `RoutineBuilder`'s
 * `ExerciseEditor` — which had it inline, and had it a second time in
 * `AlternativesEditor` a few hundred lines down. A third inline copy for
 * extra-work logging would be the wrong call under the house rule "existing
 * components before custom markup", so this is the one home for it now.
 *
 * `RoutineBuilder` isn't switched over to it here — that's a separate,
 * optional cleanup, deliberately out of scope so this doesn't risk the
 * builder's `draft.test.ts` round-trip.
 */
export function ExercisePicker({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (option: ExerciseOption | null) => void;
  placeholder?: string;
}) {
  const t = useT();
  const options = useExerciseOptions();
  const groups = useGroupedExerciseOptions(options);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.id === value) ?? null;

  // Typing a lift the library doesn't have is the moment you find out it's
  // missing, so that's where adding one belongs.
  const canCreate =
    query.trim().length > 1 && !options.some((o) => filterExerciseOption(o, query));

  function createFromQuery() {
    const name = query.trim();
    const { exercise: created } = createUserExercise({
      name,
      aliases: [],
      // Sensible defaults it can be corrected from later — the Library tab
      // owns the real editor.
      pattern: "horizontal-press",
      primaryMuscles: ["chest"],
      secondaryMuscles: [],
    });
    onChange({
      id: created.id,
      name,
      search: name,
      isCustom: true,
      primaryMuscle: "chest",
      isCardio: false,
    });
    toast.add({ title: t("library.saved", { name }), type: "success" });
    setQuery("");
  }

  return (
    <Combobox
      items={groups}
      filter={filterExerciseOption}
      value={selected}
      onValueChange={onChange}
      // Watched rather than left uncontrolled, so "no match" can offer to
      // create what you typed. The query lives here, not on the input.
      onInputValueChange={setQuery}
      itemToStringLabel={(option: ExerciseOption) => option.name}
    >
      <ComboboxInput placeholder={placeholder ?? t("common.searchExercises")} />
      <ComboboxContent>
        <ComboboxEmpty>
          {canCreate ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={createFromQuery}
            >
              <PlusIcon data-icon="inline-start" />
              {t("builder.createNamed", { name: query.trim() })}
            </Button>
          ) : (
            t("common.noExerciseFound")
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(group: ExerciseOptionGroup, index: number) => (
            <ComboboxOptionGroup key={group.key} group={group} index={index}>
              {(option) => (
                <ComboboxItem key={option.id} value={option}>
                  <span className="flex items-center gap-2">
                    {option.name}
                    {/* The heading says which muscle, not whose — a lift you
                        added still needs marking as yours. */}
                    {option.isCustom ? (
                      <Badge variant="secondary">{t("library.custom")}</Badge>
                    ) : null}
                  </span>
                </ComboboxItem>
              )}
            </ComboboxOptionGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
