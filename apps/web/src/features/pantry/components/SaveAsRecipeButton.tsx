import { useState } from "react";
import { BookmarkPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MealItem } from "@/data/diets";
import { useT } from "@/i18n/use-t";
import type { Recipe } from "../schema";
import { RecipeForm } from "./RecipeForm";

/**
 * Turns a meal's ingredient list into a saved recipe, and the meal into one
 * line that references it.
 *
 * A meal you've typed out by hand is the same information a recipe is —
 * ingredients plus how much of each — so there's no new form here, just
 * `RecipeForm` seeded with what's already on the page. What's new is what
 * happens after: `onSaved` folds the meal down to a single item pointing at
 * the recipe, at whatever amount reproduces the same total it had a moment
 * ago (see the call site — `recipeAsFood`'s two portionings need different
 * arithmetic to land on "the whole thing"), so saving a recipe here reads as
 * compressing a line, not swapping in a different meal.
 */
export function SaveAsRecipeButton({
  items,
  initialName,
  onSaved,
}: {
  items: MealItem[];
  initialName?: string;
  onSaved: (recipe: Recipe) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={items.length === 0}
        onClick={() => setOpen(true)}
      >
        <BookmarkPlusIcon data-icon="inline-start" />
        {t("dietBuilder.saveAsRecipe")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("pantry.addRecipe")}</DialogTitle>
            <DialogDescription>{t("pantry.body")}</DialogDescription>
          </DialogHeader>
          {/* Keyed so opening it again after cancelling starts from these
              ingredients again, rather than whatever was typed last time. */}
          <RecipeForm
            key={String(open)}
            initialName={initialName}
            initialIngredients={items}
            onDone={(recipe) => {
              setOpen(false);
              if (recipe) onSaved(recipe);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
