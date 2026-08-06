import { warmupSectionSchema, type WarmupSection } from "./schema";

// Transcribed from gym-docs/Routines/Stretch-Warmup.MD

const raw: WarmupSection[] = [
  {
    slug: "universal",
    title: "Universal Daily Warm-Up",
    durationMinutes: [8, 10],
    moves: [
      {
        name: "Light cardio (treadmill walk, stationary bike, rowing machine, or elliptical)",
        durationSeconds: 300,
        purpose: "Slight sweat, not fatigue",
      },
      { name: "Arm circles (10 forward + 10 backward)", sets: 1 },
      { name: "Hip circles (10 each direction)", sets: 1 },
      { name: "Torso rotations", sets: 1, reps: 10, perSide: true },
      {
        name: "Leg swings, front-to-back",
        sets: 1,
        reps: 10,
        perSide: true,
      },
      {
        name: "Leg swings, side-to-side",
        sets: 1,
        reps: 10,
        perSide: true,
      },
    ],
  },
  {
    slug: "shoulder-chest",
    title: "Shoulder & Chest Day Warm-Up",
    durationMinutes: [10, 12],
    moves: [
      {
        name: "Banded external rotation (elbow at side, rotate hand outward, slow and controlled)",
        sets: 2,
        reps: 15,
        perSide: true,
      },
      {
        name: "Banded face pull (pull toward face, elbows high, squeeze shoulder blades)",
        sets: 2,
        reps: 15,
      },
      {
        name: "Scapular push-ups (arms straight, only move shoulder blades)",
        sets: 2,
        reps: 12,
      },
      {
        name: "Wall slides (back against wall, slide arms upward, keep contact with wall)",
        sets: 2,
        reps: 10,
      },
      {
        name: "Light incline dumbbell press (activation) — set 1: ~50% working weight",
        sets: 1,
        reps: 12,
      },
      {
        name: "Light incline dumbbell press (activation) — set 2: ~70% working weight",
        sets: 1,
        reps: 8,
      },
    ],
  },
  {
    slug: "back",
    title: "Back Day Warm-Up",
    durationMinutes: [6, 8],
    moves: [
      {
        name: "Straight-arm pulldown",
        sets: 2,
        reps: 15,
        purpose: "Activates lats, improves mind-muscle connection",
      },
      {
        name: "Band pull-apart",
        sets: 2,
        reps: 15,
        purpose: "Improves posture, stabilizes shoulders",
      },
      {
        name: "Dead hang (optional, only if pain-free)",
        durationSeconds: [20, 30],
        purpose: "Shoulder decompression, grip strength",
      },
    ],
  },
  {
    slug: "arm",
    title: "Arm Day Warm-Up",
    durationMinutes: [5, 6],
    moves: [
      { name: "Wrist circles (10 each direction)", sets: 1 },
      { name: "Light cable curl", sets: 2, reps: 15 },
      { name: "Light rope pushdown", sets: 2, reps: 15 },
    ],
  },
  {
    slug: "leg",
    title: "Leg Day Warm-Up",
    durationMinutes: [8, 10],
    moves: [
      { name: "Bodyweight squats", sets: 2, reps: 15 },
      { name: "Walking lunges", sets: 2, reps: 10, perSide: true },
      { name: "Leg swings, front-to-back", sets: 1, reps: 10, perSide: true },
      { name: "Leg swings, side-to-side", sets: 1, reps: 10, perSide: true },
      {
        name: "Glute bridges",
        sets: 2,
        reps: 15,
        purpose: "Activates glutes, protects knees and lower back",
      },
    ],
  },
  {
    slug: "post-workout-stretch",
    title: "Post-Workout Stretching",
    durationMinutes: [5, 10],
    moves: [
      {
        name: "Shoulder stretch",
        durationSeconds: [30, 45],
        purpose: "Targets rear delts, rotator cuff",
      },
      {
        name: "Chest stretch (doorway stretch)",
        durationSeconds: [30, 45],
        purpose: "Targets pectorals, anterior shoulder",
      },
      {
        name: "Lat stretch",
        durationSeconds: [30, 45],
        purpose: "Targets latissimus dorsi, upper back",
      },
      {
        name: "Hamstring stretch",
        durationSeconds: [30, 45],
        purpose: "Targets posterior chain",
      },
      {
        name: "Hip flexor stretch",
        durationSeconds: [30, 45],
        purpose: "Targets hip flexors, lower back support",
      },
    ],
  },
  {
    slug: "shoulder-recovery",
    title: "Optional Shoulder Recovery Routine (Non-Training Days, 2-3x/week)",
    durationMinutes: 5,
    moves: [
      { name: "Banded external rotation", sets: 2, reps: 15 },
      { name: "Face pull", sets: 2, reps: 15 },
      { name: "Wall slides", sets: 2, reps: 10 },
    ],
  },
];

export const warmupSections: WarmupSection[] = raw.map((section) =>
  warmupSectionSchema.parse(section),
);

export function getWarmupSection(slug: string): WarmupSection | undefined {
  return warmupSections.find((section) => section.slug === slug);
}
