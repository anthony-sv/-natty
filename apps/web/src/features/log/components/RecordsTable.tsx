import { useMemo, useState } from "react";
import { DataTable } from "@/components/data-table";
import { createAppColumnHelper } from "@/lib/table";
import { useDateFormat, useT, type Translate } from "@/i18n/use-t";
import type { RecordRow } from "../records";
import {
  ExerciseDetailSheet,
  ExerciseDetailTrigger,
} from "./ExerciseDetailSheet";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

const column = createAppColumnHelper<RecordRow>();

/**
 * Built per locale rather than at module scope, because a header is a string
 * and a date cell needs a locale-aware formatter. Memoised on the two things
 * that change it, so the table isn't handed a new column list every render.
 */
const buildColumns = (t: Translate, dateFormat: Intl.DateTimeFormat) =>
  column.columns([
  // The accessor returns everything this lift can be called — the curated name,
  // its movement, and the library's other spellings — so "row" finds the seated
  // cable row and "pec deck" finds the machine fly. The cell shows only the
  // curated name. A hidden second column would filter the same way but leave an
  // empty cell in every row.
  column.accessor(
    (row) =>
      [row.exerciseName, row.movementName, ...row.aliases]
        .filter(Boolean)
        .join(" "),
    {
      id: "exercise",
      header: t("common.exercise"),
      sortFn: "alphanumeric",
      // The accessor carries the movement and aliases so the filter can see
      // them; the group heading must not, or every heading would read "Lat
      // pulldown (Wide) Lat pulldown Lat pulldown wide". `getGroupingValue` is
      // the hook for exactly that split.
      getGroupingValue: (row) => row.exerciseName,
      cell: (info) => (
        <span className="truncate font-medium">
          {info.row.original.exerciseName}
        </span>
      ),
    },
  ),
  column.accessor("reps", {
    header: t("common.reps"),
    sortFn: "basic",
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  column.accessor("weight", {
    header: t("common.weight"),
    sortFn: "basic",
    // An unweighted set is a real record, it just carries no load — it sorts
    // to the end rather than pretending to be zero.
    sortUndefined: "last",
    cell: (info) => {
      const weight = info.getValue();
      return (
        <span className="tabular-nums">
          {weight === undefined
            ? t("common.bodyweight")
            : `${weight} ${info.row.original.unit}`}
        </span>
      );
    },
  }),
  column.accessor("performedAt", {
    header: t("records.columnSet"),
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
  // Which exercise's charts are open. Held here rather than one sheet per
  // group: with 113 exercises that would mount 113 live queries.
  const t = useT();
  const dateFormat = useDateFormat(DATE_OPTIONS);
  const columns = useMemo(() => buildColumns(t, dateFormat), [t, dateFormat]);

  const [detail, setDetail] = useState<
    { exerciseId: string; exerciseName: string } | undefined
  >(undefined);

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        globalFilterColumns={SEARCHABLE}
        grouping={GROUP_BY}
        // Every row under a heading is the same exercise, so the first one
        // carries the id the charts need.
        renderGroupAction={(groupRows, label) =>
          groupRows[0] ? (
            <ExerciseDetailTrigger
              exerciseName={label}
              onSelect={() =>
                setDetail({
                  exerciseId: groupRows[0].exerciseId,
                  exerciseName: groupRows[0].exerciseName,
                })
              }
            />
          ) : null
        }
        // The logged set's own id, so a row keeps its identity through a search
        // or a re-sort — the virtual list keys its measurements off it.
        getRowId={(row) => row.id}
        devtoolsKey="records"
        empty={
          search ? t("records.emptySearch", { search }) : t("records.empty")
        }
        // The exercise column keeps a slot but narrows to an indent: its value
        // is the heading above each run, and the column has to stay in the table
        // for the search to have something to match against.
        // The three fixed tracks were sized against a laptop-width card. On a
        // phone they add up to more than the card, leaving the date's `1fr`
        // about 29px for a 77px date — which, being right-aligned, then hangs
        // 48px back over the weight column. Narrowing them costs nothing on a
        // wide screen, where the date is right-aligned to the far edge either
        // way and the slack just moves into its track.
        virtual={{ gridTemplate: "1.75rem 4rem 6.5rem minmax(0, 1fr)" }}
      />

      <ExerciseDetailSheet
        // Keyed so switching exercises remounts the charts rather than
        // animating one series into another's shape.
        key={detail?.exerciseId ?? "none"}
        exerciseId={detail?.exerciseId}
        exerciseName={detail?.exerciseName ?? ""}
        open={detail !== undefined}
        onOpenChange={(open) => {
          if (!open) setDetail(undefined);
        }}
      />
    </>
  );
}
