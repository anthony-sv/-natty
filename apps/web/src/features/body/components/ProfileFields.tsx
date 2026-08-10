import { useStore } from "@tanstack/react-store";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profileStore, setProfile } from "@/features/profile/profile-store";

const SEXES = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

/**
 * Height and sex, edited inline because they are the only two settings the app
 * has and neither warrants a settings route yet.
 *
 * Both feed FFMI rather than being logged data: height is the denominator, sex
 * only picks which population the reference scale comes from.
 */
export function ProfileFields() {
  const profile = useStore(profileStore, (s) => s);

  return (
    <div className="flex flex-wrap items-start gap-4">
      <Field className="w-40">
        <FieldLabel htmlFor="profile-height">Height (cm)</FieldLabel>
        <Input
          id="profile-height"
          type="number"
          inputMode="numeric"
          min="1"
          placeholder="e.g. 178"
          value={profile.heightCm ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value);
            setProfile({
              heightCm:
                e.target.value.trim() === "" || !Number.isFinite(value) || value <= 0
                  ? undefined
                  : value,
            });
          }}
        />
        <FieldDescription>Needed for FFMI.</FieldDescription>
      </Field>

      <Field className="w-40">
        <FieldLabel htmlFor="profile-sex">Sex</FieldLabel>
        <Select
          items={SEXES}
          value={profile.sex ?? null}
          onValueChange={(value) =>
            setProfile({ sex: (value as "male" | "female" | null) ?? undefined })
          }
        >
          <SelectTrigger id="profile-sex" aria-label="Sex">
            <SelectValue placeholder="Not set" />
          </SelectTrigger>
          <SelectContent>
            {SEXES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>Only picks the reference scale.</FieldDescription>
      </Field>
    </div>
  );
}
