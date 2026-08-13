import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import {
  Tabs,
  TabsContent,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollingTabsList } from "@/components/scrolling-tabs-list";
import { OneRepMaxPanel } from "@/features/calculator/components/OneRepMaxPanel";
import { PotentialPanel } from "@/features/calculator/components/PotentialPanel";
import { RpePanel } from "@/features/calculator/components/RpePanel";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/calculator")({
  component: CalculatorPage,
});

/**
 * The pure-arithmetic tools: nothing here reads or writes the training log.
 *
 * Plate loading is deliberately *not* a tab — see `/plates`. It's the one you
 * open standing at a rack rather than sitting down planning, so it gets its
 * own route and its own place in the nav.
 */
function CalculatorPage() {
  const t = useT();

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">{t("calc.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("calc.subtitle")}</p>
      </div>

      <Tabs defaultValue="max">
        <ScrollingTabsList>
          <TabsTrigger value="max">{t("calc.tab.oneRepMax")}</TabsTrigger>
          <TabsTrigger value="rpe">{t("calc.tab.rpe")}</TabsTrigger>
          <TabsTrigger value="potential">{t("calc.tab.potential")}</TabsTrigger>
        </ScrollingTabsList>
        <TabsContent value="max">
          <OneRepMaxPanel />
        </TabsContent>
        <TabsContent value="rpe">
          <RpePanel />
        </TabsContent>
        <TabsContent value="potential">
          <PotentialPanel />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
