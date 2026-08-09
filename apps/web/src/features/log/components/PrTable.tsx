import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { features } from "@/lib/table";
import type { LoggedSet } from "../schema";

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const column = createColumnHelper<typeof features, LoggedSet>();

const columns = column.columns([
  column.accessor("reps", {
    header: "Reps",
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  column.accessor("weight", {
    header: "Weight",
    cell: (info) => {
      const weight = info.getValue();
      return (
        <span className="font-medium tabular-nums">
          {weight === undefined
            ? "Bodyweight"
            : `${weight} ${info.row.original.unit}`}
        </span>
      );
    },
  }),
  column.accessor("performedAt", {
    header: () => <span className="block text-right">Set</span>,
    cell: (info) => (
      <span className="block text-right text-muted-foreground">
        {dateFormat.format(new Date(info.getValue()))}
      </span>
    ),
  }),
]);

/**
 * One exercise's records — the Pareto frontier, heaviest first.
 *
 * Ordering comes from `prFrontier()`, not from the table: the rows are already
 * the answer, so no sorting feature is registered.
 */
export function PrTable({ frontier }: { frontier: LoggedSet[] }) {
  return (
    <DataTable
      columns={columns}
      data={frontier}
      empty="No records for this exercise."
    />
  );
}
