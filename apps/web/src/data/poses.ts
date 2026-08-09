import { z } from "zod";
import { normalizeName } from "./normalize";

/**
 * The posing/flex cues the source docs attach to finisher sets.
 *
 * A closed set — these are the classic mandatory bodybuilding poses, and there
 * is no more of them to discover, which is why this is one flat file rather
 * than a directory like `data/exercises/`. Same alias mechanic though: the docs
 * spell several of them more than one way, and `aliases` collapses those.
 */
export const poseSchema = z.object({
  id: z.string(),
  /** Curated display name. Also matched as an alias — don't repeat it below. */
  name: z.string(),
  /** Other spellings seen in `gym-docs/`. Matched case/punctuation-insensitively. */
  aliases: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type Pose = z.infer<typeof poseSchema>;

const raw: z.input<typeof poseSchema>[] = [
  { id: "most-muscular", name: "Most muscular" },
  {
    id: "front-double-biceps",
    name: "Front double biceps",
  },
  {
    id: "back-double-biceps",
    name: "Back double biceps",
    aliases: ["double biceps"],
    notes:
      'Bare "double biceps" resolves here, not to the front pose: the source writes the same low-cable-curl finisher as "Back double biceps" in one week and "double biceps" in another. Known in competition as the rear double biceps.',
  },
  { id: "front-lat-spread", name: "Front lat spread" },
  { id: "rear-lat-spread", name: "Rear lat spread" },
  { id: "side-chest", name: "Side chest" },
  {
    id: "side-triceps",
    name: "Side triceps",
    aliases: ["side tricep"],
    notes:
      'The source always writes the singular "side tricep"; the display name uses the conventional plural.',
  },
  {
    id: "quad-flex",
    name: "Quad flex",
    aliases: ["quad"],
    notes:
      'Bare "quad" is the same pose: the source writes hack squat, lying leg curls and seated calf raise finishers as "Quad flex" in some weeks and "quad" in others.',
  },
];

export const poses: Pose[] = raw.map((p) => poseSchema.parse(p));

const posesById = new Map<string, Pose>();
const posesByName = new Map<string, Pose>();

for (const pose of poses) {
  if (posesById.has(pose.id)) throw new Error(`Duplicate pose id: ${pose.id}`);
  posesById.set(pose.id, pose);
  for (const spelling of [pose.name, ...pose.aliases]) {
    const key = normalizeName(spelling);
    const claimed = posesByName.get(key);
    if (claimed && claimed.id !== pose.id) {
      throw new Error(
        `Pose "${spelling}" is claimed by both "${claimed.id}" and "${pose.id}"`,
      );
    }
    posesByName.set(key, pose);
  }
}

export function getPose(id: string): Pose | undefined {
  return posesById.get(id);
}

export function resolvePoseName(name: string): Pose | undefined {
  return posesByName.get(normalizeName(name));
}
