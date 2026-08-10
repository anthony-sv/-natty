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
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const t = useT();

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">{t("progress.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("progress.subtitle")}</p>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">{t("progress.tab.records")}</TabsTrigger>
          <TabsTrigger value="body">{t("progress.tab.body")}</TabsTrigger>
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
