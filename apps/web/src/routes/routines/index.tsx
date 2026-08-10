import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ItemGroup } from "@/components/ui/item";
import { RoutineRow } from "@/features/routines/components/RoutineRow";
import { routinesQueryOptions } from "@/features/routines/queries";

export const Route = createFileRoute("/routines/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(routinesQueryOptions()),
  component: RoutinesIndex,
});

function RoutinesIndex() {
  const { data: routines } = useSuspenseQuery(routinesQueryOptions());

  return (
    <Page>
      <div>
        <h1 className="text-2xl font-semibold">Routines</h1>
        <p className="text-sm text-muted-foreground">
          {routines.length} programs. Each one lists the split it runs.
        </p>
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
