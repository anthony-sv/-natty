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
import { formatClock } from "../lib/format";
import { describeStep, type SessionStep } from "../lib/session";
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
  // persisted session — treat that as finished rather than crashing.
  if (step === undefined) {
    return <SessionComplete dayLabel={dayLabel} />;
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
          <WorkStepBody step={step} session={session} steps={steps} />
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
            <ChevronLeftIcon /> Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={endSession}
          >
            <SquareIcon /> End workout
          </Button>
        </div>
      </CardContent>
    </Card>
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

  const next = steps[session.stepIndex + 1];
  // Rest auto-starts the instant you tap done; a cardio block waits for Start.
  const advance = () =>
    goToStep(
      session.stepIndex + 1,
      next?.type === "rest" ? next.seconds : undefined,
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">{step.exerciseName}</h2>
        {step.isFinisher ? <Badge>Finisher</Badge> : null}
        {step.kind === "cardio" ? <Badge variant="outline">Cardio</Badge> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
        <span className="font-medium text-foreground">
          Set {step.setNumber} of {step.setsInExercise}
        </span>
        <span aria-hidden>·</span>
        <span>{describeStep(step)}</span>
      </div>

      {step.cue ? (
        <p className="text-sm">
          <span className="text-muted-foreground">Pose: </span>
          {step.cue}
        </p>
      ) : null}
      {step.notes ? (
        <p className="text-sm text-muted-foreground">{step.notes}</p>
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
          <PlayIcon /> Start {describeStep(step)}
        </Button>
      ) : (
        <Button size="lg" className="w-full" onClick={advance}>
          <CheckIcon />
          {next === undefined
            ? "Finish workout"
            : next.type === "rest"
              ? `Done — rest ${formatClock(next.seconds * 1000)}`
              : "Done"}
        </Button>
      )}
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

function SessionComplete({ dayLabel }: { dayLabel: string }) {
  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle>Workout complete</CardTitle>
        <CardDescription>{dayLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={endSession}>
          Done
        </Button>
      </CardContent>
    </Card>
  );
}
