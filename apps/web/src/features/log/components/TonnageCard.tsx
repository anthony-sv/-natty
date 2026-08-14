import { Fragment, useMemo, useState } from "react";
import { ChevronDownIcon, InfoIcon, WeightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT, type MessageKey } from "@/i18n/use-t";
import { useTonnage } from "../queries";
import { comparisonsFor, type TonnageScope } from "../tonnage";

/**
 * How much you have moved, and what that even means.
 *
 * The set counts elsewhere on this tab are the figure programming runs on;
 * this is the one that feels like something. See `tonnage.ts` for why the
 * muscle rows deliberately don't sum to the total.
 */

const SCOPES: { value: TonnageScope; key: MessageKey }[] = [
  { value: "week", key: "tonnage.scope.week" },
  { value: "month", key: "tonnage.scope.month" },
  { value: "year", key: "tonnage.scope.year" },
  { value: "all", key: "tonnage.scope.all" },
];

/**
 * Kilograms below a tonne, tonnes above.
 *
 * A year of training is seven figures in kilograms, which nobody reads —
 * and switching unit is what the comparisons below are decorating rather
 * than replacing.
 */
function useMass() {
  const t = useT();
  return (kg: number): string => {
    if (kg < 1000) return t("tonnage.kg", { value: Math.round(kg).toLocaleString() });
    const tonnes = kg / 1000;
    return t("tonnage.tonnes", {
      value: (tonnes < 100 ? Math.round(tonnes * 10) / 10 : Math.round(tonnes)).toLocaleString(),
    });
  };
}

export function TonnageCard() {
  const t = useT();
  const mass = useMass();
  const [scope, setScope] = useState<TonnageScope>("month");
  // Read once on mount, per `react-hooks/purity` — and so the window doesn't
  // shift under you mid-read.
  const [now] = useState(() => Date.now());
  const { totals } = useTonnage(scope, now);

  const comparisons = useMemo(
    () => comparisonsFor(totals.totalKg),
    [totals.totalKg],
  );

  const scopeItems = SCOPES.map(({ value, key }) => ({
    value,
    label: t(key),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WeightIcon className="size-4 text-muted-foreground" />
              {t("tonnage.title")}
            </CardTitle>
            <CardDescription>{t("tonnage.body")}</CardDescription>
          </div>
          {/* A Select, not tabs: four options that change one number, and a
              tab strip here would compete with the page's own. */}
          <Select
            items={scopeItems}
            value={scope}
            onValueChange={(value) => setScope(value as TonnageScope)}
          >
            <SelectTrigger className="w-40" aria-label={t("tonnage.scopeLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scopeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-semibold tabular-nums">
            {mass(totals.totalKg)}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("tonnage.context", {
              sets: totals.sets.toLocaleString(),
              reps: totals.reps.toLocaleString(),
            })}
          </span>
        </div>

        {/* Collapsed by default: it's the fun part, not the answer. */}
        {comparisons.length > 0 ? (
          <Collapsible>
            <CollapsibleTrigger
              className="group flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              render={<button type="button" />}
            >
              <ChevronDownIcon className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
              {t("tonnage.comparisonsToggle")}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {comparisons.map((item) => (
                  <li key={item.key} className="text-muted-foreground">
                    {t.plural(`tonnage.like.${item.key}`, item.count, {
                      count: item.count.toLocaleString(),
                    })}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ) : null}

        {totals.muscles.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("tonnage.muscle")}
              </span>
              <span className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("tonnage.direct")}
              </span>
              <span className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("tonnage.indirect")}
              </span>

              {/* A Fragment, not a wrapper with `display: contents`: the
                  cells have to be direct grid children, and a `contents` box
                  reports a zero-size rect — which makes every cell look like
                  it has escaped its parent by the width of the page. */}
              {totals.muscles.map((row) => (
                <Fragment key={row.muscle}>
                  {/* A message key, not a catalog entry — the muscle list is a
                      closed enum, so a new one fails the build in both
                      languages rather than falling back to English. */}
                  <span>{t(`muscle.${row.muscle}`)}</span>
                  {/* An em dash rather than "0 kg" in both columns: a muscle
                      that only ever rides along has no direct work, and a
                      zero reads as a measurement rather than an absence. */}
                  <span className="text-right tabular-nums">
                    {row.directKg > 0 ? mass(row.directKg) : "—"}
                  </span>
                  <span className="text-right tabular-nums text-muted-foreground">
                    {row.indirectKg > 0 ? mass(row.indirectKg) : "—"}
                  </span>
                </Fragment>
              ))}
            </div>

            {/* Said out loud rather than left to be discovered: one set of
                squats is work for quads *and* glutes, so the column is a
                measure of what reached each muscle, not a division of the
                total between them. */}
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
              {t("tonnage.doesNotSum")}
            </p>
          </div>
        ) : null}

        {/* The limitation that has to reach the screen, or someone doing
            calisthenics reads a number that badly understates them. */}
        {totals.unweightedSets > 0 ? (
          <Badge variant="secondary" className="self-start">
            {t.plural("tonnage.unweighted", totals.unweightedSets, {
              count: totals.unweightedSets,
            })}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}
