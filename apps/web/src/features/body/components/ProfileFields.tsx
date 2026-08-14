import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { PencilLineIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
 * Height and sex — the two settings the app has, and the two that almost
 * never change once they're right.
 *
 * **Collapses to one line once both are set.** This used to be a full card of
 * inputs at the very top of the tab, every time, ahead of the thing you
 * actually came to do — for two values that are correct for years at a
 * stretch. Incomplete, it stays open: that's the one state where it's
 * genuinely the next thing to do, the same reasoning the creatine card uses
 * for its own empty state.
 */
export function ProfileFields() {
  const profile = useStore(profileStore, (s) => s);
  const t = useT();
  const complete = profile.heightCm !== undefined && profile.sex !== undefined;
  // Open by default only while something's missing — once both are set this
  // starts collapsed, and pressing the edit button is the only way back in.
  const [editing, setEditing] = useState(!complete);

  const sexes = SEX_KEYS.map((sex) => ({
    value: sex.value,
    label: t(sex.labelKey),
  }));

  if (!editing) {
    const sexLabel =
      profile.sex === undefined
        ? undefined
        : sexes.find((option) => option.value === profile.sex)?.label;
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {[
            profile.heightCm !== undefined
              ? t("body.profile.heightSummary", { height: profile.heightCm })
              : undefined,
            sexLabel,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={t("body.profile.edit")}
          onClick={() => setEditing(true)}
        >
          <PencilLineIcon />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
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

      {/* Only offered once there's something to collapse back to — closing an
          incomplete form would just reopen it, since `editing` still follows
          `!complete` on the next mount. */}
      {complete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-muted-foreground"
          onClick={() => setEditing(false)}
        >
          {t("body.profile.done")}
        </Button>
      ) : null}
    </div>
  );
}
