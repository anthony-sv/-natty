import { createColumnHelper, tableFeatures } from "@tanstack/react-table";
import type { RowData } from "@tanstack/react-table";

/**
 * The feature set every `DataTable` runs with, shared so column definitions
 * are built against the same one — `createColumnHelper<typeof features, T>()`.
 * Declaring a second `tableFeatures({})` at a call site would typecheck today
 * and drift silently the moment a feature is registered here.
 *
 * Empty on purpose: these tables render an already-derived, already-ordered
 * result. Sorting or filtering means adding the matching `*Feature` plus its
 * row-model slot. In v9 features are opt-in and the core row model is
 * automatic — there is no `getCoreRowModel()`.
 *
 * Lives in `lib/` rather than beside the component so the component file
 * exports only components, which is what React Fast Refresh needs.
 */
export const features = tableFeatures({});

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
