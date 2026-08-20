import { useEffect, useState } from "react";
import { ImageIcon, PauseIcon, PlayIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EXERCISE_MEDIA } from "@/data/exercises/media";
import { useT } from "@/i18n/use-t";

/** How long each frame holds before flipping to the other. */
const FRAME_INTERVAL_MS = 1200;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Start↔end position, alternated on a timer — the honest ceiling for
 * public-domain exercise media (`media.ts`): two static photos, not a gif or
 * video. Alternating them reads as a serviceable execution loop without
 * pretending to be more than it is.
 *
 * Renders nothing for an exercise `media.ts` has no entry for — including
 * every custom `user:` exercise, which never gets media — and nothing is the
 * right answer there, not a placeholder or a guess.
 *
 * A fixed aspect-ratio box with `object-cover` rather than each photo's own
 * dimensions: the source set mixes landscape, square and portrait shots, and
 * a box that changed shape per exercise would reflow the sheet around it.
 */
export function ExerciseMedia({ exerciseId }: { exerciseId: string }) {
  const t = useT();
  const entry = EXERCISE_MEDIA[exerciseId];
  const [reduced] = useState(prefersReducedMotion);
  const [playing, setPlaying] = useState(() => !reduced);
  const [frame, setFrame] = useState<0 | 1>(0);

  useEffect(() => {
    if (!playing || entry === undefined) return;
    const id = setInterval(() => {
      setFrame((current) => (current === 0 ? 1 : 0));
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, entry]);

  if (entry === undefined) return null;

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border bg-muted">
      <img
        src={entry.frames[frame]}
        alt=""
        loading="lazy"
        className="size-full object-cover"
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute right-2 bottom-2 size-8 opacity-90"
        aria-label={t(playing ? "media.pause" : "media.play")}
        onClick={() => setPlaying((current) => !current)}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </Button>
    </div>
  );
}

/**
 * A small trigger that opens `ExerciseMedia` in a popover — for a dense list
 * (the day page's exercise list) where a permanent thumbnail on every row
 * would outweigh the badges, set dots and prescription that row already
 * carries. Renders nothing when there's no media, so an uncovered exercise
 * doesn't grow a dead button.
 */
export function ExercisePreviewButton({
  exerciseId,
  exerciseName,
}: {
  exerciseId: string;
  exerciseName: string;
}) {
  const t = useT();
  if (EXERCISE_MEDIA[exerciseId] === undefined) return null;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label={t("media.preview", { name: exerciseName })}
          >
            <ImageIcon />
          </Button>
        }
      />
      <PopoverContent className="w-72 p-2.5">
        <ExerciseMedia exerciseId={exerciseId} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * The player's version of the same idea, as a `Dialog` rather than a
 * `Popover`. The card the trigger lives in already runs at its full fixed
 * height with the photo *embedded* — which read as visual clutter on a card
 * whose whole design is "one thing changes at a time" (see `WorkStepBody`'s
 * zone comments), and a Dialog gets the photo full-width instead of squeezed
 * into a scroll zone, easier to actually see standing at the rack.
 */
export function ExercisePreviewDialogButton({
  exerciseId,
  exerciseName,
}: {
  exerciseId: string;
  exerciseName: string;
}) {
  const t = useT();
  if (EXERCISE_MEDIA[exerciseId] === undefined) return null;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="self-start">
            <ImageIcon data-icon="inline-start" />
            {t("media.viewPhoto")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{exerciseName}</DialogTitle>
        </DialogHeader>
        <ExerciseMedia exerciseId={exerciseId} />
      </DialogContent>
    </Dialog>
  );
}
