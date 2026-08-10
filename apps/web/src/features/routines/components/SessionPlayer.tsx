import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import {
  CheckIcon,
  ChevronLeftIcon,
  CircleStopIcon,
  ClockIcon,
  FlagIcon,
  PlayIcon,
  Repeat2Icon,
  TargetIcon,
  TimerIcon,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { getPose } from "@/data/poses";
import { useExerciseLog } from "@/features/log/queries";
import { formatSet } from "@/features/log/pr";
import { SetLogControl } from "@/features/log/components/SetLogControl";
import { cn } from "@/lib/utils";
import {
  formatClock,
  formatElapsed,
  formatModifiers,
  formatPose,
} from "../lib/format";
import {
  autoStartSecondsFor,
  describeStep,
  type SessionStep,
} from "../lib/session";
import { useCountdown, useElapsed } from "../lib/use-countdown";
import {
  endSession,
  goToStep,
  sessionStore,
  startTimer,
  type SessionState,
} from "../session-store";
import { TimerRing } from "./TimerRing";

/**
 * The guided workout card.
 *
 * Three fixed zones, in this order, every step: **header** (which day, how long
 * you've been at it, how far through), **stage** (what this step is), **action
 * bar** (the one button that moves you on, then the two you rarely press).
 *
 * The zones are fixed on purpose. An earlier version let each step body render
 * its own primary button at the end of its own content, so "Done" and "Start
 * next set" landed at different heights and the card resized between a work set
 * and its rest — the button you press forty times in a session moved under your
 * thumb every other press. The stage carries a `min-h` for the same reason: a
 * rest step holds far less than a work step, and without a floor the card would
 * still breathe even with the button pinned last.
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
  if (step === undefined) {
    return <StaleSession dayLabel={dayLabel} />;
  }

  const action = primaryActionFor(step, session, steps, dayLabel);
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
          <Elapsed since={session.startedAt} />
        </CardTitle>
        <CardDescription className="flex flex-col gap-1.5">
          <Progress value={(session.stepIndex / steps.length) * 100} />
          <span className="text-xs tabular-nums">
            Step {session.stepIndex + 1} of {steps.length} ·{" "}
            {steps.length - session.stepIndex - 1} to go
          </span>
        </CardDescription>
      </CardHeader>

      {/* The stage. `min-h` is the floor that keeps the card one size; bodies
          that fill less than it centre themselves inside it. It's set above the
          tallest body (a pose hold: eyebrow, name, ring, "time's up", next up)
          so nothing in a normal set-rest-set cycle ever reaches it. */}
      <CardContent className="flex min-h-80 flex-col py-5">
        {step.type === "work" ? (
          // Keyed so moving to the next set remounts the log form, which reads
          // its prefill into `defaultValues` on mount -- without it React
          // reuses the instance and the previous set's values stick.
          <WorkStepBody
            key={step.id}
            step={step}
            session={session}
            steps={steps}
          />
        ) : step.type === "pose" ? (
          <PoseStepBody step={step} session={session} steps={steps} />
        ) : (
          <RestStepBody step={step} session={session} />
        )}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2">
        <Button size="lg" className="w-full" onClick={action.onClick}>
          <ActionIcon data-icon="inline-start" />
          {action.label}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={session.stepIndex === 0}
            onClick={() => goToStep(session.stepIndex - 1)}
          >
            <ChevronLeftIcon data-icon="inline-start" /> Back
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
function primaryActionFor(
  step: SessionStep,
  session: SessionState,
  steps: SessionStep[],
  dayLabel: string,
): PrimaryAction {
  const next = steps[session.stepIndex + 1];

  // Advancing never logs. Logging is an explicit submit in the popover --
  // otherwise, with the fields prefilled from your last set, simply moving
  // through a workout would record sets you never entered.
  const advance = () => {
    if (finishIfLast(next, dayLabel)) return;
    goToStep(session.stepIndex + 1, autoStartSecondsFor(next));
  };

  // Cardio waits for an explicit Start — you have to get on the machine first.
  if (
    step.type === "work" &&
    step.durationSeconds !== undefined &&
    session.timerEndsAt === null
  ) {
    const seconds = step.durationSeconds;
    return {
      label: `Start ${describeStep(step)}`,
      icon: PlayIcon,
      onClick: () => startTimer(seconds),
    };
  }

  if (next === undefined) {
    return { label: "Finish workout", icon: FlagIcon, onClick: advance };
  }

  // Rest and pose holds are tappable throughout, not just at zero — tapping
  // early is how you cut one short, so no separate skip control is needed.
  if (step.type === "rest") {
    return { label: "Start next set", icon: CheckIcon, onClick: advance };
  }

  return {
    label:
      next.type === "rest"
        ? `Done — rest ${formatClock(next.seconds * 1000)}`
        : next.type === "pose"
          ? `Done — hold ${next.seconds}s`
          : "Done",
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

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <CircleStopIcon data-icon="inline-start" /> End workout
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this workout?</AlertDialogTitle>
            <AlertDialogDescription>
              You're on step {stepIndex + 1} of {stepCount}. Every set you've
              logged is kept — only your place in the day goes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                endSession();
                // The player vanishing with no word reads as a misclick, even
                // when it was deliberate.
                toast.add({
                  title: "Workout ended",
                  description: `${dayLabel} — anything you logged is kept.`,
                  type: "info",
                });
              }}
            >
              End workout
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
function finishIfLast(next: SessionStep | undefined, dayLabel: string): boolean {
  if (next !== undefined) return false;
  toast.add({
    title: "Workout complete",
    description: dayLabel,
    type: "success",
  });
  endSession();
  return true;
}

/** The small caps line above a step's title — what kind of step this is. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * The set's prescription as three labelled cells rather than a run of prose.
 *
 * "Set 2 of 4 · 8-12 reps" in one muted sentence makes you parse a line to find
 * the two numbers you actually act on. Split and labelled, each is findable
 * without reading — and the strip is a fixed height, which is half of why the
 * card no longer resizes between sets.
 */
function PrescriptionStrip({
  items,
}: {
  items: { icon: LucideIcon; label: string; value: string }[];
}) {
  return (
    <div className="grid grid-cols-3 divide-x rounded-lg border bg-muted/40">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex flex-col gap-0.5 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="size-3.5" />
            {label}
          </span>
          <span className="text-sm font-semibold tabular-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

function WorkStepBody({
  step,
  session,
  steps,
}: {
  step: Extract<SessionStep, { type: "work" }>;
  session: SessionState;
  steps: SessionStep[];
}) {
  const { remainingMs, isComplete } = useCountdown(session.timerEndsAt);
  const isTimed = step.durationSeconds !== undefined;
  const timerRunning = session.timerEndsAt !== null;

  // Cardio already carries its own duration; there is no weight or rep count
  // worth recording for it.
  const isLoggable = step.kind !== "cardio";
  const { sets, frontier, last, isLoading } = useExerciseLog(
    isLoggable ? step.exerciseId : undefined,
  );

  const stepRef = {
    exerciseId: step.exerciseId,
    routineSlug: session.routineSlug,
    weekNumber: session.weekNumber,
    dayNumber: session.dayNumber,
    setNumber: step.setNumber,
  };
  // Everything recorded against this exercise in *this* session, which is what
  // fills the stage between the prescription and the log control. Derived from
  // the live query rather than component state so it survives stepping Back and
  // forward again.
  const loggedToday = sets
    .filter(
      (logged) =>
        logged.exerciseId === step.exerciseId &&
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
      ? "End of day"
      : next.type === "rest"
        ? `${next.seconds}s rest`
        : next.type === "pose"
          ? `${next.seconds}s hold`
          : "Straight on";

  // Which exercise of the day this is — context the card never carried, and the
  // one thing "set 2 of 4" can't tell you.
  const exerciseCount = steps[steps.length - 1].exerciseIndex + 1;

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Eyebrow>
          Exercise {step.exerciseIndex + 1} of {exerciseCount}
        </Eyebrow>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight">
          {step.exerciseName}
        </h2>
        {step.isFinisher || step.kind === "cardio" || step.modifiers ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {step.isFinisher ? <Badge>Finisher</Badge> : null}
            {step.kind === "cardio" ? (
              <Badge variant="outline">Cardio</Badge>
            ) : null}
            {step.modifiers
              ? formatModifiers(step.modifiers).map((label) => (
                  <Badge key={label} variant="destructive">
                    {label}
                  </Badge>
                ))
              : null}
          </div>
        ) : null}
      </div>

      {isTimed && timerRunning ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <TimerRing
            percent={
              ((step.durationSeconds! * 1000 - remainingMs) /
                (step.durationSeconds! * 1000)) *
              100
            }
            label={formatClock(remainingMs)}
            isComplete={isComplete}
          />
          {isComplete ? (
            <p className="text-sm font-medium text-primary">Time's up</p>
          ) : null}
        </div>
      ) : (
        <PrescriptionStrip
          items={[
            {
              icon: Repeat2Icon,
              label: "Set",
              value: `${step.setNumber} of ${step.setsInExercise}`,
            },
            { icon: TargetIcon, label: "Target", value: describeStep(step) },
            { icon: TimerIcon, label: "Then", value: thenValue },
          ]}
        />
      )}

      {/* Reference material — read once, then ignored for the rest of the set,
          so it sits below the numbers rather than between them. It's the only
          part of the card allowed to scroll: a long note on one exercise would
          otherwise push the card past the stage's floor and start the buttons
          moving again, which is the thing this layout exists to stop. */}
      {step.alternatives || step.pose || step.notes ? (
        <div className="flex max-h-12 shrink-0 flex-col gap-1 overflow-y-auto text-sm text-muted-foreground">
          {step.alternatives ? <p>{step.alternatives}</p> : null}
          {step.pose ? (
            <p>
              Pose:{" "}
              <span className="text-foreground">{formatPose(step.pose)}</span>
            </p>
          ) : null}
          {step.notes ? <p>{step.notes}</p> : null}
        </div>
      ) : null}

      {/* What you've already done on this lift today. It takes the stage's
          slack, which is the point: the floor that keeps the card one size
          otherwise leaves a hole on a set with no notes, and "three sets in at
          60kg" is the thing you actually want to see between sets. */}
      {isLoggable ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
          <Eyebrow>Logged today</Eyebrow>
          {loggedToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing yet — log a set and it shows up here.
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

      {/* Held back until the log has loaded: the form seeds its defaults from
          `last` on mount, so mounting early would prefill from nothing. */}
      {isLoggable && !isLoading ? (
        <div className="flex flex-col gap-3">
          <Separator />
          <SetLogControl
            frontier={frontier}
            last={last}
            targetReps={step.reps}
            stepRef={stepRef}
            exerciseName={step.exerciseName}
            loggedHere={loggedHere}
          />
        </div>
      ) : null}
    </div>
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
  seconds,
  timerEndsAt,
  completeNote,
  nextLabel,
}: {
  eyebrow: string;
  title?: string;
  seconds: number;
  timerEndsAt: number | null;
  completeNote: string;
  nextLabel?: string;
}) {
  const { remainingMs, isComplete } = useCountdown(timerEndsAt);
  // Arriving here from "Done" auto-starts the clock; arriving by pressing Back
  // doesn't, and used to leave a dead 0:00 with no way to run it again.
  const isRunning = timerEndsAt !== null;
  const totalMs = seconds * 1000;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      {title ? (
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      ) : null}

      <TimerRing
        percent={isRunning ? ((totalMs - remainingMs) / totalMs) * 100 : 0}
        label={formatClock(isRunning ? remainingMs : totalMs)}
        isComplete={isComplete}
      />

      {/* One fixed-height slot for all three states, so the note appearing at
          zero can't nudge the card. */}
      <div className="flex h-8 items-center">
        {!isRunning ? (
          <Button variant="ghost" size="sm" onClick={() => startTimer(seconds)}>
            <PlayIcon data-icon="inline-start" /> Start the clock
          </Button>
        ) : isComplete ? (
          <p className="text-sm font-medium text-primary">{completeNote}</p>
        ) : null}
      </div>

      {nextLabel ? (
        <div className="flex flex-col gap-0.5">
          <Eyebrow>Next up</Eyebrow>
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
  session,
  steps,
}: {
  step: Extract<SessionStep, { type: "pose" }>;
  session: SessionState;
  steps: SessionStep[];
}) {
  // A pose is usually followed by rest, which announces the next set itself —
  // so only name what's next when the hold runs straight into it.
  const next = steps[session.stepIndex + 1];
  const nextLabel =
    next?.type === "work"
      ? `${next.exerciseName} — set ${next.setNumber} of ${next.setsInExercise}`
      : undefined;

  return (
    <TimerStepBody
      eyebrow="Hold"
      title={getPose(step.pose.poseId)?.name ?? step.pose.poseId}
      seconds={step.seconds}
      timerEndsAt={session.timerEndsAt}
      completeNote="Hold complete."
      nextLabel={nextLabel}
    />
  );
}

function RestStepBody({
  step,
  session,
}: {
  step: Extract<SessionStep, { type: "rest" }>;
  session: SessionState;
}) {
  return (
    <TimerStepBody
      eyebrow="Rest"
      seconds={step.seconds}
      timerEndsAt={session.timerEndsAt}
      completeNote="Rest complete — go when you're ready."
      nextLabel={step.nextLabel || undefined}
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
  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle>Nothing left in this workout</CardTitle>
        <CardDescription>
          {dayLabel} — this session is further along than the day now goes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={endSession}>
          Clear it
        </Button>
      </CardContent>
    </Card>
  );
}
