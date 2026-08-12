import { Badge } from "@/components/ui/badge";
import type { Prescription } from "@/data/routines";
import { useFormatting } from "@/i18n/use-formatting";
import { useT } from "@/i18n/use-t";
import { formatModifiers, formatPrescription } from "../lib/format";

export function PrescriptionBadges({
  prescriptions,
  isFinisher,
}: {
  prescriptions: Prescription[];
  isFinisher?: boolean;
}) {
  const f = useFormatting();
  const t = useT();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {prescriptions.map((p, i) => (
        // A phase and its techniques stay on one row, so a ramp that only
        // applies them to its last phase reads correctly.
        <span key={i} className="flex flex-wrap items-center gap-1.5">
          {/* Before its own chip, so "2×8-12 · 60s rest" is read as the
              warmup's numbers rather than as working sets. The player says
              this on the card; the day list has to say it too, or a warmup
              written as its own entry looks like a duplicate exercise. */}
          {p.isWarmup === true ? (
            <Badge variant="outline">{t("routines.warmupSet")}</Badge>
          ) : null}
          <Badge
            variant={
              p.isWarmup === true
                ? "outline"
                : isFinisher
                  ? "default"
                  : "secondary"
            }
          >
            {formatPrescription(p, f)}
          </Badge>
          {p.modifiers
            ? formatModifiers(p.modifiers, f).map((label) => (
                <Badge key={label} variant="destructive">
                  {label}
                </Badge>
              ))
            : null}
        </span>
      ))}
    </div>
  );
}
