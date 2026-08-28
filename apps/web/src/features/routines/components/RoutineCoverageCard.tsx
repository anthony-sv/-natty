import { useMemo } from "react";
import { CircleCheckIcon, CircleSlashIcon, InfoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { muscleSchema } from "@/data/exercises";
import type { Routine } from "@/data/routines";
import { useLibrary } from "@/features/library/use-library";
import { useT } from "@/i18n/use-t";
import { routineCoverage, type RoutineMuscleGapReason } from "../lib/coverage";

/** The order the gaps read in — same order `VolumePanel`'s own gaps card uses. */
const REASON_ORDER: RoutineMuscleGapReason[] = [
  "indirect-only",
  "never-direct",
  "not-in-routine",
];

/**
 * Does this routine, as written, cover every muscle and enough movement
 * variety within the ones it does train — see `routineCoverage`
 * (`../lib/coverage.ts`) for the full reasoning behind the two sections
 * below. Deliberately **always renders**, unlike `VolumePanel`'s gaps card:
 * this card *is* the whole feature, so "nothing missing" needs an all-clear
 * state rather than disappearing.
 */
export function RoutineCoverageCard({ routine }: { routine: Routine }) {
  const t = useT();
  const { isLoading, anatomy, trainableDirectly, patternsByMuscle } = useLibrary();

  // Destructured rather than depending on the whole `library` object, which
  // `useLibrary` rebuilds every render (`{ ...merged, isLoading }`) even when
  // nothing underneath actually changed.
  const coverage = useMemo(
    () =>
      isLoading
        ? undefined
        : routineCoverage(
            routine,
            anatomy,
            { trainableDirectly, patternsByMuscle },
            muscleSchema.options,
          ),
    [routine, isLoading, anatomy, trainableDirectly, patternsByMuscle],
  );

  // While the custom-exercise collection is still loading, a routine
  // referencing a `user:` id would otherwise flash a false "not-in-routine"
  // before it answers.
  if (coverage === undefined) {
    return <Skeleton className="h-40 w-full" />;
  }

  const isClear = coverage.muscleGaps.length === 0 && coverage.variety.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleSlashIcon className="size-4 text-muted-foreground" />
          {t("coverage.title")}
        </CardTitle>
        <CardDescription>{t("coverage.body")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isClear ? (
          <div className="flex items-start gap-2">
            <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-medium">{t("coverage.clear")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("coverage.clearBody")}
              </p>
            </div>
          </div>
        ) : (
          <>
            {coverage.muscleGaps.length > 0 ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">{t("coverage.muscles")}</h3>
                {REASON_ORDER.map((reason) => {
                  const forReason = coverage.muscleGaps.filter(
                    (gap) => gap.reason === reason,
                  );
                  if (forReason.length === 0) return null;
                  return (
                    <div key={reason} className="flex flex-col gap-1.5">
                      <h4 className="flex items-center gap-1.5 text-sm font-medium">
                        {t(`coverage.reason.${reason}`)}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {t(`coverage.reasonBody.${reason}`)}
                      </p>
                      <ul className="flex flex-wrap gap-1.5 pt-0.5">
                        {forReason.map((gap) => (
                          <li key={gap.muscle}>
                            <Badge variant="secondary" className="font-normal">
                              {t(`muscle.${gap.muscle}`)}
                              {gap.indirectCount > 0 ? (
                                <span className="text-muted-foreground tabular-nums">
                                  {" "}
                                  {t.plural("coverage.indirectCount", gap.indirectCount)}
                                </span>
                              ) : null}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {coverage.variety.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium">{t("coverage.variety")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("coverage.varietyBody")}
                  </p>
                </div>
                {coverage.variety.map((entry) => (
                  <div key={entry.muscle} className="flex flex-col gap-1.5">
                    <h4 className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                      {t(`muscle.${entry.muscle}`)}
                      <span className="text-xs font-normal text-muted-foreground tabular-nums">
                        {t("coverage.varietyCount", {
                          used: entry.used.length,
                          total: entry.used.length + entry.missing.length,
                        })}
                      </span>
                    </h4>
                    <ul className="flex flex-wrap gap-1.5">
                      {entry.missing.map((pattern) => (
                        <li key={pattern}>
                          <Badge variant="outline" className="font-normal">
                            {t(`pattern.${pattern}`)}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}

        <p className="flex items-start gap-1.5 border-t pt-3 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
          {t("coverage.note")}
        </p>
      </CardContent>
    </Card>
  );
}
