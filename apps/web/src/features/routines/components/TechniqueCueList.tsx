import { FlameIcon } from "lucide-react";
import type { SetModifiers } from "@/data/routines";
import { useT } from "@/i18n/use-t";
import { logsSeveralLoads, techniquesFor } from "../lib/technique";

/**
 * What the intensity techniques on this set actually ask you to do.
 *
 * The card used to render them as badges — "Drop set", "Rest-pause" — which
 * names a technique to someone who already knows it and leaves everyone else
 * with a red chip. Worse, two badges side by side say nothing about the fact
 * that one happens after the other: a set marked both is one set with a
 * sequence to it, and read as two independent labels it looks like a
 * contradiction.
 *
 * Numbered only when there's more than one, since the order is the thing being
 * communicated and a list of one has none.
 */
export function TechniqueCueList({
  modifiers,
}: {
  modifiers: SetModifiers | undefined;
}) {
  const t = useT();
  const techniques = techniquesFor(modifiers);
  if (techniques.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-destructive">
        <FlameIcon className="size-3.5" />
        {t(
          techniques.length > 1
            ? "player.techniqueOrder"
            : "player.techniqueOne",
        )}
      </p>
      <ol className="flex flex-col gap-1 text-sm">
        {techniques.map((key, index) => (
          <li key={key} className="flex gap-1.5">
            {techniques.length > 1 ? (
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {index + 1}.
              </span>
            ) : null}
            <span>
              {/* `modifier.ladder` interpolates its positions, which is the
                  right badge and the wrong heading — the positions are the
                  how-to, below. */}
              <span className="font-medium">
                {t(
                  key === "ladder"
                    ? "modifier.ladderName"
                    : (`modifier.${key}` as never),
                )}
              </span>
              {" — "}
              <span className="text-muted-foreground">
                {key === "ladder"
                  ? t("technique.ladder", {
                      positions: (modifiers?.ladder ?? []).join(" → "),
                    })
                  : t(`technique.${key}` as never)}
              </span>
            </span>
          </li>
        ))}
      </ol>
      {/* The one technique that changes what a *log entry* means: a drop is two
          or three loads in one set, and logged as a single number it's true for
          about a third of the reps. The log already takes several entries per
          step — nothing said so. */}
      {logsSeveralLoads(modifiers) ? (
        <p className="text-xs text-muted-foreground">
          {t("player.logEachDrop")}
        </p>
      ) : null}
    </div>
  );
}
