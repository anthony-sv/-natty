import { useStore } from "@tanstack/react-store";
import { profileStore } from "@/features/profile/profile-store";
import type { Routine } from "@/data/routines";
import { useRoutine } from "./use-routines";

/**
 * The program you're currently running, if you've picked one.
 *
 * Wraps `useRoutine` rather than re-deriving resolution: a slug that no
 * longer resolves — a custom routine you deleted after making it active —
 * reads exactly like never having picked one, not an error. `isLoading` is
 * only ever true while a *set* slug is still being resolved; with no slug at
 * all there's nothing to wait on.
 */
export function useActiveRoutine(): {
  routine: Routine | undefined;
  isLoading: boolean;
} {
  const activeRoutineSlug = useStore(
    profileStore,
    (state) => state.activeRoutineSlug,
  );
  const resolved = useRoutine(activeRoutineSlug ?? "");

  if (activeRoutineSlug === undefined) {
    return { routine: undefined, isLoading: false };
  }
  return resolved;
}
