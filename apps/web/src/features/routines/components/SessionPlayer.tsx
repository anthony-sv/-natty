import { useStore } from "@tanstack/react-store";
import { CheckIcon, ChevronLeftIcon, PlayIcon, SquareIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { getPose } from "@/data/poses";
import { useExerciseLog } from "@/features/log/queries";
import { SetLogControl } from "@/features/log/components/SetLogControl";
import { formatClock, formatModifiers, formatPose } from "../lib/format";
import {
  autoStartSecondsFor,
  describeStep,
  type SessionStep,
} from "../lib/session";
import { useCountdown } from "../lib/use-countdown";
import {
  endSession,
  goToStep,
  sessionStore,
  startTimer,
  type SessionState,
} from "../session-store";

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

  return (
    <Card className="border-primary/40 ring-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Workout in progress</span>
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            Step {session.stepIndex + 1} of {steps.length}
          </span>
        </CardTitle>
        <CardDescription>{dayLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={(session.stepIndex / steps.length) * 100} />

        {step.type === "work" ? (
          // Keyed so moving to the next set remounts the log form, which reads
          // its prefill into `defaultValues` on mount -- without it React
          // reuses the instance and the previous set's values stick.
          <WorkStepBody
            key={step.id}
            step={step}
            session={session}
            steps={steps}
            dayLabel={dayLabel}
          />
        ) : step.type === "pose" ? (
          <PoseStepBody
            step={step}
            session={session}
            steps={steps}
            dayLabel={dayLabel}
          />
        ) : (
          <RestStepBody step={step} session={session} steps={steps} />
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={session.stepIndex === 0}
            onClick={() => goToStep(session.stepIndex - 1)}
          >
            <ChevronLeftIcon data-icon="inline-start" /> Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={() => {
              endSession();
              // Stopping early is not the same as finishing, and the player
              // vanishing on its own is easy to read as a misclick.
              toast.add({
                title: "Workout ended",
                description: `${dayLabel} — anything you logged is kept.`,
                type: "info",
              });
            }}
          >
            <SquareIcon data-icon="inline-start" /> End workout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Close the session when there's no step after this one, and say so.
 *
 * Returns true when it finished, so the caller skips advancing. Finishing ends
 * the workout outright rather than parking on a "done" card that needs a
 * second press — the toast is the confirmation.
 *
 * Called from every step body that can be last: a work set, or the pose
 * closing a finisher (trailing rests are trimmed, so a rest never is).
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

function WorkStepBody({
  step,
  session,
  steps,
  dayLabel,
}: {
  step: Extract<SessionStep, { type: "work" }>;
  session: SessionState;
  steps: SessionStep[];
  dayLabel: string;
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
  // Derived from the live query rather than component state so it survives
  // stepping Back and forward again. A step can hold more than one entry --
  // a drop set, or extra work past the prescription.
  const loggedHere = sets.filter(
    (logged) =>
      logged.setNumber === step.setNumber &&
      logged.dayNumber === session.dayNumber &&
      logged.weekNumber === session.weekNumber &&
      logged.routineSlug === session.routineSlug,
  );

  const next = steps[session.stepIndex + 1];

  // Advancing never logs. Logging is an explicit submit in the popover --
  // otherwise, with the fields prefilled from your last set, simply moving
  // through a workout would record sets you never entered.
  function advance() {
    if (finishIfLast(next, dayLabel)) return;
    goToStep(session.stepIndex + 1, autoStartSecondsFor(next));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{step.exerciseName}</h2>
        {step.isFinisher ? <Badge>Finisher</Badge> : null}
        {step.kind === "cardio" ? <Badge variant="outline">Cardio</Badge> : null}
      </div>

      {step.alternatives ? (
        <p className="text-sm text-muted-foreground">{step.alternatives}</p>
      ) : null}

      {step.modifiers ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {formatModifiers(step.modifiers).map((label) => (
            <Badge key={label} variant="destructive">
              {label}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
        <span className="font-medium text-foreground">
          Set {step.setNumber} of {step.setsInExercise}
        </span>
        <span aria-hidden>·</span>
        <span>{describeStep(step)}</span>
      </div>

      {step.pose ? (
        <p className="text-sm">
          <span className="text-muted-foreground">Pose: </span>
          {formatPose(step.pose)}
        </p>
      ) : null}
      {step.notes ? (
        <p className="text-sm text-muted-foreground">{step.notes}</p>
      ) : null}

      {/* Held back until the log has loaded: the form seeds its defaults from
          `last` on mount, so mounting early would prefill from nothing. */}
      {isLoggable && !isLoading ? (
        <SetLogControl
          frontier={frontier}
          last={last}
          targetReps={step.reps}
          stepRef={stepRef}
          exerciseName={step.exerciseName}
          loggedHere={loggedHere}
        />
      ) : null}

      {isTimed && timerRunning ? (
        <div className="flex flex-col gap-2">
          <div className="text-5xl font-semibold tabular-nums">
            {formatClock(remainingMs)}
          </div>
          {isComplete ? (
            <p className="text-sm font-medium text-primary">Time's up</p>
          ) : null}
        </div>
      ) : null}

      {isTimed && !timerRunning ? (
        <Button
          size="lg"
          className="w-full"
          onClick={() => startTimer(step.durationSeconds!)}
        >
          <PlayIcon data-icon="inline-start" /> Start {describeStep(step)}
        </Button>
      ) : (
        <Button size="lg" className="w-full" onClick={advance}>
          <CheckIcon />
          {next === undefined
            ? "Finish workout"
            : next.type === "rest"
              ? `Done — rest ${formatClock(next.seconds * 1000)}`
              : next.type === "pose"
                ? `Done — hold ${next.seconds}s`
                : "Done"}
        </Button>
      )}
    </div>
  );
}

function PoseStepBody({
  step,
  session,
  steps,
  dayLabel,
}: {
  step: Extract<SessionStep, { type: "pose" }>;
  session: SessionState;
  steps: SessionStep[];
  dayLabel: string;
}) {
  const { remainingMs, isComplete } = useCountdown(session.timerEndsAt);
  const totalMs = step.seconds * 1000;
  const elapsedPercent = ((totalMs - remainingMs) / totalMs) * 100;

  const next = steps[session.stepIndex + 1];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-muted-foreground">Hold</span>

      <h2 className="text-xl font-semibold">
        {getPose(step.pose.poseId)?.name ?? step.pose.poseId}
      </h2>

      <div
        className={
          isComplete
            ? "text-6xl font-semibold tabular-nums text-primary"
            : "text-6xl font-semibold tabular-nums"
        }
      >
        {formatClock(remainingMs)}
      </div>

      <Progress value={elapsedPercent} />

      {isComplete ? (
        <p className="text-sm font-medium text-primary">Hold complete.</p>
      ) : null}

      {/* Tappable throughout, like rest — tapping early is how you cut it short. */}
      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          if (finishIfLast(next, dayLabel)) return;
          goToStep(session.stepIndex + 1, autoStartSecondsFor(next));
        }}
      >
        <CheckIcon />
        {next === undefined
          ? "Finish workout"
          : next.type === "rest"
            ? `Done — rest ${formatClock(next.seconds * 1000)}`
            : "Done"}
      </Button>
    </div>
  );
}

function RestStepBody({
  step,
  session,
  steps,
}: {
  step: Extract<SessionStep, { type: "rest" }>;
  session: SessionState;
  steps: SessionStep[];
}) {
  const { remainingMs, isComplete } = useCountdown(session.timerEndsAt);
  const totalMs = step.seconds * 1000;
  // Drains left-to-right as rest elapses.
  const elapsedPercent = ((totalMs - remainingMs) / totalMs) * 100;

  const next = steps[session.stepIndex + 1];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-muted-foreground">Rest</span>

      <div
        className={
          isComplete
            ? "text-6xl font-semibold tabular-nums text-primary"
            : "text-6xl font-semibold tabular-nums"
        }
      >
        {formatClock(remainingMs)}
      </div>

      <Progress value={elapsedPercent} />

      {isComplete ? (
        <p className="text-sm font-medium text-primary">
          Rest complete — go when you're ready.
        </p>
      ) : null}

      {step.nextLabel ? (
        <p className="text-sm text-muted-foreground">Next: {step.nextLabel}</p>
      ) : null}

      {/*
        Enabled for the whole rest, not just at zero — tapping early is how you
        cut rest short, so no separate skip control is needed.
      */}
      <Button size="lg" className="w-full" onClick={() => goToStep(session.stepIndex + 1)}>
        <CheckIcon />
        {next === undefined ? "Finish workout" : "Start next set"}
      </Button>
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
