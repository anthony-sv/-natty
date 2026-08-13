import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { CalendarIcon, CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { profileStore, setProfile } from "@/features/profile/profile-store";
import { useDateFormat, useT } from "@/i18n/use-t";
import { LENGTH_UNITS, type LengthUnit } from "@/lib/units";
import { logMeasurement } from "../collection";
import {
  DEFAULT_TRACKED_SITES,
  isPaired,
  measurementSiteSchema,
  seriesKey,
  type Measurement,
  type MeasurementSite,
} from "../schema";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/**
 * A tape session: one date, one unit, a row per site you measure.
 *
 * **Not a form per measurement.** You take a tape round five places in one go,
 * and asking for the date five times would be five chances to file them under
 * different days — which would then draw five one-point series instead of one
 * session. Every filled box becomes its own row at save time; the flat storage
 * shape is what makes that free.
 *
 * Deliberately **not** a TanStack Form, unlike every other flat form here. The
 * field set is derived from a preference and changes as you add sites, so
 * there's no fixed shape to validate against — and the only validation is "is
 * this a positive number", per box. Same call `RoutineBuilder` makes.
 *
 * **The form is the list.** An earlier version had two modes — your usual
 * sites, or all nine — with a row of toggles that only took effect in the mode
 * you weren't looking at, so they appeared to do nothing at all. Now there is
 * one list: the sites you measure, each removable, with a menu to add another.
 * Sidedness is per site for the same reason: measuring both arms and one thigh
 * is normal, and one switch for all four paired sites is a question with no
 * right answer.
 */
export function MeasurementForm({ rows }: { rows: Measurement[] }) {
  const t = useT();
  const dateFormat = useDateFormat(DATE_OPTIONS);
  const profile = useStore(profileStore);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Lazily, not during render — the purity lint rule rejects Date.now() there.
  const [defaultDate] = useState(() => Date.now());
  const [measuredAt, setMeasuredAt] = useState(defaultDate);

  // The unit you last used, so a tape marked in inches stays in inches without
  // a per-site setting. Same trick the set logger plays with kg/lb.
  const [unit, setUnit] = useState<LengthUnit>(rows[0]?.unit ?? "cm");
  const [values, setValues] = useState<Record<string, string>>({});

  const known = (site: string): site is MeasurementSite =>
    (measurementSiteSchema.options as readonly string[]).includes(site);

  const tracked = (profile.trackedSites ?? DEFAULT_TRACKED_SITES).filter(known);
  const sided = new Set(
    // Seeded from the switch this replaced, so an existing preference survives
    // one more load rather than silently turning itself off.
    (profile.sidedSites ?? (profile.trackSides === true ? tracked : []))
      .filter(known)
      .filter(isPaired),
  );
  const untracked = measurementSiteSchema.options.filter(
    (site) => !tracked.includes(site),
  );

  /** One input: a site, and a side on the ones you've asked to split. */
  const boxes = tracked.flatMap((site): { site: MeasurementSite; side?: "left" | "right" }[] =>
    sided.has(site)
      ? [
          { site, side: "left" },
          { site, side: "right" },
        ]
      : [{ site }],
  );

  const filled = boxes.filter(({ site, side }) => {
    const raw = values[seriesKey(site, side)];
    return raw !== undefined && raw.trim() !== "" && Number(raw) > 0;
  });

  function save() {
    if (filled.length === 0) return;
    for (const { site, side } of filled) {
      logMeasurement({
        measuredAt,
        site,
        side,
        value: Number(values[seriesKey(site, side)]),
        unit,
      });
    }
    toast.add({
      title: t.plural("measure.saved", filled.length),
      type: "success",
    });
    setValues({});
  }

  const setTracked = (next: MeasurementSite[]) =>
    setProfile({ trackedSites: next });

  const setSided = (next: Set<MeasurementSite>) =>
    setProfile({ sidedSites: [...next], trackSides: undefined });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-auto">
          <FieldLabel htmlFor="measure-date">{t("common.date")}</FieldLabel>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger
              render={
                <Button
                  id="measure-date"
                  variant="outline"
                  className="justify-start font-normal"
                >
                  <CalendarIcon data-icon="inline-start" />
                  {dateFormat.format(new Date(measuredAt))}
                </Button>
              }
            />
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={new Date(measuredAt)}
                disabled={{ after: new Date() }}
                onSelect={(date) => {
                  if (date) setMeasuredAt(date.getTime());
                  setDatePickerOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </Field>

        <Field className="w-auto">
          <FieldLabel htmlFor="measure-unit">{t("measure.unit")}</FieldLabel>
          <Select
            items={LENGTH_UNITS}
            value={unit}
            onValueChange={(value) => setUnit(value as LengthUnit)}
          >
            <SelectTrigger id="measure-unit" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LENGTH_UNITS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {tracked.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("measure.noneTracked")}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {tracked.map((site) => (
          <SiteRow
            key={site}
            site={site}
            unit={unit}
            isSided={sided.has(site)}
            values={values}
            onValue={(key, value) =>
              setValues((previous) => ({ ...previous, [key]: value }))
            }
            onToggleSides={(on) => {
              const next = new Set(sided);
              if (on) next.add(site);
              else next.delete(site);
              setSided(next);
            }}
            onRemove={() => setTracked(tracked.filter((entry) => entry !== site))}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={filled.length === 0}>
          <CheckIcon data-icon="inline-start" />
          {t("measure.save")}
        </Button>

        {/* One site at a time, from a menu of what you don't already have —
            rather than a wall of nine toggles that were only readable as
            "everything, or nothing". */}
        {untracked.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline">
                  <PlusIcon data-icon="inline-start" />
                  {t("measure.addSite")}
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-auto min-w-48">
              <DropdownMenuGroup>
                {untracked.map((site) => (
                  <DropdownMenuItem
                    key={site}
                    onClick={() => setTracked([...tracked, site])}
                  >
                    {t(`measure.site.${site}` as never)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}

/**
 * One site's inputs, with the two controls that belong to it: whether it's
 * measured as a pair, and whether it stays on the form at all.
 *
 * Both sit on the row rather than in a settings block, because that's where
 * you are when you decide — tape in hand, looking at the box you're about to
 * fill.
 */
function SiteRow({
  site,
  unit,
  isSided,
  values,
  onValue,
  onToggleSides,
  onRemove,
}: {
  site: MeasurementSite;
  unit: LengthUnit;
  isSided: boolean;
  values: Record<string, string>;
  onValue: (key: string, value: string) => void;
  onToggleSides: (on: boolean) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const sides: ("left" | "right" | undefined)[] = isSided
    ? ["left", "right"]
    : [undefined];

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
      <span className="min-w-28 pb-2 text-sm font-medium">
        {t(`measure.site.${site}` as never)}
      </span>

      {sides.map((side) => {
        const key = seriesKey(site, side);
        return (
          <Field key={key} className="w-32">
            {/* Labelled only when split — an unsided row's heading is already
                the site name to its left. */}
            {side !== undefined ? (
              <FieldLabel htmlFor={`measure-${key}`} className="text-xs">
                {t(`measure.side.${side}` as never)}
              </FieldLabel>
            ) : null}
            <Input
              id={`measure-${key}`}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              placeholder={unit}
              value={values[key] ?? ""}
              onChange={(e) => onValue(key, e.target.value)}
            />
          </Field>
        );
      })}

      <div className="ml-auto flex items-center gap-3">
        {/* Only on the sites there are two of. A waist has no left and right,
            and offering the switch there would be a question with no answer. */}
        {isPaired(site) ? (
          <div className="flex items-center gap-2">
            <Switch
              id={`sides-${site}`}
              checked={isSided}
              onCheckedChange={onToggleSides}
            />
            <Label htmlFor={`sides-${site}`} className="text-xs font-normal">
              {t("measure.bothSides")}
            </Label>
          </div>
        ) : null}

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label={t("measure.removeSite", {
            site: t(`measure.site.${site}` as never),
          })}
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
