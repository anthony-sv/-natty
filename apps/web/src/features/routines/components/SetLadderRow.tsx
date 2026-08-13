import { Fragment } from "react";
import { CheckIcon } from "lucide-react";
import { useT } from "@/i18n/use-t";
import { cn } from "@/lib/utils";
import type { LadderRung } from "../lib/session";
import { Eyebrow, LoadArrow } from "./PlayerChrome";

/**
 * Every set of this exercise as the figures that change between them.
 *
 * "Set 2 of 4" tells you where you are and nothing about where you're going, so
 * a ramp written 12/10/8/6 arrived one number at a time and never read as a
 * ramp — you'd finish set two of a pyramid without knowing it was one. Laid out
 * as a row it *is* the plan, and the arrows between rungs are where the load
 * instruction hangs, at the exact point it applies.
 *
 * One line, scrolling sideways rather than wrapping: a second line here is the
 * stage growing, and a seven-set finisher would take one.
 */
export function SetLadderRow({ rungs }: { rungs: LadderRung[] }) {
  const t = useT();
  // Nothing to see in a single set, and one lonely pill under the strip reads
  // as a control rather than as a plan.
  if (rungs.length < 2) return null;

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <Eyebrow>{t("player.plan")}</Eyebrow>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {rungs.map((rung, index) => (
          <Fragment key={rung.setNumber}>
            {index > 0 ? (
              rung.load ? (
                <LoadArrow load={rung.load} />
              ) : (
                <span aria-hidden className="px-0.5 text-muted-foreground/40">
                  ·
                </span>
              )
            ) : null}
            <span
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-sm tabular-nums",
                rung.isCurrent
                  ? "border-primary bg-primary/10 font-semibold"
                  : rung.isDone
                    ? "border-transparent bg-muted/60 text-muted-foreground"
                    : "border-transparent bg-muted/60",
              )}
              aria-current={rung.isCurrent ? "step" : undefined}
            >
              {rung.isDone ? (
                <CheckIcon className="size-3 shrink-0" />
              ) : (
                <span className="text-[0.625rem] text-muted-foreground">
                  {rung.setNumber}
                </span>
              )}
              {rung.target}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
