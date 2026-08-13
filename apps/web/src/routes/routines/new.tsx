import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoutines } from "@/features/routines/use-routines";
import { RoutineBuilder } from "@/features/routines/components/builder/RoutineBuilder";
import {
  emptyDraft,
  toDraft,
  type DraftRoutine,
} from "@/features/routines/components/builder/draft";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/routines/new")({
  component: NewRoutine,
});

function NewRoutine() {
  const t = useT();
  const f = useFormatting();
  const [draft, setDraft] = useState<DraftRoutine>(emptyDraft);
  // Remounts the builder when a template is chosen, so its internal state
  // starts from the copy rather than merging into what was already typed.
  const [seed, setSeed] = useState(0);

  // Every routine, not just the compiled-in six — see the diet builder.
  const { routines } = useRoutines();
  const templates = routines.map((routine) => ({
    value: routine.slug,
    label: f.names.routine(routine.slug, routine.name),
  }));

  return (
    <Page>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/routines" />}>
              {t("nav.routines")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("builder.newTitle")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("builder.newTitle")}</h1>

        {/* Copying a built-in is the cheapest route to something that works,
            and it reuses the same editor rather than a second path. Only the
            first week is copied — a user routine is one week that repeats. */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            {t("builder.duplicateHint")}
          </span>
          <Select
            items={templates}
            value={null}
            onValueChange={(value) => {
              const source = routines.find((r) => r.slug === value);
              if (source === undefined) return;
              const copy = toDraft(source);
              setDraft({
                ...copy,
                name: t("builder.duplicateOf", {
                  name: f.names.routine(source.slug, source.name),
                }),
              });
              setSeed((n) => n + 1);
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t("builder.duplicate")} />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <RoutineBuilder key={seed} initial={draft} />
    </Page>
  );
}
