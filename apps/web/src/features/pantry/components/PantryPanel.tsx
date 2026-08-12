import { useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import {
  ArchiveIcon,
  PencilLineIcon,
  PlusIcon,
  RotateCcwIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { backupFilename } from "@/features/backup/backup";
import { downloadBackup, exportRecipe } from "@/features/backup/use-backup";
import { kcalOf } from "@/features/nutrition/macros";
import { useT } from "@/i18n/use-t";
import {
  archiveRecipe,
  archiveUserFood,
  deleteRecipe,
  deleteUserFood,
  restoreRecipe,
  restoreUserFood,
  userFoods,
  userRecipes,
} from "../collection";
import { recipeAsFood } from "../pantry";
import type { Recipe, UserFood } from "../schema";
import { usePantry } from "../use-pantry";
import { RecipeForm } from "./RecipeForm";
import { UserFoodForm } from "./UserFoodForm";

/** Foods and recipes you wrote: add, correct, archive, restore. */
export function PantryPanel() {
  const t = useT();
  const [showArchived, setShowArchived] = useState(false);
  const [editingFood, setEditingFood] = useState<UserFood | undefined>();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [adding, setAdding] = useState<"food" | "recipe" | undefined>();

  const pantry = usePantry();
  const { data: foodRows } = useLiveQuery((q) => q.from({ f: userFoods }));
  const { data: recipeRows } = useLiveQuery((q) => q.from({ r: userRecipes }));

  const foods = (foodRows ?? []).filter(
    (f) => showArchived || f.archivedAt === undefined,
  );
  const recipes = (recipeRows ?? []).filter(
    (r) => showArchived || r.archivedAt === undefined,
  );
  const archivedCount =
    (foodRows ?? []).filter((f) => f.archivedAt !== undefined).length +
    (recipeRows ?? []).filter((r) => r.archivedAt !== undefined).length;

  /** How many recipes reference a food — what makes deleting it unsafe. */
  const usedBy = (foodId: string) =>
    (recipeRows ?? []).filter((recipe) =>
      recipe.ingredients.some((item) => item.foodId === foodId),
    ).length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("pantry.title")}</CardTitle>
          <CardDescription>{t("pantry.body")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setAdding("food")}>
                <PlusIcon data-icon="inline-start" />
                {t("pantry.addFood")}
              </Button>
              <Button variant="outline" onClick={() => setAdding("recipe")}>
                <PlusIcon data-icon="inline-start" />
                {t("pantry.addRecipe")}
              </Button>
            </div>
            {archivedCount > 0 ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="pantry-archived"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
                <Label htmlFor="pantry-archived" className="text-sm font-normal">
                  {t("pantry.showArchived")}
                </Label>
              </div>
            ) : null}
          </div>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("pantry.recipes")}</h3>
            {recipes.length === 0 ? (
              <Empty>
                <EmptyTitle>{t("pantry.empty.recipes")}</EmptyTitle>
                <EmptyDescription>{t("pantry.empty.recipesBody")}</EmptyDescription>
              </Empty>
            ) : (
              <ul className="divide-y">
                {recipes.map((recipe) => {
                  const as = recipeAsFood(recipe, pantry.ingredientSource);
                  return (
                    <Row
                      key={recipe.id}
                      name={recipe.name}
                      isArchived={recipe.archivedAt !== undefined}
                      detail={[
                        recipe.method
                          ? t(`method.${recipe.method}` as never)
                          : undefined,
                        t.plural(
                          "pantry.ingredientCount",
                          recipe.ingredients.length,
                        ),
                        recipe.portioning.kind === "servings"
                          ? `${t("pantry.perServing")}: ${Math.round(kcalOf(as.macros)).toLocaleString()} kcal`
                          : `${t("pantry.per100Cooked")}: ${Math.round(kcalOf(as.macros)).toLocaleString()} kcal`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      badge={t("pantry.recipe")}
                      onShare={() => {
                        void (async () => {
                          const now = Date.now();
                          const backup = await exportRecipe(recipe.id, now);
                          if (backup === undefined) return;
                          downloadBackup(backup, backupFilename(now, "recipe"));
                          toast.add({
                            title: t("data.shared"),
                            type: "success",
                          });
                        })();
                      }}
                      onEdit={() => setEditingRecipe(recipe)}
                      onArchive={() => {
                        archiveRecipe(recipe.id);
                        toast.add({
                          title: t("pantry.archivedNotice", { name: recipe.name }),
                          type: "info",
                          actionProps: {
                            children: t("history.undo"),
                            onClick: () => restoreRecipe(recipe.id),
                          },
                        });
                      }}
                      onRestore={() => {
                        restoreRecipe(recipe.id);
                        toast.add({
                          title: t("pantry.restored", { name: recipe.name }),
                          type: "success",
                        });
                      }}
                      // A recipe is referenced by plans, which this panel can't
                      // see, so it archives rather than deletes — same rule, one
                      // step more cautious.
                      canDelete={false}
                      onDelete={() => deleteRecipe(recipe.id)}
                    />
                  );
                })}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("pantry.foods")}</h3>
            {foods.length === 0 ? (
              <Empty>
                <EmptyTitle>{t("pantry.empty.foods")}</EmptyTitle>
                <EmptyDescription>{t("pantry.empty.foodsBody")}</EmptyDescription>
              </Empty>
            ) : (
              <ul className="divide-y">
                {foods.map((food) => {
                  const uses = usedBy(food.id);
                  return (
                    <Row
                      key={food.id}
                      name={food.name}
                      isArchived={food.archivedAt !== undefined}
                      detail={[
                        food.unit === "unit"
                          ? t("pantry.perUnit")
                          : t("pantry.per100"),
                        `${Math.round(kcalOf(food.macros)).toLocaleString()} kcal`,
                        food.state
                          ? t(`pantry.state.${food.state}` as never)
                          : undefined,
                        uses > 0
                          ? t("pantry.inUse", {
                              count: t.plural("pantry.recipeCount", uses),
                            })
                          : undefined,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      badge={t("pantry.yours")}
                      onEdit={() => setEditingFood(food)}
                      onArchive={() => {
                        archiveUserFood(food.id);
                        toast.add({
                          title: t("pantry.archivedNotice", { name: food.name }),
                          type: "info",
                          actionProps: {
                            children: t("history.undo"),
                            onClick: () => restoreUserFood(food.id),
                          },
                        });
                      }}
                      onRestore={() => {
                        restoreUserFood(food.id);
                        toast.add({
                          title: t("pantry.restored", { name: food.name }),
                          type: "success",
                        });
                      }}
                      // Safe only when no recipe points at it. A plan might
                      // still, which is why the fallback is archive.
                      canDelete={uses === 0}
                      onDelete={() => {
                        deleteUserFood(food.id);
                        toast.add({
                          title: t("pantry.deleted", { name: food.name }),
                          type: "info",
                        });
                      }}
                    />
                  );
                })}
              </ul>
            )}
          </section>
        </CardContent>
      </Card>

      <Dialog
        open={
          adding !== undefined ||
          editingFood !== undefined ||
          editingRecipe !== undefined
        }
        onOpenChange={(open) => {
          if (!open) {
            setAdding(undefined);
            setEditingFood(undefined);
            setEditingRecipe(undefined);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingFood
                ? t("pantry.edit", { name: editingFood.name })
                : editingRecipe
                  ? t("pantry.edit", { name: editingRecipe.name })
                  : adding === "recipe"
                    ? t("pantry.addRecipe")
                    : t("pantry.addFood")}
            </DialogTitle>
            <DialogDescription>{t("pantry.body")}</DialogDescription>
          </DialogHeader>

          {/* Keyed so the fields start from what's stored now, not from
              whatever the dialog held when it was last opened. */}
          {adding === "recipe" || editingRecipe ? (
            <RecipeForm
              key={editingRecipe?.id ?? "new-recipe"}
              existing={editingRecipe}
              onDone={() => {
                setAdding(undefined);
                setEditingRecipe(undefined);
              }}
            />
          ) : (
            <UserFoodForm
              key={editingFood?.id ?? "new-food"}
              existing={editingFood}
              onDone={() => {
                setAdding(undefined);
                setEditingFood(undefined);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  name,
  detail,
  badge,
  isArchived,
  canDelete,
  onShare,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: {
  name: string;
  detail: string;
  badge: string;
  isArchived: boolean;
  canDelete: boolean;
  /** Recipes only — a single food is rarely worth handing someone a file. */
  onShare?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const t = useT();

  return (
    <li className="flex items-center gap-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
          <Badge variant="outline">{badge}</Badge>
          {isArchived ? (
            <Badge variant="secondary">{t("pantry.archived")}</Badge>
          ) : null}
        </span>
        <span className="truncate text-xs text-muted-foreground">{detail}</span>
      </div>

      {onShare ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          aria-label={t("data.share")}
          onClick={onShare}
        >
          <Share2Icon />
        </Button>
      ) : null}

      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground"
        aria-label={t("pantry.edit", { name })}
        onClick={onEdit}
      >
        <PencilLineIcon />
      </Button>

      {isArchived ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          aria-label={t("pantry.restore")}
          onClick={onRestore}
        >
          <RotateCcwIcon />
        </Button>
      ) : canDelete ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          aria-label={t("pantry.delete")}
          onClick={onDelete}
        >
          <Trash2Icon />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground"
          aria-label={t("pantry.archive")}
          onClick={onArchive}
        >
          <ArchiveIcon />
        </Button>
      )}
    </li>
  );
}
