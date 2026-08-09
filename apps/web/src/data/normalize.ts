/**
 * Fold a written name to a match key, for any of the small controlled
 * vocabularies transcribed out of `gym-docs/` — exercises, poses.
 *
 * Case and punctuation carry no meaning in these names: "Lat pulldown (Wide
 * grip)", "Lat pulldown wide grip" and "LAT PULLDOWN - WIDE GRIP" are one
 * thing, as are "Quad flex" and "quad flex". Word order and pluralisation *are*
 * significant, so they're left alone and handled by listing the real spellings
 * as aliases; stemming here would silently merge things like "raise"/"raised"
 * and "side tricep"/"side triceps" that deserve a look first.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
