import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { CircleCheckIcon, CirclePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Routine } from "@/data/routines";
import { profileStore, setProfile } from "@/features/profile/profile-store";
import { scheduleSequence } from "@/features/routines/lib/next-day";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";

type StartMode = "default" | "custom";

function dayKey(weekNumber: number, dayNumber: number): string {
  return `${weekNumber}-${dayNumber}`;
}

/**
 * Picking a program is what the home page's "Today" card reads — see
 * `TodayCard`. The choice here only ever seeds the *first* read of that
 * card, before anything is logged: `nextTrainingDay` stops consulting it the
 * moment a set exists for this routine, so there's no ongoing pointer to
 * keep in sync, only a one-time starting line for someone picking up a
 * program mid-cycle (week 3 of an 8-week plan, say) rather than at day 1.
 */
export function ActivateProgramButton({ routine }: { routine: Routine }) {
  const t = useT();
  const f = useFormatting();
  const activeRoutineSlug = useStore(
    profileStore,
    (state) => state.activeRoutineSlug,
  );
  const isActive = activeRoutineSlug === routine.slug;

  const sequence = scheduleSequence(routine);
  const multiWeek = routine.weeks.length > 1;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<StartMode>("default");
  const [dayValue, setDayValue] = useState(
    sequence.length > 0
      ? dayKey(sequence[0].weekNumber, sequence[0].day.dayNumber)
      : "",
  );

  if (isActive) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          setProfile({
            activeRoutineSlug: undefined,
            activeRoutineStartDay: undefined,
          })
        }
      >
        <CircleCheckIcon data-icon="inline-start" />
        {t("routines.activeProgram")}
      </Button>
    );
  }

  const dayItems = sequence.map((entry) => ({
    value: dayKey(entry.weekNumber, entry.day.dayNumber),
    label: multiWeek
      ? t("routines.weekDayLabel", {
          week: entry.weekNumber,
          day: t("routines.dayLabel", {
            number: entry.day.dayNumber,
            label: f.names.text(entry.day.label) ?? entry.day.label,
          }),
        })
      : t("routines.dayLabel", {
          number: entry.day.dayNumber,
          label: f.names.text(entry.day.label) ?? entry.day.label,
        }),
  }));

  const confirm = () => {
    const [weekNumber, dayNumber] = dayValue.split("-").map(Number);
    setProfile({
      activeRoutineSlug: routine.slug,
      activeRoutineStartDay:
        mode === "custom" && dayValue !== ""
          ? { weekNumber, dayNumber }
          : undefined,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <CirclePlusIcon data-icon="inline-start" />
            {t("routines.setActive")}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80">
        <RadioGroup
          value={mode}
          onValueChange={(next) => setMode(next as StartMode)}
        >
          <Label className="flex items-start gap-3 rounded-md p-2 font-normal hover:bg-accent has-data-checked:bg-accent">
            <RadioGroupItem value="default" className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {t("routines.activate.default")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("routines.activate.defaultBody")}
              </span>
            </span>
          </Label>
          <Label className="flex items-start gap-3 rounded-md p-2 font-normal hover:bg-accent has-data-checked:bg-accent">
            <RadioGroupItem value="custom" className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {t("routines.activate.custom")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("routines.activate.customBody")}
              </span>
            </span>
          </Label>
        </RadioGroup>

        {mode === "custom" ? (
          <div className="flex flex-col gap-1 border-t pt-2">
            <Label className="text-xs">{t("routines.activate.day")}</Label>
            <Select
              items={dayItems}
              value={dayValue}
              onValueChange={(value) => setDayValue(value as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayItems.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <Button size="sm" className="mt-2 w-full" onClick={confirm}>
          {t("routines.activate.confirm")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
