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
import type { SetSegment } from "@/data/routines";
import { useT } from "@/i18n/use-t";
import { emptySegment, type DraftSegment } from "./draft";

const KINDS: SetSegment["kind"][] = ["reps", "pulses", "hold"];

/**
 * The parts of a set that runs as a sequence, in order.
 *
 * Ordered and repeatable rather than a fixed set of fields, because the order
 * *is* the protocol — hold-then-pulses and pulses-then-hold are different sets,
 * and a routine can repeat a part (two holds in one set is the normal case).
 */
export function SegmentEditor({
  segments,
  onChange,
}: {
  segments: DraftSegment[];
  onChange: (next: DraftSegment[]) => void;
}) {
  const t = useT();

  const kinds = KINDS.map((value) => ({
    value,
    label: t(`builder.segmentKind.${value}` as never),
  }));

  const update = (index: number, patch: Partial<DraftSegment>) =>
    onChange(segments.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t("builder.segments")}</span>

      {segments.map((segment, index) => (
        <div
          key={index}
          className="flex flex-wrap items-end gap-2 rounded-md border p-2"
        >
          <span className="w-5 shrink-0 pb-2 text-xs tabular-nums text-muted-foreground">
            {index + 1}.
          </span>

          <div className="flex flex-col gap-1">
            <Label className="text-xs">{t("builder.segmentKind")}</Label>
            <Select
              items={kinds}
              value={segment.kind}
              onValueChange={(value) =>
                update(index, { kind: value as SetSegment["kind"] })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kinds.map((kind) => (
                  <SelectItem key={kind.value} value={kind.value}>
                    {kind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {segment.kind === "hold" ? (
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("builder.segmentSeconds")}</Label>
              <Input
                type="number"
                min="1"
                className="w-20"
                value={segment.seconds}
                onChange={(e) => update(index, { seconds: e.target.value })}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Label className="text-xs">{t("builder.segmentCount")}</Label>
              <Input
                type="number"
                min="1"
                className="w-20"
                value={segment.count}
                onChange={(e) => update(index, { count: e.target.value })}
              />
            </div>
          )}

          {segment.kind === "reps" ? (
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id={`pulse-${index}`}
                checked={segment.pulsePerRep}
                onCheckedChange={(checked) =>
                  update(index, { pulsePerRep: checked === true })
                }
              />
              <Label htmlFor={`pulse-${index}`} className="text-xs font-normal">
                {t("builder.pulsePerRep")}
              </Label>
            </div>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto text-muted-foreground"
            aria-label={t("builder.removeSegment", { number: index + 1 })}
            onClick={() => onChange(segments.filter((_, i) => i !== index))}
          >
            <XIcon />
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...segments, emptySegment("reps")])}
        >
          <PlusIcon data-icon="inline-start" />
          {t("builder.addSegment")}
        </Button>
        {segments.length < 2 ? (
          <span className="text-xs text-destructive">
            {t("builder.needTwoSegments")}
          </span>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">{t("builder.segmentsHint")}</p>
    </div>
  );
}
