import { useState } from "react";
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
import { useFormatting } from "@/i18n/use-formatting";
import { useT, type Translate } from "@/i18n/use-t";
import { useExerciseLog } from "@/features/log/queries";
import { useCardioLog } from "@/features/log/cardio-queries";
import { formatSet } from "@/features/log/pr";
import { SetLogControl } from "@/features/log/components/SetLogControl";
import { CardioLogControl } from "@/features/log/components/CardioLogControl";
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
  setLadder,
  timedSecondsFor,
  type PoseStep,
  type RestStep,
  type SessionStep,
  type SetSequence,
  type WorkStep,
} from "../lib/session";
import { useElapsed, useTimerState, type TimerState } from "../lib/use-countdown";
import {
  effectiveExerciseId,
  endSession,
  goToStep,
  sessionStore,
  startTimer,
  swapExercise,
  type SessionState,
} from "../session-store";
import { Eyebrow, LoadBadge, PrescriptionStrip } from "./PlayerChrome";
import { SequencePreview, SequenceStage } from "./SequenceStage";
import { SetLadderRow } from "./SetLadderRow";
import { TechniqueCueList } from "./TechniqueCueList";
import { TimerRing } from "./TimerRing";

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
}: {
  steps: SessionStep[];
  dayLabel: string;
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
    />
  );
}

function PlayerCard({
  session,
  step,
  steps,
  dayLabel,
}: {
  session: SessionState;
  step: SessionStep;
  steps: SessionStep[];
  dayLabel: string;
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
          />
        ) : step.type === "pose" ? (
          <PoseStepBody step={step} steps={steps} session={session} timer={timer} />
        ) : (
          <RestStepBody step={step} timer={timer} />
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
            dayLabel={dayLabel}
            stepIndex={session.stepIndex}
            stepCount={steps.length}
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

  // Advancing never logs. Logging is an explicit submit in the popover --
  // otherwise, with the fields prefilled from your last set, simply moving
  // through a workout would record sets you never entered.
  const advance = () => {
    if (finishIfLast(next, dayLabel, t)) return;
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
 */
function EndWorkoutButton({
  dayLabel,
  stepIndex,
  stepCount,
}: {
  dayLabel: string;
  stepIndex: number;
  stepCount: number;
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
                endSession();
                // The player vanishing with no word reads as a misclick, even
                // when it was deliberate.
                toast.add({
                  title: t("player.ended"),
                  description: t("player.endedBody", { day: dayLabel }),
                  type: "info",
                });
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
 */
function finishIfLast(
  next: SessionStep | undefined,
  dayLabel: string,
  t: Translate,
): boolean {
  if (next !== undefined) return false;
  toast.add({
    title: t("player.complete"),
    description: dayLabel,
    type: "success",
  });
  endSession();
  return true;
}

function WorkStepBody({
  step,
  session,
  steps,
  timer,
  sequence,
  totalSeconds,
}: {
  step: WorkStep;
  session: SessionState;
  steps: SessionStep[];
  timer: TimerState;
  /** `step.sequence` with any mid-set "+10s" folded in. */
  sequence: SetSequence | undefined;
  totalSeconds: number;
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

            {sequence !== undefined ? (
              <SequencePreview sequence={sequence} />
            ) : null}

            {step.alternatives || step.pose || step.notes ? (
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                {step.alternatives ? <p>{step.alternatives}</p> : null}
                {step.pose ? (
                  <p>
                    {t("player.pose")}:{" "}
                    <span className="text-foreground">
                      {formatPose(step.pose, f)}
                    </span>
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
 * Rest and pose holds are the same shape: a countdown, and what it's for.
 *
 * The ring is centred in the stage rather than stacked at the top, because a
 * short body left-aligned under a work step's dense header reads as the card
 * having lost something.
 */
function TimerStepBody({
  eyebrow,
  title,
  subtitle,
  seconds,
  timer,
  completeNote,
  nextLabel,
  nextExerciseName,
}: {
  eyebrow: string;
  title?: string;
  subtitle?: string;
  seconds: number;
  timer: TimerState;
  completeNote: string;
  nextLabel?: string;
  nextExerciseName?: string;
}) {
  const t = useT();
  const leadSeconds = Math.ceil(timer.leadRemainingMs / 1000);
  const totalMs = seconds * 1000;

  useCue(timer.phase === "lead" ? "tick" : undefined, `lead-${leadSeconds}`);
  useCue(timer.phase === "complete" ? "end" : undefined, timer.phase);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto text-center">
      <div className="flex flex-col gap-0.5">
        <Eyebrow>{eyebrow}</Eyebrow>
        {title ? (
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
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

  return (
    <TimerStepBody
      eyebrow={t("player.hold")}
      title={names.pose(step.pose.poseId)}
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

function RestStepBody({ step, timer }: { step: RestStep; timer: TimerState }) {
  const t = useT();

  return (
    <TimerStepBody
      eyebrow={t("player.rest")}
      seconds={step.seconds}
      timer={timer}
      completeNote={t("player.restComplete")}
      nextLabel={step.nextLabel || undefined}
      nextExerciseName={step.nextExerciseName}
    />
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
