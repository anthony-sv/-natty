import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { features } from "@/lib/table";
import { ffmi, formatIndex, normalizedFfmi } from "../ffmi";
import type { BodyEntry } from "../schema";

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Height comes from the profile, not the row, so the columns are built inside
 * a memo rather than at module scope — changing your height reworks every
 * row's FFMI, which is the point of storing it once.
 */
function buildColumns(heightCm: number | undefined) {
  const column = createColumnHelper<typeof features, BodyEntry>();
  return column.columns([
    column.accessor("measuredAt", {
      header: "Date",
      sortFn: "datetime",
      cell: (info) => (
        <span className="text-muted-foreground">
          {dateFormat.format(new Date(info.getValue()))}
        </span>
      ),
    }),
    column.accessor("weight", {
      header: "Weight",
      sortFn: "basic",
      cell: (info) => (
        <span className="font-medium tabular-nums">
          {info.getValue()} {info.row.original.unit}
        </span>
      ),
    }),
    column.accessor("bodyFatPercent", {
      header: "Body fat",
      sortFn: "basic",
      sortUndefined: "last",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className="tabular-nums">
            {value === undefined ? "—" : `${value}%`}
          </span>
        );
      },
    }),
    // Display columns have no value to compare, so neither is sortable — FFMI
    // tracks weight and body fat anyway, both of which are.
    column.display({
      id: "ffmi",
      header: "FFMI",
      cell: (info) => (
        <span className="tabular-nums">
          {formatIndex(ffmi(info.row.original, heightCm))}
        </span>
      ),
    }),
    column.display({
      id: "normalized",
      header: "Normalized",
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
  const columns = useMemo(() => buildColumns(heightCm), [heightCm]);
  return (
    <DataTable
      columns={columns}
      data={entries}
      isLoading={isLoading}
      getRowId={(entry) => entry.id}
      devtoolsKey="body-history"
      empty="No weigh-ins logged yet."
    />
  );
}
