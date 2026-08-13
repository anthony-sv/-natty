import { formatWeightValue } from "@/lib/units";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLiveQuery } from "@tanstack/react-db";
import { useStore } from "@tanstack/react-store";
import {
  ChevronRightIcon,
  FlameIcon,
  RulerIcon,
  ScaleIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react";
import { useBodyEntries } from "@/features/body/collection";
import { ffmi, formatIndex, leanMassKg } from "@/features/body/ffmi";
import { weeklyAverages, weekOverWeek } from "@/features/body/weekly";
import { useIntake } from "@/features/intake/use-intake";
import { resolveIntake, tickedMeals } from "@/features/intake/intake";
import { loggedSetsFork } from "@/features/log/collection";
import { toCalendar } from "@/features/log/heatmap";
import { useAllRecords } from "@/features/log/queries";
import { useMeasurements } from "@/features/measurements/collection";
import {
  orderSeries,
  toSeries,
  type SiteSeries,
} from "@/features/measurements/measurements";
import {
  measurementSiteSchema,
  type MeasurementSite,
} from "@/features/measurements/schema";
import {
  effectiveTargetKcal,
  variantForDay,
  weekdayOf,
} from "@/features/nutrition/macros";
import { useDiets } from "@/features/nutrition/use-diets";
import { usePantry } from "@/features/pantry/use-pantry";
import { profileStore } from "@/features/profile/profile-store";
import { useT } from "@/i18n/use-t";
import { startOfDay } from "@/lib/week";
import { cn } from "@/lib/utils";

/**
 * The index, as four things the app knows about you.
 *
 * **A card carries its own numbers and is its own link.** The page used to be
 * a flat strip of four totals over a grid of link cards whose entire content
 * was a sentence describing the route — so the half with data said very little
 * and the half with words said nothing you couldn't read off the sidebar.
 *
 * An area with nothing in it still gets its card, showing the one thing you'd
 * do to start it. That's the other half of what a home screen is for: a first
 * run should say what the app *can* do, and a card that hides itself can't.
 */

/** A year, matching the heatmap the training card's streak is read from. */
const STREAK_WEEKS = 52;

/**
 * What the measurements card leads with, ahead of the head-to-foot order the
 * measurements tab reads down.
 *
 * Arms and waist are the two the card exists for — one for what you're
 * building and one for what you'd rather not be, which is the same pair
 * `DEFAULT_TRACKED_SITES` opens the form on. Head-to-foot puts neck, shoulders
 * and chest first, so tracking any of them would push both off a card that
 * only shows three.
 */
const HOME_SITES: readonly MeasurementSite[] = [
  "upperArm",
  "waist",
  ...measurementSiteSchema.options.filter(
    (site) => site !== "upperArm" && site !== "waist",
  ),
];

export function HomeCards() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <TrainingCard />
      <BodyCard />
      <MeasurementsCard />
      <FoodCard />
    </div>
  );
}

function TrainingCard() {
  const t = useT();
  const { rows, loggedSetCount } = useAllRecords();
  const loggedSets = loggedSetsFork.useActive();
  const { data } = useLiveQuery((q) => q.from({ set: loggedSets }), [loggedSets]);
  const [now] = useState(() => Date.now());

  const sets = useMemo(() => data ?? [], [data]);
  const calendar = useMemo(
    () => toCalendar(sets, { weeks: STREAK_WEEKS, now }),
    [sets, now],
  );

  // Sets in the week you're in, off the same grid the streak comes from — two
  // counts of one thing drift, which is why `summariseDay` derives from
  // `buildSteps` rather than counting prescriptions again.
  const thisWeek = calendar.weeks[calendar.weeks.length - 1] ?? [];
  const setsThisWeek = thisWeek.reduce((total, day) => total + day.sets, 0);

  if (loggedSetCount === 0) {
    return (
      <HomeCard
        icon={FlameIcon}
        title={t("home.training")}
        to="/routines"
        empty={t("home.training.empty")}
      />
    );
  }

  return (
    <HomeCard
      icon={FlameIcon}
      title={t("home.training")}
      to="/progress"
      search={{ tab: "history" }}
      headline={t.plural("home.streakDays", calendar.currentStreak)}
      lines={[
        t.plural("home.setsThisWeek", setsThisWeek),
        t.plural("home.recordsHeld", rows.length),
      ]}
    />
  );
}

function BodyCard() {
  const t = useT();
  const { entries, latest } = useBodyEntries();
  const profile = useStore(profileStore);
  const [now] = useState(() => Date.now());

  const unit = latest?.unit ?? "kg";
  const change = useMemo(
    () => weekOverWeek(weeklyAverages(entries, unit, now)),
    [entries, unit, now],
  );

  if (latest === undefined) {
    return (
      <HomeCard
        icon={ScaleIcon}
        title={t("home.body")}
        to="/progress"
        search={{ tab: "body" }}
        empty={t("home.body.empty")}
      />
    );
  }

  const index = ffmi(latest, profile.heightCm);
  const lean = leanMassKg(latest);

  return (
    <HomeCard
      icon={ScaleIcon}
      title={t("home.body")}
      to="/progress"
      search={{ tab: "body" }}
      headline={`${formatWeightValue(latest.weight)} ${latest.unit}`}
      // Each line is dropped rather than shown as a dash: a card of "—" is
      // worse than a shorter card, and body fat is genuinely optional.
      lines={[
        change?.deltaWeight === undefined
          ? undefined
          : t("home.weekAverage", {
              weight: `${change.latest.weight.toFixed(1)} ${unit}`,
              delta: `${change.deltaWeight > 0 ? "+" : change.deltaWeight < 0 ? "−" : ""}${Math.abs(change.deltaWeight).toFixed(1)}`,
            }),
        latest.bodyFatPercent === undefined
          ? t("home.noBodyFat")
          : t("home.bodyFat", { percent: latest.bodyFatPercent.toFixed(1) }),
        // FFMI needs a height, and says so rather than vanishing — it's one
        // field away and the card is where you'd find that out.
        index === undefined
          ? lean === undefined
            ? undefined
            : t("home.needHeight")
          : t("home.ffmi", { value: formatIndex(index) }),
      ]}
    />
  );
}

function MeasurementsCard() {
  const t = useT();
  const { rows } = useMeasurements();

  const series = useMemo(() => orderSeries(toSeries(rows), HOME_SITES), [rows]);

  // A left and a right arm are two series, and arms are what this card leads
  // with — so the side has to be on the label or the card shows two rows
  // reading "Upper arm" with different numbers.
  const label = (entry: SiteSeries) =>
    entry.side === undefined
      ? t(`measure.site.${entry.site}` as never)
      : t("measure.siteSide", {
          site: t(`measure.site.${entry.site}` as never),
          side: t(`measure.side.${entry.side}` as never),
        });

  if (series.length === 0) {
    return (
      <HomeCard
        icon={RulerIcon}
        title={t("home.measurements")}
        to="/progress"
        search={{ tab: "measurements" }}
        empty={t("home.measurements.empty")}
      />
    );
  }

  // Three, and the headline is the first — a card is a glance, and the full
  // list is one tap away on the tab this links to.
  const [first, ...rest] = series.slice(0, 3);

  return (
    <HomeCard
      icon={RulerIcon}
      title={t("home.measurements")}
      to="/progress"
      search={{ tab: "measurements" }}
      headline={`${first.latest.toFixed(1)} ${first.unit}`}
      headlineHint={label(first)}
      lines={[
        first.change === undefined
          ? undefined
          : t("home.sinceStart", {
              delta: `${first.change >= 0 ? "+" : "−"}${Math.abs(first.change).toFixed(1)}`,
              unit: first.unit,
            }),
        // The rest carry their own change too. Waist is nearly always one of
        // them, and a waist figure without a direction is the least useful
        // number on the page — it's the one you're watching move.
        ...rest.map((entry) =>
          t("home.siteValue", {
            site: label(entry),
            value:
              entry.change === undefined
                ? `${entry.latest.toFixed(1)} ${entry.unit}`
                : `${entry.latest.toFixed(1)} ${entry.unit} (${entry.change >= 0 ? "+" : "−"}${Math.abs(entry.change).toFixed(1)})`,
          }),
        ),
      ]}
    />
  );
}

function FoodCard() {
  const t = useT();
  const { entries } = useIntake();
  const { plans } = useDiets();
  const pantry = usePantry();
  const [now] = useState(() => Date.now());

  const plan = plans[0]?.plan;
  const today = startOfDay(now);

  const resolved = useMemo(
    () => (plan === undefined ? undefined : resolveIntake(entries, plan, pantry, today)),
    [entries, plan, pantry, today],
  );

  if (plan === undefined || resolved === undefined) return null;

  const target = effectiveTargetKcal(plan);
  const ticked = tickedMeals(entries, plan.slug, today).size;
  // Meals the plan prescribes *today* — a weekday variant changes the count,
  // so it can't be taken from the plan once.
  const available = plan.meals.filter(
    (meal) => variantForDay(meal.variants, weekdayOf(new Date(today))) !== undefined,
  ).length;

  if (resolved.meals.length === 0 && resolved.extras.length === 0) {
    return (
      <HomeCard
        icon={UtensilsIcon}
        title={t("home.food")}
        to="/nutrition"
        search={{ tab: "today" }}
        empty={
          available > 0
            ? t.plural("home.food.emptyMeals", available)
            : t("home.food.empty")
        }
      />
    );
  }

  return (
    <HomeCard
      icon={UtensilsIcon}
      title={t("home.food")}
      to="/nutrition"
      search={{ tab: "today" }}
      headline={
        target === undefined
          ? `${Math.round(resolved.kcal).toLocaleString()} kcal`
          : t("home.kcalOfTarget", {
              eaten: Math.round(resolved.kcal).toLocaleString(),
              target: Math.round(target.kcal).toLocaleString(),
            })
      }
      lines={[
        available > 0
          ? t("home.mealsTicked", { ticked, total: available })
          : undefined,
        t("home.macrosSoFar", {
          protein: Math.round(resolved.totals.protein),
          carbs: Math.round(resolved.totals.carbs),
          fat: Math.round(resolved.totals.fat),
        }),
      ]}
    />
  );
}

/**
 * One area, as a card you can press.
 *
 * The whole card is the link rather than a button inside it: the target is the
 * thing you're already looking at, and a small "open" affordance in a corner
 * is a smaller tap target for no gain.
 */
function HomeCard({
  icon: Icon,
  title,
  to,
  search,
  headline,
  headlineHint,
  lines,
  empty,
}: {
  icon: LucideIcon;
  title: string;
  to: string;
  search?: Record<string, string>;
  headline?: string;
  /** Sits beside the headline — which measurement it is, say. */
  headlineHint?: string;
  /** `undefined` entries are dropped, so a missing figure shortens the card. */
  lines?: (string | undefined)[];
  /** Shown instead of the numbers when there's nothing yet. */
  empty?: string;
}) {
  const shown = (lines ?? []).filter((line): line is string => line !== undefined);

  return (
    <Link
      to={to}
      search={search}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-4 transition-colors",
        "hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
        <ChevronRightIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </div>

      {empty !== undefined ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-semibold tabular-nums">{headline}</span>
            {headlineHint !== undefined ? (
              <span className="text-sm text-muted-foreground">{headlineHint}</span>
            ) : null}
          </div>
          {shown.length > 0 ? (
            <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground tabular-nums">
              {shown.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </Link>
  );
}
