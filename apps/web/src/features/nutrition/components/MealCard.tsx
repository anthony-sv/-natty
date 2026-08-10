import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getFood } from "@/data/diets";
import { useNames } from "@/i18n/names";
import { useT } from "@/i18n/use-t";
import { macrosForItem } from "../macros";
import type { ResolvedMeal } from "../macros";

/**
 * One meal: what to eat, how it's weighed, and what it comes to.
 *
 * The share bar is the point of the header — a meal's calories mean little
 * until you know it's a third of the day.
 */
export function MealCard({
  meal,
  dayKcal,
  onChooseOption,
}: {
  meal: ResolvedMeal;
  /** The day's total, so the header can show this meal's share of it. */
  dayKcal: number;
  onChooseOption: (index: number) => void;
}) {
  const t = useT();
  const names = useNames();
  const share = dayKcal > 0 ? (meal.kcal / dayKcal) * 100 : 0;
  const options = meal.variant.options;
  const hasSwaps = options.length > 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <CardTitle className="flex flex-wrap items-center gap-2">
            {names.text(meal.name)}
            {meal.variant.label ? (
              <Badge variant="secondary">{names.text(meal.variant.label)}</Badge>
            ) : null}
          </CardTitle>
          <span className="text-sm text-muted-foreground tabular-nums">
            P{meal.macros.protein.toFixed(0)} · C{meal.macros.carbs.toFixed(0)} ·
            F{meal.macros.fat.toFixed(0)} ·{" "}
            <span className="font-medium text-foreground">
              {Math.round(meal.kcal).toLocaleString()} kcal
            </span>
          </span>
        </div>
        {meal.note ? (
          <CardDescription>{names.text(meal.note)}</CardDescription>
        ) : null}

        {/* Share of the day, as a slim track rather than another number. */}
        <div className="pt-1">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={t("nutrition.mealShare", {
              percent: share.toFixed(0),
            })}
          >
            <div
              className="h-full rounded-full bg-foreground/60"
              style={{ width: `${share}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("nutrition.mealShare", { percent: share.toFixed(0) })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {hasSwaps ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">
              {t("nutrition.swapHint")}
            </span>
            <ToggleGroup
              value={[String(meal.optionIndex)]}
              onValueChange={(value) => {
                const next = Number(value[0]);
                if (Number.isInteger(next)) onChooseOption(next);
              }}
              className="flex-wrap"
            >
              {options.map((option, index) => (
                <ToggleGroupItem key={option.label ?? index} value={String(index)}>
                  {names.text(option.label) ??
                    t("nutrition.option", { number: index + 1 })}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">{t("nutrition.amount")}</TableHead>
              <TableHead>{t("nutrition.item")}</TableHead>
              <TableHead className="text-right">P</TableHead>
              <TableHead className="text-right">C</TableHead>
              <TableHead className="text-right">F</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meal.items.map((item, index) => {
              const food = getFood(item.foodId);
              const macros = macrosForItem(item);
              return (
                <TableRow key={`${item.foodId}-${index}`}>
                  <TableCell className="align-top font-medium tabular-nums">
                    {item.amount}
                    {food.unit === "unit" ? "" : ` ${food.unit}`}
                  </TableCell>
                  <TableCell className="align-top whitespace-normal">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{names.food(item.foodId)}</span>
                      {/* The single most important word on the row: 343g raw
                          and 150g cooked are different instructions. */}
                      {food.state ? (
                        <Badge
                          variant={food.state === "raw" ? "destructive" : "outline"}
                          className="uppercase"
                        >
                          {food.state === "raw"
                            ? t("nutrition.raw")
                            : t("nutrition.cooked")}
                        </Badge>
                      ) : null}
                    </span>
                    {(item.note ?? food.unitNote) !== undefined ? (
                      <span className="block text-xs text-muted-foreground">
                        {names.text(item.note ?? food.unitNote)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="align-top text-right tabular-nums">
                    {macros.protein.toFixed(1)}
                  </TableCell>
                  <TableCell className="align-top text-right tabular-nums">
                    {macros.carbs.toFixed(1)}
                  </TableCell>
                  <TableCell className="align-top text-right tabular-nums">
                    {macros.fat.toFixed(1)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
