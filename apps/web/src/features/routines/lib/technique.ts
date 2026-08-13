import type { SetModifiers } from "@/data/routines";

/**
 * The intensity techniques on a set, as things to *do*, in the order you do
 * them.
 *
 * `formatModifiers` already turns the same flags into badges, and badges were
 * all the player had: "Drop set" in small caps above a rep target, which names
 * the technique to someone who already knows it and says nothing at all to
 * someone reading it mid-set. The distinction that matters is that a modifier
 * is a fact about the prescription while this is an instruction — and the
 * instruction has an order, which is the part a row of badges actively
 * destroys.
 *
 * That order is the whole reason this is a list rather than a lookup. A set
 * marked both rest-pause and drop set is not two independent notes: you take it
 * to failure, rack it and breathe, get your extra reps, and *then* strip the
 * weight. Rendered as two badges it reads as a contradiction.
 */
export type TechniqueKey =
  | "ladder"
  | "negatives"
  | "staticHolds"
  | "forcedReps"
  | "restPause"
  | "partials"
  | "dropSet";

/**
 * Sorted by when it happens: the three that shape every rep of the set, then
 * the four that only begin once the set has failed, in the sequence you'd run
 * them — help first while the weight is still on you, then a pause, then
 * partials, and stripping the bar last because you can't go back.
 */
const ORDER: TechniqueKey[] = [
  "ladder",
  "negatives",
  "staticHolds",
  "forcedReps",
  "restPause",
  "partials",
  "dropSet",
];

export function techniquesFor(
  modifiers: SetModifiers | undefined,
): TechniqueKey[] {
  if (modifiers === undefined) return [];
  return ORDER.filter((key) =>
    key === "ladder" ? modifiers.ladder !== undefined : modifiers[key] === true,
  );
}

/**
 * Whether the set produces more than one entry worth logging.
 *
 * A drop set is two or three loads in one set and the log already accepts
 * several entries against one step — but nothing said so, so a drop got logged
 * as a single number that was true for a third of the reps.
 */
export function logsSeveralLoads(modifiers: SetModifiers | undefined): boolean {
  return modifiers?.dropSet === true;
}
