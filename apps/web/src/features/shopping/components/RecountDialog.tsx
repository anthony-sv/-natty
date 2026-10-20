import { useState } from "react";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useT } from "@/i18n/use-t";
import { recountStock } from "../collection";
import { formatStockAmount } from "../format";
import type { StockStatus } from "../shopping";

export type RecountMode = "bought" | "left";

/**
 * The two ways a count gets corrected: "I bought N packages" and "there's
 * this much left". One dialog because they're one write — a fresh count —
 * phrased from the end you're standing at.
 *
 * A pair of plain inputs, not a TanStack Form: one number, no cross-field
 * rules, and the dialog closes on submit.
 */
export function RecountDialog({
  status,
  mode,
  suggestedPackages = 1,
  onClose,
}: {
  status: StockStatus | undefined;
  mode: RecountMode;
  suggestedPackages?: number;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={status !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {status !== undefined ? (
          <RecountBody
            // Re-seeded per item, rather than reset in an effect.
            key={`${status.item.id}-${mode}`}
            status={status}
            mode={mode}
            suggestedPackages={suggestedPackages}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RecountBody({
  status,
  mode,
  suggestedPackages,
  onClose,
}: {
  status: StockStatus;
  mode: RecountMode;
  suggestedPackages: number;
  onClose: () => void;
}) {
  const t = useT();
  const { item, remaining } = status;
  const [value, setValue] = useState(() =>
    mode === "bought" ? String(suggestedPackages) : String(Math.round(remaining)),
  );
  const number = Number(value);
  const valid = value.trim() !== "" && number >= 0 && (mode === "left" || number > 0);
  const next = mode === "bought" ? remaining + number * item.packageSize : number;

  const save = (amount: number) => {
    const transaction = recountStock(item.id, amount);
    void toast.promise(transaction.isPersisted.promise, {
      loading: t("shopping.saving"),
      success: {
        title: t("shopping.recounted", {
          name: item.name,
          amount: formatStockAmount(amount, item.unit, t),
        }),
        type: "success",
      },
      error: { title: t("shopping.saveError"), type: "error" },
    });
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {mode === "bought"
            ? t("shopping.boughtTitle", { name: item.name })
            : t("shopping.leftTitle", { name: item.name })}
        </DialogTitle>
        <DialogDescription>
          {t("shopping.appThinks", { amount: formatStockAmount(remaining, item.unit, t) })}
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) save(next);
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="recount-value">
              {mode === "bought"
                ? t("shopping.packagesBought", {
                    size: formatStockAmount(item.packageSize, item.unit, t),
                  })
                : t("shopping.amountLeft", { unit: t(`shopping.unit.${item.unit}`) })}
            </FieldLabel>
            <Input
              id="recount-value"
              type="number"
              min="0"
              step={mode === "bought" ? "1" : "any"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {valid ? (
              <FieldDescription>
                {t("shopping.willHave", { amount: formatStockAmount(next, item.unit, t) })}
              </FieldDescription>
            ) : null}
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!valid}>
              <CheckIcon data-icon="inline-start" />
              {t("shopping.save")}
            </Button>
            {mode === "left" ? (
              <Button type="button" variant="outline" onClick={() => save(0)}>
                {t("shopping.markEmpty")}
              </Button>
            ) : null}
          </div>
        </FieldGroup>
      </form>
    </>
  );
}
