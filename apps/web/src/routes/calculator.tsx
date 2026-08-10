import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { OneRepMaxPanel } from "@/features/calculator/components/OneRepMaxPanel";
import { PotentialPanel } from "@/features/calculator/components/PotentialPanel";
import { RpePanel } from "@/features/calculator/components/RpePanel";

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
  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">Calculators</h1>
        <p className="text-sm text-muted-foreground">
          What you could build, what you could lift, and how hard a set was.
        </p>
      </div>

      <Tabs defaultValue="max">
        <TabsList>
          <TabsTrigger value="max">One-rep max</TabsTrigger>
          <TabsTrigger value="rpe">RPE &amp; RIR</TabsTrigger>
          <TabsTrigger value="potential">Natural potential</TabsTrigger>
        </TabsList>
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
