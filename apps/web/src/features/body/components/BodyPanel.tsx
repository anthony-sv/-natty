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
import { useBodyEntries } from "../collection";
import { describeFfmi, ffmi, formatIndex, leanMassKg, normalizedFfmi } from "../ffmi";
import { BodyCharts } from "./BodyCharts";
import { BodyEntryForm } from "./BodyEntryForm";
import { FfmiMeter } from "./FfmiMeter";
import { BodyHistoryTable } from "./BodyHistoryTable";
import { ProfileFields } from "./ProfileFields";

export function BodyPanel() {
  const { entries, latest, isLoading } = useBodyEntries();
  const profile = useStore(profileStore, (s) => s);

  const normalized = latest ? normalizedFfmi(latest, profile.heightCm) : undefined;
  const band = describeFfmi(normalized, profile.sex);
  const lean = latest ? leanMassKg(latest) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
          <CardDescription>
            Stored once and applied to every weigh-in, so correcting a typo here
            recalculates the whole history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileFields />
        </CardContent>
      </Card>

      {latest ? (
        <Card>
          <CardHeader>
            <CardTitle>Latest</CardTitle>
            <CardDescription>
              {profile.heightCm === undefined
                ? "Add your height above to see FFMI."
                : latest.bodyFatPercent === undefined
                  ? "Add a body-fat reading to a weigh-in to see FFMI."
                  : "Fat-free mass index — lean mass over height squared."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-10 gap-y-4">
            <Stat label="Weight" value={`${latest.weight} ${latest.unit}`} />
            <Stat
              label="Body fat"
              value={
                latest.bodyFatPercent === undefined
                  ? "—"
                  : `${latest.bodyFatPercent}%`
              }
            />
            <Stat
              label="Lean mass"
              value={lean === undefined ? "—" : `${lean.toFixed(1)} kg`}
            />
            <Stat label="FFMI" value={formatIndex(ffmi(latest, profile.heightCm))} />
            <Stat
              label="Normalized"
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
          <CardTitle>Log a weigh-in</CardTitle>
          <CardDescription>
            Body fat is optional — weight alone is still worth tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Keyed on the latest entry so the prefill follows it rather than
              staying on whatever was there when the form first mounted. */}
          <BodyEntryForm key={latest?.id ?? "none"} latest={latest} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trend</CardTitle>
          <CardDescription>
            Weight and body fat on their own scales — one chart each, since a
            shared axis would only invite reading a crossing point as
            meaningful.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BodyCharts entries={entries} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>
            {profile.sex === undefined && normalized !== undefined
              ? "Set your sex above to see where a normalized figure sits against population norms."
              : "Most recent first."}
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
