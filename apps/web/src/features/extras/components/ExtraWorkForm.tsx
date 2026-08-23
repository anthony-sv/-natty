import { useState } from "react";
import { CheckIcon } from "lucide-react";
import type { ExerciseEntry } from "@/data/routines";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ExercisePicker } from "@/features/library/components/ExercisePicker";
import type { ExerciseOption } from "@/features/library/use-exercise-options";
import { FinisherPicker } from "@/features/routines/components/builder/FinisherPicker";
import { PhaseEditor } from "@/features/routines/components/builder/PhaseEditor";
import {
  applyFinisher,
  emptyPhase,
  finisherKindOf,
  timed,
  toPrescriptions,
  type DraftPhase,
} from "@/features/routines/components/builder/draft";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";
import { createExtra } from "../collection";
import type { DayTarget } from "../extras";

/**
 * Full parity with the routine builder, not a cut-down version of it.
 *
 * The first version of this form was a flat TanStack Form — one prescription,
 * sets/reps/rest as three fields. That covers a plain accessory set and
 * nothing else: no warmup, no ramp, and only the "pose hold" finisher, not
 * the "hold and pulse" one — because both of those are genuinely multi-phase
 * (a ramp is four sets with falling reps and rising load; hold-and-pulse is
 * four *sequenced* sets), and a single prescription has nowhere to put a
 * second phase.
 *
 * So this reuses the builder's own machinery instead of reinventing a
 * smaller copy of it: `PhaseEditor` (warmup, load, segments, modifiers, style
 * — everything) and `FinisherPicker` (the "none"/"pose"/"ramp" choice),
 * against local `DraftPhase[]` state exactly like `RoutineBuilder`'s
 * `ExerciseEditor` does for one exercise inside a full day. Neither
 * component reads any builder-specific context — both are plain props in,
 * `DraftPhase[]`/`onChange` out — so lifting them here needed no changes to
 * either.
 *
 * **Not a TanStack Form**, for the same reason the builder itself isn't
 * one: multiple phases of dynamic, structural edits (add a phase, add a
 * segment, toggle a modifier) don't fit "a flat set of fields with per-field
 * validation" — `toPrescriptions` is the validation, called on every render
 * to decide whether Add is enabled, the same way `toRoutine` gates the
 * builder's own Save.
 */
export function ExtraWorkForm({
  target,
  dayLabel,
  onDone,
}: {
  target: DayTarget;
  dayLabel: string;
  onDone: () => void;
}) {
  const t = useT();
  const { names } = useFormatting();
  const [option, setOption] = useState<ExerciseOption | null>(null);
  const [phases, setPhases] = useState<DraftPhase[]>([emptyPhase()]);
  const [isFinisher, setIsFinisher] = useState(false);

  // Cardio can't be a finisher — the same rule `RoutineBuilder`'s
  // `ExerciseEditor` follows, since only resistance work reads the flag.
  const kind: ExerciseEntry["kind"] = option?.isCardio === true ? "cardio" : "resistance";
  const prescriptions = toPrescriptions(phases);
  const canSubmit = option !== null && prescriptions.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (option === null || prescriptions.length === 0) return;

    const entry: ExerciseEntry = {
      exerciseId: option.id,
      orAlternatives: [],
      kind,
      isFinisher,
      prescriptions,
    };

    const { transaction } = createExtra({ ...target, entry });
    const exerciseName = names.exercise(option.id);
    void toast.promise(transaction.isPersisted.promise, {
      loading: t("extras.saving"),
      success: {
        title: t("extras.saved", { name: exerciseName, day: dayLabel }),
        type: "success",
      },
      error: { title: t("extras.saveError"), type: "error" },
    });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="extra-exercise">{t("common.exercise")}</FieldLabel>
          <ExercisePicker
            value={option?.id ?? ""}
            onChange={(picked) => {
              setOption(picked);
              // The library already knows conditioning from lifting, so
              // picking a cardio exercise settles the phases too — rather
              // than leaving them asking for "3 sets of 8-12 reps" of a
              // treadmill.
              if (picked?.isCardio === true) setPhases((prev) => timed(prev));
            }}
          />
        </Field>

        {option !== null ? (
          <>
            {kind !== "cardio" ? (
              <FinisherPicker
                value={finisherKindOf({ isFinisher, phases })}
                phases={phases}
                onChange={(nextKind) => {
                  setIsFinisher(nextKind !== "none");
                  setPhases(applyFinisher(phases, nextKind));
                }}
              />
            ) : null}

            <PhaseEditor
              phases={phases}
              kind={kind}
              isFinisher={isFinisher}
              onChange={setPhases}
            />
          </>
        ) : null}

        <FieldDescription>{t("extras.expiryHint")}</FieldDescription>

        <Button type="submit" disabled={!canSubmit} className="self-start">
          <CheckIcon data-icon="inline-start" />
          {t("extras.action")}
        </Button>
      </FieldGroup>
    </form>
  );
}
