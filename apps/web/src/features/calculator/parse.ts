/**
 * Reads a number input, treating blank and nonsense alike as "not set".
 *
 * The calculators are all live — no submit button, results update as you
 * type — so a half-typed value has to resolve to undefined rather than to an
 * error state that flashes on every keystroke.
 */
export function parseMeasurement(raw: string): number | undefined {
  const value = Number(raw);
  return raw.trim() === "" || !Number.isFinite(value) || value <= 0
    ? undefined
    : value;
}
