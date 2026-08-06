import { createFileRoute } from "@tanstack/react-router";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Routines</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {routines.map((routine) => (
          <RoutineCard key={routine.slug} routine={routine} />
        ))}
      </div>
    </div>
  );
}
