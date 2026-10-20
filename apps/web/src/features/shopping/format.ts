import type { Translate } from "@/i18n/use-t";
import type { StockUnit } from "./schema";

/**
 * An amount the way the package says it: kilos and litres once there are
 * enough grams or millilitres, whole-ish numbers otherwise.
 *
 * Never a raw stored figure — `formatWeightValue` exists because a weigh-in
 * once printed `83.60000000000001 kg`, and remaining stock is subtraction
 * all the way down.
 */
export function formatStockAmount(value: number, unit: StockUnit, t: Translate): string {
  const number = (n: number, digits: number) =>
    new Intl.NumberFormat(t.locale, { maximumFractionDigits: digits }).format(n);

  if (unit === "unit") {
    const rounded = Math.round(value * 10) / 10;
    return t.plural("shopping.amount.unit", rounded, { count: number(rounded, 1) });
  }
  if (value >= 1000) {
    return t(unit === "g" ? "shopping.amount.kg" : "shopping.amount.l", {
      count: number(value / 1000, value >= 10_000 ? 0 : 1),
    });
  }
  return t(unit === "g" ? "shopping.amount.g" : "shopping.amount.ml", {
    count: number(value, value >= 10 ? 0 : 1),
  });
}

/** "12 days", "about 3 weeks" — rounded the way a person would say it. */
export function formatDaysLeft(days: number, t: Translate): string {
  if (days < 1) return t("shopping.daysLeft.lessThanOne");
  if (days < 21) {
    const n = Math.floor(days);
    return t.plural("shopping.daysLeft.days", n, { count: n });
  }
  const weeks = Math.round(days / 7);
  return t.plural("shopping.daysLeft.weeks", weeks, { count: weeks });
}
