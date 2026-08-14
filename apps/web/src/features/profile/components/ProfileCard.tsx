import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { PencilLineIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { profileStore, setProfile, type Profile } from "@/features/profile/profile-store";
import { useT } from "@/i18n/use-t";
import { ProfileForm } from "./ProfileForm";

const CLEARED: Pick<Profile, "heightCm" | "sex" | "wristCm" | "ankleCm"> = {
  heightCm: undefined,
  sex: undefined,
  wristCm: undefined,
  ankleCm: undefined,
};

/**
 * Display, then edit — not a form left open forever.
 *
 * **`ProfileForm` writes through live with no submit button**, which is right
 * for the fields themselves but wrong as the page's resting state: it read as
 * a calculator you type into rather than a record of what's already saved, and
 * there was nothing to *edit* — no display, no Edit button, no Delete, nothing
 * to test the empty states against. This wraps it the way `LoggedSetList` and
 * `BodyHistoryTable` treat a real row: a display with edit and delete, not an
 * always-open input.
 *
 * **Starts in edit mode only while every field is empty** — first visit, or
 * after clearing. Anything set at all switches to the display, since there's
 * something to show; `ProfileForm`'s own write-through means "edit" needs no
 * draft state of its own, just a toggle over the same live fields.
 */
export function ProfileCard() {
  const profile = useStore(profileStore, (s) => s);
  const t = useT();

  const hasAnything =
    profile.heightCm !== undefined ||
    profile.sex !== undefined ||
    profile.wristCm !== undefined ||
    profile.ankleCm !== undefined;
  const [editing, setEditing] = useState(!hasAnything);

  const clear = () => {
    // Snapshotted before clearing, not read back from the store after — by
    // then it's already `CLEARED`, and undo needs the values as they were.
    const before = {
      heightCm: profile.heightCm,
      sex: profile.sex,
      wristCm: profile.wristCm,
      ankleCm: profile.ankleCm,
    };
    setProfile(CLEARED);
    setEditing(true);
    toast.add({
      title: t("profile.cleared"),
      type: "info",
      actionProps: {
        children: t("history.undo"),
        onClick: () => {
          setProfile(before);
          setEditing(false);
        },
      },
    });
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-4">
        <ProfileForm />
        {hasAnything ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start text-muted-foreground"
            onClick={() => setEditing(false)}
          >
            {t("profile.done")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Stat label={t("common.heightCm")} value={profile.heightCm} />
        <Stat
          label={t("profile.sex")}
          value={
            profile.sex === undefined
              ? undefined
              : t(profile.sex === "male" ? "profile.male" : "profile.female")
          }
        />
        <Stat label={t("profile.wristCm")} value={profile.wristCm} />
        <Stat label={t("profile.ankleCm")} value={profile.ankleCm} />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(true)}
        >
          <PencilLineIcon data-icon="inline-start" />
          {t("profile.edit")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={clear}
        >
          <Trash2Icon data-icon="inline-start" />
          {t("profile.clear")}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number | undefined }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">
        {value ?? t("common.none")}
      </span>
    </div>
  );
}
