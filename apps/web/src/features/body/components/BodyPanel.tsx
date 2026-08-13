import { useMemo, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { profileStore } from "@/features/profile/profile-store";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { formatWeightValue, type WeightUnit } from "@/lib/units";
import { useBodyEntries } from "../collection";
import { describeFfmi, ffmi, formatIndex, leanMassKg, normalizedFfmi } from "../ffmi";
import { weeklyAverages } from "../weekly";
import { BodyCharts } from "./BodyCharts";
import { BodyEntryForm } from "./BodyEntryForm";
import { FfmiMeter } from "./FfmiMeter";
import { BodyHistoryTable } from "./BodyHistoryTable";
import { ProfileFields } from "./ProfileFields";
import { WeeklyAverageCard } from "./WeeklyAverageCard";

export function BodyPanel() {
  const { entries, latest, isLoading } = useBodyEntries();
  const profile = useStore(profileStore, (s) => s);
  const t = useT();
  const names = useNames();

  const normalized = latest ? normalizedFfmi(latest, profile.heightCm) : undefined;
  // `describeFfmi` is pure and returns the English band; it's a closed set with
  // no ids, so it translates by source string the way day labels do.
  const band = names.text(describeFfmi(normalized, profile.sex));
  const lean = latest ? leanMassKg(latest) : undefined;

  // Read once on mount rather than during render: `react-hooks/purity` rejects
  // a mid-render clock read, and "which week is the current one" shouldn't
  // change under the card while you're looking at it.
  const [now] = useState(() => Date.now());
  // Averaged in the latest weigh-in's unit, the same one the chart plots in, so
  // the card and the line can't disagree.
  const unit: WeightUnit = latest?.unit ?? "kg";
  const weekly = useMemo(
    () => weeklyAverages(entries, unit, now),
    [entries, unit, now],
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("body.profile.title")}</CardTitle>
          <CardDescription>{t("body.profile.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileFields />
        </CardContent>
      </Card>

      <WeeklyAverageCard weekly={weekly} unit={unit} />

      {latest ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("body.latest.title")}</CardTitle>
            <CardDescription>
              {profile.heightCm === undefined
                ? t("body.latest.needHeight")
                : latest.bodyFatPercent === undefined
                  ? t("body.latest.needBodyFat")
                  : t("body.latest.body")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-10 gap-y-4">
            <Stat
              label={t("common.weight")}
              value={`${formatWeightValue(latest.weight)} ${latest.unit}`}
            />
            <Stat
              label={t("body.stat.bodyFat")}
              value={
                latest.bodyFatPercent === undefined
                  ? t("common.none")
                  : `${latest.bodyFatPercent}%`
              }
            />
            <Stat
              label={t("body.stat.leanMass")}
              value={
                lean === undefined ? t("common.none") : `${lean.toFixed(1)} kg`
              }
            />
            <Stat
              label={t("body.stat.ffmi")}
              value={formatIndex(ffmi(latest, profile.heightCm))}
            />
            <Stat
              label={t("body.stat.normalized")}
              value={formatIndex(normalized)}
              badge={band}
            />
          </CardContent>
          {normalized !== undefined && profile.sex !== undefined ? (
            <CardContent className="pt-0">
              <FfmiMeter value={normalized} sex={profile.sex} />
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("body.logEntry.title")}</CardTitle>
          <CardDescription>{t("body.logEntry.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Keyed on the latest entry so the prefill follows it rather than
              staying on whatever was there when the form first mounted. */}
          <BodyEntryForm key={latest?.id ?? "none"} latest={latest} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("body.trend.title")}</CardTitle>
          <CardDescription>{t("body.trend.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BodyCharts entries={entries} weekly={weekly} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("body.history.title")}</CardTitle>
          <CardDescription>
            {profile.sex === undefined && normalized !== undefined
              ? t("body.history.needSex")
              : t("body.history.body")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BodyHistoryTable
            entries={entries}
            heightCm={profile.heightCm}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
      </span>
    </div>
  );
}
