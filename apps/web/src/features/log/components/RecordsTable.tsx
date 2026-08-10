import { DataTable } from "@/components/data-table";
import { createAppColumnHelper } from "@/lib/table";
import type { RecordRow } from "../records";

const dateFormat = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const column = createAppColumnHelper<RecordRow>();

const columns = column.columns([
  // The accessor returns the exercise name *plus* its movement so searching
  // "row" finds the seated cable row; the cell shows only the curated name.
  // A hidden second column would work too, but it would still render an empty
  // cell in every row.
  column.accessor((row) => `${row.exerciseName} ${row.movementName ?? ""}`, {
    id: "exercise",
    header: "Exercise",
    sortFn: "alphanumeric",
    // The accessor carries the movement so the filter can see it; the group
    // heading must not, or every heading would read "Lat pulldown (Wide) Lat
    // pulldown". `getGroupingValue` is the hook for exactly that split.
    getGroupingValue: (row) => row.exerciseName,
    cell: (info) => (
      <span className="truncate font-medium">
        {info.row.original.exerciseName}
      </span>
    ),
  }),
  column.accessor("reps", {
    header: "Reps",
    sortFn: "basic",
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  column.accessor("weight", {
    header: "Weight",
    sortFn: "basic",
    // An unweighted set is a real record, it just carries no load — it sorts
    // to the end rather than pretending to be zero.
    sortUndefined: "last",
    cell: (info) => {
      const weight = info.getValue();
      return (
        <span className="tabular-nums">
          {weight === undefined
            ? "Bodyweight"
            : `${weight} ${info.row.original.unit}`}
        </span>
      );
    },
  }),
  column.accessor("performedAt", {
    header: "Set",
    sortFn: "datetime",
    // The card is wide and there are only three values on a row, so
    // left-packing them all left two thirds of it empty. Reps and weight stay
    // together where they read as one fact; the date bookends the row.
    meta: { align: "end" },
    cell: (info) => (
      <span className="text-muted-foreground">
        {dateFormat.format(new Date(info.getValue()))}
      </span>
    ),
  }),
]);

/** Only the exercise column is searched — see `globalFilterColumns`. */
const SEARCHABLE = ["exercise"] as const;

/**
 * One heading per exercise. A flat list made a lift's records hard to pick out
 * from its neighbours', and grouping beats repeating the name on every row
 * because the heading also carries the count.
 */
const GROUP_BY = ["exercise"] as const;

/** Every record across every exercise: one virtualized, sortable table. */
export function RecordsTable({
  rows,
  isLoading,
  search,
}: {
  rows: RecordRow[];
  isLoading: boolean;
  search: string;
}) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      globalFilter={search}
      globalFilterColumns={SEARCHABLE}
      grouping={GROUP_BY}
      // The logged set's own id, so a row keeps its identity through a search
      // or a re-sort — the virtual list keys its measurements off it.
      getRowId={(row) => row.id}
      devtoolsKey="records"
      empty={
        search ? `No records match "${search}".` : "No records logged yet."
      }
      // The exercise column keeps a slot but narrows to an indent: its value
      // is the heading above each run, and the column has to stay in the table
      // for the search to have something to match against.
      virtual={{ gridTemplate: "1.75rem 6rem 10rem minmax(0, 1fr)" }}
    />
  );
}
