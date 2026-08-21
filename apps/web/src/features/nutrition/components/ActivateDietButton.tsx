import { useStore } from "@tanstack/react-store";
import { CircleCheckIcon, CirclePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { profileStore, setProfile } from "@/features/profile/profile-store";
import { useT } from "@/i18n/use-t";

/**
 * The plan you're following, set by an explicit gesture rather than by
 * browsing — the same shape `ActivateProgramButton` uses for
 * `activeRoutineSlug`. The picker above this button changes which plan the
 * page is *showing*; only this button changes which one is active, so
 * looking a plan up (or saving an edit to one you're not on) can't silently
 * swap out the plan `/` and every other page read off. No start-day
 * equivalent here — a diet plan has no cycle position to resume into.
 */
export function ActivateDietButton({ slug }: { slug: string }) {
  const t = useT();
  const activeDietSlug = useStore(profileStore, (state) => state.activeDietSlug);
  const isActive = activeDietSlug === slug;

  if (isActive) {
    return (
      <Button
        variant="secondary"
        onClick={() => setProfile({ activeDietSlug: undefined })}
      >
        <CircleCheckIcon data-icon="inline-start" />
        {t("nutrition.activePlan")}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => setProfile({ activeDietSlug: slug })}
    >
      <CirclePlusIcon data-icon="inline-start" />
      {t("nutrition.setActive")}
    </Button>
  );
}
