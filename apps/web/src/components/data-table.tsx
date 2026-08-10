import { useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { RowData } from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppTable, type ColumnDisplayMeta, type ColumnList } from "@/lib/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n/use-t";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Placeholder rows shown while a table's data is still loading. */
const SKELETON_ROWS = 5;

/** How many real records sit under a group row, at any depth. */
function countLeafRows(rows: { subRows: unknown[] }[]): number {
  return rows.reduce(
    (count, row) =>
      count +
      (row.subRows.length
        ? countLeafRows(row.subRows as { subRows: unknown[] }[])
        : 1),
    0,
  );
}

/** The caller's own rows from under a group heading, at any depth. */
function leafOriginals<TData>(
  rows: { subRows: unknown[]; original: TData }[],
): TData[] {
  return rows.flatMap((row) =>
    row.subRows.length
      ? leafOriginals(row.subRows as { subRows: unknown[]; original: TData }[])
      : [row.original],
  );
}

interface VirtualOptions {
  /**
   * `grid-template-columns` for the header and every row.
   *
   * Virtual rows are absolutely positioned, so the table layout algorithm
   * can't size the columns. The shared template is what keeps header and body
   * aligned, which is why it's required rather than inferred.
   */
  gridTemplate: string;
  /** Starting row height in px; rows are measured once mounted. */
  estimateRowHeight?: number;
  /** Height of the scroll area in px. */
  height?: number;
}

/**
 * A shadcn-styled table driven by TanStack Table.
 *
 * Lives here rather than in `components/ui/` because that directory is
 * vendored from the shadcn registry and shouldn't be hand-edited — and shadcn
 * publishes no `data-table` component, only a docs recipe, so this is that
 * recipe built against the primitives in `ui/table.tsx`.
 *
 * Sorting and filtering come from the feature set in `lib/table.ts`. Sorting
 * is table-owned, so every column with an accessor gets a clickable header;
 * the global filter is caller-owned, and since the table never writes it there
 * is no change handler to pair with the value.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  empty,
  isLoading = false,
  globalFilter,
  globalFilterColumns,
  grouping,
  renderGroupAction,
  getRowId,
  devtoolsKey,
  virtual,
}: {
  columns: ColumnList<TData>;
  data: TData[];
  /** Shown in place of rows when there are none. */
  empty?: React.ReactNode;
  /** Renders placeholder rows instead of rows or the empty state. */
  isLoading?: boolean;
  /** Word-wise, punctuation-insensitive match across the searchable columns. */
  globalFilter?: string;
  /**
   * Which column ids the global filter searches. Worth setting: by default
   * every string *or number* column participates, so searching "8" matches
   * rep counts and dates as well as names.
   */
  globalFilterColumns?: readonly string[];
  /**
   * Column ids to group rows under, as a starting state — the table owns it
   * from there. Group rows start expanded, so grouping reads as headings over
   * the same list rather than as hiding everything behind a click.
   */
  grouping?: readonly string[];
  /**
   * A control for the end of each group heading, given that group's own rows
   * and its heading text.
   *
   * The heading is already a button that toggles expansion, so anything else
   * belongs beside it rather than folded into it. Handing back `TData` keeps
   * the table's own row type out of the caller's signature.
   */
  renderGroupAction?: (rows: TData[], groupLabel: string) => React.ReactNode;
  /**
   * A stable id per row. Without it rows are keyed by position, so filtering
   * or sorting hands the same key to a different record — which the virtual
   * list then reuses a measurement for.
   */
  getRowId?: (row: TData, index: number) => string;
  /** Names this table in the devtools panel, which lists every live one. */
  devtoolsKey?: string;
  /** Renders only the visible rows. For lists that can grow without bound. */
  virtual?: VirtualOptions;
}) {
  // `useAppTable`, not `useTable`: the factory in `lib/table.ts` already binds
  // the feature set, so it isn't restated at every table.
  const t = useT();
  const table = useAppTable({
    columns,
    data,
    key: devtoolsKey,
    getRowId,
    state: { globalFilter },
    initialState: { grouping: [...(grouping ?? [])], expanded: true },
    // Word-wise and punctuation-insensitive, so "bench incline" and "pec-deck"
    // both land — see `lib/table.ts`.
    globalFilterFn: "matchesAllWords",
    getColumnCanGlobalFilter: (column) =>
      globalFilterColumns === undefined ||
      globalFilterColumns.includes(column.id),
  });
  // Registration is per instance, which is what makes the panel work on a page
  // holding several tables: each one registers under its own `key` and the
  // panel lists them. `enabled` keeps unkeyed tables out of it.
  useTanStackTableDevtools(table, { enabled: devtoolsKey !== undefined });

  const rows = table.getRowModel().rows;
  // Read off the column def rather than a prop: `columnMeta` is the v9 slot
  // for exactly this, and it keeps alignment next to the cell it aligns.
  const isAlignedEnd = (column: { columnDef: { meta?: ColumnDisplayMeta } }) =>
    column.columnDef.meta?.align === "end";
  const columnCount = table.getHeaderGroups()[0]?.headers.length ?? columns.length;

  /**
   * A group's heading row: one full-width cell with a disclosure control, and
   * optionally a caller's own control at the end.
   *
   * The heading's own button already owns expansion, so a second action can't
   * be folded into it — `renderGroupAction` sits beside it rather than inside.
   *
   * The count comes from walking `subRows`, not from the render model — that
   * model interleaves group rows with expanded leaves, so filtering it would
   * count the wrong things.
   */
  function renderGroupCells(row: (typeof rows)[number]): React.ReactNode {
    const columnId = row.groupingColumnId;
    const value = columnId === undefined ? "" : row.getGroupingValue(columnId);
    const count = countLeafRows(row.subRows);
    return (
      <TableCell
        colSpan={columnCount}
        className="flex items-center gap-2 bg-muted/40"
        style={virtual ? { gridColumn: "1 / -1" } : undefined}
      >
        <button
          type="button"
          onClick={row.getToggleExpandedHandler()}
          aria-expanded={row.getIsExpanded()}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {row.getIsExpanded() ? (
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate font-medium">{String(value)}</span>
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {t.plural("records.count", count)}
          </span>
        </button>
        {renderGroupAction?.(
          // The originals, not the table's rows — the caller wants its own data
          // back, not a handle on the table's internals.
          leafOriginals(row.subRows),
          String(value),
        )}
      </TableCell>
    );
  }

  const rowStyle = virtual
    ? { gridTemplateColumns: virtual.gridTemplate }
    : undefined;

  const header = (
    // Sticky only matters when virtualized, where the body scrolls under it;
    // `bg-card` because a transparent header would show rows through it.
    <TableHeader className={virtual ? "sticky top-0 z-10 bg-card" : undefined}>
      {table.getHeaderGroups().map((group) => (
        <TableRow
          key={group.id}
          className={virtual ? "grid" : undefined}
          style={rowStyle}
        >
          {group.headers.map((header) => (
            <TableHead
              key={header.id}
              className={cn(
                virtual && "flex items-center",
                isAlignedEnd(header.column) && "justify-end text-right",
              )}
            >
              {/* A grouped column's header is redundant — its values are the
                  headings running down the table — and its slot is narrowed to
                  an indent, too narrow for a label anyway. */}
              {header.isPlaceholder || header.column.getIsGrouped() ? null : header.column.getCanSort() ? (
                <button
                  type="button"
                  onClick={header.column.getToggleSortingHandler()}
                  className="-mx-1 flex items-center gap-1 rounded-sm px-1 py-0.5 hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <table.FlexRender header={header} />
                  {/* Neutral state still shows an arrow, so a column reads as
                      sortable before you touch it. */}
                  {header.column.getIsSorted() === "asc" ? (
                    <ArrowUpIcon className="size-3.5" />
                  ) : header.column.getIsSorted() === "desc" ? (
                    <ArrowDownIcon className="size-3.5" />
                  ) : (
                    <ChevronsUpDownIcon className="size-3.5 text-muted-foreground/60" />
                  )}
                </button>
              ) : (
                <table.FlexRender header={header} />
              )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );

  if (isLoading || rows.length === 0) {
    return (
      <Table>
        {header}
        <TableBody>
          {isLoading ? (
            Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <TableRow key={index}>
                {Array.from({ length: columnCount }, (_, columnIndex) => (
                  <TableCell key={columnIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="h-20 text-center text-muted-foreground"
              >
                {empty ?? "Nothing here yet."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  if (virtual) {
    return (
      <VirtualTable
        header={header}
        count={rows.length}
        getRowKey={(index) => rows[index]!.id}
        renderCells={(index) => {
          const row = rows[index]!;
          if (row.getIsGrouped()) return renderGroupCells(row);
          return row.getAllCells().map((cell) => (
            <TableCell
              key={cell.id}
              className={cn(
                "flex items-center",
                isAlignedEnd(cell.column) && "justify-end text-right",
              )}
            >
              {/* A placeholder is a leaf row's cell for the grouped column:
                  the value is in the heading above, so the slot is just the
                  indent that shows the row belongs to it. */}
              {cell.getIsPlaceholder() ? null : <table.FlexRender cell={cell} />}
            </TableCell>
          ));
        }}
        options={virtual}
      />
    );
  }

  return (
    <Table>
      {header}
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {row.getIsGrouped()
              ? renderGroupCells(row)
              : // getAllCells, not getVisibleCells — visibility is a feature
                // and this table doesn't register it.
                row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(isAlignedEnd(cell.column) && "text-right")}
                  >
                    {cell.getIsPlaceholder() ? null : (
                      <table.FlexRender cell={cell} />
                    )}
                  </TableCell>
                ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * A table whose body is a spacer sized to the whole list, with only the
 * visible rows positioned inside it.
 *
 * Split out of `DataTable` so only this component loses React Compiler
 * memoization — `useVirtualizer` returns functions the compiler can't memoize
 * safely, and it skips any component that calls one.
 *
 * It takes a row count and two callbacks rather than the table, which keeps it
 * clear of the table's generics and makes the boundary obvious: it decides
 * *which* rows are on screen, the caller decides what a row contains.
 */
function VirtualTable({
  header,
  count,
  getRowKey,
  renderCells,
  options,
}: {
  header: React.ReactNode;
  count: number;
  getRowKey: (index: number) => string;
  renderCells: (index: number) => React.ReactNode;
  options: VirtualOptions;
}) {
  // Held in state, not a ref: the virtualizer attaches its scroll listener
  // when this value changes from null to the element, and a ref alone gives it
  // no render to notice that in.
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const { gridTemplate, estimateRowHeight = 41, height = 460 } = options;

  // eslint-disable-next-line react-hooks/incompatible-library -- the reason this component exists; see above
  const virtualizer = useVirtualizer({
    // Counted off the row model rather than the raw data, so filtering and
    // sorting are already applied.
    count,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateRowHeight,
    getItemKey: getRowKey,
    overscan: 8,
  });

  return (
    <div
      // `ui/table.tsx` already wraps every table in an `overflow-x-auto`
      // container, and adding a second scroll container would break the sticky
      // header — that inner one, not ours, would be the scrollport. So the
      // height goes *on* the vendored container, reached by attribute from
      // outside since it accepts no class of its own.
      ref={(node) =>
        setScrollElement(
          node?.querySelector<HTMLElement>('[data-slot="table-container"]') ??
            null,
        )
      }
      className="[&>[data-slot=table-container]]:h-(--virtual-height) [&>[data-slot=table-container]]:overflow-y-auto"
      style={{ "--virtual-height": `${height}px` } as React.CSSProperties}
    >
      <Table>
        {header}
        <TableBody
          className="relative grid"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => (
            <TableRow
              key={getRowKey(item.index)}
              // Both are needed for dynamic measurement: the index tells the
              // virtualizer which row it just measured, and the key keeps that
              // measurement attached to the right one.
              data-index={item.index}
              ref={virtualizer.measureElement}
              className="absolute grid w-full items-center"
              style={{
                transform: `translateY(${item.start}px)`,
                gridTemplateColumns: gridTemplate,
              }}
            >
              {renderCells(item.index)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
