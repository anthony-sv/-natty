import type { IntakeEntry } from "@/features/intake/schema";
import type { Supplement } from "./schema";

/**
 * A day's supplement checklist.
 *
 * Pure and injected like `pr.ts`, `volume.ts` and `intake.ts` — the stack and
 * the entries come in, nothing is imported from a collection or from React.
 */

export interface SupplementRow {
  supplement: Supplement;
  /** The entry that ticked it, so the row can untick and offer an undo. */
  entryId: string | undefined;
  taken: boolean;
}

export interface SupplementDay {
  rows: SupplementRow[];
  taken: number;
  /** Rows on the list today. Archived ones you didn't take are not on it. */
  total: number;
  /**
   * You ticked something that is no longer in the stack — archived, or deleted
   * outright before it had history.
   *
   * Counted rather than listed: the row would have no name to show, and the
   * point of surfacing it at all is that a day's count reconciles.
   */
  orphaned: number;
}

/** Which supplement ids are ticked on this local day. */
export function takenOn(
  entries: IntakeEntry[],
  day: number,
): Map<string, string> {
  const taken = new Map<string, string>();
  for (const entry of entries) {
    if (entry.day !== day) continue;
    if (entry.source.kind !== "supplement") continue;
    // First tick wins, so a duplicate row (two devices, one day) unticks to
    // the one the list is showing rather than leaving a ghost behind.
    if (!taken.has(entry.source.supplementId)) {
      taken.set(entry.source.supplementId, entry.id);
    }
  }
  return taken;
}

/**
 * The checklist for one day.
 *
 * **An archived supplement stays on the day you took it** and drops off the
 * ones you didn't, which is the whole reason archiving exists rather than
 * deleting: stopping a supplement today must not rewrite the three months you
 * were taking it.
 *
 * Sorted by name, in the reader's locale — `localeCompare` with no locale
 * sorts an alphabetical English list into something that isn't alphabetical in
 * Spanish.
 */
export function supplementDay(
  stack: Supplement[],
  entries: IntakeEntry[],
  day: number,
  locale: string,
): SupplementDay {
  const taken = takenOn(entries, day);
  const rows = stack
    .filter(
      (supplement) =>
        supplement.archivedAt === undefined || taken.has(supplement.id),
    )
    .map((supplement): SupplementRow => {
      const entryId = taken.get(supplement.id);
      return { supplement, entryId, taken: entryId !== undefined };
    })
    .sort((a, b) =>
      a.supplement.name.localeCompare(b.supplement.name, locale),
    );

  const known = new Set(stack.map((supplement) => supplement.id));

  return {
    rows,
    taken: rows.filter((row) => row.taken).length,
    total: rows.length,
    orphaned: [...taken.keys()].filter((id) => !known.has(id)).length,
  };
}

/** Whether anything was ever ticked against this one — archive if so. */
export function hasHistory(entries: IntakeEntry[], id: string): boolean {
  return entries.some(
    (entry) =>
      entry.source.kind === "supplement" && entry.source.supplementId === id,
  );
}
