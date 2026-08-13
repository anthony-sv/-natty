import {
  createCollection,
  localStorageCollectionOptions,
  useLiveQuery,
} from "@tanstack/react-db";
import { useMemo } from "react";
import { forkCollection } from "@/lib/synced-collection";
import {
  deleteMeasurements,
  fetchMeasurements,
  upsertMeasurements,
} from "@/server/measurements";
import {
  measurementSchema,
  type Measurement,
  type MeasurementInput,
} from "./schema";

/**
 * Every girth you've measured, persisted to localStorage.
 *
 * Its own collection rather than a field on a weigh-in: `bodyEntrySchema`
 * requires a weight, so folding measurements in would mean inventing a
 * weigh-in every time you only wanted to put a tape round your arm. They also
 * arrive on different schedules — the scale is daily, a tape is monthly.
 */
const localMeasurements = createCollection(
  localStorageCollectionOptions({
    storageKey: "natty.measurements.v1",
    getKey: (row) => row.id,
    schema: measurementSchema,
  }),
);

export const measurementsFork = forkCollection({
  queryKey: "measurements",
  local: localMeasurements,
  getKey: (row) => row.id,
  fetch: () => fetchMeasurements(),
  upsert: (rows) => upsertMeasurements({ data: rows }),
  remove: (ids) => deleteMeasurements({ data: ids }),
});

/** Whichever collection backs the app right now — see `forkCollection`. */
export const measurements = () => measurementsFork.active();

/** Record one girth. Returns the row and its transaction, as `logSet` does. */
export function logMeasurement(input: MeasurementInput) {
  const row = { ...input, id: crypto.randomUUID() };
  const transaction = measurements().insert(row);
  return { row, transaction };
}

export function updateMeasurement(
  id: string,
  patch: Partial<MeasurementInput>,
): void {
  measurements().update(id, (draft) => Object.assign(draft, patch));
}

/**
 * Remove one, handing back the row so a toast can offer Undo.
 *
 * Same shape as `deleteSet`: small, frequent and fully reversible, so a
 * confirm dialog would buy nothing an undo doesn't.
 */
export function deleteMeasurement(id: string): Measurement | undefined {
  const row = measurements().get(id);
  if (row !== undefined) measurements().delete(id);
  return row;
}

export function restoreMeasurement(row: Measurement): void {
  measurements().insert(row);
}

/** Every measurement, most recent first. */
export function useMeasurements(): {
  rows: Measurement[];
  isLoading: boolean;
} {
  const collection = measurementsFork.useActive();
  // Ordered in the query rather than by a JS sort afterwards — `orderBy` is
  // incrementally maintained, the house rule everywhere in this codebase.
  const { data, isLoading } = useLiveQuery(
    (q) =>
      q.from({ row: collection }).orderBy(({ row }) => row.measuredAt, "desc"),
    [collection],
  );

  return { rows: useMemo(() => data ?? [], [data]), isLoading };
}
