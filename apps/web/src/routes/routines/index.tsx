import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { RoutineCard } from "@/features/routines/components/RoutineCard";
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
      <h1 className="text-2xl font-semibold">Routines</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {routines.map((routine) => (
          <RoutineCard key={routine.slug} routine={routine} />
        ))}
      </div>
    </Page>
  );
}
