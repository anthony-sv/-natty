import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import { CalendarIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

/** One input on the form. `side` is undefined on a site there's only one of. */
interface Box {
  site: MeasurementSite;
  side: "left" | "right" | undefined;
}

/**
 * A tape session: one date, one unit, a row per site you track.
 *
 * **Not a form per measurement.** You take a tape round five places in one go,
 * and asking for the date five times would be five chances to file them under
 * different days — which would then draw five one-point series instead of one
 * session. Every filled box becomes its own row at save time; the flat storage
 * shape is what makes that free.
 *
 * Deliberately **not** a TanStack Form, unlike every other flat form here. The
 * field set is derived from a preference and changes as you toggle sites, so
 * there's no fixed shape to validate against — and the only validation is "is
 * this a positive number", per box. Same call `RoutineBuilder` makes.
 */
export function MeasurementForm({ rows }: { rows: Measurement[] }) {
  const t = useT();
  const dateFormat = useDateFormat(DATE_OPTIONS);
  const profile = useStore(profileStore);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showAllSites, setShowAllSites] = useState(false);

  // Lazily, not during render — the purity lint rule rejects Date.now() there.
  const [defaultDate] = useState(() => Date.now());
  const [measuredAt, setMeasuredAt] = useState(defaultDate);

  // The unit you last used, so a tape marked in inches stays in inches without
  // a per-site setting. Same trick the set logger plays with kg/lb.
  const [unit, setUnit] = useState<LengthUnit>(rows[0]?.unit ?? "cm");
  const [values, setValues] = useState<Record<string, string>>({});

  const tracked = (profile.trackedSites ?? DEFAULT_TRACKED_SITES).filter(
    (site): site is MeasurementSite =>
      (measurementSiteSchema.options as readonly string[]).includes(site),
  );
  const trackSides = profile.trackSides ?? false;
  const visible = showAllSites ? measurementSiteSchema.options : tracked;

  /** One input per site, or two when a paired site is measured both ways. */
  const boxes: Box[] = visible.flatMap((site): Box[] =>
    trackSides && isPaired(site)
      ? [
          { site, side: "left" },
          { site, side: "right" },
        ]
      : [{ site, side: undefined }],
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

  function toggleTracked(site: MeasurementSite, on: boolean) {
    const next = on
      ? [...tracked, site]
      : tracked.filter((entry) => entry !== site);
    setProfile({ trackedSites: next });
  }

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

        <div className="flex items-center gap-2 pb-2">
          <Switch
            id="measure-sides"
            checked={trackSides}
            onCheckedChange={(on) => setProfile({ trackSides: on })}
          />
          <Label htmlFor="measure-sides" className="text-sm font-normal">
            {t("measure.trackSides")}
          </Label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {boxes.map(({ site, side }) => {
          const key = seriesKey(site, side);
          return (
            <Field key={key}>
              <FieldLabel htmlFor={`measure-${key}`}>
                {side === undefined
                  ? t(`measure.site.${site}` as never)
                  : t("measure.siteSide", {
                      site: t(`measure.site.${site}` as never),
                      side: t(`measure.side.${side}` as never),
                    })}
              </FieldLabel>
              <Input
                id={`measure-${key}`}
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder={unit}
                value={values[key] ?? ""}
                onChange={(e) =>
                  setValues((previous) => ({
                    ...previous,
                    [key]: e.target.value,
                  }))
                }
              />
            </Field>
          );
        })}
      </div>

      {/* Opting in to more sites, rather than a settings page: the moment you
          want your neck on the list is the moment you're standing there with
          the tape, not a trip somewhere else. */}
      {showAllSites ? (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
          <span className="text-sm font-medium">{t("measure.tracking")}</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {measurementSiteSchema.options.map((site) => (
              <div key={site} className="flex items-center gap-2">
                <Switch
                  id={`track-${site}`}
                  checked={tracked.includes(site)}
                  onCheckedChange={(on) => toggleTracked(site, on)}
                />
                <Label htmlFor={`track-${site}`} className="text-sm font-normal">
                  {t(`measure.site.${site}` as never)}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={save} disabled={filled.length === 0}>
          <CheckIcon data-icon="inline-start" />
          {t("measure.save")}
        </Button>
        <Button variant="ghost" onClick={() => setShowAllSites((on) => !on)}>
          {showAllSites ? t("measure.showTracked") : t("measure.showAll")}
        </Button>
      </div>
    </div>
  );
}
