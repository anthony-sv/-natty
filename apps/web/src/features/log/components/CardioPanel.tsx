import { useMemo, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { FootprintsIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n/use-t";
import { cardioEntriesFork } from "../cardio-collection";
import {
  describeDistance,
  distanceThisWeek,
  totalDistanceKm,
} from "../cardio";
import { CardioEntryList } from "./CardioEntryList";

/**
 * What your cardio adds up to — total distance is nothing next to a bar
 * chart of resistance sets, so this leans on the one thing distance is good
 * for: a real-world comparison. See `cardio.ts` for the reference list.
 */
export function CardioPanel() {
  const t = useT();
  // Read once on mount rather than during render, per `react-hooks/purity`.
  const [now] = useState(() => Date.now());

  const cardioEntries = cardioEntriesFork.useActive();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ entry: cardioEntries }),
    [cardioEntries],
  );
  const entries = useMemo(() => data ?? [], [data]);

  const totalKm = useMemo(() => totalDistanceKm(entries), [entries]);
  const weekKm = useMemo(() => distanceThisWeek(entries, now), [entries, now]);
  const milestone = useMemo(() => describeDistance(totalKm, t), [totalKm, t]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Empty>
        <FootprintsIcon className="size-8 text-muted-foreground" />
        <EmptyTitle>{t("cardio.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("cardio.empty.body")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("cardio.total.title")}</CardTitle>
          <CardDescription>
            {t("cardio.total.thisWeek", { km: weekKm.toFixed(1) })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <p className="text-3xl font-semibold tabular-nums">
            {t("cardio.total.value", { km: totalKm.toFixed(1) })}
          </p>
          {milestone ? (
            <p className="text-sm text-muted-foreground">
              {milestone.kind === "passed"
                ? t("cardio.milestone.passed", {
                    route: milestone.label,
                    remainder: milestone.remainderKm.toFixed(1),
                  })
                : t("cardio.milestone.toward", {
                    remaining: milestone.remainingKm.toFixed(1),
                    route: milestone.label,
                  })}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("cardio.sessions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardioEntryList
            entries={[...entries].sort((a, b) => b.performedAt - a.performedAt)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
