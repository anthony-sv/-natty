/**
 * Downloads the reviewed matches from `match-exercise-media.ts`'s candidate
 * output, re-encodes them to WebP, and writes `src/data/exercises/media.ts`.
 *
 * The mapping below is **hand-reviewed**, not the raw top-scored candidate for
 * every exercise — a fair number of the highest-scoring candidates were wrong
 * (grip, stance, or posture mismatches that the word-overlap score can't see:
 * "reverse curl" scores high against "curl", "seated" against "standing"), and
 * a few correct matches only showed up as the 2nd or 3rd candidate. See the
 * commit this shipped in for the review notes. Run again after a review pass
 * on a future dataset update:
 *
 *   curl -s -o tools/.cache/free-exercise-db.json \
 *     https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
 *   node tools/apply-exercise-media.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const RAW_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const OUT_DIR = "public/exercises";
const FRAME_WIDTH = 600;

/**
 * `ourId -> sourceId`. Hand-reviewed against `tools/.cache/candidates.json`.
 * A `sourceId` shared by two of our ids (e.g. both dip variants pointing at
 * `Dip_Machine`) is deliberate where the underlying equipment is genuinely the
 * same photo-worthy setup, not a shortcut.
 */
const ACCEPTED = {
  "flat-barbell-bench-press": "Barbell_Bench_Press_-_Medium_Grip",
  "close-grip-bench-press": "Close-Grip_Barbell_Bench_Press",
  "flat-smith-bench-press": "Smith_Machine_Bench_Press",
  "incline-barbell-bench-press": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "incline-dumbbell-press": "Incline_Dumbbell_Press",
  "incline-dumbbell-neutral-press": "Hammer_Grip_Incline_DB_Bench_Press",
  "incline-smith-bench-press": "Smith_Machine_Incline_Bench_Press",
  "cable-crossover-mid": "Cable_Crossover",
  "machine-chest-dip": "Dip_Machine",
  "machine-triceps-dip": "Dip_Machine",
  "feet-elevated-push-up": "Push-Ups_With_Feet_Elevated",
  "standing-cable-chest-press": "Standing_Cable_Chest_Press",
  "flat-machine-chest-press": "Leverage_Chest_Press",
  "dumbbell-pullover": "Bent-Arm_Dumbbell_Pullover",

  "lat-pulldown-wide": "Wide-Grip_Lat_Pulldown",
  "lat-pulldown-close": "Close-Grip_Front_Lat_Pulldown",
  "cable-straight-arm-pulldown": "Straight-Arm_Pulldown",
  "rope-straight-arm-pulldown": "Rope_Straight-Arm_Pulldown",
  "t-bar-row-v-bar": "T-Bar_Row_with_Handle",
  "barbell-row-underhand": "Reverse_Grip_Bent-Over_Rows",
  "barbell-row-overhand": "Bent_Over_Barbell_Row",
  "single-arm-dumbbell-row": "One-Arm_Dumbbell_Row",
  "single-arm-dumbbell-high-row": "One-Arm_Dumbbell_Row",
  "incline-bench-dumbbell-row": "Dumbbell_Incline_Row",

  "seated-barbell-shoulder-press": "Barbell_Shoulder_Press",
  "dumbbell-shoulder-press": "Dumbbell_Shoulder_Press",
  "smith-shoulder-press": "Smith_Machine_Overhead_Shoulder_Press",
  "machine-shoulder-press-neutral": "Machine_Shoulder_Military_Press",
  "seated-dumbbell-lateral-raise": "Seated_Side_Lateral_Raise",
  "dumbbell-front-raise": "Front_Dumbbell_Raise",
  "dumbbell-front-raise-together": "Front_Dumbbell_Raise",
  "plate-front-raise": "Front_Plate_Raise",
  "incline-dumbbell-front-raise": "Front_Incline_Dumbbell_Raise",
  "seated-bent-over-rear-delt-raise": "Seated_Bent-Over_Rear_Delt_Raise",
  "reverse-fly-machine": "Reverse_Machine_Flyes",
  "cable-face-pull": "Face_Pull",
  "barbell-upright-row": "Upright_Barbell_Row",
  "barbell-shrug": "Barbell_Shrug",
  "dumbbell-shrug": "Dumbbell_Shrug",

  "standing-barbell-curl": "Barbell_Curl",
  "standing-ez-bar-curl": "EZ-Bar_Curl",
  "standing-dumbbell-curl": "Dumbbell_Bicep_Curl",
  "alternating-dumbbell-curl": "Dumbbell_Bicep_Curl",
  "standing-hammer-curl": "Hammer_Curls",
  "alternating-hammer-curl": "Alternate_Hammer_Curl",
  "rope-hammer-curl": "Cable_Hammer_Curls_-_Rope_Attachment",
  "machine-preacher-curl": "Machine_Preacher_Curls",
  "ez-bar-preacher-curl": "Preacher_Curl",

  "rope-pushdown": "Triceps_Pushdown_-_Rope_Attachment",
  "cable-pushdown": "Triceps_Pushdown",
  "straight-bar-pushdown": "Triceps_Pushdown",
  "reverse-grip-pushdown": "Reverse_Grip_Triceps_Pushdown",
  "single-arm-reverse-pushdown": "Reverse_Grip_Triceps_Pushdown",
  "rope-overhead-extension": "Cable_Rope_Overhead_Triceps_Extension",
  "dumbbell-kickback": "Tricep_Dumbbell_Kickback",
  "dumbbell-kickback-pinky-up": "Tricep_Dumbbell_Kickback",

  "back-squat": "Barbell_Squat",
  "front-squat": "Front_Barbell_Squat",
  "dumbbell-squat": "Dumbbell_Squat",
  "smith-machine-squat": "Smith_Machine_Squat",
  "hack-squat": "Hack_Squat",
  "hack-squat-narrow": "Narrow_Stance_Hack_Squats",
  "smith-bulgarian-split-squat": "Smith_Single-Leg_Split_Squat",
  "leg-press-45": "Leg_Press",
  "leg-extension": "Leg_Extensions",
  "lying-leg-curl": "Lying_Leg_Curls",
  "seated-leg-curl": "Seated_Leg_Curl",
  "standing-single-leg-curl": "Standing_Leg_Curl",
  "dumbbell-stiff-leg-deadlift": "Stiff-Legged_Dumbbell_Deadlift",
  "seated-calf-raise": "Seated_Calf_Raise",

  "barbell-hip-thrust": "Barbell_Hip_Thrust",
  "barbell-glute-bridge": "Barbell_Glute_Bridge",
  "cable-glute-kickback": "One-Legged_Cable_Kickback",
  "machine-hip-abduction": "Thigh_Abductor",
  "machine-hip-adduction": "Thigh_Adductor",

  "machine-ab-crunch": "Ab_Crunch_Machine",
  "decline-reverse-crunch": "Decline_Reverse_Crunch",
  "hanging-leg-raise": "Hanging_Leg_Raise",
};

const source = JSON.parse(readFileSync("tools/.cache/free-exercise-db.json", "utf8"));
const bySourceId = new Map(source.map((e) => [e.id, e]));

const media = {};
let fetched = 0;

for (const [ourId, sourceId] of Object.entries(ACCEPTED)) {
  const entry = bySourceId.get(sourceId);
  if (!entry || entry.images.length < 2) {
    console.error(`SKIP ${ourId}: ${sourceId} has no two images`);
    continue;
  }

  const dir = `${OUT_DIR}/${sourceId}`;
  mkdirSync(dir, { recursive: true });

  for (const frameIndex of [0, 1]) {
    const url = RAW_BASE + entry.images[frameIndex];
    const outPath = `${dir}/${frameIndex}.webp`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`FAIL ${url}: ${res.status}`);
      continue;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await sharp(buffer)
      .resize({ width: FRAME_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);
  }

  media[ourId] = { sourceId };
  fetched++;
  console.log(`OK   ${ourId.padEnd(38)} <- ${sourceId}`);
}

const mapLiteral = JSON.stringify(
  Object.fromEntries(
    Object.entries(media).map(([id, { sourceId }]) => [
      id,
      {
        sourceId,
        frames: [`/exercises/${sourceId}/0.webp`, `/exercises/${sourceId}/1.webp`],
      },
    ]),
  ),
  null,
  2,
);

const header = [
  "/**",
  " * Media for the exercises this maps, from `yuhonas/free-exercise-db`",
  " * (Unlicense) — self-hosted, re-encoded to WebP, under `public/exercises/`.",
  " *",
  " * **Hand-reviewed and committed, not matched at runtime.** A fuzzy match that",
  " * lands wrong shows a picture of a *different lift*, which is worse than no",
  " * picture at all. See `tools/apply-exercise-media.mjs` for the review notes",
  " * and how to regenerate this after a dataset update.",
  " *",
  " * Media only — no taxonomy from the source dataset is used here. An",
  " * exercise absent from this map simply renders no media.",
  " */",
].join("\n");

const mediaTs = `${header}
export const EXERCISE_MEDIA: Record<string, { sourceId: string; frames: [string, string] }> = ${mapLiteral};
`;

writeFileSync("src/data/exercises/media.ts", mediaTs);
console.log(`\nWrote src/data/exercises/media.ts — ${fetched}/${Object.keys(ACCEPTED).length} matched.`);
