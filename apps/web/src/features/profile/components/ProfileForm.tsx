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
  { value: "male", labelKey: "profile.male" },
  { value: "female", labelKey: "profile.female" },
];

/** A positive number, or undefined for blank/nonsense — the calculators'
 * own rule, so a half-typed value doesn't throw or flash an error. */
function parsePositive(raw: string): number | undefined {
  const value = Number(raw);
  return raw.trim() === "" || !Number.isFinite(value) || value <= 0
    ? undefined
    : value;
}

/**
 * Standing facts about your body, edited in the one place that owns them.
 *
 * **Height and sex used to live inline on the Body tab; wrist and ankle used
 * to live inline on the Casey Butt calculator tab** — the same two numbers,
 * duplicated because two features each needed a way to type them in. Both
 * were write-throughs against the same `profileStore` the whole time, so
 * consolidating them cost no data migration — only a screen to put them on
 * that doesn't require an account, since FFMI and the potential estimate both
 * work signed out.
 *
 * No submit button, the calculators' own rule: this writes through on every
 * change, so correcting a typo takes effect immediately rather than waiting
 * on a save you might not remember to press.
 */
export function ProfileForm() {
  const profile = useStore(profileStore, (s) => s);
  const t = useT();

  const sexes = SEX_KEYS.map((sex) => ({ value: sex.value, label: t(sex.labelKey) }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start gap-4">
        <Field className="w-40">
          <FieldLabel htmlFor="profile-height">{t("common.heightCm")}</FieldLabel>
          <Input
            id="profile-height"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.5"
            placeholder="e.g. 178"
            value={profile.heightCm ?? ""}
            onChange={(e) => setProfile({ heightCm: parsePositive(e.target.value) })}
          />
          <FieldDescription>{t("profile.heightHint")}</FieldDescription>
        </Field>

        <Field className="w-40">
          <FieldLabel htmlFor="profile-sex">{t("profile.sex")}</FieldLabel>
          <Select
            items={sexes}
            value={profile.sex ?? null}
            onValueChange={(value) =>
              setProfile({ sex: (value as "male" | "female" | null) ?? undefined })
            }
          >
            <SelectTrigger id="profile-sex" aria-label={t("profile.sex")}>
              <SelectValue placeholder={t("profile.sexUnset")} />
            </SelectTrigger>
            <SelectContent>
              {sexes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>{t("profile.sexHint")}</FieldDescription>
        </Field>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <Field className="w-40">
          <FieldLabel htmlFor="profile-wrist">{t("profile.wristCm")}</FieldLabel>
          <Input
            id="profile-wrist"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.1"
            placeholder="e.g. 18"
            value={profile.wristCm ?? ""}
            onChange={(e) => setProfile({ wristCm: parsePositive(e.target.value) })}
          />
          <FieldDescription>{t("profile.wristHint")}</FieldDescription>
        </Field>

        <Field className="w-40">
          <FieldLabel htmlFor="profile-ankle">{t("profile.ankleCm")}</FieldLabel>
          <Input
            id="profile-ankle"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.1"
            placeholder="e.g. 23"
            value={profile.ankleCm ?? ""}
            onChange={(e) => setProfile({ ankleCm: parsePositive(e.target.value) })}
          />
          <FieldDescription>{t("profile.ankleHint")}</FieldDescription>
        </Field>
      </div>
    </div>
  );
}
