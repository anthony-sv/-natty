import { Badge } from "@/components/ui/badge";
import type { Prescription } from "@/data/routines";
import { formatPrescription } from "../lib/format";

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
        <Badge key={i} variant={isFinisher ? "default" : "secondary"}>
          {formatPrescription(p)}
        </Badge>
      ))}
    </div>
  );
}
