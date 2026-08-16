import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { useStore } from "@tanstack/react-store";
import { profileStore } from "@/features/profile/profile-store";
import { daysBetween } from "@/lib/week";
import { loggedSetsFork } from "./collection";
import { deloadStatus, type DeloadStatus } from "./plateau";

/**
 * How long acknowledging the deload banner suppresses it before
 * `deloadStatus` gets to re-evaluate — see `deloadAcknowledgedAt`'s own
 * comment in `profile-store.ts` for why this exists at all.
 */
const ACKNOWLEDGE_SUPPRESS_DAYS = 14;

/**
 * The one place `deloadStatus` gets read for display, so the banner and the
 * heatmap-week rings can't disagree about whether a deload is suggested —
 * dismissing the banner has to mean the ring goes with it, or acknowledging
 * "I'll deload this week" while the heatmap keeps flagging the same week
 * reads as the app not having heard you.
 */
export function useDeloadSuggested(now: number): DeloadStatus {
  const acknowledgedAt = useStore(
    profileStore,
    (state) => state.deloadAcknowledgedAt,
  );
  const loggedSets = loggedSetsFork.useActive();
  const { data } = useLiveQuery(
    (q) => q.from({ set: loggedSets }),
    [loggedSets],
  );
  const sets = useMemo(() => data ?? [], [data]);
  const status = useMemo(() => deloadStatus(sets, now), [sets, now]);

  const suppressed =
    acknowledgedAt !== undefined &&
    daysBetween(acknowledgedAt, now) < ACKNOWLEDGE_SUPPRESS_DAYS;

  return suppressed
    ? { suggested: false, plateauedExerciseIds: status.plateauedExerciseIds }
    : status;
}
