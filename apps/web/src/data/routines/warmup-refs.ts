/**
 * Resolves which warmup sections apply to a training day, by muscle-group
 * label. This runs once at data-authoring time (called directly in each
 * routine's data module below) — it is not a runtime fuzzy matcher over
 * arbitrary user input, just a small deterministic helper over the fixed,
 * known vocabulary of day labels used across these transcribed programs.
 */
export function warmupRefsFor(label: string): string[] {
  const refs: string[] = ["universal"];
  const l = label.toLowerCase();
  if (l.includes("chest") || l.includes("shoulder") || l.includes("trap")) {
    refs.push("shoulder-chest");
  }
  if (l.includes("back")) refs.push("back");
  if (l.includes("arm") || l.includes("bicep") || l.includes("tricep")) {
    refs.push("arm");
  }
  if (
    l.includes("leg") ||
    l.includes("quad") ||
    l.includes("hamstring") ||
    l.includes("calf") ||
    l.includes("calves")
  ) {
    refs.push("leg");
  }
  refs.push("post-workout-stretch");
  return refs;
}
