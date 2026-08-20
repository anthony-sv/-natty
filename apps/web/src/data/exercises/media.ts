/**
 * Media for the exercises this maps, from `yuhonas/free-exercise-db`
 * (Unlicense) — self-hosted, re-encoded to WebP, under `public/exercises/`.
 *
 * **Hand-reviewed and committed, not matched at runtime.** A fuzzy match that
 * lands wrong shows a picture of a *different lift*, which is worse than no
 * picture at all. See `tools/apply-exercise-media.mjs` for the review notes
 * and how to regenerate this after a dataset update.
 *
 * Media only — no taxonomy from the source dataset is used here. An
 * exercise absent from this map simply renders no media.
 */
export const EXERCISE_MEDIA: Record<string, { sourceId: string; frames: [string, string] }> = {
  "flat-barbell-bench-press": {
    "sourceId": "Barbell_Bench_Press_-_Medium_Grip",
    "frames": [
      "/exercises/Barbell_Bench_Press_-_Medium_Grip/0.webp",
      "/exercises/Barbell_Bench_Press_-_Medium_Grip/1.webp"
    ]
  },
  "close-grip-bench-press": {
    "sourceId": "Close-Grip_Barbell_Bench_Press",
    "frames": [
      "/exercises/Close-Grip_Barbell_Bench_Press/0.webp",
      "/exercises/Close-Grip_Barbell_Bench_Press/1.webp"
    ]
  },
  "flat-smith-bench-press": {
    "sourceId": "Smith_Machine_Bench_Press",
    "frames": [
      "/exercises/Smith_Machine_Bench_Press/0.webp",
      "/exercises/Smith_Machine_Bench_Press/1.webp"
    ]
  },
  "incline-barbell-bench-press": {
    "sourceId": "Barbell_Incline_Bench_Press_-_Medium_Grip",
    "frames": [
      "/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.webp",
      "/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/1.webp"
    ]
  },
  "incline-dumbbell-press": {
    "sourceId": "Incline_Dumbbell_Press",
    "frames": [
      "/exercises/Incline_Dumbbell_Press/0.webp",
      "/exercises/Incline_Dumbbell_Press/1.webp"
    ]
  },
  "incline-dumbbell-neutral-press": {
    "sourceId": "Hammer_Grip_Incline_DB_Bench_Press",
    "frames": [
      "/exercises/Hammer_Grip_Incline_DB_Bench_Press/0.webp",
      "/exercises/Hammer_Grip_Incline_DB_Bench_Press/1.webp"
    ]
  },
  "incline-smith-bench-press": {
    "sourceId": "Smith_Machine_Incline_Bench_Press",
    "frames": [
      "/exercises/Smith_Machine_Incline_Bench_Press/0.webp",
      "/exercises/Smith_Machine_Incline_Bench_Press/1.webp"
    ]
  },
  "cable-crossover-mid": {
    "sourceId": "Cable_Crossover",
    "frames": [
      "/exercises/Cable_Crossover/0.webp",
      "/exercises/Cable_Crossover/1.webp"
    ]
  },
  "machine-chest-dip": {
    "sourceId": "Dip_Machine",
    "frames": [
      "/exercises/Dip_Machine/0.webp",
      "/exercises/Dip_Machine/1.webp"
    ]
  },
  "machine-triceps-dip": {
    "sourceId": "Dip_Machine",
    "frames": [
      "/exercises/Dip_Machine/0.webp",
      "/exercises/Dip_Machine/1.webp"
    ]
  },
  "feet-elevated-push-up": {
    "sourceId": "Push-Ups_With_Feet_Elevated",
    "frames": [
      "/exercises/Push-Ups_With_Feet_Elevated/0.webp",
      "/exercises/Push-Ups_With_Feet_Elevated/1.webp"
    ]
  },
  "standing-cable-chest-press": {
    "sourceId": "Standing_Cable_Chest_Press",
    "frames": [
      "/exercises/Standing_Cable_Chest_Press/0.webp",
      "/exercises/Standing_Cable_Chest_Press/1.webp"
    ]
  },
  "flat-machine-chest-press": {
    "sourceId": "Leverage_Chest_Press",
    "frames": [
      "/exercises/Leverage_Chest_Press/0.webp",
      "/exercises/Leverage_Chest_Press/1.webp"
    ]
  },
  "dumbbell-pullover": {
    "sourceId": "Bent-Arm_Dumbbell_Pullover",
    "frames": [
      "/exercises/Bent-Arm_Dumbbell_Pullover/0.webp",
      "/exercises/Bent-Arm_Dumbbell_Pullover/1.webp"
    ]
  },
  "lat-pulldown-wide": {
    "sourceId": "Wide-Grip_Lat_Pulldown",
    "frames": [
      "/exercises/Wide-Grip_Lat_Pulldown/0.webp",
      "/exercises/Wide-Grip_Lat_Pulldown/1.webp"
    ]
  },
  "lat-pulldown-close": {
    "sourceId": "Close-Grip_Front_Lat_Pulldown",
    "frames": [
      "/exercises/Close-Grip_Front_Lat_Pulldown/0.webp",
      "/exercises/Close-Grip_Front_Lat_Pulldown/1.webp"
    ]
  },
  "cable-straight-arm-pulldown": {
    "sourceId": "Straight-Arm_Pulldown",
    "frames": [
      "/exercises/Straight-Arm_Pulldown/0.webp",
      "/exercises/Straight-Arm_Pulldown/1.webp"
    ]
  },
  "rope-straight-arm-pulldown": {
    "sourceId": "Rope_Straight-Arm_Pulldown",
    "frames": [
      "/exercises/Rope_Straight-Arm_Pulldown/0.webp",
      "/exercises/Rope_Straight-Arm_Pulldown/1.webp"
    ]
  },
  "t-bar-row-v-bar": {
    "sourceId": "T-Bar_Row_with_Handle",
    "frames": [
      "/exercises/T-Bar_Row_with_Handle/0.webp",
      "/exercises/T-Bar_Row_with_Handle/1.webp"
    ]
  },
  "barbell-row-underhand": {
    "sourceId": "Reverse_Grip_Bent-Over_Rows",
    "frames": [
      "/exercises/Reverse_Grip_Bent-Over_Rows/0.webp",
      "/exercises/Reverse_Grip_Bent-Over_Rows/1.webp"
    ]
  },
  "barbell-row-overhand": {
    "sourceId": "Bent_Over_Barbell_Row",
    "frames": [
      "/exercises/Bent_Over_Barbell_Row/0.webp",
      "/exercises/Bent_Over_Barbell_Row/1.webp"
    ]
  },
  "single-arm-dumbbell-row": {
    "sourceId": "One-Arm_Dumbbell_Row",
    "frames": [
      "/exercises/One-Arm_Dumbbell_Row/0.webp",
      "/exercises/One-Arm_Dumbbell_Row/1.webp"
    ]
  },
  "single-arm-dumbbell-high-row": {
    "sourceId": "One-Arm_Dumbbell_Row",
    "frames": [
      "/exercises/One-Arm_Dumbbell_Row/0.webp",
      "/exercises/One-Arm_Dumbbell_Row/1.webp"
    ]
  },
  "incline-bench-dumbbell-row": {
    "sourceId": "Dumbbell_Incline_Row",
    "frames": [
      "/exercises/Dumbbell_Incline_Row/0.webp",
      "/exercises/Dumbbell_Incline_Row/1.webp"
    ]
  },
  "seated-barbell-shoulder-press": {
    "sourceId": "Barbell_Shoulder_Press",
    "frames": [
      "/exercises/Barbell_Shoulder_Press/0.webp",
      "/exercises/Barbell_Shoulder_Press/1.webp"
    ]
  },
  "dumbbell-shoulder-press": {
    "sourceId": "Dumbbell_Shoulder_Press",
    "frames": [
      "/exercises/Dumbbell_Shoulder_Press/0.webp",
      "/exercises/Dumbbell_Shoulder_Press/1.webp"
    ]
  },
  "smith-shoulder-press": {
    "sourceId": "Smith_Machine_Overhead_Shoulder_Press",
    "frames": [
      "/exercises/Smith_Machine_Overhead_Shoulder_Press/0.webp",
      "/exercises/Smith_Machine_Overhead_Shoulder_Press/1.webp"
    ]
  },
  "machine-shoulder-press-neutral": {
    "sourceId": "Machine_Shoulder_Military_Press",
    "frames": [
      "/exercises/Machine_Shoulder_Military_Press/0.webp",
      "/exercises/Machine_Shoulder_Military_Press/1.webp"
    ]
  },
  "seated-dumbbell-lateral-raise": {
    "sourceId": "Seated_Side_Lateral_Raise",
    "frames": [
      "/exercises/Seated_Side_Lateral_Raise/0.webp",
      "/exercises/Seated_Side_Lateral_Raise/1.webp"
    ]
  },
  "dumbbell-front-raise": {
    "sourceId": "Front_Dumbbell_Raise",
    "frames": [
      "/exercises/Front_Dumbbell_Raise/0.webp",
      "/exercises/Front_Dumbbell_Raise/1.webp"
    ]
  },
  "dumbbell-front-raise-together": {
    "sourceId": "Front_Dumbbell_Raise",
    "frames": [
      "/exercises/Front_Dumbbell_Raise/0.webp",
      "/exercises/Front_Dumbbell_Raise/1.webp"
    ]
  },
  "plate-front-raise": {
    "sourceId": "Front_Plate_Raise",
    "frames": [
      "/exercises/Front_Plate_Raise/0.webp",
      "/exercises/Front_Plate_Raise/1.webp"
    ]
  },
  "incline-dumbbell-front-raise": {
    "sourceId": "Front_Incline_Dumbbell_Raise",
    "frames": [
      "/exercises/Front_Incline_Dumbbell_Raise/0.webp",
      "/exercises/Front_Incline_Dumbbell_Raise/1.webp"
    ]
  },
  "seated-bent-over-rear-delt-raise": {
    "sourceId": "Seated_Bent-Over_Rear_Delt_Raise",
    "frames": [
      "/exercises/Seated_Bent-Over_Rear_Delt_Raise/0.webp",
      "/exercises/Seated_Bent-Over_Rear_Delt_Raise/1.webp"
    ]
  },
  "reverse-fly-machine": {
    "sourceId": "Reverse_Machine_Flyes",
    "frames": [
      "/exercises/Reverse_Machine_Flyes/0.webp",
      "/exercises/Reverse_Machine_Flyes/1.webp"
    ]
  },
  "cable-face-pull": {
    "sourceId": "Face_Pull",
    "frames": [
      "/exercises/Face_Pull/0.webp",
      "/exercises/Face_Pull/1.webp"
    ]
  },
  "barbell-upright-row": {
    "sourceId": "Upright_Barbell_Row",
    "frames": [
      "/exercises/Upright_Barbell_Row/0.webp",
      "/exercises/Upright_Barbell_Row/1.webp"
    ]
  },
  "barbell-shrug": {
    "sourceId": "Barbell_Shrug",
    "frames": [
      "/exercises/Barbell_Shrug/0.webp",
      "/exercises/Barbell_Shrug/1.webp"
    ]
  },
  "dumbbell-shrug": {
    "sourceId": "Dumbbell_Shrug",
    "frames": [
      "/exercises/Dumbbell_Shrug/0.webp",
      "/exercises/Dumbbell_Shrug/1.webp"
    ]
  },
  "standing-barbell-curl": {
    "sourceId": "Barbell_Curl",
    "frames": [
      "/exercises/Barbell_Curl/0.webp",
      "/exercises/Barbell_Curl/1.webp"
    ]
  },
  "standing-ez-bar-curl": {
    "sourceId": "EZ-Bar_Curl",
    "frames": [
      "/exercises/EZ-Bar_Curl/0.webp",
      "/exercises/EZ-Bar_Curl/1.webp"
    ]
  },
  "standing-dumbbell-curl": {
    "sourceId": "Dumbbell_Bicep_Curl",
    "frames": [
      "/exercises/Dumbbell_Bicep_Curl/0.webp",
      "/exercises/Dumbbell_Bicep_Curl/1.webp"
    ]
  },
  "alternating-dumbbell-curl": {
    "sourceId": "Dumbbell_Bicep_Curl",
    "frames": [
      "/exercises/Dumbbell_Bicep_Curl/0.webp",
      "/exercises/Dumbbell_Bicep_Curl/1.webp"
    ]
  },
  "standing-hammer-curl": {
    "sourceId": "Hammer_Curls",
    "frames": [
      "/exercises/Hammer_Curls/0.webp",
      "/exercises/Hammer_Curls/1.webp"
    ]
  },
  "alternating-hammer-curl": {
    "sourceId": "Alternate_Hammer_Curl",
    "frames": [
      "/exercises/Alternate_Hammer_Curl/0.webp",
      "/exercises/Alternate_Hammer_Curl/1.webp"
    ]
  },
  "rope-hammer-curl": {
    "sourceId": "Cable_Hammer_Curls_-_Rope_Attachment",
    "frames": [
      "/exercises/Cable_Hammer_Curls_-_Rope_Attachment/0.webp",
      "/exercises/Cable_Hammer_Curls_-_Rope_Attachment/1.webp"
    ]
  },
  "machine-preacher-curl": {
    "sourceId": "Machine_Preacher_Curls",
    "frames": [
      "/exercises/Machine_Preacher_Curls/0.webp",
      "/exercises/Machine_Preacher_Curls/1.webp"
    ]
  },
  "ez-bar-preacher-curl": {
    "sourceId": "Preacher_Curl",
    "frames": [
      "/exercises/Preacher_Curl/0.webp",
      "/exercises/Preacher_Curl/1.webp"
    ]
  },
  "rope-pushdown": {
    "sourceId": "Triceps_Pushdown_-_Rope_Attachment",
    "frames": [
      "/exercises/Triceps_Pushdown_-_Rope_Attachment/0.webp",
      "/exercises/Triceps_Pushdown_-_Rope_Attachment/1.webp"
    ]
  },
  "cable-pushdown": {
    "sourceId": "Triceps_Pushdown",
    "frames": [
      "/exercises/Triceps_Pushdown/0.webp",
      "/exercises/Triceps_Pushdown/1.webp"
    ]
  },
  "straight-bar-pushdown": {
    "sourceId": "Triceps_Pushdown",
    "frames": [
      "/exercises/Triceps_Pushdown/0.webp",
      "/exercises/Triceps_Pushdown/1.webp"
    ]
  },
  "reverse-grip-pushdown": {
    "sourceId": "Reverse_Grip_Triceps_Pushdown",
    "frames": [
      "/exercises/Reverse_Grip_Triceps_Pushdown/0.webp",
      "/exercises/Reverse_Grip_Triceps_Pushdown/1.webp"
    ]
  },
  "single-arm-reverse-pushdown": {
    "sourceId": "Reverse_Grip_Triceps_Pushdown",
    "frames": [
      "/exercises/Reverse_Grip_Triceps_Pushdown/0.webp",
      "/exercises/Reverse_Grip_Triceps_Pushdown/1.webp"
    ]
  },
  "rope-overhead-extension": {
    "sourceId": "Cable_Rope_Overhead_Triceps_Extension",
    "frames": [
      "/exercises/Cable_Rope_Overhead_Triceps_Extension/0.webp",
      "/exercises/Cable_Rope_Overhead_Triceps_Extension/1.webp"
    ]
  },
  "dumbbell-kickback": {
    "sourceId": "Tricep_Dumbbell_Kickback",
    "frames": [
      "/exercises/Tricep_Dumbbell_Kickback/0.webp",
      "/exercises/Tricep_Dumbbell_Kickback/1.webp"
    ]
  },
  "dumbbell-kickback-pinky-up": {
    "sourceId": "Tricep_Dumbbell_Kickback",
    "frames": [
      "/exercises/Tricep_Dumbbell_Kickback/0.webp",
      "/exercises/Tricep_Dumbbell_Kickback/1.webp"
    ]
  },
  "back-squat": {
    "sourceId": "Barbell_Squat",
    "frames": [
      "/exercises/Barbell_Squat/0.webp",
      "/exercises/Barbell_Squat/1.webp"
    ]
  },
  "front-squat": {
    "sourceId": "Front_Barbell_Squat",
    "frames": [
      "/exercises/Front_Barbell_Squat/0.webp",
      "/exercises/Front_Barbell_Squat/1.webp"
    ]
  },
  "dumbbell-squat": {
    "sourceId": "Dumbbell_Squat",
    "frames": [
      "/exercises/Dumbbell_Squat/0.webp",
      "/exercises/Dumbbell_Squat/1.webp"
    ]
  },
  "smith-machine-squat": {
    "sourceId": "Smith_Machine_Squat",
    "frames": [
      "/exercises/Smith_Machine_Squat/0.webp",
      "/exercises/Smith_Machine_Squat/1.webp"
    ]
  },
  "hack-squat": {
    "sourceId": "Hack_Squat",
    "frames": [
      "/exercises/Hack_Squat/0.webp",
      "/exercises/Hack_Squat/1.webp"
    ]
  },
  "hack-squat-narrow": {
    "sourceId": "Narrow_Stance_Hack_Squats",
    "frames": [
      "/exercises/Narrow_Stance_Hack_Squats/0.webp",
      "/exercises/Narrow_Stance_Hack_Squats/1.webp"
    ]
  },
  "smith-bulgarian-split-squat": {
    "sourceId": "Smith_Single-Leg_Split_Squat",
    "frames": [
      "/exercises/Smith_Single-Leg_Split_Squat/0.webp",
      "/exercises/Smith_Single-Leg_Split_Squat/1.webp"
    ]
  },
  "leg-press-45": {
    "sourceId": "Leg_Press",
    "frames": [
      "/exercises/Leg_Press/0.webp",
      "/exercises/Leg_Press/1.webp"
    ]
  },
  "leg-extension": {
    "sourceId": "Leg_Extensions",
    "frames": [
      "/exercises/Leg_Extensions/0.webp",
      "/exercises/Leg_Extensions/1.webp"
    ]
  },
  "lying-leg-curl": {
    "sourceId": "Lying_Leg_Curls",
    "frames": [
      "/exercises/Lying_Leg_Curls/0.webp",
      "/exercises/Lying_Leg_Curls/1.webp"
    ]
  },
  "seated-leg-curl": {
    "sourceId": "Seated_Leg_Curl",
    "frames": [
      "/exercises/Seated_Leg_Curl/0.webp",
      "/exercises/Seated_Leg_Curl/1.webp"
    ]
  },
  "standing-single-leg-curl": {
    "sourceId": "Standing_Leg_Curl",
    "frames": [
      "/exercises/Standing_Leg_Curl/0.webp",
      "/exercises/Standing_Leg_Curl/1.webp"
    ]
  },
  "dumbbell-stiff-leg-deadlift": {
    "sourceId": "Stiff-Legged_Dumbbell_Deadlift",
    "frames": [
      "/exercises/Stiff-Legged_Dumbbell_Deadlift/0.webp",
      "/exercises/Stiff-Legged_Dumbbell_Deadlift/1.webp"
    ]
  },
  "seated-calf-raise": {
    "sourceId": "Seated_Calf_Raise",
    "frames": [
      "/exercises/Seated_Calf_Raise/0.webp",
      "/exercises/Seated_Calf_Raise/1.webp"
    ]
  },
  "barbell-hip-thrust": {
    "sourceId": "Barbell_Hip_Thrust",
    "frames": [
      "/exercises/Barbell_Hip_Thrust/0.webp",
      "/exercises/Barbell_Hip_Thrust/1.webp"
    ]
  },
  "barbell-glute-bridge": {
    "sourceId": "Barbell_Glute_Bridge",
    "frames": [
      "/exercises/Barbell_Glute_Bridge/0.webp",
      "/exercises/Barbell_Glute_Bridge/1.webp"
    ]
  },
  "cable-glute-kickback": {
    "sourceId": "One-Legged_Cable_Kickback",
    "frames": [
      "/exercises/One-Legged_Cable_Kickback/0.webp",
      "/exercises/One-Legged_Cable_Kickback/1.webp"
    ]
  },
  "machine-hip-abduction": {
    "sourceId": "Thigh_Abductor",
    "frames": [
      "/exercises/Thigh_Abductor/0.webp",
      "/exercises/Thigh_Abductor/1.webp"
    ]
  },
  "machine-hip-adduction": {
    "sourceId": "Thigh_Adductor",
    "frames": [
      "/exercises/Thigh_Adductor/0.webp",
      "/exercises/Thigh_Adductor/1.webp"
    ]
  },
  "machine-ab-crunch": {
    "sourceId": "Ab_Crunch_Machine",
    "frames": [
      "/exercises/Ab_Crunch_Machine/0.webp",
      "/exercises/Ab_Crunch_Machine/1.webp"
    ]
  },
  "decline-reverse-crunch": {
    "sourceId": "Decline_Reverse_Crunch",
    "frames": [
      "/exercises/Decline_Reverse_Crunch/0.webp",
      "/exercises/Decline_Reverse_Crunch/1.webp"
    ]
  },
  "hanging-leg-raise": {
    "sourceId": "Hanging_Leg_Raise",
    "frames": [
      "/exercises/Hanging_Leg_Raise/0.webp",
      "/exercises/Hanging_Leg_Raise/1.webp"
    ]
  }
};
