import { normalizeName } from "@/data/normalize";

/**
 * How every search box in the app matches text.
 *
 * A contiguous substring match — which is what both the table's built-in
 * `includesString` and the Combobox's default do — fails the two things people
 * actually type. "bench incline" finds nothing in "Incline barbell bench
 * press", because the words are the other way round; "pec-deck" finds nothing
 * in "Pec deck open", because of a hyphen. Splitting the query into words and
 * requiring each one somewhere in the value fixes both.
 *
 * Folding runs through `normalizeName`, the same function the exercise library
 * resolves names with, so the search box and the data agree on what counts as
 * the same spelling.
 */

/** The query, folded and split. An empty query yields no words, matching all. */
export function searchWords(query: string): string[] {
  return normalizeName(query).split(" ").filter(Boolean);
}

/** Folded once; pair with `searchWords` when matching many rows against one query. */
export function searchable(value: string): string {
  return normalizeName(value);
}

/** Does every word of `query` appear somewhere in `haystack`? */
export function matchesAllWords(haystack: string, query: string): boolean {
  const folded = searchable(haystack);
  return searchWords(query).every((word) => folded.includes(word));
}
