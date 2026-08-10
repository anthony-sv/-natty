import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BodyPanel } from "@/features/body/components/BodyPanel";
import { RecordsPanel } from "@/features/log/components/RecordsPanel";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="text-sm text-muted-foreground">
          What you've lifted and how your body composition is tracking.
        </p>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
        </TabsList>
        <TabsContent value="records">
          <RecordsPanel />
        </TabsContent>
        <TabsContent value="body">
          <BodyPanel />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
