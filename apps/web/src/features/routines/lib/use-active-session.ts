import { useStore } from "@tanstack/react-store";
import type { Routine, TrainingDay } from "@/data/routines";
import { useCompletions } from "@/features/log/completion-collection";
import { composeDay, lastCompletionFor } from "@/features/extras/extras";
import { useExtras } from "@/features/extras/use-extras";
import { useFormatting } from "@/i18n/use-formatting";
import { useRoutines } from "../use-routines";
import { sessionStore, type SessionState } from "../session-store";
import { exerciseDisplayName } from "./format";
import { buildSteps, type SessionStep } from "./session";

export interface ResolvedSession {
  state: SessionState;
  routine: Routine;
  day: TrainingDay;
  steps: SessionStep[];
  /** Undefined once the session has run past the last step. */
  currentStep: SessionStep | undefined;
  /** Name of the exercise being worked or rested for. */
  currentExerciseName: string | undefined;
  /** Which `exerciseIndex`es are extra work rather than a prescription —
   * see `composeDay`. Composed with `"append"` placement, the same as
   * `SessionPlayer` itself: this only ever resolves an *active* session, and
   * `"beforeCardio"` placement is unsafe once one is running. */
  extraIndices: Set<number>;
}

/**
 * The active session resolved against program data, or null.
 *
 * Programs are compiled into the bundle, so a persisted session can point at a
 * routine/week/day that no longer exists after a deploy. Resolving here means
 * callers get null in that case instead of a broken resume link.
 *
 * Resolved against `useRoutines`, which merges your own routines over the
 * built-in list. Reading only the compiled-in six meant a workout started from
 * a routine you wrote resolved to null: the session was live in localStorage
 * and the home page quietly showed "nothing in progress".
 */
export function useActiveSession(): ResolvedSession | null {
  const state = useStore(sessionStore, (s) => s);
  const { routines, isLoading } = useRoutines();
  const { extras } = useExtras();
  const completions = useCompletions();
  const f = useFormatting();

  if (state === null || isLoading) return null;

  const routine = routines.find((r) => r.slug === state.routineSlug);
  const week = routine?.weeks.find((w) => w.weekNumber === state.weekNumber);
  const rawDay = week?.days.find((d) => d.dayNumber === state.dayNumber);
  if (!routine || !rawDay) return null;

  // Composed the same way the day page composes it — without this, a
  // session that's had extra work added mid-workout resolves here against
  // the *uncomposed* day: the resume card would report the wrong step count,
  // and `day.exercises[currentStep.exerciseIndex]` would be `undefined` for
  // any step that's an extra, blanking `currentExerciseName`.
  const target = {
    routineSlug: state.routineSlug,
    weekNumber: state.weekNumber,
    dayNumber: state.dayNumber,
  };
  const { day, extraIndices } = composeDay(
    rawDay,
    extras,
    target,
    lastCompletionFor(completions, target),
    "append",
  );

  const steps = buildSteps(day, f);
  const currentStep = steps[state.stepIndex];
  const activeEntry =
    currentStep === undefined
      ? undefined
      : day.exercises[currentStep.exerciseIndex];
  const currentExerciseName =
    activeEntry === undefined ? undefined : exerciseDisplayName(activeEntry, f);

  return {
    state,
    routine,
    day,
    steps,
    currentStep,
    currentExerciseName,
    extraIndices,
  };
}
