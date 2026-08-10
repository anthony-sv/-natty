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
import { useT, type MessageKey } from "@/i18n/use-t";

const SEX_KEYS: Array<{ value: "male" | "female"; labelKey: MessageKey }> = [
  { value: "male", labelKey: "body.profile.male" },
  { value: "female", labelKey: "body.profile.female" },
];

/**
 * Height and sex, edited inline because they are the only two settings the app
 * has and neither warrants a settings route yet.
 *
 * Both feed FFMI rather than being logged data: height is the denominator, sex
 * only picks which population the reference scale comes from.
 */
export function ProfileFields() {
  const profile = useStore(profileStore, (s) => s);
  const t = useT();
  // `items` wants `{ value, label }`, and the label is what the Select renders
  // for the current value — so it has to be resolved, not a key.
  const sexes = SEX_KEYS.map((sex) => ({
    value: sex.value,
    label: t(sex.labelKey),
  }));

  return (
    <div className="flex flex-wrap items-start gap-4">
      <Field className="w-40">
        <FieldLabel htmlFor="profile-height">{t("common.heightCm")}</FieldLabel>
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
        <FieldDescription>{t("body.profile.heightHint")}</FieldDescription>
      </Field>

      <Field className="w-40">
        <FieldLabel htmlFor="profile-sex">{t("body.profile.sex")}</FieldLabel>
        <Select
          items={sexes}
          value={profile.sex ?? null}
          onValueChange={(value) =>
            setProfile({ sex: (value as "male" | "female" | null) ?? undefined })
          }
        >
          <SelectTrigger id="profile-sex" aria-label={t("body.profile.sex")}>
            <SelectValue placeholder={t("body.profile.sexUnset")} />
          </SelectTrigger>
          <SelectContent>
            {sexes.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>{t("body.profile.sexHint")}</FieldDescription>
      </Field>
    </div>
  );
}
