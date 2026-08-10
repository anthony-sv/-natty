import { Link } from "@tanstack/react-router";
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
  const summary = summariseRoutine(routine);

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
            <ItemTitle className="text-base">{routine.name}</ItemTitle>
            {routine.goal ? (
              <Badge
                variant={routine.goal === "cutting" ? "destructive" : "default"}
              >
                {routine.goal}
              </Badge>
            ) : null}
            {routine.style ? (
              <Badge variant="secondary">{routine.style}</Badge>
            ) : null}
          </div>

          <ItemDescription className="shrink-0">
            {summary.length} · {summary.trainingDays} training day
            {summary.trainingDays === 1 ? "" : "s"}
            {summary.restDays > 0 ? ` · ${summary.restDays} rest` : ""}
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
