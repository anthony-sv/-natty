import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/i18n/use-t";
import { emptyPhase, emptySegment, type DraftPhase } from "./draft";
import { SegmentEditor } from "./SegmentEditor";

const MODIFIERS = [
  "forcedReps",
  "negatives",
  "partials",
  "staticHolds",
  "dropSet",
  "restPause",
] as const;

/**
 * The prescription phases for one exercise.
 *
 * A phase is a run of identical sets, which is what makes a ramp expressible
 * without new structure: four sets adding weight while the reps fall is four
 * phases of one set. The hint says so, because "phase" is the one word here
 * that isn't self-explanatory.
 */
export function PhaseEditor({
  phases,
  onChange,
}: {
  phases: DraftPhase[];
  onChange: (next: DraftPhase[]) => void;
}) {
  const t = useT();

  const styles = [
    { value: "plain", label: t("builder.setStyle.plain") },
    { value: "timed", label: t("builder.setStyle.timed") },
    { value: "segments", label: t("builder.setStyle.segments") },
  ];

  /** Which of the three shapes a phase is currently in. */
  const styleOf = (phase: DraftPhase) =>
    phase.segments !== undefined
      ? "segments"
      : phase.durationSeconds !== undefined
        ? "timed"
        : "plain";

  const update = (index: number, patch: Partial<DraftPhase>) =>
    onChange(phases.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  // One ramp-up block per exercise. Two would be two runs of light sets with
  // working sets somewhere among them, which isn't a thing anyone does — and
  // it makes "warmup 1 of 2" ambiguous about which block it means.
  const hasWarmup = phases.some((phase) => phase.isWarmup);

  return (
    <div className="flex flex-col gap-3">
      {phases.map((phase, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-md border p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("builder.sets")}</Label>
              <Input
                type="number"
                min="1"
                className="w-16"
                value={phase.sets}
                onChange={(e) => update(index, { sets: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("builder.setStyle")}</Label>
              <Select
                items={styles}
                value={styleOf(phase)}
                onValueChange={(value) =>
                  update(index, {
                    // Exactly one of the three shapes is set at a time, which
                    // is the same either/or `prescriptionSchema` enforces —
                    // so switching always clears the other two.
                    //
                    // Switching to a sequence seeds the shape people actually
                    // write — a hold and some pulses — rather than an empty
                    // list that immediately says it needs two parts.
                    segments:
                      value === "segments"
                        ? [emptySegment("hold"), emptySegment("pulses")]
                        : undefined,
                    // Twenty minutes: the length of a cardio block someone is
                    // most likely writing when they reach for this.
                    durationSeconds: value === "timed" ? "1200" : undefined,
                  })
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {phase.durationSeconds !== undefined ? (
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t("builder.duration")}</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="1"
                    className="w-24"
                    value={phase.durationSeconds}
                    onChange={(e) =>
                      update(index, { durationSeconds: e.target.value })
                    }
                  />
                  {/* In seconds, because that's what the model stores and what
                      the player counts down — but a 20-minute block is 1200 of
                      them, so the minutes are spelled out beside it. */}
                  <span className="text-xs text-muted-foreground">
                    {t("builder.durationHint", {
                      minutes: (Number(phase.durationSeconds) / 60).toFixed(
                        Number(phase.durationSeconds) % 60 === 0 ? 0 : 1,
                      ),
                    })}
                  </span>
                </div>
              </div>
            ) : null}

            {styleOf(phase) === "plain" ? (
              <div className="flex flex-col gap-1">
                <Label className="text-xs">{t("builder.reps")}</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="1"
                    className="w-16"
                    value={phase.repsFrom}
                    onChange={(e) => update(index, { repsFrom: e.target.value })}
                  />
                  <span className="text-xs text-muted-foreground">
                    {t("builder.repsTo")}
                  </span>
                  <Input
                    type="number"
                    min="1"
                    className="w-16"
                    placeholder="—"
                    value={phase.repsTo}
                    onChange={(e) => update(index, { repsTo: e.target.value })}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("builder.rest")}</Label>
              <Input
                type="number"
                min="0"
                className="w-20"
                value={phase.restSeconds}
                onChange={(e) => update(index, { restSeconds: e.target.value })}
              />
            </div>

            {/* On the phase, not the exercise: "two light sets, then three
                working ones" is two phases, which is the same shape a ramp
                already uses. */}
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id={`warmup-${index}`}
                checked={phase.isWarmup}
                // One warmup phase per exercise, and the others are locked
                // rather than hidden — a disabled box says "not two of these",
                // where a missing one would just look like a bug.
                disabled={!phase.isWarmup && hasWarmup}
                onCheckedChange={(checked) => {
                  const next = phases.map((p, i) =>
                    i === index ? { ...p, isWarmup: checked === true } : p,
                  );
                  // Ticking this on the only phase would leave an exercise
                  // that is *entirely* warmup — no working sets at all, which
                  // is never what anyone means and only shows up later as a
                  // second row on the day page. Add the working phase here
                  // instead of letting you discover the gap.
                  onChange(
                    checked === true && next.every((p) => p.isWarmup)
                      ? [...next, emptyPhase()]
                      : next,
                  );
                }}
              />
              <Label
                htmlFor={`warmup-${index}`}
                className="text-xs font-normal data-disabled:opacity-50"
                data-disabled={!phase.isWarmup && hasWarmup ? "" : undefined}
              >
                {t("routines.warmupSet")}
              </Label>
            </div>

            {phases.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto text-muted-foreground"
                aria-label={t("builder.removePhase", { number: index + 1 })}
                onClick={() => onChange(phases.filter((_, i) => i !== index))}
              >
                <XIcon />
              </Button>
            ) : null}
          </div>

          {phase.segments !== undefined ? (
            <SegmentEditor
              segments={phase.segments}
              onChange={(segments) => update(index, { segments })}
            />
          ) : null}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              {t("builder.modifiers")}
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {MODIFIERS.map((modifier) => (
                <div key={modifier} className="flex items-center gap-2">
                  <Checkbox
                    id={`mod-${index}-${modifier}`}
                    checked={phase.modifiers[modifier]}
                    onCheckedChange={(checked) =>
                      update(index, {
                        modifiers: {
                          ...phase.modifiers,
                          [modifier]: checked === true,
                        },
                      })
                    }
                  />
                  <Label
                    htmlFor={`mod-${index}-${modifier}`}
                    className="text-xs font-normal"
                  >
                    {t(`modifier.${modifier}` as never)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onChange([...phases, emptyPhase()])}
        >
          <PlusIcon data-icon="inline-start" />
          {t("builder.addPhase")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("builder.phaseHint")}</p>
      </div>
    </div>
  );
}
