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
      cell: (info) => (
        <span className="text-muted-foreground">
          {dateFormat.format(new Date(info.getValue()))}
        </span>
      ),
    }),
    column.accessor("weight", {
      header: "Weight",
      cell: (info) => (
        <span className="font-medium tabular-nums">
          {info.getValue()} {info.row.original.unit}
        </span>
      ),
    }),
    column.accessor("bodyFatPercent", {
      header: "Body fat",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className="tabular-nums">
            {value === undefined ? "—" : `${value}%`}
          </span>
        );
      },
    }),
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
      header: () => <span className="block text-right">Normalized</span>,
      cell: (info) => (
        <span className="block text-right tabular-nums">
          {formatIndex(normalizedFfmi(info.row.original, heightCm))}
        </span>
      ),
    }),
  ]);
}

export function BodyHistoryTable({
  entries,
  heightCm,
}: {
  entries: BodyEntry[];
  heightCm: number | undefined;
}) {
  const columns = useMemo(() => buildColumns(heightCm), [heightCm]);
  return (
    <DataTable
      columns={columns}
      data={entries}
      empty="No weigh-ins logged yet."
    />
  );
}
