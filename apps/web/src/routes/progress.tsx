import { useState } from "react";
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
import { HistoryPanel } from "@/features/log/components/HistoryPanel";
import { VolumePanel } from "@/features/log/components/VolumePanel";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
});

function ProgressPage() {
  const t = useT();
  const [tab, setTab] = useState("records");

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">{t("progress.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("progress.subtitle")}</p>
      </div>

      {/* Controlled, and each panel's body is rendered only while its tab is the
          one selected — because two of these panels own a Sheet, which portals
          to the body. Base UI keeps an inactive panel mounted, so opening a day
          from History and then switching to Records left the day sheet on screen
          over a tab it doesn't belong to; open an exercise there and both sheets
          were up at once. `keepMounted={false}` does not fix it: the panel gets
          `inert` and an exit style that never resolves, so it stays mounted and
          so does its portal. Gating on `tab` is the version that doesn't depend
          on the library's unmount timing, and it also stops four live queries
          running for one visible panel. */}
      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList>
          <TabsTrigger value="records">{t("progress.tab.records")}</TabsTrigger>
          <TabsTrigger value="volume">{t("volume.tab")}</TabsTrigger>
          <TabsTrigger value="history">{t("history.tab")}</TabsTrigger>
          <TabsTrigger value="body">{t("progress.tab.body")}</TabsTrigger>
        </TabsList>
        <TabsContent value="records">
          {tab === "records" ? <RecordsPanel /> : null}
        </TabsContent>
        <TabsContent value="volume">
          {tab === "volume" ? <VolumePanel /> : null}
        </TabsContent>
        <TabsContent value="history">
          {tab === "history" ? <HistoryPanel /> : null}
        </TabsContent>
        <TabsContent value="body">
          {tab === "body" ? <BodyPanel /> : null}
        </TabsContent>
      </Tabs>
    </Page>
  );
}
