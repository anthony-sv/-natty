import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { ScrollingTabsList } from "@/components/scrolling-tabs-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingListPanel } from "@/features/shopping/components/ShoppingListPanel";
import { StockPanel } from "@/features/shopping/components/StockPanel";
import { useT } from "@/i18n/use-t";

const TABS = ["list", "stock"] as const;
type Tab = (typeof TABS)[number];

/** A week, a fortnight, a month — the three ways people actually shop. */
const HORIZONS = [7, 14, 30] as const;
const HORIZON_KEY = "natty.shopping-horizon.v1";

function loadHorizon(): number {
  try {
    const stored = Number(localStorage.getItem(HORIZON_KEY));
    if ((HORIZONS as readonly number[]).includes(stored)) return stored;
  } catch {
    // Storage blocked: a week is the sensible default anyway.
  }
  return 7;
}

export const Route = createFileRoute("/shopping")({
  // The key only when present — always returning `{ tab: undefined }` makes
  // the search object required and every plain `<Link to="/shopping">`
  // stops typechecking.
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(search.tab as Tab) ? { tab: search.tab as Tab } : {},
  component: ShoppingPage,
});

/**
 * What to buy, and what's in the cupboard.
 *
 * Its own page rather than a nutrition tab: half of what runs out isn't food
 * — toothpaste, creatine — and the list is the one screen you open in the
 * shop rather than in the kitchen.
 */
function ShoppingPage() {
  const t = useT();
  const navigate = useNavigate();
  const tab = Route.useSearch().tab ?? "list";
  // Seeded once: no clock reads during render.
  const [now] = useState(() => Date.now());
  const [horizon, setHorizon] = useState(loadHorizon);

  const horizonItems = HORIZONS.map((days) => ({
    value: String(days),
    label: t(`shopping.horizon.${days}`),
  }));

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{t("shopping.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("shopping.subtitle")}</p>
        </div>
        <Select
          items={horizonItems}
          value={String(horizon)}
          onValueChange={(value) => {
            const days = Number(value);
            setHorizon(days);
            try {
              localStorage.setItem(HORIZON_KEY, String(days));
            } catch {
              // Remembered for this visit only.
            }
          }}
        >
          <SelectTrigger className="w-44" aria-label={t("shopping.horizon")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {horizonItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs
        value={tab}
        onValueChange={(next) =>
          void navigate({ to: "/shopping", search: { tab: next as Tab }, replace: true })
        }
      >
        <ScrollingTabsList>
          <TabsTrigger value="list">{t("shopping.tab.list")}</TabsTrigger>
          <TabsTrigger value="stock">{t("shopping.tab.stock")}</TabsTrigger>
        </ScrollingTabsList>
        {/* Bodies render only while selected, the `/progress` rule — both
            own dialogs, and an inactive panel stays mounted otherwise. */}
        <TabsContent value="list">
          {tab === "list" ? <ShoppingListPanel now={now} horizonDays={horizon} /> : null}
        </TabsContent>
        <TabsContent value="stock">
          {tab === "stock" ? <StockPanel now={now} /> : null}
        </TabsContent>
      </Tabs>
    </Page>
  );
}
