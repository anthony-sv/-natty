import {
  columnFilteringFeature,
  columnGroupingFeature,
  constructFilterFn,
  createExpandedRowModel,
  createFilteredRowModel,
  createGroupedRowModel,
  createSortedRowModel,
  createTableHook,
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
import { searchable, searchWords } from "@/lib/search";

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
 * The house search behaviour (`lib/search.ts`) as a table filter function.
 *
 * Built with `constructFilterFn` off the built-in rather than written from
 * scratch — that's the sanctioned way to vary one, and it keeps the auto-remove
 * behaviour that clears an emptied search box. The resolvers are where the
 * folding belongs: the table applies `resolveFilterValue` once per filter and
 * `resolveDataValue` once per row, so nothing re-splits the query per row.
 */
const filterFn_matchesAllWords = constructFilterFn({
  ...filterFn_includesString,
  filter: (dataValue: string, words: string[]) =>
    words.every((word) => dataValue.includes(word)),
  resolveFilterValue: (value: unknown) => searchWords(String(value ?? "")),
  resolveDataValue: (value: unknown) => searchable(String(value ?? "")),
  // Runs against whichever form the table hands it; both stringify to "" when
  // there's nothing to search for.
  autoRemove: (value: unknown) => String(value ?? "").trim() === "",
});

/**
 * The feature set every table in the app runs with.
 *
 * In v9 features are opt-in, each processing slot has to be registered
 * alongside the feature that owns it, and the core row model is automatic —
 * there is no `getCoreRowModel()`. Global filtering additionally requires
 * column filtering; registering it alone throws on the slot prerequisite, and
 * grouping needs expansion or a grouped table renders headings with nothing
 * under them.
 *
 * The `sortFns` registry is spelled out rather than imported wholesale so only
 * the three comparators the app's columns actually name get bundled. Anything
 * not registered here falls back to a basic comparator, `'auto'` included.
 *
 * No aggregation feature: group rows carry a heading and a count we render,
 * not a rolled-up value.
 */
const features = tableFeatures({
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
  filterFns: {
    includesString: filterFn_includesString,
    matchesAllWords: filterFn_matchesAllWords,
  },
  columnGroupingFeature,
  groupedRowModel: createGroupedRowModel(),
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  /**
   * Per-column display hints, scoped to this table factory.
   *
   * `columnMeta` is a type-only slot — `metaHelper` returns a phantom the table
   * strips at runtime and only the type survives. It's the v9 answer to what
   * would otherwise be a `declare module` augmentation, which would leak these
   * keys onto every table in the app rather than ours.
   */
  columnMeta: metaHelper<ColumnDisplayMeta>(),
});

/**
 * The app's table factory.
 *
 * `createTableHook` binds the feature set once so call sites stop restating it:
 * `createAppColumnHelper<Row>()` instead of
 * `createColumnHelper<typeof features, Row>()`, and `useAppTable` instead of
 * `useTable({ features, … })`. The library recommends a factory exactly when
 * several tables share real conventions, which is what `DataTable` and the two
 * tables built on it are.
 *
 * Created at module scope, never during render — a factory built per render
 * would hand back a new context and remount every table under it.
 */
export const { createAppColumnHelper, useAppTable } = createTableHook({
  features,
});

/**
 * Exactly what `createAppColumnHelper(...).columns([...])` hands back.
 *
 * Derived rather than spelled out because a table's columns are heterogeneous,
 * so the library types their value as `any` — deriving keeps that `any` inside
 * the library instead of in our own signature, where lint rightly rejects it.
 * Annotating the array instead would also discard each accessor's own value
 * type, which is the thing the helper exists to preserve.
 */
export type ColumnList<TData extends RowData> = ReturnType<
  ReturnType<typeof createAppColumnHelper<TData>>["columns"]
>;
