import { ChevronsUpDownIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWarmupSection } from "@/data/routines";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";
import { formatPrescription } from "../lib/format";

export function WarmupBlock({ warmupRefs }: { warmupRefs: string[] }) {
  const t = useT();
  const f = useFormatting();
  const sections = warmupRefs
    .map((slug) => getWarmupSection(slug))
    .filter((s) => s !== undefined);

  if (sections.length === 0) return null;

  return (
    <Collapsible className="rounded-lg border p-3">
      <CollapsibleTrigger render={<Button variant="ghost" className="w-full justify-between" />}>
        {t("routines.warmup")}
        <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Accordion className="mt-2">
          {sections.map((section) => (
            <AccordionItem key={section.slug} value={section.slug}>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  {section.title}
                  {section.durationMinutes !== undefined ? (
                    <Badge variant="outline">
                      {Array.isArray(section.durationMinutes)
                        ? `${section.durationMinutes[0]}-${section.durationMinutes[1]} min`
                        : `${section.durationMinutes} min`}
                    </Badge>
                  ) : null}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="flex flex-col gap-2">
                  {section.moves.map((move, i) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {move.name}
                        {move.purpose ? (
                          <span className="block text-xs text-muted-foreground">
                            {move.purpose}
                          </span>
                        ) : null}
                      </span>
                      {move.sets !== undefined || move.durationSeconds !== undefined ? (
                        <Badge variant="secondary">
                          {formatPrescription(
                            {
                              sets: move.sets ?? 1,
                              reps: move.reps,
                              durationSeconds: move.durationSeconds,
                              perSide: move.perSide,
                            },
                            f,
                          )}
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CollapsibleContent>
    </Collapsible>
  );
}
