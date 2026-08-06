import { notFound } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { getRoutineBySlug, routines } from "@/data/routines";

export const routinesQueryOptions = () =>
  queryOptions({
    queryKey: ["routines"],
    queryFn: async () => routines,
  });

export const routineQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["routines", slug],
    queryFn: async () => {
      const routine = getRoutineBySlug(slug);
      if (!routine) throw notFound();
      return routine;
    },
  });
