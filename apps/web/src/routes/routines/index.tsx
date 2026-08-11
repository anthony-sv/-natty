import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { Page } from "@/components/page";
import { Button } from "@/components/ui/button";
import { ItemGroup } from "@/components/ui/item";
import { RoutineRow } from "@/features/routines/components/RoutineRow";
import { useRoutines } from "@/features/routines/use-routines";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/routines/")({
  component: RoutinesIndex,
});

function RoutinesIndex() {
  // A live query rather than the old loader-fed one, so a routine you just
  // wrote appears here without a reload.
  const { routines } = useRoutines();
  const t = useT();

  return (
    <Page>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav.routines")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("routines.subtitle", { count: routines.length })}
          </p>
        </div>
        <Button nativeButton={false} render={<Link to="/routines/new" />}>
          <PlusIcon data-icon="inline-start" />
          {t("builder.new")}
        </Button>
      </div>
      {/* A single column: the rows carry a week's worth of day labels, and
          side-by-side they'd wrap into the same tall boxes this replaced. */}
      <ItemGroup className="gap-2">
        {routines.map((routine) => (
          <RoutineRow key={routine.slug} routine={routine} />
        ))}
      </ItemGroup>
    </Page>
  );
}
