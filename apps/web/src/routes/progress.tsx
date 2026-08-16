import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Page } from "@/components/page";
import {
  Tabs,
  TabsContent,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollingTabsList } from "@/components/scrolling-tabs-list";
import { DataPanel } from "@/features/backup/components/DataPanel";
import { BodyPanel } from "@/features/body/components/BodyPanel";
import { LibraryPanel } from "@/features/library/components/LibraryPanel";
import { RecordsPanel } from "@/features/log/components/RecordsPanel";
import { HistoryPanel } from "@/features/log/components/HistoryPanel";
import { VolumePanel } from "@/features/log/components/VolumePanel";
import { CardioPanel } from "@/features/log/components/CardioPanel";
import { MeasurementPanel } from "@/features/measurements/components/MeasurementPanel";
import { useT } from "@/i18n/use-t";

// Measurements sits beside Body rather than inside it: they answer different
// questions from different collections, and the Body panel already carries the
// FFMI meter, two charts, a form and a history table.
const TABS = [
  "records",
  "volume",
  "cardio",
  "history",
  "library",
  "body",
  "measurements",
  "data",
] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/progress")({
  // `?tab=` so a panel is linkable — the command palette jumps straight to one,
  // and a refresh doesn't bounce you back to Records. The key is returned only
  // when present, or every plain `<Link to="/progress">` stops typechecking.
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(search.tab as Tab) ? { tab: search.tab as Tab } : {},
  component: ProgressPage,
});

function ProgressPage() {
  const t = useT();
  const navigate = useNavigate();
  // The URL is the source of truth, not component state — that's what makes a
  // tab linkable and survive a refresh. `replace` so tabbing around doesn't
  // fill the back button with panel switches.
  const { tab = "records" } = Route.useSearch();
  const setTab = (next: string) =>
    void navigate({ to: "/progress", search: { tab: next as Tab }, replace: true });

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
        <ScrollingTabsList>
          <TabsTrigger value="records">{t("progress.tab.records")}</TabsTrigger>
          <TabsTrigger value="volume">{t("volume.tab")}</TabsTrigger>
          <TabsTrigger value="cardio">{t("cardio.tab")}</TabsTrigger>
          <TabsTrigger value="history">{t("history.tab")}</TabsTrigger>
          <TabsTrigger value="library">{t("library.tab")}</TabsTrigger>
          <TabsTrigger value="body">{t("progress.tab.body")}</TabsTrigger>
          <TabsTrigger value="measurements">{t("measure.tab")}</TabsTrigger>
          <TabsTrigger value="data">{t("data.tab")}</TabsTrigger>
        </ScrollingTabsList>
        <TabsContent value="records">
          {tab === "records" ? <RecordsPanel /> : null}
        </TabsContent>
        <TabsContent value="volume">
          {tab === "volume" ? <VolumePanel /> : null}
        </TabsContent>
        <TabsContent value="cardio">
          {tab === "cardio" ? <CardioPanel /> : null}
        </TabsContent>
        <TabsContent value="history">
          {tab === "history" ? <HistoryPanel /> : null}
        </TabsContent>
        <TabsContent value="library">
          {tab === "library" ? <LibraryPanel /> : null}
        </TabsContent>
        <TabsContent value="body">
          {tab === "body" ? <BodyPanel /> : null}
        </TabsContent>
        <TabsContent value="measurements">
          {tab === "measurements" ? <MeasurementPanel /> : null}
        </TabsContent>
        <TabsContent value="data">
          {tab === "data" ? <DataPanel /> : null}
        </TabsContent>
      </Tabs>
    </Page>
  );
}
