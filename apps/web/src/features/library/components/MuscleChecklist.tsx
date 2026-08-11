import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { muscleSchema, type MuscleId } from "@/data/exercises";
import { useT } from "@/i18n/use-t";

/**
 * The eighteen muscles, as a wrapped grid of checkboxes.
 *
 * A multi-select Combobox would hide the options behind a click, and the whole
 * list fits — picking muscles is a "see everything and tick two" job, not a
 * search job. `useT` is what sorts and labels them, so this reads in Spanish
 * without a second component.
 */
export function MuscleChecklist({
  value,
  onChange,
}: {
  value: MuscleId[];
  onChange: (next: MuscleId[]) => void;
}) {
  const t = useT();

  const muscles = muscleSchema.options
    .map((id) => ({ id, label: t(`muscle.${id}` as never) }))
    .sort((a, b) => a.label.localeCompare(b.label, t.locale));

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {muscles.map(({ id, label }) => {
        const checked = value.includes(id);
        return (
          <div key={id} className="flex items-center gap-2">
            <Checkbox
              id={`muscle-${id}`}
              checked={checked}
              onCheckedChange={() =>
                onChange(
                  checked
                    ? value.filter((muscle) => muscle !== id)
                    : [...value, id],
                )
              }
            />
            <Label htmlFor={`muscle-${id}`} className="text-sm font-normal">
              {label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
