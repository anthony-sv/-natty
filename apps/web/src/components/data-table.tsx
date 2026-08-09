import { useTable, type RowData } from "@tanstack/react-table";
import { features, type ColumnList } from "@/lib/table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * A shadcn-styled table driven by TanStack Table.
 *
 * Lives here rather than in `components/ui/` because that directory is
 * vendored from the shadcn registry and shouldn't be hand-edited — and shadcn
 * publishes no `data-table` component, only a docs recipe, so this is that
 * recipe built against the primitives in `ui/table.tsx`.
 *
 * No features are registered: these tables display a derived, already-ordered
 * result. Sorting or filtering means adding the matching `*Feature` plus its
 * row-model slot to `tableFeatures()` — in v9 those are opt-in, and the core
 * row model is automatic (there is no `getCoreRowModel()` any more).
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  empty,
}: {
  columns: ColumnList<TData>;
  data: TData[];
  /** Shown in place of rows when there are none. */
  empty?: React.ReactNode;
}) {
  const table = useTable({ features, columns, data });
  const rows = table.getRowModel().rows;

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-20 text-center text-muted-foreground"
            >
              {empty ?? "Nothing here yet."}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              {/* getAllCells, not getVisibleCells — visibility is a feature and
                  this table doesn't register it. */}
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
