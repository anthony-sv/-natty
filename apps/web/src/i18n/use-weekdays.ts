import { useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import type { Weekday } from "@/data/diets";
import { localeStore } from "./locale-store";

/**
 * Short weekday names in the reader's language.
 *
 * From `Intl`, not the message dictionary: the seven names are exactly the kind
 * of thing the platform already knows in every locale, and hand-translating
 * them would be a list to keep in step for no benefit. A reference Monday is
 * picked and walked forward, so the week starts on Monday the way the plans do
 * rather than on whatever day the locale's calendar starts.
 */
export function useWeekdayLabels(): Record<Weekday, string> {
  const locale = useStore(localeStore, (s) => s);

  return useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2024-01-01 was a Monday. Any Monday would do; a fixed one keeps this
    // pure, which `Date.now()` here would not be.
    const monday = new Date(2024, 0, 1);
    const order: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    return Object.fromEntries(
      order.map((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return [day, format.format(date)];
      }),
    ) as Record<Weekday, string>;
  }, [locale]);
}
