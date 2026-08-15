/**
 * The food card's visual: today's protein/carbs/fat as one slim stacked bar,
 * segments sized by calorie share (protein and carbs at 4 kcal/g, fat at 9)
 * rather than by grams — grams alone would draw fat's segment too small for
 * how much of the day's energy it is. `--macro-*` are the same tokens the
 * `/nutrition` donut uses, deliberately not shared with `--chart-*` — see
 * `styles.css`.
 */
export function MiniMacroBar({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  const kcal = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 };
  const total = kcal.protein + kcal.carbs + kcal.fat;
  if (total <= 0) return <MiniMacroBarSample />;

  const segments: Array<{ key: string; share: number; color: string }> = [
    { key: "protein", share: kcal.protein / total, color: "var(--macro-protein)" },
    { key: "carbs", share: kcal.carbs / total, color: "var(--macro-carbs)" },
    { key: "fat", share: kcal.fat / total, color: "var(--macro-fat)" },
  ].filter((segment) => segment.share > 0);

  return (
    <div
      className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full"
      aria-hidden="true"
    >
      {segments.map((segment) => (
        <span
          key={segment.key}
          className="h-full rounded-full"
          style={{ width: `${segment.share * 100}%`, background: segment.color }}
        />
      ))}
    </div>
  );
}

/** Nothing logged yet today. */
export function MiniMacroBarSample() {
  return (
    <div
      className="h-2 w-full rounded-full border border-dashed border-muted-foreground/40"
      aria-hidden="true"
    />
  );
}
