import {
  columnFilteringFeature,
  columnGroupingFeature,
  createColumnHelper,
  createExpandedRowModel,
  createFilteredRowModel,
  createGroupedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowExpandingFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  tableFeatures,
} from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";

/**
 * The feature set every `DataTable` runs with, shared so column definitions
 * are built against the same one — `createColumnHelper<typeof features, T>()`.
 * Declaring a second `tableFeatures({})` at a call site would typecheck today
 * and drift silently the moment a feature is registered here.
 *
 * In v9 features are opt-in, each processing slot has to be registered
 * alongside the feature that owns it, and the core row model is automatic —
 * there is no `getCoreRowModel()`. Global filtering additionally requires
 * column filtering; registering it alone throws on the slot prerequisite.
 *
 * The `sortFns` registry is spelled out rather than imported wholesale so only
 * the three comparators the app's columns actually name get bundled. Anything
 * not registered here falls back to a basic comparator, `'auto'` included.
 *
 * Grouping needs expansion registered alongside it: without the expanded row
 * model a grouped table renders group rows and nothing under them. No
 * aggregation feature — group rows here carry a heading and a count we render
 * ourselves, not a rolled-up value, and registering it would pull every
 * aggregation function in.
 *
 * Lives in `lib/` rather than beside the component so the component file
 * exports only components, which is what React Fast Refresh needs.
 */
export const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  /**
   * Per-column display hints, scoped to this table factory.
   *
   * `columnMeta` is a type-only slot — `metaHelper` returns a phantom the
   * table strips at runtime and only the type survives. It's the v9 answer to
   * what would otherwise be a `declare module` augmentation, which would leak
   * these keys onto every table in the app rather than ours.
   */
  columnMeta: metaHelper<ColumnDisplayMeta>(),
});

export interface ColumnDisplayMeta {
  /**
   * Pushes a column's header *and* cells to the end of their slot.
   *
   * Alignment belongs on the column definition, next to the header and cell
   * that render it — not restated as a list of ids at the call site.
   */
  align?: "end";
}

/**
 * Exactly what `createColumnHelper(...).columns([...])` hands back.
 *
 * Derived rather than spelled out because a table's columns are heterogeneous,
 * so the library types their value as `any` — deriving keeps that `any` inside
 * the library instead of in our own signature, where lint rightly rejects it.
 */
export type ColumnList<TData extends RowData> = ReturnType<
  ReturnType<typeof createColumnHelper<typeof features, TData>>["columns"]
>;
