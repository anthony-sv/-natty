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
 *
 * **A warmup is drawn hollow**, which is the one place a mark changes kind
 * rather than weight — a ramp-up genuinely isn't the same thing as a working
 * set, and it's the difference the count underneath deliberately hides. They're
 * still drawn: the row is a picture of what you'll do, and leaving them out
 * would under-draw the exercise you spend longest on.
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
      isWarmup: prescription.isWarmup === true,
    })),
  );

  if (marks.length === 0) return null;

  // The count is working sets only, matching `summariseDay` — the strip above
  // says "12 sets" and a row saying 14 beside it would be two counts of one
  // thing disagreeing.
  const working = marks.filter((mark) => !mark.isWarmup).length;

  return (
    <span
      className="flex items-center gap-1"
      role="img"
      aria-label={`${working} set${working === 1 ? "" : "s"}`}
    >
      {marks.map((mark) => (
        <span
          key={mark.key}
          className={cn(
            "size-2 rounded-full",
            mark.isWarmup
              ? "border border-muted-foreground/50"
              : isFinisher
                ? "bg-primary"
                : mark.phase % 2 === 0
                  ? "bg-muted-foreground/70"
                  : "bg-muted-foreground/35",
          )}
        />
      ))}
      {/* Omitted rather than printed as 0 on an all-warmup exercise, which
          read as a broken row. The hollow marks and the phase's own Warmup
          chip already say what it is; a zero says something went wrong. */}
      {working > 0 ? (
        <span className="pl-1 text-xs text-muted-foreground tabular-nums">
          {working}
        </span>
      ) : null}
    </span>
  );
}
