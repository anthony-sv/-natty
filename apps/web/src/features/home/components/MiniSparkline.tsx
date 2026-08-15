/**
 * The body card's visual: a plain inline-SVG sparkline, not the full
 * `@tanstack/react-charts` adapter `BodyCharts` uses — too small a mark to
 * justify the axes, tooltip and theme wiring a real chart needs. `--chart
 * -weight` is the same token the real trend chart plots with, so the two
 * never disagree about which hue is "weight".
 */

const WIDTH = 100;
const HEIGHT = 28;
const PAD = 3;

export function MiniSparkline({ points }: { points: number[] }) {
  if (points.length < 2) return <MiniSparklineSample />;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const coords = points.map((value, i) => {
    const x = PAD + (i / (points.length - 1)) * (WIDTH - PAD * 2);
    const y = HEIGHT - PAD - ((value - min) / span) * (HEIGHT - PAD * 2);
    return [x, y] as const;
  });
  const path = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-7 w-full"
      aria-hidden="true"
    >
      <polyline
        points={path}
        fill="none"
        stroke="var(--chart-weight)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill="var(--chart-weight)" />
    </svg>
  );
}

/** Fewer than two weigh-ins — a trend needs at least a second point. */
export function MiniSparklineSample() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-7 w-full"
      aria-hidden="true"
    >
      <line
        x1={PAD}
        y1={HEIGHT / 2}
        x2={WIDTH - PAD}
        y2={HEIGHT / 2}
        stroke="var(--muted-foreground)"
        strokeWidth="2"
        strokeDasharray="3 3"
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  );
}
