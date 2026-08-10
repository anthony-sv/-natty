import { cn } from "@/lib/utils";

/**
 * A countdown drawn as a ring around its own clock.
 *
 * A flat bar under a number makes you read two things and relate them; a ring
 * puts the remaining fraction *around* the figure, so "nearly done" is the
 * shape of it. It's also the affordance every kitchen and gym timer already
 * uses, which is worth more mid-set than novelty.
 */
export function TimerRing({
  /** 0–100, how much of the interval has already gone. */
  percent,
  label,
  caption,
  isComplete = false,
  size = 128,
}: {
  percent: number;
  /** The clock itself, already formatted. */
  label: string;
  caption?: string;
  isComplete?: boolean;
  size?: number;
}) {
  const stroke = 10;
  const radius = (100 - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const remaining = Math.max(0, Math.min(100, 100 - percent));

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label} remaining${caption ? `, ${caption}` : ""}`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          // Drains clockwise as the interval elapses.
          strokeDashoffset={circumference * (1 - remaining / 100)}
          className={cn(
            "transition-[stroke-dashoffset] duration-300",
            isComplete ? "stroke-primary" : "stroke-foreground/70",
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "text-4xl font-semibold tabular-nums",
            isComplete && "text-primary",
          )}
        >
          {label}
        </span>
        {caption ? (
          <span className="text-xs text-muted-foreground">{caption}</span>
        ) : null}
      </div>
    </div>
  );
}
