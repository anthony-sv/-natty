import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/i18n/use-t";
import type { UserFood } from "../schema";
import { UserFoodForm } from "./UserFoodForm";

/**
 * What a food picker's empty state offers instead of just "not found".
 *
 * A search coming up empty is the moment you discover a food is missing —
 * the same reasoning `RoutineBuilder`'s exercise picker inlines a create
 * button on. Foods can't take that component's shortcut of writing sensible
 * defaults and letting you fix them later, though: a "fixed later" macro is a
 * silent zero sitting in a meal total, not a cosmetic wrong muscle group. So
 * this opens the real editor (`UserFoodForm`) rather than inserting a
 * placeholder — you still land back in the meal you were building, just
 * after typing three numbers instead of never.
 *
 * **Two components, not one, and the split matters.** The dialog can't be
 * rendered from inside `ComboboxEmpty` — it did, at first, and typing into
 * the dialog's own inputs closed it: the dialog's content portals outside
 * the combobox's popover, the popover reads that focus move as "interaction
 * left me" and closes itself, and closing unmounts everything the popover
 * was rendering, dialog included, out from under whatever you'd typed. So
 * `CreateFoodTrigger` — a plain button — is the only thing that goes inside
 * `ComboboxEmpty`; `CreateFoodDialog` is controlled from outside and rendered
 * as a sibling of the `Combobox` itself, where the popover closing behind it
 * doesn't touch it.
 */
export function CreateFoodTrigger({
  query,
  onClick,
}: {
  query: string;
  onClick: () => void;
}) {
  const t = useT();
  const name = query.trim();

  // Same floor the exercise picker uses — a single stray character isn't
  // someone naming a food, it's someone still typing.
  if (name.length < 2) return null;

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick}>
      <PlusIcon data-icon="inline-start" />
      {t("pantry.createNamed", { name })}
    </Button>
  );
}

export function CreateFoodDialog({
  open,
  onOpenChange,
  initialName,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What was typed into the picker, seeding the new food's name. */
  initialName: string;
  onCreated: (food: UserFood) => void;
}) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("pantry.addFood")}</DialogTitle>
          <DialogDescription>{t("pantry.body")}</DialogDescription>
        </DialogHeader>
        {/* Keyed so a second "add it" for a different search starts from
            that query rather than whatever the dialog last held. */}
        <UserFoodForm
          key={initialName}
          initialName={initialName}
          onDone={(food) => {
            onOpenChange(false);
            if (food) onCreated(food);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
