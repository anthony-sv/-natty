import {
  ArrowDownIcon,
  ArrowUpIcon,
  EqualIcon,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import type { LoadCue } from "../lib/session";

/**
 * The furniture the player card is built from — the pieces every step body
 * arranges rather than the bodies themselves.
 *
 * They live together because the card's whole layout rule is that these are
 * *fixed*: the stage is a fixed height and the zones inside it don't grow, so
 * the button under your thumb stays where it was. A piece that sized itself to
 * its content would undo that from anywhere it was used, so the constraint
 * belongs with the pieces.
 */

/** The small caps line above a step's title — what kind of step this is. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs font-medium uppercase tracking-widest text-muted-foreground",
        className,
      )}
    >
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
export function PrescriptionStrip({
  items,
}: {
  items: { icon: LucideIcon; label: string; value: string }[];
}) {
  return (
    <div className="grid shrink-0 grid-cols-3 divide-x rounded-lg border bg-muted/40">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="size-3.5 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          {/* Clamped rather than wrapped: "10s hold → 12 pulses → 12 reps" in a
              third of a phone's width is four lines, and four lines here is the
              strip pushing the stage past its floor. */}
          <span className="truncate text-sm font-semibold tabular-nums">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

const LOAD_ICON: Record<LoadCue["direction"], LucideIcon> = {
  heavier: ArrowUpIcon,
  same: EqualIcon,
  lighter: ArrowDownIcon,
};

/**
 * Where the load goes on this set, said out loud.
 *
 * The rep numbers were always on screen; what was missing is the sentence that
 * goes with them. A ramp reaching you as "8 reps" on set three, having been
 * "10 reps" on set two, is a ramp you have to notice — and noticing it is the
 * author's job, not yours, mid-set.
 *
 * An inferred cue is worded as the observation it is ("the rep target drops")
 * rather than as an instruction, because the routine didn't actually say to add
 * weight — the numbers merely imply it, and putting a guess in the program's
 * voice is how you end up adding weight nobody asked for.
 */
export function LoadBadge({
  load,
  className,
}: {
  load: LoadCue;
  className?: string;
}) {
  const t = useT();
  const Icon = LOAD_ICON[load.direction];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        load.direction === "heavier"
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground",
        className,
      )}
      title={t(load.stated ? "player.loadStated" : "player.loadInferred")}
    >
      <Icon className="size-3.5" />
      {t(`player.load.${load.direction}` as never)}
    </span>
  );
}

/** The same cue at ladder scale: an arrow between two rungs, no words. */
export function LoadArrow({ load }: { load: LoadCue }) {
  const t = useT();
  const Icon = LOAD_ICON[load.direction];

  return (
    <Icon
      className={cn(
        "size-3.5 shrink-0",
        load.direction === "heavier" ? "text-primary" : "text-muted-foreground",
      )}
      aria-label={t(`player.load.${load.direction}` as never)}
    />
  );
}
