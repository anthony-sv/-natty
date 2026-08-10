import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WeightUnit } from "@/lib/units";
import { cn } from "@/lib/utils";
import { DAYS_IN_WEEK, weekOverWeek, type WeeklyAverage } from "../weekly";

const weekLabel = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
});

/** Weight changes are small, so a rounded-to-the-kilo figure would show none. */
function formatWeight(value: number, unit: WeightUnit): string {
  return `${value.toFixed(1)} ${unit}`;
}

/** A true minus sign, not a hyphen — it aligns with digits in tabular figures. */
function signOf(value: number): string {
  return value > 0 ? "+" : value < 0 ? "−" : "";
}

/** Signed, so "+0.4" and "−0.4" are distinguishable at a glance. */
function formatDelta(value: number, unit: WeightUnit): string {
  return `${signOf(value)}${Math.abs(value).toFixed(1)} ${unit}`;
}

function formatPercent(value: number): string {
  return `${signOf(value)}${Math.abs(value).toFixed(1)}%`;
}

/**
 * Recent weeks, most recent first. Six is enough to see a direction without
 * turning the card into a second history table.
 */
const RECENT_WEEKS = 6;

/**
 * This week's average weight, and how it compares to last week's.
 *
 * The card exists because a single morning's number is mostly water — the swing
 * between two consecutive days routinely exceeds a month of real change, so
 * "down 0.4kg since yesterday" is noise dressed as progress. Comparing weekly
 * means is the smallest honest comparison.
 */
export function WeeklyAverageCard({
  weekly,
  unit,
}: {
  /** Oldest first, as `weeklyAverages` returns them. */
  weekly: WeeklyAverage[];
  unit: WeightUnit;
}) {
  const change = weekOverWeek(weekly);
  if (change === undefined) return null;

  const { latest, previous, deltaWeight, deltaPercent } = change;
  const recent = [...weekly].reverse().slice(0, RECENT_WEEKS);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span>Weekly average</span>
          {latest.isPartial ? (
            <Badge variant="outline">
              {latest.count} of {DAYS_IN_WEEK} days
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          {latest.isPartial
            ? // Said plainly rather than hidden: a Monday-to-Wednesday mean sits
              // lower than a full week for reasons that aren't fat loss.
              "This week is still running, so it's an average of the days so far — it'll move as the week fills in."
            : "Monday to Sunday. A day-to-day change is mostly water; a week-to-week one isn't."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              Week of {weekLabel.format(new Date(latest.weekStart))}
            </span>
            <span className="text-3xl font-semibold tabular-nums">
              {formatWeight(latest.weight, unit)}
            </span>
          </div>

          {deltaWeight === undefined || deltaPercent === undefined ? (
            <p className="text-sm text-muted-foreground">
              One more week of weigh-ins and this shows the change.
            </p>
          ) : (
            <DeltaStat
              deltaWeight={deltaWeight}
              deltaPercent={deltaPercent}
              unit={unit}
              previousLabel={weekLabel.format(new Date(previous!.weekStart))}
            />
          )}
        </div>

        {recent.length > 1 ? (
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Recent weeks
            </h3>
            <ul className="divide-y">
              {recent.map((week, index) => {
                // The list runs newest-first, so the week to compare against is
                // the *next* one along.
                const before = recent[index + 1];
                return (
                  <li
                    key={week.weekStart}
                    className="flex items-center justify-between gap-4 py-1.5 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {weekLabel.format(new Date(week.weekStart))}
                      {week.isPartial ? " · so far" : ""}
                    </span>
                    <span className="flex items-center gap-3 tabular-nums">
                      <span className="font-medium">
                        {formatWeight(week.weight, unit)}
                      </span>
                      <span
                        className={cn(
                          "w-20 text-right",
                          before === undefined
                            ? "text-muted-foreground/50"
                            : "text-muted-foreground",
                        )}
                      >
                        {before === undefined
                          ? "—"
                          : formatDelta(week.weight - before.weight, unit)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * The change, with a direction icon.
 *
 * Deliberately **not** coloured green-for-down: whether losing weight is good
 * depends on what you're doing, and the app doesn't know whether you're cutting
 * or bulking. The arrow says which way; you know whether that's the way you
 * wanted.
 */
function DeltaStat({
  deltaWeight,
  deltaPercent,
  unit,
  previousLabel,
}: {
  deltaWeight: number;
  deltaPercent: number;
  unit: WeightUnit;
  previousLabel: string;
}) {
  const Icon =
    deltaWeight > 0 ? TrendingUpIcon : deltaWeight < 0 ? TrendingDownIcon : MinusIcon;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">
        vs week of {previousLabel}
      </span>
      <span className="flex items-center gap-2 text-xl font-semibold tabular-nums">
        <Icon className="size-5 text-muted-foreground" />
        {formatDelta(deltaWeight, unit)}
        <span className="text-sm font-normal text-muted-foreground">
          ({formatPercent(deltaPercent)})
        </span>
      </span>
    </div>
  );
}
