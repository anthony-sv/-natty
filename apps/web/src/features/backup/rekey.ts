import type { BackupData } from "./backup";

/**
 * Giving imported items fresh ids.
 *
 * **This is what separates sharing from restoring.** A shared routine arrives
 * carrying the slug it had on someone else's machine, and that slug is
 * provenance: `LoggedSet.routineSlug` points at it. Reusing it would file your
 * sets under their routine — or worse, merge their plan into one you already
 * have at the same slug. The same goes for `user:`, `food:` and `recipe:` ids.
 *
 * A **restore** deliberately doesn't do this: it's your own data going back
 * where it came from, and re-keying would orphan every logged set that
 * references it.
 *
 * Pure, and takes its id generator, so a test can assert the rewriting rather
 * than the randomness.
 */

export interface IdSource {
  /**
   * Fresh slugs, kept separate because they're checked against different
   * collections — one generator would let an imported plan take a slug that
   * only routines were screened for.
   */
  routineSlug: (name: string) => string;
  dietSlug: (name: string) => string;
  /** A fresh prefixed id — `user:`, `food:`, `recipe:`. */
  id: (prefix: string) => string;
}

/**
 * Rewrite every id in `data` so nothing collides with what you already have.
 *
 * Ingredient references are rewritten **through the same map**, which is the
 * subtle half: a recipe pointing at an imported food has to follow that food to
 * its new id, or it silently loses its ingredients and reads as zero macros.
 */
export function rekey(data: BackupData, source: IdSource): BackupData {
  const foodIds = new Map<string, string>();
  const recipeIds = new Map<string, string>();
  const exerciseIds = new Map<string, string>();

  const foods = data.foods.map((food) => {
    const id = source.id("food");
    foodIds.set(food.id, id);
    return { ...food, id };
  });

  const exercises = data.exercises.map((exercise) => {
    const id = source.id("user");
    exerciseIds.set(exercise.id, id);
    return { ...exercise, id };
  });

  const recipes = data.recipes.map((recipe) => {
    const id = source.id("recipe");
    recipeIds.set(recipe.id, id);
    return {
      ...recipe,
      id,
      // Follow imported ingredients to their new ids. Anything not in the file
      // is a built-in and keeps the id it has.
      ingredients: recipe.ingredients.map((item) => ({
        ...item,
        foodId: foodIds.get(item.foodId) ?? item.foodId,
      })),
    };
  });

  /** A meal item may point at either half of the pantry. */
  const remapFoodId = (foodId: string) =>
    foodIds.get(foodId) ?? recipeIds.get(foodId) ?? foodId;

  /** What an extra's `routineSlug` has to follow, below. */
  const routineSlugs = new Map<string, string>();
  const routines = data.routines.map((routine) => {
    const slug = source.routineSlug(routine.name);
    routineSlugs.set(routine.slug, slug);
    return {
      ...routine,
      slug,
      weeks: routine.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          exercises: day.exercises.map((entry) => ({
            ...entry,
            exerciseId: exerciseIds.get(entry.exerciseId) ?? entry.exerciseId,
            orAlternatives: entry.orAlternatives.map(
              (id) => exerciseIds.get(id) ?? id,
            ),
          })),
        })),
      })),
    };
  });

  const dietSlugs = new Map<string, string>();
  const diets = data.diets.map((plan) => {
    const slug = source.dietSlug(plan.name);
    dietSlugs.set(plan.slug, slug);
    return {
    ...plan,
    slug,
    meals: plan.meals.map((meal) => ({
      ...meal,
      variants: meal.variants.map((variant) => ({
        ...variant,
        options: variant.options.map((option) => ({
          ...option,
          items: option.items.map((item) => ({
            ...item,
            foodId: remapFoodId(item.foodId),
          })),
        })),
      })),
    })),
    };
  });

  /** The stack, whose ids the ticks below have to follow. */
  const supplementIds = new Map<string, string>();
  const supplements = data.supplements.map((supplement) => {
    const id = source.id("supplement");
    supplementIds.set(supplement.id, id);
    return { ...supplement, id };
  });

  /**
   * An intake entry names a plan, a food or a supplement, so each has to follow.
   *
   * It rides along on a merged *full* backup — no share carries intake — and
   * without this the day you logged would point at the plan slug it had on the
   * other machine and resolve to nothing.
   */
  const intake = data.intake.map((entry) => ({
    ...entry,
    id: source.id("intake"),
    source:
      entry.source.kind === "meal"
        ? {
            ...entry.source,
            planSlug: dietSlugs.get(entry.source.planSlug) ?? entry.source.planSlug,
          }
        : entry.source.kind === "supplement"
          ? {
              ...entry.source,
              supplementId:
                supplementIds.get(entry.source.supplementId) ??
                entry.source.supplementId,
            }
          : { ...entry.source, foodId: remapFoodId(entry.source.foodId) },
  }));

  /**
   * An extra points at a routine day and, inside its `entry`, at exercises —
   * both have to follow the same maps `routines` above just built, or a
   * shared routine's extras land pointing at a slug and lifts that no longer
   * exist once the routine itself has a fresh slug.
   */
  const extras = data.extras.map((extra) => ({
    ...extra,
    id: source.id("extra"),
    routineSlug: routineSlugs.get(extra.routineSlug) ?? extra.routineSlug,
    entry: {
      ...extra.entry,
      exerciseId: exerciseIds.get(extra.entry.exerciseId) ?? extra.entry.exerciseId,
      orAlternatives: extra.entry.orAlternatives.map(
        (id) => exerciseIds.get(id) ?? id,
      ),
    },
  }));

  return {
    ...data,
    intake,
    supplements,
    extras,
    foods,
    exercises,
    recipes,
    routines,
    diets,
    // Logged sets, cardio sessions, weigh-ins and girths are never part of a
    // share, and on a restore they must keep the ids their provenance
    // already points at.
    sets: data.sets,
    cardio: data.cardio,
    bodyEntries: data.bodyEntries,
    measurements: data.measurements,
  };
}
