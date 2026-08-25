import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";
import {
  ArrowLeftRightIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  CircleStopIcon,
  ClockIcon,
  FlagIcon,
  ListOrderedIcon,
  PlayIcon,
  PlusIcon,
  Repeat2Icon,
  TargetIcon,
  TimerIcon,
  Volume2Icon,
  VolumeXIcon,
  type LucideIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import type { PoseCue } from "@/data/routines";
import { useFormatting } from "@/i18n/use-formatting";
import { useT, type Translate } from "@/i18n/use-t";
import { useExerciseLog } from "@/features/log/queries";
import { useCardioLog } from "@/features/log/cardio-queries";
import { formatSet } from "@/features/log/pr";
import { hasLoggedSetsForDay } from "@/features/log/collection";
import { hasLoggedCardioForDay } from "@/features/log/cardio-collection";
import { logCompletion } from "@/features/log/completion-collection";
import { SetLogControl } from "@/features/log/components/SetLogControl";
import { CardioLogControl } from "@/features/log/components/CardioLogControl";
import { ExercisePreviewDialogButton } from "@/features/library/components/ExerciseMedia";
import { AddExtraWorkDialog } from "@/features/extras/components/AddExtraWorkDialog";
import { cn } from "@/lib/utils";
import { playerPrefs, toggleCues, useCue } from "../lib/cues";
import {
  formatClock,
  formatElapsed,
  formatModifiers,
  formatPose,
  type Formatting,
} from "../lib/format";
import {
  autoStartFor,
  describeStep,
  isLoggableStep,
  LEAD_IN_SECONDS,
  extendSequence,
  previousWorkStep,
  setLadder,
  timedSecondsFor,
  workLabel,
  type PoseStep,
  type RestStep,
  type SessionStep,
  type SetSequence,
  type WorkStep,
} from "../lib/session";
import {
  useElapsed,
  useTimerState,
  type TimerPhase,
  type TimerState,
} from "../lib/use-countdown";
import {
  effectiveExerciseId,
  effectivePoseId,
  endSession,
  goToStep,
  sessionStore,
  startTimer,
  swapExercise,
  swapPose,
  type SessionState,
} from "../session-store";
import { Eyebrow, LoadBadge, PrescriptionStrip } from "./PlayerChrome";
import { SequencePreview, SequenceStage } from "./SequenceStage";
import { SetLadderRow } from "./SetLadderRow";
import { TechniqueCueList } from "./TechniqueCueList";
import { TimerRing } from "./TimerRing";

/** A stable no-op, so skipping auto-advance doesn't churn the effect's deps. */
function NOOP(): void {}

/**
 * The guided workout card.
 *
 * Three fixed zones, in this order, every step: **header** (which day, how long
 * you've been at it, how far through), **stage** (what this step is), **action
 * bar** (the one button that moves you on, then the two you rarely press).
 *
 * The stage is a **fixed height**, not a minimum one, and that is the whole
 * layout rule. A floor was not enough: the tallest bodies breached it — a set
 * with technique cues, a long note and six logged sets is simply taller than a
 * rest step — and every time one did, the card grew and the button you press
 * forty times a session moved under your thumb. With a fixed stage the only
 * thing that can vary is *inside* it, and exactly one zone is allowed to: the
 * scrolling middle. Everything else is pinned.
 */
export function SessionPlayer({
  steps,
  dayLabel,
  extraIndices,
}: {
  steps: SessionStep[];
  dayLabel: string;
  /** Which `exerciseIndex`es are extra work rather than a prescription —
   * see `composeDay`. Threaded down to the eyebrow, not into `buildSteps`
   * itself: an extra is a property of how this day was *composed*, not of
   * the day, and `buildSteps` deliberately stays a pure flattener that
   * doesn't know the difference. A live session always composes with
   * `"append"` placement, so in practice this is a trailing range here —
   * but the eyebrow tests membership rather than assuming that. */
  extraIndices?: Set<number>;
}) {
  const session = useStore(sessionStore, (s) => s);
  if (session === null) return null;

  const step = steps[session.stepIndex];
  // The stored index can outrun the day if program data changed under a
  // persisted session — offer a way out rather than crashing.
  if (step === undefined) return <StaleSession dayLabel={dayLabel} />;

  // Split here so everything below can use hooks unconditionally: the two exits
  // above are the reason the card is its own component rather than the rest of
  // this one.
  return (
    <PlayerCard
      session={session}
      step={step}
      steps={steps}
      dayLabel={dayLabel}
      extraIndices={extraIndices}
    />
  );
}

function PlayerCard({
  session,
  step,
  steps,
  dayLabel,
  extraIndices,
}: {
  session: SessionState;
  step: SessionStep;
  steps: SessionStep[];
  dayLabel: string;
  extraIndices?: Set<number>;
}) {
  const t = useT();
  const f = useFormatting();

  // Resolved here rather than in the body, because the timer has to be built
  // from the *extended* length: "+10s" mid-set makes the set genuinely longer,
  // and a clock still counting the authored length would finish early.
  const sequence =
    step.type === "work" && step.sequence !== undefined
      ? extendSequence(step.sequence, session.partExtraMs)
      : undefined;
  const totalSeconds = sequence?.seconds ?? timedSecondsFor(step) ?? 0;

  // One subscription for the whole card. The bodies take the resolved timer as
  // a prop rather than each resolving it, so the ring, the button's wording and
  // the audible cues can never disagree about what the clock is doing.
  const timer = useTimerState(session, totalSeconds);
  const action = primaryActionFor({
    step,
    session,
    steps,
    dayLabel,
    t,
    f,
    timer,
    totalSeconds,
  });
  const ActionIcon = action.icon;

  // Moves on by itself once the countdown actually finishes, rather than
  // making you tap through a card that's already told you it's done.
  //
  // **Except on the last step**, where `action.onClick` is `advance`, and
  // `advance` on a step with no `next` is `finishIfLast` — it ends the whole
  // session. A cardio block is routinely the last thing in a day, so without
  // this guard its countdown finishing would tear the session down (and with
  // it, the cardio log popover) before you ever got a chance to open it and
  // log what you just did. Ending the workout stays a deliberate tap, same
  // as `EndWorkoutButton`'s own confirm dialog for bailing out early — the
  // button already reads "Finish" the whole time this step is running, so
  // nothing is hidden, it's just no longer automatic.
  const isLastStep = steps[session.stepIndex + 1] === undefined;
  useAutoAdvance(timer.phase, isLastStep ? NOOP : action.onClick);

  return (
    <Card className="gap-0 overflow-hidden border-primary/40 py-0 ring-primary/30">
      <CardHeader className="gap-3 border-b bg-muted/40 py-4">
        <CardTitle className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="flex items-center gap-2">
            {/* A live dot says "running" without spending a line on the words. */}
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {dayLabel}
          </span>
          <span className="flex items-center gap-1">
            <Elapsed since={session.startedAt} />
            <AddExtraWorkButton session={session} dayLabel={dayLabel} />
            <CueToggle />
          </span>
        </CardTitle>
        <CardDescription className="flex flex-col gap-1.5">
          <Progress value={(session.stepIndex / steps.length) * 100} />
          <span className="text-xs tabular-nums">
            {t("player.stepOf", {
              current: session.stepIndex + 1,
              total: steps.length,
              left: steps.length - session.stepIndex - 1,
            })}
          </span>
        </CardDescription>
      </CardHeader>

      {/* The stage. Fixed, so nothing inside it can move the button below —
          and clipped, so nothing inside it can *paint over* the button either.
          A fixed height alone doesn't contain anything: a body that outgrows it
          overflows visibly and lands on top of the footer, which is how the
          log control ended up printed through "Atrás". The scroll zone inside
          is what should absorb that, and `overflow-hidden` here is the backstop
          for the day something outside that zone grows. */}
      <CardContent className="flex h-[25rem] flex-col overflow-hidden py-5 sm:h-[27rem] lg:h-[30rem]">
        {step.type === "work" ? (
          // Keyed so moving to the next set remounts the log form, which reads
          // its prefill into `defaultValues` on mount -- without it React
          // reuses the instance and the previous set's values stick.
          <WorkStepBody
            key={step.id}
            step={step}
            session={session}
            steps={steps}
            timer={timer}
            sequence={sequence}
            totalSeconds={totalSeconds}
            extraIndices={extraIndices}
          />
        ) : step.type === "pose" ? (
          <PoseStepBody step={step} steps={steps} session={session} timer={timer} />
        ) : (
          <RestStepBody step={step} steps={steps} session={session} timer={timer} />
        )}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-3 pt-4">
        {/* Taller than a standard button and full width: this is pressed
            standing up, at arm's length, with chalk on your hands. */}
        <Button
          size="lg"
          className="h-14 w-full text-base"
          onClick={action.onClick}
        >
          <ActionIcon data-icon="inline-start" />
          {action.label}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={session.stepIndex === 0}
            onClick={() => goToStep(session.stepIndex - 1)}
          >
            <ChevronLeftIcon data-icon="inline-start" /> {t("player.back")}
          </Button>
          <EndWorkoutButton
            session={session}
            dayLabel={dayLabel}
            stepIndex={session.stepIndex}
            stepCount={steps.length}
            exerciseIndex={step.exerciseIndex}
          />
        </div>
      </CardFooter>
    </Card>
  );
}

interface PrimaryAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

/**
 * Moves on by itself once a countdown finishes, rather than leaving you to
 * tap through a card that's already told you it's done.
 *
 * Gated on `phase === "complete"` alone is enough to scope this correctly:
 * `goToStep` (`session-store.ts`) sets `timerEndsAt` to `null` for any step
 * that isn't rest, pose or timed work — which `autoStartFor` is what decides
 * — so a plain rep-counted set can never read "complete" here in the first
 * place, and this never fires for one.
 *
 * The isFirst/changed guard mirrors `useCue`'s, for the same reason: arriving
 * on a step that's *already* complete — reopening the app on a stale
 * finished rest — is not a transition, and auto-advancing on arrival would
 * yank you into the next step with no warning. Only a live countdown
 * actually finishing fires this.
 */
function useAutoAdvance(phase: TimerPhase, onAdvance: () => void): void {
  const previous = useRef<TimerPhase | null>(null);

  useEffect(() => {
    const isFirst = previous.current === null;
    const changed = previous.current !== phase;
    previous.current = phase;
    if (!isFirst && changed && phase === "complete") onAdvance();
  }, [phase, onAdvance]);
}

/**
 * The one button that moves you forward, for any step.
 *
 * It lives here rather than in the step bodies because its *position* is a
 * property of the card, not of the step — see the note on `SessionPlayer`. What
 * changes between steps is the wording and the icon, which is exactly what a
 * descriptor is for.
 */
function primaryActionFor({
  step,
  session,
  steps,
  dayLabel,
  t,
  f,
  timer,
  totalSeconds,
}: {
  step: SessionStep;
  session: SessionState;
  steps: SessionStep[];
  dayLabel: string;
  t: Translate;
  f: Formatting;
  timer: TimerState;
  totalSeconds: number;
}): PrimaryAction {
  const next = steps[session.stepIndex + 1];

  // Advancing never logs a set. Logging is an explicit submit in the popover
  // -- otherwise, with the fields prefilled from your last set, simply moving
  // through a workout would record sets you never entered.
  const advance = () => {
    if (finishIfLast(next, session, dayLabel, t)) return;
    goToStep(session.stepIndex + 1, autoStartFor(next));
  };

  // Work you have to be in position for starts on a press — you have to get on
  // the machine, or set up under the load, first — and then spends its opening
  // seconds counting you in rather than counting the hold.
  if (
    step.type === "work" &&
    timer.phase === "idle" &&
    timedSecondsFor(step) !== undefined
  ) {
    return {
      label:
        step.sequence !== undefined
          ? t("player.startSequence")
          : t("player.startTimed", { label: describeStep(step, f) }),
      icon: PlayIcon,
      onClick: () => startTimer(totalSeconds, LEAD_IN_SECONDS),
    };
  }

  if (next === undefined) {
    return { label: t("player.finish"), icon: FlagIcon, onClick: advance };
  }

  // Rest and pose holds are tappable throughout, not just at zero — tapping
  // early is how you cut one short, so no separate skip control is needed.
  if (step.type === "rest") {
    return { label: t("player.startNextSet"), icon: CheckIcon, onClick: advance };
  }

  return {
    label:
      next.type === "rest"
        ? t("player.doneRest", { clock: formatClock(next.seconds * 1000) })
        : next.type === "pose"
          ? t("player.doneHold", { seconds: next.seconds })
          : t("player.done"),
    icon: CheckIcon,
    onClick: advance,
  };
}

/** How long this session has been running, ticking on the shared clock. */
function Elapsed({ since }: { since: number }) {
  const elapsedMs = useElapsed(since);
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
      <ClockIcon className="size-3.5" />
      {formatElapsed(elapsedMs)}
    </span>
  );
}

/**
 * "Add extra work" from inside a live session — a session-level action, the
 * same class `CueToggle` is, rather than a step-level one, which is why it
 * sits in the header rather than the fixed-height stage or the footer's
 * three-zone action bar. Saving closes the dialog and raises a toast; there
 * is deliberately no jump to the new steps, which would abandon your place
 * in the day the same way the End-workout confirmation exists to prevent.
 */
function AddExtraWorkButton({
  session,
  dayLabel,
}: {
  session: SessionState;
  dayLabel: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("extras.addButton")}
        title={t("extras.addButton")}
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="size-4" />
      </Button>
      <AddExtraWorkDialog
        target={{
          routineSlug: session.routineSlug,
          weekNumber: session.weekNumber,
          dayNumber: session.dayNumber,
        }}
        dayLabel={dayLabel}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

/**
 * Mute the beeps and the buzz.
 *
 * In the header rather than in settings because the answer changes with the
 * room: earbuds in, it's the only way to run a hold without watching the
 * screen; in a quiet gym at 6am it's the first thing you'd want off, and a
 * preference you have to leave the session to find is one you'd rather just
 * silence the phone for.
 */
function CueToggle() {
  const t = useT();
  const cues = useStore(playerPrefs, (s) => s.cues);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={cues}
      aria-label={t(cues ? "player.cuesOn" : "player.cuesOff")}
      title={t(cues ? "player.cuesOn" : "player.cuesOff")}
      onClick={toggleCues}
    >
      {cues ? (
        <Volume2Icon className="size-4" />
      ) : (
        <VolumeXIcon className="size-4 text-muted-foreground" />
      )}
    </Button>
  );
}

/**
 * Ending early, behind a confirmation.
 *
 * It sits next to Back, one mis-tap from the control you press most, and it
 * throws away where you are in the day with nothing to undo it — so it asks
 * first and says what survives.
 *
 * The icon is a stop sign rather than a bare square: an outlined square beside
 * a label reads as an unchecked checkbox, which is the opposite of a button
 * that ends something.
 *
 * **Still logs a completion, bounded to `exerciseIndex`.** This used to end
 * the session and nothing else, on the reasoning that leaving mid-day isn't
 * the same as finishing it — true, but the consequence was that a day you got
 * six exercises into read identically to one you never started, everywhere
 * that reads completions. `logCompletion` here is bounded rather than
 * open-ended the way `finishIfLast`'s is, so only what was actually reached
 * gets credited — see `weeklyVolume` and `muscleFatigue`. The
 * nothing-logged warning is unrelated and stays: it's about whether any *set*
 * has real weight/reps behind it, which a completion can never supply.
 */
function EndWorkoutButton({
  session,
  dayLabel,
  stepIndex,
  stepCount,
  exerciseIndex,
}: {
  session: SessionState;
  dayLabel: string;
  stepIndex: number;
  stepCount: number;
  exerciseIndex: number;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <>
      <Button
        variant="ghost"
        className="ml-auto text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <CircleStopIcon data-icon="inline-start" /> {t("player.endWorkout")}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("player.endConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("player.endConfirm.body", {
                current: stepIndex + 1,
                total: stepCount,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("player.endConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logCompletion({
                  routineSlug: session.routineSlug,
                  weekNumber: session.weekNumber,
                  dayNumber: session.dayNumber,
                  performedAt: Date.now(),
                  throughExerciseIndex: exerciseIndex,
                });
                // The player vanishing with no word reads as a misclick, even
                // when it was deliberate — unless nothing was recorded at
                // all, in which case that's the more useful thing to say.
                if (!warnIfNothingLogged(session, t)) {
                  toast.add({
                    title: t("player.ended"),
                    description: t("player.endedBody", { day: dayLabel }),
                    type: "info",
                  });
                }
                endSession();
              }}
            >
              {t("player.endWorkout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Close the session when there's no step after this one, and say so.
 *
 * Returns true when it finished, so the caller skips advancing. Finishing ends
 * the workout outright rather than parking on a "done" card that needs a
 * second press — the toast is the confirmation.
 *
 * **Reaching the end always counts, whether or not anything was logged.**
 * `logCompletion` records the day as trained — no weight, no reps, so it can
 * never register as a PR the way a real logged set would — which is what lets
 * the heatmap, the streak and `nextTrainingDay` all agree you showed up
 * without this inventing a set you didn't actually enter. No
 * `throughExerciseIndex` bound here: reaching the last step means the whole
 * day, the same thing `dayLookup.exercisesFor` reads an absent bound as.
 *
 * **Bailing out early, via `EndWorkoutButton`, now counts too** — it used to
 * record nothing at all, on the reasoning that leaving mid-day isn't the same
 * as finishing it. True, but the consequence was that Volume and Fatigue
 * treated a day you got six exercises into exactly like a day you never
 * started — which is a worse error than crediting six exercises. It logs a
 * completion bounded to `exerciseIndex`, so only what was actually reached
 * counts; see `weeklyVolume` and `muscleFatigue` for how that bound is used.
 */
function finishIfLast(
  next: SessionStep | undefined,
  session: SessionState,
  dayLabel: string,
  t: Translate,
): boolean {
  if (next !== undefined) return false;
  logCompletion({
    routineSlug: session.routineSlug,
    weekNumber: session.weekNumber,
    dayNumber: session.dayNumber,
    performedAt: Date.now(),
  });
  toast.add({
    title: t("player.complete"),
    description: dayLabel,
    type: "success",
  });
  endSession();
  return true;
}

/**
 * Warns instead of the normal completion toast when the whole day closes
 * with nothing recorded against it — the same discovery `nextTrainingDay`
 * and the heatmap would otherwise leave for tomorrow, silently. Returns
 * whether it fired, so the caller can skip the ordinary "workout complete"
 * toast rather than showing both.
 */
function warnIfNothingLogged(session: SessionState, t: Translate): boolean {
  const ref = {
    routineSlug: session.routineSlug,
    weekNumber: session.weekNumber,
    dayNumber: session.dayNumber,
  };
  if (hasLoggedSetsForDay(ref) || hasLoggedCardioForDay(ref)) return false;
  toast.add({
    title: t("player.nothingLogged"),
    description: t("player.nothingLoggedBody"),
    type: "warning",
  });
  return true;
}

function WorkStepBody({
  step,
  session,
  steps,
  timer,
  sequence,
  totalSeconds,
  extraIndices,
}: {
  step: WorkStep;
  session: SessionState;
  steps: SessionStep[];
  timer: TimerState;
  /** `step.sequence` with any mid-set "+10s" folded in. */
  sequence: SetSequence | undefined;
  totalSeconds: number;
  extraIndices?: Set<number>;
}) {
  const t = useT();
  const f = useFormatting();
  const isTimed = timedSecondsFor(step) !== undefined;
  const isCounting = isTimed && timer.phase !== "idle";

  // Cardio already carries its own duration; there is no weight or rep count
  // worth recording for it.
  const isLoggable = isLoggableStep(step);

  /**
   * The lift you're actually doing, which is the routine's unless you swapped
   * it for one of its alternatives.
   *
   * **Everything that touches the log uses this, not `step.exerciseId`.** That
   * is the whole point of the swap: taking a dumbbell hip thrust because
   * someone's on the machine should put the set on the dumbbell hip thrust's
   * history, show the dumbbell hip thrust's PR, and leave the machine's record
   * untouched. Logging a substitute against the lift you didn't do would
   * quietly corrupt both.
   */
  const exerciseId = effectiveExerciseId(session, step.exerciseIndex, step.exerciseId);
  const isSwapped = exerciseId !== step.exerciseId;
  const exerciseName = isSwapped
    ? f.names.exercise(exerciseId)
    : step.exerciseName;

  const isCardio = step.kind === "cardio";
  const showsLog = !isCardio;
  const { sets, frontier, last, isLoading } = useExerciseLog(
    showsLog ? exerciseId : undefined,
  );
  const { entries: cardioEntries, last: cardioLast } = useCardioLog(
    isCardio ? exerciseId : undefined,
  );

  const stepRef = {
    exerciseId,
    routineSlug: session.routineSlug,
    weekNumber: session.weekNumber,
    dayNumber: session.dayNumber,
    setNumber: step.setNumber,
  };
  const cardioLoggedHere = cardioEntries.filter(
    (entry) =>
      entry.routineSlug === stepRef.routineSlug &&
      entry.weekNumber === stepRef.weekNumber &&
      entry.dayNumber === stepRef.dayNumber &&
      entry.setNumber === stepRef.setNumber,
  );
  // Everything recorded against this exercise in *this* session. Derived from
  // the live query rather than component state so it survives stepping Back and
  // forward again.
  const loggedToday = sets
    .filter(
      (logged) =>
        logged.exerciseId === exerciseId &&
        logged.dayNumber === session.dayNumber &&
        logged.weekNumber === session.weekNumber &&
        logged.routineSlug === session.routineSlug,
    )
    .sort(
      (a, b) =>
        (a.setNumber ?? 0) - (b.setNumber ?? 0) || a.performedAt - b.performedAt,
    );

  // A step can hold more than one entry -- a drop set, or extra work past the
  // prescription.
  const loggedHere = loggedToday.filter(
    (logged) => logged.setNumber === step.setNumber,
  );

  const next = steps[session.stepIndex + 1];
  // Rest is its own step, so what follows this set is what tells you how long
  // you get — it belongs on the set you're about to do, not only after it.
  const thenValue =
    next === undefined
      ? t("player.thenEnd")
      : next.type === "rest"
        ? t("player.thenRest", { seconds: next.seconds })
        : next.type === "pose"
          ? t("player.thenHold", { seconds: next.seconds })
          : t("player.thenStraightOn");

  // Which exercise of the day this is — context the card never carried, and the
  // one thing "set 2 of 4" can't tell you.
  const exerciseCount = steps[steps.length - 1].exerciseIndex + 1;
  const badges = formatModifiers(step.modifiers ?? {}, f);

  return (
    // `min-h-0` is doing real work here and is easy to drop: a flex item's
    // default `min-height: auto` means this would rather *overflow* its fixed
    // parent than shrink, so the scroll zone below never got the chance to
    // scroll and the whole body spilled over the footer instead.
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Zone 1 — who and what. Fixed: the title is clamped to two lines and
          the badges to one scrolling row, so a long exercise name with four
          modifiers occupies exactly what a short one does. */}
      <div className="flex shrink-0 flex-col gap-1.5">
        {/* In a rotation the eyebrow says where you are in the *round*, not
            "exercise 3 of 8" — that counter bounces between 3 and 4 all the
            way through a superset and reads as the app losing its place. */}
        <Eyebrow>
          {step.group !== undefined
            ? t(
                step.group.size > 2
                  ? "player.circuitRound"
                  : "player.supersetRound",
                { round: step.group.round, total: step.group.rounds },
              )
            : extraIndices?.has(step.exerciseIndex) === true
              ? t("extras.eyebrow")
              : t("player.exerciseOf", {
                  current: step.exerciseIndex + 1,
                  total: exerciseCount,
                })}
        </Eyebrow>
        <div className="flex items-start gap-2">
          <h2 className="line-clamp-2 min-w-0 flex-1 text-2xl font-semibold leading-tight tracking-tight">
            {exerciseName}
          </h2>
          {/* Only when the routine actually named substitutes. A picker on
              every exercise would offer a choice that isn't there. */}
          {step.alternativeIds.length > 0 ? (
            <SwapControl step={step} current={exerciseId} isSwapped={isSwapped} />
          ) : null}
        </div>
        {isSwapped ||
        step.isWarmup ||
        step.isFinisher ||
        step.load ||
        step.kind === "cardio" ||
        step.intensity ||
        badges.length > 0 ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5">
            {/* So a glance at the card says you're off-plan today, and which
                lift the numbers below belong to. */}
            {isSwapped ? (
              <Badge variant="secondary" className="shrink-0">
                {t("player.swappedFrom", { name: step.exerciseName })}
              </Badge>
            ) : null}
            {/* First, because it changes what the whole card means: this set
                isn't one you're trying to beat, and there's no log control. */}
            {step.isWarmup ? (
              <Badge variant="outline" className="shrink-0">
                {t("routines.warmupSet")}
              </Badge>
            ) : null}
            {/* Beside the badges rather than in the strip below, because it's
                the one thing on the card that is about the *last* set. */}
            {step.load ? <LoadBadge load={step.load} className="shrink-0" /> : null}
            {step.isFinisher ? (
              <Badge className="shrink-0">{t("common.finisher")}</Badge>
            ) : null}
            {step.kind === "cardio" ? (
              <Badge variant="outline" className="shrink-0">
                {t("common.cardio")}
              </Badge>
            ) : null}
            {/* On the card because it's what you act on: the clock says how
                long, this says how hard. */}
            {step.intensity ? (
              <Badge variant="secondary" className="shrink-0">
                {t(`intensity.${step.intensity}` as never)}
              </Badge>
            ) : null}
            {badges.map((label) => (
              <Badge key={label} variant="destructive" className="shrink-0">
                {label}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {isCounting ? (
        sequence !== undefined ? (
          <SequenceStage sequence={sequence} timer={timer} />
        ) : (
          <TimedWorkStage timer={timer} seconds={totalSeconds} />
        )
      ) : (
        <>
          {/* Zone 2 — the numbers, fixed height. */}
          <PrescriptionStrip
            items={[
              {
                icon: Repeat2Icon,
                // The cell's label carries the distinction, so the value stays
                // the two numbers you act on rather than growing a word.
                label: step.isWarmup ? t("routines.warmupSet") : t("player.set"),
                value: t("player.setValue", {
                  number: step.setNumber,
                  total: step.setsInExercise,
                }),
              },
              {
                icon: sequence !== undefined ? ListOrderedIcon : TargetIcon,
                label: t("player.target"),
                value:
                  sequence !== undefined
                    ? t("player.partCount", {
                        count: sequence.parts.length,
                        clock: formatClock(sequence.seconds * 1000),
                      })
                    : describeStep(step, f),
              },
              { icon: TimerIcon, label: t("player.then"), value: thenValue },
            ]}
          />

          <SetLadderRow rungs={setLadder(steps, step, f)} />

          {/* Zone 3 — the only zone allowed to vary, and it scrolls rather than
              growing. Everything here is read once and then ignored for the
              rest of the set, which is why it sits below the numbers rather
              than between them. */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
            {/* Ordered by how soon you act on it, because on a phone this zone
                can be squeezed to a couple of lines and whatever is first is
                the only thing you'll see without scrolling. The techniques are
                instructions for the set you're about to do; the sequence
                preview and the notes are things you read once. */}
            <TechniqueCueList modifiers={step.modifiers} />

            {/* A button, not the photo itself — an embedded image read as
                clutter on a card whose whole design is one thing changing at
                a time. The dialog shows it full-width instead of squeezed
                into this scroll zone. Renders nothing when there's no photo
                for this exercise (`media.ts`). */}
            <ExercisePreviewDialogButton
              exerciseId={exerciseId}
              exerciseName={exerciseName}
            />

            {sequence !== undefined ? (
              <SequencePreview sequence={sequence} />
            ) : null}

            {step.alternatives || step.pose || step.notes ? (
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                {step.alternatives ? <p>{step.alternatives}</p> : null}
                {step.pose ? (
                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    <span>
                      {t("player.pose")}:{" "}
                      <span className="text-foreground">
                        {formatPose(
                          step.pose,
                          f,
                          effectivePoseId(session, step.exerciseIndex, step.pose.poseId),
                        )}
                      </span>
                    </span>
                    {/* Only when the prescription actually named more than
                        one acceptable pose — a picker on every finisher would
                        offer a choice that isn't there. */}
                    {step.pose.orAlternatives !== undefined &&
                    step.pose.orAlternatives.length > 0 ? (
                      <PoseSwapControl
                        pose={step.pose}
                        exerciseIndex={step.exerciseIndex}
                        current={effectivePoseId(
                          session,
                          step.exerciseIndex,
                          step.pose.poseId,
                        )}
                      />
                    ) : null}
                  </p>
                ) : null}
                {step.notes ? <p>{step.notes}</p> : null}
              </div>
            ) : null}

            {/* What you've already done on this lift today — "three sets in at
                60kg" is the thing you actually want to see between sets. */}
            {showsLog ? (
              <div className="flex flex-col gap-1.5">
                <Eyebrow>{t("player.loggedToday")}</Eyebrow>
                {loggedToday.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("player.nothingLoggedYet")}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {loggedToday.map((logged) => (
                      <span
                        key={logged.id}
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs tabular-nums",
                          logged.setNumber === step.setNumber
                            ? "border-primary/40 bg-primary/10 font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        <span className="text-muted-foreground">
                          {logged.setNumber}.{" "}
                        </span>
                        {formatSet(logged)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Present only on the last set of an exercise, which is exactly
                when it's actionable: it's how you know to send someone for the
                bench while you finish. */}
            {step.nextExerciseName ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowRightIcon className="size-3.5 shrink-0" />
                {t("player.afterThis")}{" "}
                <span className="font-medium text-foreground">
                  {step.nextExerciseName}
                </span>
              </p>
            ) : null}
          </div>
        </>
      )}

      {/* Zone 4 — pinned last, so the distance from the log control to the
          button below it never changes. Held back until the log has loaded:
          the form seeds its defaults from `last` on mount. */}
      {isCardio ? (
        <div className="flex shrink-0 flex-col gap-3">
          <Separator />
          <CardioLogControl
            last={cardioLast}
            stepRef={stepRef}
            loggedHere={cardioLoggedHere}
          />
        </div>
      ) : isLoggable && !isLoading ? (
        <div className="flex shrink-0 flex-col gap-3">
          <Separator />
          <SetLogControl
            frontier={frontier}
            last={last}
            targetReps={step.reps}
            stepRef={stepRef}
            exerciseName={exerciseName}
            loggedHere={loggedHere}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * A work step that is simply a clock — a cardio block, a stretch hold.
 *
 * The card's head already says which exercise and which set, so this is the
 * ring and nothing else. It still gets the lead-in: a stretch you're counting
 * down should start when you're in the stretch.
 */
function TimedWorkStage({
  timer,
  seconds,
}: {
  timer: TimerState;
  seconds: number;
}) {
  const t = useT();
  const leadSeconds = Math.ceil(timer.leadRemainingMs / 1000);
  const totalMs = seconds * 1000;

  useCue(timer.phase === "lead" ? "tick" : undefined, `lead-${leadSeconds}`);
  useCue(timer.phase === "complete" ? "end" : undefined, timer.phase);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
      {timer.phase === "lead" ? (
        <TimerRing
          tone="lead"
          percent={0}
          label={String(Math.max(1, leadSeconds))}
          caption={t("player.getSet")}
        />
      ) : (
        <TimerRing
          percent={((totalMs - timer.remainingMs) / totalMs) * 100}
          label={formatClock(timer.remainingMs)}
          isComplete={timer.phase === "complete"}
        />
      )}
      <p className="flex h-5 items-center text-sm font-medium text-primary">
        {timer.phase === "complete" ? t("player.timesUp") : ""}
      </p>
    </div>
  );
}

/**
 * Swap to one of this exercise's listed substitutes, mid-session.
 *
 * A menu rather than a Combobox: the choice is two or three named lifts the
 * routine already picked, not a search over 113. The original is in the list
 * and selecting it clears the swap, so getting back is the same gesture as
 * leaving — no separate "undo" to find.
 *
 * The swap lasts the session and no longer. Someone being on the machine today
 * is not an edit to the program, and silently rewriting the routine is how
 * you'd find it changed next week without having asked for that.
 */
function SwapControl({
  step,
  current,
  isSwapped,
}: {
  step: WorkStep;
  current: string;
  isSwapped: boolean;
}) {
  const t = useT();
  const { names } = useFormatting();
  const choices = [step.exerciseId, ...step.alternativeIds];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={isSwapped ? "secondary" : "outline"}
            size="sm"
            className="shrink-0"
          >
            <ArrowLeftRightIcon data-icon="inline-start" />
            {t("player.swap")}
          </Button>
        }
      />
      {/* The content sizes to its anchor by default, and the anchor here is a
          small button — which wraps every exercise name onto three lines. */}
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        {/* The Group is required, not decoration: `DropdownMenuLabel` is Base
            UI's `GroupLabel`, and one outside a Group throws. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("player.swapTitle")}</DropdownMenuLabel>
          {choices.map((id) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={id === current}
              onCheckedChange={() =>
                swapExercise(step.exerciseIndex, id, step.exerciseId)
              }
            >
              {names.exercise(id)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Swap to one of this finisher's other acceptable poses, mid-session — the
 * pose equivalent of `SwapControl`, same reasoning throughout: a menu over the
 * two or three the routine already named rather than a search over all eight,
 * the original is in the list so picking it clears the swap, and it lasts the
 * session only. "Either flex" was never one pose the routine had a preference
 * between; it's an in-the-moment choice, which is exactly what a swap is.
 */
function PoseSwapControl({
  pose,
  exerciseIndex,
  current,
}: {
  pose: PoseCue;
  exerciseIndex: number;
  current: string;
}) {
  const t = useT();
  const { names } = useFormatting();
  const choices = [pose.poseId, ...(pose.orAlternatives ?? [])];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={current !== pose.poseId ? "secondary" : "outline"}
            size="sm"
            className="h-6 shrink-0 px-2 text-xs"
          >
            <ArrowLeftRightIcon data-icon="inline-start" className="size-3" />
            {names.pose(current)}
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-auto min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("player.poseSwapTitle")}</DropdownMenuLabel>
          {choices.map((id) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={id === current}
              onCheckedChange={() => swapPose(exerciseIndex, id, pose.poseId)}
            >
              {names.pose(id)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Rest and pose holds are the same shape: a countdown, and what it's for.
 *
 * The ring is centred in the stage rather than stacked at the top, because a
 * short body left-aligned under a work step's dense header reads as the card
 * having lost something.
 */
function TimerStepBody({
  eyebrow,
  title,
  titleAction,
  subtitle,
  seconds,
  timer,
  completeNote,
  nextLabel,
  nextExerciseName,
  logControl,
}: {
  eyebrow: string;
  title?: string;
  /** A control that sits beside the title — currently just the pose swap. */
  titleAction?: React.ReactNode;
  subtitle?: string;
  seconds: number;
  timer: TimerState;
  completeNote: string;
  nextLabel?: string;
  nextExerciseName?: string;
  /** The rest screen's offer to log the set that led into it — see
      `RestStepBody`. Sits between the ring and "next up" on purpose: it's
      the one screen you're guaranteed to see between every set, which makes
      it the actual moment to catch a set you advanced past without logging. */
  logControl?: React.ReactNode;
}) {
  const t = useT();
  const leadSeconds = Math.ceil(timer.leadRemainingMs / 1000);
  const totalMs = seconds * 1000;

  useCue(timer.phase === "lead" ? "tick" : undefined, `lead-${leadSeconds}`);
  useCue(timer.phase === "complete" ? "end" : undefined, timer.phase);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto text-center">
      <div className="flex flex-col items-center gap-0.5">
        <Eyebrow>{eyebrow}</Eyebrow>
        {title ? (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            {titleAction}
          </div>
        ) : null}
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {timer.phase === "lead" ? (
        <TimerRing
          tone="lead"
          percent={0}
          label={String(Math.max(1, leadSeconds))}
          caption={t("player.getSet")}
        />
      ) : (
        <TimerRing
          percent={
            timer.phase === "idle"
              ? 0
              : ((totalMs - timer.remainingMs) / totalMs) * 100
          }
          label={formatClock(timer.phase === "idle" ? totalMs : timer.remainingMs)}
          isComplete={timer.phase === "complete"}
        />
      )}

      {/* One fixed-height slot for all the states, so the note appearing at
          zero can't nudge the card. */}
      <div className="flex h-8 items-center">
        {/* Arriving here from "Done" auto-starts the clock; arriving by pressing
            Back doesn't, and used to leave a dead 0:00 with no way to run it
            again. */}
        {timer.phase === "idle" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTimer(seconds, LEAD_IN_SECONDS)}
          >
            <PlayIcon data-icon="inline-start" /> {t("player.startClock")}
          </Button>
        ) : timer.phase === "complete" ? (
          <p className="text-sm font-medium text-primary">{completeNote}</p>
        ) : null}
      </div>

      {logControl}

      {nextLabel ? (
        <div className="flex flex-col gap-0.5">
          <Eyebrow>
            {/* A rest before a *different* lift is the one that decides whether
                you stay at this machine, so it's labelled differently. */}
            {nextExerciseName ? t("player.nextExercise") : t("player.nextUp")}
          </Eyebrow>
          {/* Clamped rather than wrapped freely: on a phone a long exercise
              name runs to three lines and pushes the body past the stage's
              floor, which is the one way this layout can still resize. */}
          <p className="line-clamp-2 font-medium">{nextLabel}</p>
        </div>
      ) : null}
    </div>
  );
}

function PoseStepBody({
  step,
  steps,
  session,
  timer,
}: {
  step: PoseStep;
  steps: SessionStep[];
  session: SessionState;
  timer: TimerState;
}) {
  const t = useT();
  const { names } = useFormatting();

  // A pose is usually followed by rest, which announces the next set itself —
  // so only name what's next when the hold runs straight into it.
  const next = steps[session.stepIndex + 1];
  const nextLabel =
    next?.type === "work"
      ? `${next.exerciseName} — ${t(
          next.isWarmup ? "routines.warmupSetOf" : "routines.setOf",
          { number: next.setNumber, total: next.setsInExercise },
        )}`
      : undefined;

  const currentPoseId = effectivePoseId(session, step.exerciseIndex, step.pose.poseId);
  const hasAlternatives =
    step.pose.orAlternatives !== undefined && step.pose.orAlternatives.length > 0;

  return (
    <TimerStepBody
      eyebrow={t("player.hold")}
      title={names.pose(currentPoseId)}
      titleAction={
        hasAlternatives ? (
          <PoseSwapControl
            pose={step.pose}
            exerciseIndex={step.exerciseIndex}
            current={currentPoseId}
          />
        ) : undefined
      }
      subtitle={`${step.exerciseName} — ${t("routines.setOf", {
        number: step.setNumber,
        total: step.setsInExercise,
      })}`}
      seconds={step.seconds}
      timer={timer}
      completeNote={t("player.holdComplete")}
      nextLabel={nextLabel}
    />
  );
}

function RestStepBody({
  step,
  steps,
  session,
  timer,
}: {
  step: RestStep;
  steps: SessionStep[];
  session: SessionState;
  timer: TimerState;
}) {
  const t = useT();
  // What this rest is resting *from* — walking back past a finisher's pose
  // hold if there is one. See `previousWorkStep`.
  const previous = previousWorkStep(steps, session.stepIndex);

  return (
    <TimerStepBody
      eyebrow={t("player.rest")}
      seconds={step.seconds}
      timer={timer}
      completeNote={t("player.restComplete")}
      nextLabel={step.nextLabel || undefined}
      nextExerciseName={step.nextExerciseName}
      logControl={
        previous !== undefined ? (
          <RestLogPrompt step={previous} session={session} />
        ) : undefined
      }
    />
  );
}

/**
 * The rest screen's offer to log the set that led into it, for whoever
 * advanced past the card without stopping to fill in the popover.
 *
 * Rest is the one screen guaranteed between every set — the exact moment
 * "oh, I forgot" actually happens — which is why this lives here rather than
 * relying on the work step's own control alone. `SetLogControl`'s "logging is
 * explicit" rule still holds: this offers the same popover, it doesn't log
 * anything by itself.
 *
 * Mirrors `WorkStepBody`'s own three-way split (cardio / loggable / neither)
 * exactly, because it's the same question about the same step, asked one
 * screen later.
 */
function RestLogPrompt({
  step,
  session,
}: {
  step: WorkStep;
  session: SessionState;
}) {
  const t = useT();
  const f = useFormatting();
  const isCardio = step.kind === "cardio";
  const isLoggable = isLoggableStep(step);

  const exerciseId = effectiveExerciseId(session, step.exerciseIndex, step.exerciseId);
  const isSwapped = exerciseId !== step.exerciseId;
  const exerciseName = isSwapped ? f.names.exercise(exerciseId) : step.exerciseName;

  const { sets, frontier, last, isLoading } = useExerciseLog(
    !isCardio ? exerciseId : undefined,
  );
  const { entries: cardioEntries, last: cardioLast } = useCardioLog(
    isCardio ? exerciseId : undefined,
  );

  const stepRef = {
    exerciseId,
    routineSlug: session.routineSlug,
    weekNumber: session.weekNumber,
    dayNumber: session.dayNumber,
    setNumber: step.setNumber,
  };

  const loggedSets = sets.filter(
    (logged) =>
      logged.exerciseId === exerciseId &&
      logged.dayNumber === session.dayNumber &&
      logged.weekNumber === session.weekNumber &&
      logged.routineSlug === session.routineSlug &&
      logged.setNumber === step.setNumber,
  );
  const loggedCardio = cardioEntries.filter(
    (entry) =>
      entry.routineSlug === stepRef.routineSlug &&
      entry.weekNumber === stepRef.weekNumber &&
      entry.dayNumber === stepRef.dayNumber &&
      entry.setNumber === stepRef.setNumber,
  );
  const isLogged = isCardio ? loggedCardio.length > 0 : loggedSets.length > 0;

  // This is the "forgot" prompt, not a second confirmation of what you
  // already did — once the step it's asking about is logged, it has nothing
  // left to offer and disappears rather than sitting there showing what you
  // just entered.
  if (!isCardio && !isLoggable) return null;
  if (isLogged) return null;
  if (!isCardio && isLoading) return null;

  const label = workLabel({ ...step, exerciseName }, f);

  return (
    <div className="flex w-full max-w-xs flex-col items-start gap-1.5 border-t pt-3 text-left">
      <Eyebrow>{t("player.logLastSet")}</Eyebrow>
      <p className="text-sm font-medium">{label}</p>
      {isCardio ? (
        <CardioLogControl
          last={cardioLast}
          stepRef={stepRef}
          loggedHere={loggedCardio}
        />
      ) : (
        <SetLogControl
          frontier={frontier}
          last={last}
          targetReps={step.reps}
          stepRef={stepRef}
          exerciseName={exerciseName}
          loggedHere={loggedSets}
          variant="compact"
        />
      )}
    </div>
  );
}

/**
 * Only reachable when a persisted session's step index outruns the day — say,
 * the program data changed underneath it. Finishing normally closes the session
 * outright, so this is a recovery path, not the end of a workout: the button
 * clears the orphaned session rather than confirming anything.
 */
function StaleSession({ dayLabel }: { dayLabel: string }) {
  const t = useT();

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle>{t("player.stale.title")}</CardTitle>
        <CardDescription>
          {t("player.stale.body", { day: dayLabel })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={endSession}>
          {t("player.stale.action")}
        </Button>
      </CardContent>
    </Card>
  );
}
