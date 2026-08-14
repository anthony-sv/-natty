import { useState } from "react";
import { ChevronDownIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useT, type MessageKey } from "@/i18n/use-t";
import { isUntouched, type DraftPhase, type FinisherKind } from "./draft";

/**
 * Which shape of finisher an exercise runs, if any.
 *
 * A popover rather than the switch this replaced, because there turned out to
 * be two of them and a switch can only say yes. Each option carries what it
 * *writes* — the sets, the rest and the hold — since that is the whole reason
 * to pick one: doing either by hand is a dozen fields, and the ramp is four
 * sequences of five parts each, which is what a preset is for.
 */

const OPTIONS: {
  value: FinisherKind;
  label: MessageKey;
  body: MessageKey;
}[] = [
  {
    value: "none",
    label: "builder.finisher.none",
    body: "builder.finisher.noneBody",
  },
  {
    value: "pose",
    label: "builder.finisher.pose",
    body: "builder.finisher.poseBody",
  },
  {
    value: "ramp",
    label: "builder.finisher.ramp",
    body: "builder.finisher.rampBody",
  },
];

export function FinisherPicker({
  value,
  phases,
  onChange,
}: {
  value: FinisherKind;
  /** Read only to decide whether picking one would overwrite your typing. */
  phases: DraftPhase[];
  onChange: (kind: FinisherKind) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find((option) => option.value === value) ?? OPTIONS[0];
  // Said before the click, not after: the ramp replaces whatever is there, and
  // a warning that arrives once the sets are gone is an apology.
  const wouldOverwrite = !isUntouched(phases);

  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">{t("common.finisher")}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="w-44 justify-between font-normal"
            >
              {t(current.label)}
              <ChevronDownIcon className="text-muted-foreground" />
            </Button>
          }
        />
        <PopoverContent align="start" className="w-80">
          <RadioGroup
            value={value}
            onValueChange={(next) => {
              onChange(next as FinisherKind);
              setOpen(false);
            }}
          >
            {OPTIONS.map((option) => (
              <Label
                key={option.value}
                className="flex items-start gap-3 rounded-md p-2 font-normal hover:bg-accent has-data-checked:bg-accent"
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{t(option.label)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t(option.body)}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>

          {wouldOverwrite ? (
            <p className="mt-2 flex items-start gap-1.5 border-t pt-2 text-xs text-muted-foreground">
              <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
              {t("builder.finisher.overwrites")}
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
