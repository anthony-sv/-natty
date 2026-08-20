/**
 * Scores our 113(ish) curated exercises against `yuhonas/free-exercise-db`
 * (Unlicense) and emits ranked candidates for a human review pass — see the
 * plan's note on why this is candidates, not an auto-applied mapping: a
 * confident-looking fuzzy match that lands wrong shows a picture of a
 * *different lift*, worse than showing nothing.
 *
 *   node tools/.cache/free-exercise-db.json must exist — fetch it first:
 *     curl -s -o tools/.cache/free-exercise-db.json \
 *       https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
 *
 *   npx tsx tools/match-exercise-media.ts > tools/.cache/candidates.json
 *
 * Equipment is a disambiguator, not just the name: our `facets.implement`
 * lines up closely with their `equipment` field, so a candidate whose
 * equipment contradicts ours is demoted — that's what keeps "Db incline
 * press" off a barbell photo.
 */
import { readFileSync } from "node:fs";
import { exercises } from "../src/data/exercises";
import { normalizeName } from "../src/data/normalize";

interface SourceExercise {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  images: string[];
}

const source: SourceExercise[] = JSON.parse(
  readFileSync("tools/.cache/free-exercise-db.json", "utf8"),
);

/** Our `facets.implement` values mapped to the dataset's `equipment` strings. */
const EQUIPMENT_MAP: Record<string, string[]> = {
  barbell: ["barbell"],
  dumbbell: ["dumbbell"],
  cable: ["cable"],
  machine: ["machine", "leverage machine"],
  smith: ["machine", "leverage machine"],
  "ez-bar": ["barbell", "e-z curl bar"],
  "t-bar": ["machine", "leverage machine", "barbell"],
  plate: ["other"],
  bodyweight: ["body only", "bands"],
};

function tokens(name: string): Set<string> {
  return new Set(normalizeName(name).split(" ").filter(Boolean));
}

/** Jaccard overlap of word sets — order-independent, punctuation-blind. */
function overlap(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const word of a) if (b.has(word)) shared++;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

interface Candidate {
  sourceId: string;
  sourceName: string;
  score: number;
  equipmentMatch: boolean;
  hasImages: boolean;
}

interface ReviewRow {
  ourId: string;
  ourName: string;
  ourAliases: string[];
  ourImplement: string | undefined;
  candidates: Candidate[];
}

const rows: ReviewRow[] = exercises.map((exercise) => {
  const ourNames = [exercise.name, ...exercise.aliases];
  const ourTokenSets = ourNames.map(tokens);
  const allowedEquipment = exercise.facets.implement
    ? (EQUIPMENT_MAP[exercise.facets.implement] ?? [])
    : undefined;

  const candidates: Candidate[] = source
    .map((candidate) => {
      const candidateTokens = tokens(candidate.name);
      const bestNameScore = Math.max(
        ...ourTokenSets.map((t) => overlap(t, candidateTokens)),
      );
      const equipmentMatch =
        allowedEquipment === undefined ||
        allowedEquipment.length === 0 ||
        (candidate.equipment !== null &&
          allowedEquipment.includes(candidate.equipment));

      const score = bestNameScore * (equipmentMatch ? 1 : 0.4);

      return {
        sourceId: candidate.id,
        sourceName: candidate.name,
        score,
        equipmentMatch,
        hasImages: candidate.images.length >= 2,
      };
    })
    .filter((c) => c.score > 0.15 && c.hasImages)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    ourId: exercise.id,
    ourName: exercise.name,
    ourAliases: exercise.aliases,
    ourImplement: exercise.facets.implement,
    candidates,
  };
});

console.log(JSON.stringify(rows, null, 1));
