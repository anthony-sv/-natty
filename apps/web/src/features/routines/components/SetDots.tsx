import { cn } from "@/lib/utils";
import type { Prescription } from "@/data/routines";

/**
 * One mark per set you'll perform, in phase order.
 *
 * The chips already say "2×10-12 · 90s rest", but reading volume off them means
 * adding up numbers across rows. A row of marks is countable at a glance, so
 * the eight-set day looks like more work than the four-set one before you've
 * read a word of it.
 *
 * Phases alternate weight rather than colour: a ramp's last, heavier phase is a
 * different thing from the two before it, and that's a distinction of emphasis,
 * not of category.
 */
export function SetDots({
  prescriptions,
  isFinisher = false,
}: {
  prescriptions: Prescription[];
  isFinisher?: boolean;
}) {
  const marks = prescriptions.flatMap((prescription, phase) =>
    Array.from({ length: prescription.sets }, (_, index) => ({
      key: `${phase}-${index}`,
      phase,
    })),
  );

  if (marks.length === 0) return null;

  const total = marks.length;

  return (
    <span
      className="flex items-center gap-1"
      role="img"
      aria-label={`${total} set${total === 1 ? "" : "s"}`}
    >
      {marks.map((mark) => (
        <span
          key={mark.key}
          className={cn(
            "size-2 rounded-full",
            isFinisher
              ? "bg-primary"
              : mark.phase % 2 === 0
                ? "bg-muted-foreground/70"
                : "bg-muted-foreground/35",
          )}
        />
      ))}
      <span className="pl-1 text-xs text-muted-foreground tabular-nums">
        {total}
      </span>
    </span>
  );
}
