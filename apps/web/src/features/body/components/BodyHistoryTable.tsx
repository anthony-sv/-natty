import { formatWeightValue } from "@/lib/units";
import { useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { createAppColumnHelper } from "@/lib/table";
import { useDateFormat, useT, type Translate } from "@/i18n/use-t";
import { ffmi, formatIndex, normalizedFfmi } from "../ffmi";
import type { BodyEntry } from "../schema";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/**
 * Height comes from the profile, not the row, so the columns are built inside
 * a memo rather than at module scope — changing your height reworks every
 * row's FFMI, which is the point of storing it once.
 */
function buildColumns(
  heightCm: number | undefined,
  t: Translate,
  dateFormat: Intl.DateTimeFormat,
) {
  const column = createAppColumnHelper<BodyEntry>();
  return column.columns([
    column.accessor("measuredAt", {
      header: t("common.date"),
      sortFn: "datetime",
      cell: (info) => (
        <span className="text-muted-foreground">
          {dateFormat.format(new Date(info.getValue()))}
        </span>
      ),
    }),
    column.accessor("weight", {
      header: t("common.weight"),
      sortFn: "basic",
      cell: (info) => (
        <span className="font-medium tabular-nums">
          {formatWeightValue(info.getValue())} {info.row.original.unit}
        </span>
      ),
    }),
    column.accessor("bodyFatPercent", {
      header: t("body.stat.bodyFat"),
      sortFn: "basic",
      sortUndefined: "last",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className="tabular-nums">
            {value === undefined ? t("common.none") : `${value}%`}
          </span>
        );
      },
    }),
    // Display columns have no value to compare, so neither is sortable — FFMI
    // tracks weight and body fat anyway, both of which are.
    column.display({
      id: "ffmi",
      header: t("body.stat.ffmi"),
      cell: (info) => (
        <span className="tabular-nums">
          {formatIndex(ffmi(info.row.original, heightCm))}
        </span>
      ),
    }),
    column.display({
      id: "normalized",
      header: t("body.stat.normalized"),
      // Alignment on the column def rather than hand-rolled into both the
      // header and the cell, which is what `columnMeta` is for.
      meta: { align: "end" },
      cell: (info) => (
        <span className="tabular-nums">
          {formatIndex(normalizedFfmi(info.row.original, heightCm))}
        </span>
      ),
    }),
  ]);
}

export function BodyHistoryTable({
  entries,
  heightCm,
  isLoading,
}: {
  entries: BodyEntry[];
  heightCm: number | undefined;
  /** Optional, like `DataTable`'s own — an omitted one just isn't loading. */
  isLoading?: boolean;
}) {
  const t = useT();
  const dateFormat = useDateFormat(DATE_OPTIONS);
  const columns = useMemo(
    () => buildColumns(heightCm, t, dateFormat),
    [heightCm, t, dateFormat],
  );
  return (
    <DataTable
      columns={columns}
      data={entries}
      isLoading={isLoading}
      getRowId={(entry) => entry.id}
      devtoolsKey="body-history"
      empty={t("body.history.empty")}
    />
  );
}
