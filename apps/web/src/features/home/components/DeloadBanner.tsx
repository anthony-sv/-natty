import { useState } from "react";
import { CircleCheckIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDeloadSuggested } from "@/features/log/use-deload";
import { setProfile } from "@/features/profile/profile-store";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";

/**
 * A plain-language suggestion, not an action: nothing about your program
 * changes here, and it stays up for as long as the condition holds — that's
 * the "visualized throughout the week" the feature was asked for, alongside
 * the current-week marking on the training heatmaps (`useDeloadSuggested`
 * is the shared computation behind both, so acknowledging here clears the
 * ring too).
 */
export function DeloadBanner() {
  const t = useT();
  const names = useNames();
  // Read once on mount rather than during render, per `react-hooks/purity`.
  const [now] = useState(() => Date.now());
  const status = useDeloadSuggested(now);

  if (!status.suggested) return null;

  const exerciseNames = status.plateauedExerciseIds.map((id) =>
    names.exercise(id),
  );

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlertIcon className="size-4 text-muted-foreground" />
          {t("deload.title")}
        </CardTitle>
        <CardDescription>
          {t("deload.body", { exercises: exerciseNames.join(", ") })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setProfile({ deloadAcknowledgedAt: Date.now() })}
        >
          <CircleCheckIcon data-icon="inline-start" />
          {t("deload.acknowledge")}
        </Button>
      </CardContent>
    </Card>
  );
}
