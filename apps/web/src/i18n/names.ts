import { useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import { useLiveQuery } from "@tanstack/react-db";
import { getExercise, getMovement } from "@/data/exercises";
import { userExercises } from "@/features/library/collection";
import { userFoods, userRecipes } from "@/features/pantry/collection";
import { getPose } from "@/data/poses";
import { findFood } from "@/data/diets/foods";
import * as esMX from "./catalog/es-MX";
import { localeStore, type Locale } from "./locale-store";

/**
 * Names for the authored data, in the reader's language.
 *
 * Separate from `messages/` because the two have different failure modes. A
 * missing *message* is a bug in the app and the type system catches it; a
 * missing *name* is a gap in the catalog, which happens the moment someone adds
 * an exercise, and it should degrade to the English name rather than fail the
 * build. `i18n.test.ts` is what stops those gaps reaching a release.
 *
 * `src/data/` stays English and untouched — it's the source, not a translation
 * target, so adding a lift doesn't require speaking Spanish.
 */

interface Catalog {
  exerciseNames: Record<string, string>;
  movementNames: Record<string, string>;
  poseNames: Record<string, string>;
  foodNames: Record<string, string>;
  barNames: Record<string, string>;
  routineNames: Record<string, string>;
  dietPlanNames: Record<string, string>;
  text: Record<string, string>;
}

/** English is the source, so it needs no catalog — every lookup falls through. */
const EMPTY: Catalog = {
  exerciseNames: {},
  movementNames: {},
  poseNames: {},
  foodNames: {},
  barNames: {},
  routineNames: {},
  dietPlanNames: {},
  text: {},
};

export const CATALOGS: Record<Locale, Catalog> = {
  en: EMPTY,
  "es-MX": esMX,
};

export interface Names {
  /** Curated variant name: "Wide-grip lat pulldown". */
  exercise: (exerciseId: string) => string;
  /** The rollup a variant belongs to: "Lat pulldown". */
  movement: (exerciseId: string) => string | undefined;
  pose: (poseId: string) => string;
  food: (foodId: string) => string;
  /** Bar names come from `features/plates/equipment.ts`, which has ids. */
  bar: (barId: string, fallback: string) => string;
  routine: (slug: string, fallback: string) => string;
  dietPlan: (slug: string, fallback: string) => string;
  /**
   * Anything keyed by its own English wording — day labels, meal names, notes.
   *
   * Passes the source through untranslated when the catalog has no entry, so a
   * new note reads as English rather than disappearing.
   */
  text: (source: string | undefined) => string | undefined;
}

/**
 * The naming functions for a locale, without React.
 *
 * The plain form exists so pure modules can be handed a `Names` the way
 * `toRecordRows` already takes an `ExerciseNaming` — `buildSteps` and
 * `format.ts` translate through it without importing a store.
 */
export function namesFor(locale: Locale): Names {
  const catalog = CATALOGS[locale];

  return {
    // The id fallback only fires for an entry that no longer exists —
    // `authoring.ts` throws on an unknown name — but a dangling id should read
    // as a visible id rather than an empty heading.
    exercise: (exerciseId) =>
      catalog.exerciseNames[exerciseId] ??
      getExercise(exerciseId)?.name ??
      exerciseId,

    movement: (exerciseId) => {
      const exercise = getExercise(exerciseId);
      if (exercise === undefined) return undefined;
      return (
        catalog.movementNames[exercise.movementId] ??
        getMovement(exercise.movementId)?.name
      );
    },

    pose: (poseId) => catalog.poseNames[poseId] ?? getPose(poseId)?.name ?? poseId,

    // `getFood` throws on an unknown id, which is right at authoring time and
    // wrong here: a food you wrote yourself is unknown to the compiled-in
    // table, and a name lookup crashing the page is a worse failure than a
    // visible id. Falls through like `exercise` does; `useNames` layers your
    // own food and recipe names over this.
    food: (foodId) => catalog.foodNames[foodId] ?? findFood(foodId)?.name ?? foodId,

    bar: (barId, fallback) => catalog.barNames[barId] ?? fallback,

    routine: (slug, fallback) => catalog.routineNames[slug] ?? fallback,

    dietPlan: (slug, fallback) => catalog.dietPlanNames[slug] ?? fallback,

    text: (source) =>
      source === undefined ? undefined : (catalog.text[source] ?? source),
  };
}

/**
 * The same, bound to the active locale, and aware of your own exercises.
 *
 * A custom exercise is authored in whatever language you wrote it in and is
 * **not** a translation target — so it layers over `namesFor` rather than going
 * through a catalog, and `i18n.test.ts` neither walks it nor should. Without
 * this every custom lift renders as `user:9f3c…` in the records table, the
 * heatmap's day sheet and the player.
 *
 * Memoised on the locale and the user rows: several callers put this in a
 * `useMemo` dependency list, and a fresh object every render would rebuild a
 * day's steps whenever anything else on the page changed.
 */
export function useNames(): Names {
  const locale = useStore(localeStore, (s) => s);
  const { data } = useLiveQuery((q) => q.from({ e: userExercises }));

  const { data: ownFoods } = useLiveQuery((q) => q.from({ f: userFoods }));
  const { data: ownRecipes } = useLiveQuery((q) => q.from({ r: userRecipes }));

  return useMemo(() => {
    const base = namesFor(locale);
    const exercises = new Map((data ?? []).map((e) => [e.id, e.name]));
    // Foods and recipes share one namespace here because they share one
    // downstream: `MealItem.foodId` holds either.
    const foods = new Map<string, string>([
      ...(ownFoods ?? []).map((f) => [f.id, f.name] as const),
      ...(ownRecipes ?? []).map((r) => [r.id, r.name] as const),
    ]);

    if (exercises.size === 0 && foods.size === 0) return base;
    return {
      ...base,
      exercise: (id) => exercises.get(id) ?? base.exercise(id),
      food: (id) => foods.get(id) ?? base.food(id),
    };
  }, [locale, data, ownFoods, ownRecipes]);
}
