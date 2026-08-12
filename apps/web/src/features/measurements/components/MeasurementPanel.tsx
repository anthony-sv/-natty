import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { toast } from "@/components/ui/toast";
import { useDateFormat, useT } from "@/i18n/use-t";
import {
  deleteMeasurement,
  restoreMeasurement,
  useMeasurements,
} from "../collection";
import { orderSeries, toSeries } from "../measurements";
import { measurementSiteSchema, type Measurement } from "../schema";
import { MeasurementCharts } from "./MeasurementCharts";
import { MeasurementForm } from "./MeasurementForm";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/**
 * Girth, and how it has moved.
 *
 * The scale tells you the direction; a tape tells you where it went. Two people
 * can hold the same weight for six months with completely different arms, which
 * is the entire reason this exists alongside `/progress`'s Body tab rather than
 * inside it.
 */
export function MeasurementPanel() {
  const t = useT();
  const { rows, isLoading } = useMeasurements();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("measure.title")}</CardTitle>
          <CardDescription>{t("measure.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementForm rows={rows} />
        </CardContent>
      </Card>

      {rows.length > 0 ? <LatestStrip rows={rows} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("measure.trend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MeasurementCharts rows={rows} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("measure.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryList rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Latest per site, with how far it has come.
 *
 * The change is over the whole run rather than since the previous reading — a
 * tape is accurate to about half a centimetre, so reading-to-reading noise
 * would swamp the signal, and "since I started" is the question anyway.
 */
function LatestStrip({ rows }: { rows: Measurement[] }) {
  const t = useT();
  const series = orderSeries(toSeries(rows), measurementSiteSchema.options);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {series.map((entry) => (
        <div key={entry.key} className="flex flex-col gap-0.5 rounded-lg border p-3">
          <span className="text-xs text-muted-foreground">
            {entry.side === undefined
              ? t(`measure.site.${entry.site}` as never)
              : t("measure.siteSide", {
                  site: t(`measure.site.${entry.site}` as never),
                  side: t(`measure.side.${entry.side}` as never),
                })}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {entry.latest.toFixed(1)} {entry.unit}
          </span>
          {/* Omitted, not zeroed, on a single reading — "+0.0" would read as
              having held steady rather than as having only just started. */}
          {entry.change !== undefined ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {t("measure.change", {
                delta: `${entry.change >= 0 ? "+" : ""}${entry.change.toFixed(1)}`,
                unit: entry.unit,
              })}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Every reading, newest first, with a delete.
 *
 * Immediate with an Undo on the toast rather than behind a confirm — small,
 * frequent and fully reversible, the same call `deleteSet` makes. Nothing needs
 * fixing up afterwards either: every number on this page is derived from the
 * rows on each read, so removing a mistyped 400 cm silently corrects the strip
 * and the chart.
 */
function HistoryList({ rows }: { rows: Measurement[] }) {
  const t = useT();
  const dateFormat = useDateFormat(DATE_OPTIONS);

  if (rows.length === 0) {
    return (
      <Empty>
        <EmptyTitle>{t("measure.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("measure.empty.body")}</EmptyDescription>
      </Empty>
    );
  }

  return (
    <ul className="divide-y">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center gap-3 py-2">
          <span className="w-28 shrink-0 text-xs text-muted-foreground">
            {dateFormat.format(new Date(row.measuredAt))}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">
            {row.side === undefined
              ? t(`measure.site.${row.site}` as never)
              : t("measure.siteSide", {
                  site: t(`measure.site.${row.site}` as never),
                  side: t(`measure.side.${row.side}` as never),
                })}
          </span>
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {row.value} {row.unit}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            aria-label={t("measure.delete")}
            onClick={() => {
              const removed = deleteMeasurement(row.id);
              if (removed === undefined) return;
              toast.add({
                title: t("measure.deleted"),
                type: "info",
                actionProps: {
                  children: t("history.undo"),
                  onClick: () => restoreMeasurement(removed),
                },
              });
            }}
          >
            <Trash2Icon />
          </Button>
        </li>
      ))}
    </ul>
  );
}
