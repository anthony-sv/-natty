import { cn } from "@/lib/utils";
import { discScale, type Plate } from "../equipment";
import type { PlateCount } from "../solve";

/**
 * A plate seen edge on, which is how it looks once it's on the bar.
 *
 * Not the face-on `PlateDisc`: from the side a disc is a thin slab, and its
 * *height* is what tells you it's a 25 rather than a 10. Thickness tracks
 * weight too, so a stack of change plates doesn't read as a stack of 25s.
 */
function PlateEdge({
  plate,
  onClick,
}: {
  plate: Plate;
  onClick?: () => void;
}) {
  const label = `${plate.weight} ${plate.unit}`;
  const heavy = plate.unit === "kg" ? 10 : 25;
  const medium = plate.unit === "kg" ? 2.5 : 10;
  const thickness =
    plate.weight >= heavy ? 14 : plate.weight >= medium ? 10 : 7;

  const slab = (
    <span
      className="block rounded-[2px] border border-black/40 shadow-sm"
      style={{
        height: `${Math.round(discScale(plate) * 100)}%`,
        width: `${thickness}px`,
        backgroundColor: plate.color,
        // A cylinder catches light down its middle and falls off at both
        // edges; flat fills read as stickers.
        backgroundImage:
          "linear-gradient(90deg, rgba(0,0,0,0.32) 0%, rgba(255,255,255,0.30) 42%, rgba(255,255,255,0.06) 62%, rgba(0,0,0,0.28) 100%)",
      }}
    />
  );

  if (onClick === undefined) {
    return (
      <span className="flex h-full items-center" title={label}>
        {slab}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Remove a pair of ${label}`}
      aria-label={`Remove a pair of ${label}`}
      className="flex h-full items-center rounded-sm transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {slab}
    </button>
  );
}

/** The bar itself: knurled shaft, a collar at each end, sleeves beyond them. */
function Bar() {
  return (
    <span aria-hidden className="flex h-full shrink-0 items-center">
      <span className="h-4 w-2 rounded-l-[2px] bg-neutral-500" />
      <span className="h-2.5 w-24 bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-600" />
      <span className="h-4 w-2 rounded-r-[2px] bg-neutral-500" />
    </span>
  );
}

/**
 * A loaded bar, seen from the side.
 *
 * Mirrored: both ends are drawn because that's what you're about to load, and
 * a one-sided picture is the most common way to misread "40 a side" as
 * "40 total".
 */
export function BarDiagram({
  perSide,
  onRemove,
  className,
}: {
  perSide: PlateCount[];
  /** Omit for a read-only diagram. */
  onRemove?: (plate: PlateCount["plate"]) => void;
  className?: string;
}) {
  const discs = perSide.flatMap((entry) =>
    Array.from({ length: entry.pairs }, (_, index) => ({
      key: `${entry.plate.weight}-${index}`,
      plate: entry.plate,
    })),
  );

  return (
    <div
      className={cn(
        "flex h-28 w-full items-center justify-center gap-px overflow-x-auto rounded-lg border bg-muted/30 px-3",
        className,
      )}
      role="img"
      aria-label={
        discs.length === 0
          ? "An empty bar"
          : `Per side: ${perSide
              .map((entry) => `${entry.pairs} × ${entry.plate.weight}`)
              .join(", ")}`
      }
    >
      {/* Outermost first on the left, so the heaviest sits against the collar
          on both ends — the order you'd actually load them in. */}
      {[...discs].reverse().map((disc) => (
        <PlateEdge
          key={`l-${disc.key}`}
          plate={disc.plate}
          onClick={onRemove ? () => onRemove(disc.plate) : undefined}
        />
      ))}
      <Bar />
      {discs.map((disc) => (
        <PlateEdge
          key={`r-${disc.key}`}
          plate={disc.plate}
          onClick={onRemove ? () => onRemove(disc.plate) : undefined}
        />
      ))}
    </div>
  );
}
