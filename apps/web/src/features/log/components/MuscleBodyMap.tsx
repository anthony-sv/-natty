import { Fragment, type KeyboardEvent, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MuscleId } from "@/data/exercises";

/**
 * Hand-authored inline SVG, front and back silhouette, one region per muscle.
 *
 * No dependency exists for this and none should be added — it follows the same
 * own-your-primitives streak as `PlateDisc`/`PlateEdge` (`features/plates/`),
 * `TrainingHeatmap` and `FfmiMeter`: an off-the-shelf body map wouldn't theme,
 * wouldn't take our tokens, and wouldn't match our 18-muscle vocabulary.
 *
 * Stylised, not anatomical — smooth tapered shapes standing in for limbs and
 * torso, not a muscle-fiber illustration. The job is "which region is this",
 * not likeness; a licensed anatomical asset is what the visually detailed
 * references for this feature actually use, and that license doesn't extend
 * here — see the plan's licensing note on exercise media for why that path is
 * deliberately not taken for imagery either.
 */

type Shape =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "path"; d: string };

interface RegionDef {
  muscle: MuscleId;
  shapes: Shape[];
}

const circle = (cx: number, cy: number, r: number): Shape => ({
  kind: "circle",
  cx,
  cy,
  r,
});
const ellipse = (cx: number, cy: number, rx: number, ry: number): Shape => ({
  kind: "ellipse",
  cx,
  cy,
  rx,
  ry,
});
const path = (d: string): Shape => ({ kind: "path", d });

/**
 * A vertical capsule tapering from width `w1` at `y1` to `w2` at `y2`, rounded
 * at both ends. What turns a limb from a uniform-width rod into something that
 * reads as a shoulder-to-elbow or hip-to-knee taper, with two numbers instead
 * of a hand-fitted bezier per limb.
 */
function taperedCapsule(cx: number, y1: number, w1: number, y2: number, w2: number): Shape {
  const hw1 = w1 / 2;
  const hw2 = w2 / 2;
  const topY = y1 + hw1;
  const botY = y2 - hw2;
  return path(
    `M ${cx - hw1} ${topY} A ${hw1} ${hw1} 0 1 1 ${cx + hw1} ${topY} ` +
      `L ${cx + hw2} ${botY} A ${hw2} ${hw2} 0 1 1 ${cx - hw2} ${botY} Z`,
  );
}

/**
 * Non-interactive base figure — head, neck, torso, limbs — shared by both
 * views since the outer silhouette doesn't change, only which muscles are
 * labelled on top of it.
 *
 * The torso is a genuine V-taper (wide shoulders, narrow waist, a slight hip
 * flare) rather than a rounded rectangle — the earlier flat-sided box read as
 * a mannequin rather than a body. Every limb is a `taperedCapsule` for the
 * same reason: a uniform-width rod through a shoulder and an elbow doesn't
 * look like an arm.
 */
function BodySilhouette() {
  return (
    <g className="fill-muted stroke-border" strokeWidth={1.5}>
      <circle cx={100} cy={26} r={18} />
      <rect x={88} y={40} width={24} height={16} rx={6} />
      <path
        d="M64,56 C50,60 42,72 42,92 C42,120 54,145 66,168 C60,188 57,202 57,218
           L143,218 C143,202 140,188 134,168 C146,145 158,120 158,92
           C158,72 150,60 136,56 C122,48 78,48 64,56 Z"
      />
      {[taperedCapsule(33, 58, 24, 145, 16), taperedCapsule(30, 148, 17, 224, 12),
        taperedCapsule(167, 58, 24, 145, 16), taperedCapsule(170, 148, 17, 224, 12),
        taperedCapsule(77, 214, 42, 310, 30), taperedCapsule(76, 312, 27, 400, 15),
        taperedCapsule(123, 214, 42, 310, 30), taperedCapsule(124, 312, 27, 400, 15),
      ].map((shape, i) => (
        <Fragment key={i}>{renderShape(shape, i)}</Fragment>
      ))}
      <ellipse cx={76} cy={406} rx={15} ry={7} />
      <ellipse cx={124} cy={406} rx={15} ry={7} />
    </g>
  );
}

const FRONT_REGIONS: RegionDef[] = [
  { muscle: "front-delts", shapes: [circle(44, 66, 16), circle(156, 66, 16)] },
  { muscle: "side-delts", shapes: [circle(33, 70, 9), circle(167, 70, 9)] },
  {
    muscle: "upper-chest",
    shapes: [
      path("M70,62 C70,58 130,58 130,62 L128,80 C112,74 88,74 72,80 Z"),
    ],
  },
  { muscle: "chest", shapes: [ellipse(75, 98, 20, 16), ellipse(125, 98, 20, 16)] },
  {
    muscle: "biceps",
    shapes: [taperedCapsule(33, 68, 18, 130, 14), taperedCapsule(167, 68, 18, 130, 14)],
  },
  {
    muscle: "abs",
    shapes: [path("M82,122 C82,118 118,118 118,122 L122,175 C110,182 90,182 78,175 Z")],
  },
  {
    muscle: "adductors",
    shapes: [taperedCapsule(90, 216, 14, 300, 12), taperedCapsule(110, 216, 14, 300, 12)],
  },
  {
    muscle: "quads",
    shapes: [taperedCapsule(77, 216, 34, 305, 26), taperedCapsule(123, 216, 34, 305, 26)],
  },
  {
    muscle: "forearms",
    shapes: [taperedCapsule(30, 152, 15, 220, 11), taperedCapsule(170, 152, 15, 220, 11)],
  },
  {
    muscle: "calves",
    shapes: [taperedCapsule(76, 314, 24, 398, 15), taperedCapsule(124, 314, 24, 398, 15)],
  },
];

const BACK_REGIONS: RegionDef[] = [
  {
    muscle: "traps",
    shapes: [path("M100,42 L128,64 L114,108 L100,118 L86,108 L72,64 Z")],
  },
  { muscle: "rear-delts", shapes: [circle(44, 66, 16), circle(156, 66, 16)] },
  { muscle: "side-delts", shapes: [circle(33, 70, 9), circle(167, 70, 9)] },
  {
    muscle: "upper-back",
    shapes: [path("M80,92 C80,88 120,88 120,92 L118,140 C106,146 94,146 82,140 Z")],
  },
  {
    muscle: "lats",
    shapes: [
      path("M52,90 C44,112 42,148 50,170 L68,168 C60,146 60,116 66,96 Z"),
      path("M148,90 C156,112 158,148 150,170 L132,168 C140,146 140,116 134,96 Z"),
    ],
  },
  {
    muscle: "triceps",
    shapes: [taperedCapsule(33, 68, 18, 130, 14), taperedCapsule(167, 68, 18, 130, 14)],
  },
  { muscle: "spinal-erectors", shapes: [taperedCapsule(100, 140, 18, 205, 14)] },
  {
    muscle: "glutes",
    shapes: [path("M60,205 C60,198 140,198 140,205 L136,232 C118,240 82,240 64,232 Z")],
  },
  {
    muscle: "adductors",
    shapes: [taperedCapsule(90, 226, 14, 300, 12), taperedCapsule(110, 226, 14, 300, 12)],
  },
  {
    muscle: "hamstrings",
    shapes: [taperedCapsule(77, 224, 34, 305, 26), taperedCapsule(123, 224, 34, 305, 26)],
  },
  {
    muscle: "forearms",
    shapes: [taperedCapsule(30, 152, 15, 220, 11), taperedCapsule(170, 152, 15, 220, 11)],
  },
  {
    muscle: "calves",
    shapes: [taperedCapsule(76, 314, 24, 398, 15), taperedCapsule(124, 314, 24, 398, 15)],
  },
];

function renderShape(shape: Shape, key: number): ReactNode {
  switch (shape.kind) {
    case "circle":
      return <circle key={key} cx={shape.cx} cy={shape.cy} r={shape.r} />;
    case "ellipse":
      return (
        <ellipse key={key} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />
      );
    case "path":
      return <path key={key} d={shape.d} />;
  }
}

function MuscleRegion({
  region,
  fill,
  label,
  onSelect,
}: {
  region: RegionDef;
  fill: string;
  label: string;
  onSelect?: (muscle: MuscleId) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <g
            role="button"
            tabIndex={0}
            aria-label={label}
            className="cursor-pointer outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80"
            onClick={() => onSelect?.(region.muscle)}
            onKeyDown={(event: KeyboardEvent<SVGGElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.(region.muscle);
              }
            }}
          />
        }
      >
        <g fill={fill} className="transition-colors duration-300">
          {region.shapes.map((shape, i) => (
            <Fragment key={i}>{renderShape(shape, i)}</Fragment>
          ))}
        </g>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function MuscleBodyFigure({
  view,
  summary,
  colorFor,
  labelFor,
  onSelect,
}: {
  view: "front" | "back";
  /** A full text summary of this figure's state — the "table view" the
      dataviz interaction rule asks for, so colour is never the only
      encoding. Read by screen readers via `aria-label`. */
  summary: string;
  colorFor: (muscle: MuscleId) => string;
  labelFor: (muscle: MuscleId) => string;
  onSelect?: (muscle: MuscleId) => void;
}) {
  const regions = view === "front" ? FRONT_REGIONS : BACK_REGIONS;

  return (
    <svg
      viewBox="0 0 200 430"
      role="img"
      aria-label={summary}
      className="w-full max-w-[11rem]"
    >
      <BodySilhouette />
      {regions.map((region) => (
        <MuscleRegion
          key={`${view}-${region.muscle}`}
          region={region}
          fill={colorFor(region.muscle)}
          label={labelFor(region.muscle)}
          onSelect={onSelect}
        />
      ))}
    </svg>
  );
}
