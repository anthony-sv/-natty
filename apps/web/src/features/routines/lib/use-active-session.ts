import { useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import type { Routine, TrainingDay } from "@/data/routines";
import { useFormatting } from "@/i18n/use-formatting";
import { routinesQueryOptions } from "../queries";
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
}

/**
 * The active session resolved against program data, or null.
 *
 * Programs are compiled into the bundle, so a persisted session can point at a
 * routine/week/day that no longer exists after a deploy. Resolving here means
 * callers get null in that case instead of a broken resume link.
 */
export function useActiveSession(): ResolvedSession | null {
  const state = useStore(sessionStore, (s) => s);
  const { data: routines } = useQuery(routinesQueryOptions());
  const f = useFormatting();

  if (state === null || routines === undefined) return null;

  const routine = routines.find((r) => r.slug === state.routineSlug);
  const week = routine?.weeks.find((w) => w.weekNumber === state.weekNumber);
  const day = week?.days.find((d) => d.dayNumber === state.dayNumber);
  if (!routine || !day) return null;

  const steps = buildSteps(day, f);
  const currentStep = steps[state.stepIndex];
  const activeEntry =
    currentStep === undefined
      ? undefined
      : day.exercises[currentStep.exerciseIndex];
  const currentExerciseName =
    activeEntry === undefined ? undefined : exerciseDisplayName(activeEntry, f);

  return { state, routine, day, steps, currentStep, currentExerciseName };
}
