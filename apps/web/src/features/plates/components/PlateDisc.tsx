import { cn } from "@/lib/utils";
import { discScale, type Plate } from "../equipment";

/**
 * A calibrated disc, seen face on.
 *
 * Drawn as one rather than printed as a coloured chip: a rack of colour swatches
 * with numbers on them is a legend, not a picture of your plates. The parts are
 * the ones a real disc has — a coloured body, a bevelled rim, a steel hub, and
 * the collar opening in the middle — because that combination is what makes it
 * read as a plate at 40px rather than as a circle.
 *
 * The weight sits on the hub. It's the only place with room and contrast at
 * this size, and calibrated steel discs carry it there anyway.
 */
export function PlateDisc({
  plate,
  size = 40,
  className,
  onClick,
  title,
}: {
  plate: Plate;
  /** Diameter in px at full scale; smaller denominations draw smaller. */
  size?: number;
  className?: string;
  onClick?: () => void;
  title?: string;
}) {
  const diameter = Math.round(size * discScale(plate));
  const label = `${plate.weight} ${plate.unit}`;

  const disc = (
    <svg
      viewBox="0 0 100 100"
      width={diameter}
      height={diameter}
      role="img"
      aria-label={label}
      className="shrink-0"
    >
      {/* Body, with a dark edge so a white disc still has an outline. */}
      <circle
        cx="50"
        cy="50"
        r="49"
        fill={plate.color}
        stroke="rgba(0,0,0,0.45)"
        strokeWidth="2"
      />
      {/* Bevel: a light arc up top, a dark one below. Cheap, and it's what
          stops the disc reading as a flat dot. */}
      <circle
        cx="50"
        cy="50"
        r="43"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="3"
        strokeDasharray="135 135"
        transform="rotate(-160 50 50)"
      />
      <circle
        cx="50"
        cy="50"
        r="43"
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="3"
        strokeDasharray="135 135"
        transform="rotate(20 50 50)"
      />
      {/* Steel hub. */}
      <circle
        cx="50"
        cy="50"
        r="31"
        fill="#d4d7db"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.5"
      />
      <circle cx="50" cy="50" r="26" fill="#eceef1" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#1b1b1b"
        fontSize={plate.weight >= 10 ? 26 : 22}
        fontWeight="700"
        fontFamily="inherit"
      >
        {plate.weight}
      </text>
    </svg>
  );

  if (onClick === undefined) {
    return (
      <span className={cn("flex items-center", className)} title={title ?? label}>
        {disc}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-label={title ?? `Add a pair of ${label}`}
      className={cn(
        "flex items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {disc}
    </button>
  );
}
