import { useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import {
  ArrowUpCircleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleAlertIcon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NUTRIENT_UNITS, type MealItem } from "@/data/diets";
import { profileStore } from "@/features/profile/profile-store";
import { useT, type MessageKey } from "@/i18n/use-t";
import { FIBER_FLAT_AI, FIBER_G_PER_1000_KCAL, type FoodSource } from "../macros";
import {
  categoryScores,
  dayNutrients,
  nutrientRows,
  type Category,
  type NutrientRow,
  type NutrientStatus,
  type ReportKey,
} from "../micronutrients";

/**
 * Vitamins, minerals and electrolytes for a day's food, as category scores
 * over a full table.
 *
 * The scores are the glance — "vitamins 100%, electrolytes 71%" — and the
 * table is the answer to *which one*. Both read the same rows, so they can't
 * disagree.
 *
 * Bars, not a chart: one series of magnitudes against a fixed 0–100% scale,
 * each directly labelled, so they're HTML in a single neutral ink the way the
 * volume bars are. Status in the table is an icon *and* a word, never colour
 * alone; the four status colours are the reserved `--status-*` tokens.
 */
export function NutritionScores({
  items,
  foods,
  description,
}: {
  items: MealItem[];
  foods: FoodSource;
  /** What these items are — "Monday's plan", "what you ate today". */
  description: string;
}) {
  const t = useT();
  const profileSex = useStore(profileStore, (state) => state.sex);
  const sex = profileSex ?? "male";

  const { day, rows, scores } = useMemo(() => {
    const day = dayNutrients(items, foods);
    const rows = nutrientRows(day, sex);
    return { day, rows, scores: categoryScores(rows) };
  }, [items, foods, sex]);

  const fiber = rows.find((row) => row.key === "fiber")!;
  const coverage = Math.round(day.coverage * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("scores.title")}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Fibre leads, on its own line: it's the one the plan states a
            target for, and the one with a rule worth spelling out. */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium">{t("nutrition.fibre")}</span>
            <span className="text-sm tabular-nums">
              <span className="font-semibold">{fiber.amount.toFixed(1)} g</span>
              <span className="text-muted-foreground">
                {" "}
                / {fiber.target.toFixed(0)} g
              </span>
            </span>
          </div>
          <Bar ratio={fiber.ratio} label={t("nutrition.fibre")} />
          <p className="text-xs text-muted-foreground">
            {t("scores.fiberRule", {
              perThousand: FIBER_G_PER_1000_KCAL,
              male: FIBER_FLAT_AI.male,
              female: FIBER_FLAT_AI.female,
            })}
          </p>
        </div>

        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {SCORE_ORDER.map((key) => (
            <div key={key} className="flex min-w-0 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-sm">
                  {t(`scores.category.${key}` as MessageKey)}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {Math.round(scores[key] * 100)}%
                </span>
              </div>
              <Bar
                ratio={scores[key]}
                label={t(`scores.category.${key}` as MessageKey)}
              />
            </div>
          ))}
        </div>

        <Collapsible>
          <CollapsibleTrigger
            render={
              <Button variant="ghost" size="sm" className="group -ml-2 w-fit" />
            }
          >
            <ChevronDownIcon
              data-icon="inline-start"
              className="transition-transform group-data-[panel-open]:rotate-180"
            />
            {t("scores.everyNutrient")}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <NutrientTable rows={rows} />
          </CollapsibleContent>
        </Collapsible>

        <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-muted-foreground">
          <li>{t("scores.estimates")}</li>
          {coverage < 100 ? (
            <li>{t("scores.coverage", { percent: coverage })}</li>
          ) : null}
          <li>{t("scores.sodium")}</li>
          <li>
            {profileSex === undefined
              ? t("scores.sexUnset")
              : t(`scores.sex.${profileSex}` as MessageKey)}
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

const SCORE_ORDER: Array<Category | "all"> = [
  "all",
  "vitamins",
  "minerals",
  "electrolytes",
  "immune",
  "antioxidants",
  "bone",
  "metabolism",
  "heart",
];

/** One magnitude on a fixed 0–100% track. Over 100% simply fills it. */
function Bar({ ratio, label }: { ratio: number; label: string }) {
  const percent = Math.round(Math.min(ratio, 1) * 100);
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-muted"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div
        className="h-full rounded-full bg-foreground/70"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

const STATUS: Record<
  NutrientStatus,
  { icon: typeof CheckCircle2Icon; color: string }
> = {
  met: { icon: CheckCircle2Icon, color: "var(--status-good)" },
  close: { icon: CircleAlertIcon, color: "var(--status-warning)" },
  low: { icon: XCircleIcon, color: "var(--status-critical)" },
  high: { icon: ArrowUpCircleIcon, color: "var(--status-serious)" },
};

function unitOf(key: ReportKey): string {
  return key === "fiber" ? "g" : NUTRIENT_UNITS[key];
}

/** Enough digits to tell 0.4 µg from 0 without printing 1,280.0 mg. */
function amount(value: number): string {
  if (value >= 100) return Math.round(value).toLocaleString();
  if (value >= 10) return value.toFixed(0);
  return value.toFixed(1);
}

function NutrientTable({ rows }: { rows: NutrientRow[] }) {
  const t = useT();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("scores.nutrient")}</TableHead>
          <TableHead className="text-right">{t("scores.youGet")}</TableHead>
          <TableHead className="text-right">{t("scores.target")}</TableHead>
          <TableHead>{t("scores.status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const { icon: Icon, color } = STATUS[row.status];
          const unit = unitOf(row.key);
          return (
            <TableRow key={row.key}>
              <TableCell className="whitespace-normal">
                {t(`scores.nutrientName.${row.key}` as MessageKey)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {amount(row.amount)} {unit}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {amount(row.target)} {unit}
              </TableCell>
              <TableCell>
                {/* The word and the percentage only from `sm` up: four columns
                    of Spanish don't fit a phone. The icon still says it — it
                    carries the word as its accessible name and differs in
                    shape, so status is never colour alone — and the percentage
                    is the two figures beside it. */}
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <Icon
                    className="size-4 shrink-0"
                    style={{ color }}
                    role="img"
                    aria-label={t(`scores.statusLabel.${row.status}` as MessageKey)}
                  />
                  <span className="hidden sm:inline">
                    {t(`scores.statusLabel.${row.status}` as MessageKey)}
                  </span>
                  <span className="hidden text-muted-foreground tabular-nums sm:inline">
                    {Math.round(row.ratio * 100)}%
                  </span>
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
