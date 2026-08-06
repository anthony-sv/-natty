import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Routine } from "@/data/routines";

export function RoutineCard({ routine }: { routine: Routine }) {
  const dayCount = routine.weeks[0]?.days.length ?? 0;

  return (
    <Link
      to="/routines/$routineSlug"
      params={{ routineSlug: routine.slug }}
      className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
    >
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle>{routine.name}</CardTitle>
          <CardDescription>
            {routine.weeks.length > 1
              ? `${routine.weeks.length} weeks`
              : `${dayCount}-day cycle`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {routine.source ? <Badge variant="outline">{routine.source}</Badge> : null}
          {routine.style ? <Badge variant="secondary">{routine.style}</Badge> : null}
          {routine.goal ? (
            <Badge variant={routine.goal === "cutting" ? "destructive" : "default"}>
              {routine.goal}
            </Badge>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
