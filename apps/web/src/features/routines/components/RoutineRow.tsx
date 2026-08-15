import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import type { Routine } from "@/data/routines";
import { profileStore } from "@/features/profile/profile-store";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";
import { summariseRoutine } from "../lib/summary";

/**
 * One program, as a row rather than a card.
 *
 * The card version was three lines of text in a box tall enough for six, and
 * the only thing distinguishing two programs was "8 weeks" versus "8 weeks".
 * A row is as tall as its content and has the width to carry the split, which
 * is the thing you're actually choosing between.
 */
export function RoutineRow({ routine }: { routine: Routine }) {
  const t = useT();
  const f = useFormatting();
  const summary = summariseRoutine(routine, f);
  const isActive = useStore(
    profileStore,
    (state) => state.activeRoutineSlug === routine.slug,
  );

  return (
    <Item
      variant="outline"
      // Composes via `useRender`, so the Link *is* the row — no wrapper anchor
      // around a card, which is what made the old one's focus ring sit wrong.
      render={
        <Link to="/routines/$routineSlug" params={{ routineSlug: routine.slug }} />
      }
      className="items-start gap-x-4 gap-y-2"
    >
      <ItemContent className="gap-2">
        {/* Name left, length right, so the row's width is used rather than
            leaving a gap between the text and the chevron. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ItemTitle className="text-base">
              {f.names.routine(routine.slug, routine.name)}
            </ItemTitle>
            {isActive ? <Badge>{t("routines.active")}</Badge> : null}
            {routine.goal ? (
              <Badge
                variant={routine.goal === "cutting" ? "destructive" : "default"}
              >
                {f.names.text(routine.goal)}
              </Badge>
            ) : null}
            {routine.style ? (
              <Badge variant="secondary">{f.names.text(routine.style)}</Badge>
            ) : null}
          </div>

          {/* `min-w-0`, never `shrink-0`. This wraps onto its own line on a
              phone, and a flex item that refuses to shrink takes its max-content
              width even with a whole line to itself — so in Spanish, where
              "ciclo de 7 días · 5 días de entrenamiento · 2 de descanso" is half
              again as long as the English, it ran 60px past the card and printed
              over the border. Nothing was clipping it, so it just showed. */}
          <ItemDescription className="min-w-0">
            {summary.length} ·{" "}
            {t.plural("routines.trainingDays", summary.trainingDays)}
            {summary.restDays > 0
              ? ` · ${t("routines.restDays", { count: summary.restDays })}`
              : ""}
          </ItemDescription>
        </div>

        {summary.split.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {summary.split.map((label, index) => (
              <span
                // Labels repeat across a week in some splits, so the position
                // is part of the identity.
                key={`${label}-${index}`}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </ItemContent>

      <ItemActions>
        <ChevronRightIcon className="size-4 text-muted-foreground" />
      </ItemActions>
    </Item>
  );
}
