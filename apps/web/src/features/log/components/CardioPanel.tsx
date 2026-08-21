import { useMemo, useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { useStore } from "@tanstack/react-store";
import { Link } from "@tanstack/react-router";
import { FootprintsIcon, HeartPulseIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { profileStore } from "@/features/profile/profile-store";
import { useT } from "@/i18n/use-t";
import { cardioEntriesFork } from "../cardio-collection";
import {
  describeDistance,
  distanceThisWeek,
  totalDistanceKm,
} from "../cardio";
import { ageFromBirthDate, estimatedMaxHr, zone2Range } from "../heart-rate";
import { CardioEntryList } from "./CardioEntryList";

/**
 * The estimated Zone 2 heart-rate band — derived from the profile, not from
 * cardio history, so it's useful before you've logged a single session.
 * That's why it's a card of its own rather than folded into the totals card
 * below, which stays gated on having entries at all.
 */
function Zone2Card({ now }: { now: number }) {
  const t = useT();
  const birthDate = useStore(profileStore, (s) => s.birthDate);

  const range =
    birthDate === undefined
      ? undefined
      : zone2Range(estimatedMaxHr(ageFromBirthDate(birthDate, now)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulseIcon className="size-4 text-muted-foreground" />{" "}
          {t("cardio.zone2.title")}
        </CardTitle>
        <CardDescription>{t("cardio.zone2.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {range === undefined ? (
          <Empty>
            <EmptyTitle>{t("cardio.zone2.noBirthDate")}</EmptyTitle>
            <EmptyDescription>
              <Link to="/profile">{t("cardio.zone2.setBirthDate")}</Link>
            </EmptyDescription>
          </Empty>
        ) : (
          <p className="text-3xl font-semibold tabular-nums">
            {t("cardio.zone2.range", {
              low: range.lowBpm,
              high: range.highBpm,
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

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
      <div className="flex flex-col gap-4">
        <Zone2Card now={now} />
        <Empty>
          <FootprintsIcon className="size-8 text-muted-foreground" />
          <EmptyTitle>{t("cardio.empty.title")}</EmptyTitle>
          <EmptyDescription>{t("cardio.empty.body")}</EmptyDescription>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Zone2Card now={now} />

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
