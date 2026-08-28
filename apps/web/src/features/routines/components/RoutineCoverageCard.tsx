import { useMemo } from "react";
import { CircleCheckIcon, CircleSlashIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { muscleSchema } from "@/data/exercises";
import type { Routine } from "@/data/routines";
import { useLibrary } from "@/features/library/use-library";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { routineCoverage, unifiedCoverage } from "../lib/coverage";

/**
 * Does this routine, as written, cover every muscle and enough movement
 * variety within the ones it does train — see `routineCoverage`/
 * `unifiedCoverage` (`../lib/coverage.ts`) for the reasoning. One
 * muscle-per-row accordion, collapsed by default: expanding a muscle shows
 * exactly which patterns it's missing and which real library exercises
 * would close each one — the point is to name something you could add, not
 * just report a gap. Deliberately **always renders**, unlike `VolumePanel`'s
 * gaps card: this card *is* the whole feature, so "nothing missing" needs an
 * all-clear state rather than disappearing.
 */
export function RoutineCoverageCard({ routine }: { routine: Routine }) {
  const t = useT();
  const names = useNames();
  const { isLoading, anatomy, trainableDirectly, patternsByMuscle, all } = useLibrary();

  // Destructured rather than depending on the whole `library` object, which
  // `useLibrary` rebuilds every render (`{ ...merged, isLoading }`) even when
  // nothing underneath actually changed.
  const unified = useMemo(() => {
    if (isLoading) return undefined;
    const library = { trainableDirectly, patternsByMuscle, all };
    const coverage = routineCoverage(routine, anatomy, library, muscleSchema.options);
    return unifiedCoverage(coverage, library, muscleSchema.options);
  }, [routine, isLoading, anatomy, trainableDirectly, patternsByMuscle, all]);

  // While the custom-exercise collection is still loading, a routine
  // referencing a `user:` id would otherwise flash a false gap before it
  // answers.
  if (unified === undefined) {
    return <Skeleton className="h-40 w-full" />;
  }

  const isClear = unified.muscles.length === 0 && unified.neverDirect.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleSlashIcon className="size-4 text-muted-foreground" />
          {t("coverage.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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
          <Accordion>
            {unified.muscles.map((entry) => (
              <AccordionItem key={entry.muscle} value={entry.muscle}>
                <AccordionTrigger>
                  <span className="flex flex-wrap items-center gap-x-1.5">
                    {t(`muscle.${entry.muscle}`)}
                    <span className="text-xs font-normal text-muted-foreground tabular-nums">
                      {t.plural("coverage.missingCount", entry.missing.length)}
                      {entry.indirectCount > 0 ? (
                        <>
                          {" "}
                          {t.plural("coverage.indirectCount", entry.indirectCount)}
                        </>
                      ) : null}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    {entry.missing.map((m) => (
                      <div key={m.pattern} className="flex flex-col gap-1.5">
                        <h4 className="text-sm font-medium">
                          {t(`pattern.${m.pattern}`)}
                        </h4>
                        <ul className="flex flex-wrap gap-1.5">
                          {m.candidates.map((id) => (
                            <li key={id}>
                              <Badge variant="outline" className="font-normal">
                                {names.exercise(id)}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {unified.neverDirect.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("coverage.neverDirectNote")}{" "}
            {unified.neverDirect.map((muscle) => t(`muscle.${muscle}`)).join(", ")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
