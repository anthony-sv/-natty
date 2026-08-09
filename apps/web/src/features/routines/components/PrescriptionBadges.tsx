import { Badge } from "@/components/ui/badge";
import type { Prescription } from "@/data/routines";
import { formatModifiers, formatPrescription } from "../lib/format";

export function PrescriptionBadges({
  prescriptions,
  isFinisher,
}: {
  prescriptions: Prescription[];
  isFinisher?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {prescriptions.map((p, i) => (
        // A phase and its techniques stay on one row, so a ramp that only
        // applies them to its last phase reads correctly.
        <span key={i} className="flex flex-wrap items-center gap-1.5">
          <Badge variant={isFinisher ? "default" : "secondary"}>
            {formatPrescription(p)}
          </Badge>
          {p.modifiers
            ? formatModifiers(p.modifiers).map((label) => (
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
