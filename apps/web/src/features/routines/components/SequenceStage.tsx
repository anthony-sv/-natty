import { Fragment } from "react";
import { PauseIcon, PlayIcon, PlusIcon, SkipForwardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import { useCue } from "../lib/cues";
import { formatClock, formatSegment } from "../lib/format";
import { partAt, type SetSequence } from "../lib/session";
import type { TimerState } from "../lib/use-countdown";
import {
  extendPart,
  pauseTimer,
  resumeTimer,
  skipAhead,
} from "../session-store";
import { TimerRing } from "./TimerRing";

/** How much a "+" press buys you when the pace is ahead of your set. */
const NUDGE_SECONDS = 10;

/**
 * A set that runs as a sequence, running itself.
 *
 * The parts of a sequence have no rest between them — that's what makes it one
 * set rather than five — so the player cannot ask you to advance them. The
 * previous model did: five steps, five taps, from a position where both hands
 * are loaded and your eyes are shut. Going from a 10s hold to twelve pulses
 * meant finding a phone mid-contraction, which is not a thing anybody does, so
 * in practice the sequence was run from memory and the player was decoration.
 *
 * Now one clock covers the whole set and the running part is a subtraction
 * against it (`partAt`). Holds are exact, because the routine gave them a
 * duration; pulses and reps are *paced* from their count, because it didn't.
 * That distinction is drawn on screen — a paced part says so — and it's why the
 * controls exist: the tempo is an assumption, and +10s or Next part is how you
 * disagree with it without leaving the set.
 */
export function SequenceStage({
  sequence,
  timer,
}: {
  sequence: SetSequence;
  timer: TimerState;
}) {
  const t = useT();
  const f = useFormatting();

  const current = partAt(sequence, timer.elapsedMs);
  const next = sequence.parts[current.index]; // `index` is 1-based, so this is the one after
  const isDone = timer.phase === "complete";
  const leadSeconds = Math.ceil(timer.leadRemainingMs / 1000);

  // Everything audible, keyed off where the clock is rather than called from
  // the render path — see `useCue`. Four separate keys because they're four
  // different events and collapsing them would make one swallow another.
  useCue(timer.phase === "lead" ? "tick" : undefined, `lead-${leadSeconds}`);
  useCue(
    timer.phase === "running" ? "go" : undefined,
    timer.phase === "running" ? "on" : "off",
  );
  useCue(
    timer.phase === "running" ? "part" : undefined,
    `part-${current.index}`,
  );
  useCue(isDone ? "end" : undefined, timer.phase);

  const partRemainingMs = Math.max(
    0,
    current.endMs - Math.min(timer.elapsedMs, sequence.seconds * 1000),
  );
  const partPercent =
    current.seconds === 0
      ? 100
      : ((current.seconds * 1000 - partRemainingMs) / (current.seconds * 1000)) *
        100;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto text-center">
      {timer.phase === "lead" ? (
        <TimerRing
          tone="lead"
          percent={0}
          label={String(Math.max(1, leadSeconds))}
          caption={t("player.getSet")}
        />
      ) : (
        <TimerRing
          percent={isDone ? 100 : partPercent}
          label={formatClock(isDone ? 0 : partRemainingMs)}
          caption={t("player.partOf", {
            current: current.index,
            total: sequence.parts.length,
          })}
          isComplete={isDone}
          tone={timer.isPaused ? "paused" : "default"}
        />
      )}

      <div className="flex flex-col gap-0.5">
        <p className="text-lg font-semibold leading-tight">
          {formatSegment(current.detail, f)}
        </p>
        {/* One fixed-height line for three states, so a part with nothing after
            it can't shrink the stage under the ring. */}
        <p className="flex h-4 items-center justify-center gap-1 text-xs text-muted-foreground">
          {isDone ? (
            t("player.sequenceDone")
          ) : timer.isPaused ? (
            t("player.paused")
          ) : next !== undefined ? (
            <>
              <span aria-hidden>→</span>
              {formatSegment(next.detail, f)}
            </>
          ) : (
            t("player.lastPart")
          )}
        </p>
      </div>

      <PartsTrack sequence={sequence} currentIndex={current.index} isDone={isDone} />

      {/* Only while it's running. The tempo is the thing you'd want to argue
          with, and there is nothing to argue with before it starts or after it
          finishes — a row of dead buttons there would just be three more things
          to read past. */}
      {timer.phase === "running" ? (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (timer.isPaused ? resumeTimer() : pauseTimer())}
          >
            {timer.isPaused ? (
              <PlayIcon data-icon="inline-start" />
            ) : (
              <PauseIcon data-icon="inline-start" />
            )}
            {t(timer.isPaused ? "player.resume" : "player.pause")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            // Grants the time to *this part*, not to the deadline. Moving the
            // deadline alone would push the derived start out with it and rewind
            // you into the part you'd just finished — see `extendPart`.
            onClick={() => extendPart(current.index, NUDGE_SECONDS)}
          >
            <PlusIcon data-icon="inline-start" />
            {t("format.seconds", { count: NUDGE_SECONDS })}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            // This direction *is* symmetric: pulling the deadline in by what's
            // left lands elapsed exactly on the next boundary.
            onClick={() => skipAhead(partRemainingMs / 1000)}
          >
            <SkipForwardIcon data-icon="inline-start" />
            {t("player.nextPart")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The whole set at a glance, with the part you're on marked.
 *
 * Five steps all saying the same exercise name gave you no way to tell "hold,
 * then pulses" from "pulses, then another hold", and no way to see what was
 * coming. It stays on screen while the sequence runs because that is exactly
 * when you can't afford to wonder.
 */
function PartsTrack({
  sequence,
  currentIndex,
  isDone,
}: {
  sequence: SetSequence;
  currentIndex: number;
  isDone: boolean;
}) {
  const f = useFormatting();

  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-1 text-xs">
      {sequence.parts.map((part, index) => (
        <Fragment key={part.index}>
          {index > 0 ? (
            <span aria-hidden className="text-muted-foreground/50">
              →
            </span>
          ) : null}
          <span
            className={cn(
              "rounded px-1.5 py-0.5 tabular-nums",
              isDone || part.index < currentIndex
                ? "text-muted-foreground/60 line-through"
                : part.index === currentIndex
                  ? "bg-primary/15 font-medium text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {formatSegment(part.detail, f)}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * The same set before it starts: what you're about to run, and how long it
 * takes.
 *
 * A sequence is the one set you should read before beginning, because you can't
 * consult the card halfway through it.
 */
export function SequencePreview({ sequence }: { sequence: SetSequence }) {
  const t = useT();
  const f = useFormatting();

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-2.5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {t("player.sequenceIntro", { clock: formatClock(sequence.seconds * 1000) })}
      </p>
      <ol className="flex flex-col gap-1 text-sm">
        {sequence.parts.map((part) => (
          <li key={part.index} className="flex items-baseline gap-2">
            <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">
              {part.index}.
            </span>
            <span className="flex-1">{formatSegment(part.detail, f)}</span>
            {/* A paced part is an estimate and says so — the difference between
                "hold this for ten seconds" and "we think twelve pulses takes
                about ten" is the difference between a clock and a suggestion. */}
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {part.isTimed
                ? t("format.seconds", { count: part.seconds })
                : t("player.pacedSeconds", { count: part.seconds })}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
