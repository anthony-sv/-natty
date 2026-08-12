import { describe, expect, it } from "vitest";
import { exercises, movements } from "@/data/exercises";
import { poses } from "@/data/poses";
import { foods } from "@/data/diets/foods";
import { diets } from "@/data/diets";
import { routines } from "@/data/routines";
import { muscleSchema } from "@/data/exercises";
import { SPLIT_FOR_PATTERN } from "@/features/log/volume";
import { BARS } from "@/features/plates/equipment";
import { ffmiScale } from "@/features/body/ffmi";
import { CATALOGS } from "./names";
import { LOCALES, type Locale } from "./locale-store";
import { MESSAGES } from "./use-t";
import { en } from "./messages/en";

/**
 * The gate that makes translating the data safe.
 *
 * `src/data/` stays English and untouched, so nothing forces a catalog entry
 * when an exercise is added — this does. It walks the real data rather than a
 * fixture, in the same spirit as `exercises.test.ts` and `macros.test.ts`: a
 * gap fails here, loudly and by name, instead of rendering an English word in
 * the middle of a Spanish page.
 */

/** Every locale that isn't the source. English needs no catalog. */
const TRANSLATIONS = LOCALES.map((l) => l.value).filter(
  (locale): locale is Exclude<Locale, "en"> => locale !== "en",
);

/**
 * Every string in the data that carries no id of its own, so its English
 * wording is the key. Collected from the data rather than listed, so a new day
 * label or meal name is caught the moment it's authored.
 */
function sourceStrings(): Map<string, string> {
  // Value is where it came from, so a failure says which file to look in.
  const found = new Map<string, string>();
  const add = (value: string | undefined, where: string) => {
    if (value !== undefined && value.trim() !== "") found.set(value, where);
  };

  for (const routine of routines) {
    // Bare words rather than ids, and both render as badges on the program.
    add(routine.goal, `${routine.slug} goal`);
    add(routine.style, `${routine.slug} style`);
    for (const week of routine.weeks) {
      for (const day of week.days) {
        // Rest days carry no label worth translating beyond the app's own word.
        add(day.label, `${routine.slug} week ${week.weekNumber}`);
      }
    }
  }

  for (const plan of diets) {
    for (const note of plan.notes) add(note, `${plan.slug} notes`);
    for (const supplement of plan.supplements) {
      add(supplement.name, `${plan.slug} supplements`);
      add(supplement.dose, `${plan.slug} supplements`);
      add(supplement.timing, `${plan.slug} supplements`);
      add(supplement.note, `${plan.slug} supplements`);
    }
    for (const meal of plan.meals) {
      add(meal.name, `${plan.slug} meals`);
      for (const variant of meal.variants) {
        add(variant.label, `${plan.slug} ${meal.name}`);
        for (const option of variant.options) {
          add(option.label, `${plan.slug} ${meal.name}`);
          for (const item of option.items) {
            add(item.note, `${plan.slug} ${meal.name}`);
          }
        }
      }
    }
  }

  // The per-unit note on a food ("~30g each"), which renders on any item that
  // doesn't override it. Missed on the first pass — the meals were walked but
  // the foods they point at weren't.
  for (const food of foods) {
    add(food.unitNote, "foods.ts");
  }

  // FFMI band labels. `describeFfmi` is pure and returns the English word, so
  // it translates by source string the way day labels do.
  for (const sex of ["male", "female"] as const) {
    for (const band of ffmiScale(sex).bands) {
      add(band.label, "ffmi.ts bands");
    }
  }

  return found;
}

describe.each(TRANSLATIONS)("%s", (locale) => {
  const catalog = CATALOGS[locale];

  /** Reported as a list of what's missing, not as a count — a count is useless. */
  const missing = (
    items: { id: string; name: string }[],
    lookup: Record<string, string>,
  ) =>
    items
      .filter((item) => lookup[item.id] === undefined)
      .map((item) => `${item.id} (${item.name})`);

  it("names every exercise", () => {
    expect(missing(exercises, catalog.exerciseNames)).toEqual([]);
  });

  it("names every movement", () => {
    expect(missing(movements, catalog.movementNames)).toEqual([]);
  });

  it("names every pose", () => {
    expect(missing(poses, catalog.poseNames)).toEqual([]);
  });

  it("names every food", () => {
    expect(missing(foods, catalog.foodNames)).toEqual([]);
  });

  it("names every bar", () => {
    expect(
      missing(
        BARS.map((bar) => ({ id: bar.id, name: bar.name })),
        catalog.barNames,
      ),
    ).toEqual([]);
  });

  it("names every routine", () => {
    expect(
      missing(
        routines.map((r) => ({ id: r.slug, name: r.name })),
        catalog.routineNames,
      ),
    ).toEqual([]);
  });

  it("names every diet plan", () => {
    expect(
      missing(
        diets.map((d) => ({ id: d.slug, name: d.name })),
        catalog.dietPlanNames,
      ),
    ).toEqual([]);
  });

  it("translates every day label, meal, supplement and note", () => {
    const untranslated = [...sourceStrings().entries()]
      .filter(([source]) => catalog.text[source] === undefined)
      .map(([source, where]) => `${where}: "${source}"`);
    expect(untranslated).toEqual([]);
  });

  it("has exactly the message keys English has", () => {
    // Both directions: a missing key would render blank, and a leftover one is
    // a translation of something that no longer exists.
    expect(Object.keys(MESSAGES[locale]).sort()).toEqual(Object.keys(en).sort());
  });

  it("leaves no message accidentally untranslated", () => {
    // Some strings are legitimately identical in both languages, and each one
    // is named here rather than waved through by a count — loanwords a Mexican
    // gym actually uses ("reps", "cardio", "set", "finisher"), acronyms,
    // symbols, the product name, and templates that are pure interpolation.
    // Anything else that matches is a key someone copied across and never came
    // back to, which is invisible in the UI and exactly what this catches.
    const intentional = new Set([
      "common.reps",
      "common.cardio",
      "common.finisher",
      "common.none",
      "format.seconds",
      "format.secondsRange",
      "format.minutes",
      "format.repsRange",
      "format.setCount.one",
      "format.setCount.other",
      "format.repsOnly",
      "index.title",
      "records.columnSet",
      "detail.summaryNoBest",
      "detail.legend.set",
      "body.stat.ffmi",
      "routines.phase.cardio",
      "routines.summary.finishers.one",
      "routines.summary.finishers.other",
      "player.set",
      "player.pose",
      "nutrition.tab.plan",
      "nutrition.tab.macros",
      "nutrition.tdee",
      "modifier.dropSet",
      // Gym loanwords: "pullover" and "curl" are what the movements are called
      // in Spanish too, and "cardio" is already on this list twice over.
      "pattern.pullover",
      "pattern.elbow-flexion",
      "pattern.cardio",
      "library.setsLogged.one",
      "library.setsLogged.other",
      // "Sets" and "reps" are the words a Mexican gym uses, which is why
      // `common.reps` and `format.setCount` are already on this list.
      "builder.sets",
      "builder.reps",
      "builder.segmentKind.reps",
      // A placeholder and the kcal symbol; there is nothing in it to translate.
      "pantry.kcal",
      "volume.sets",
      "volume.setsAxis",
      "split.cardio",
      // "Core" is the word a Mexican gym uses too.
      "split.core",
      "history.setsOnDay.one",
      "history.setsOnDay.other",
    ]);

    const unexplained = Object.keys(en).filter(
      (key) =>
        !intentional.has(key) &&
        MESSAGES[locale][key as keyof typeof en] === en[key as keyof typeof en],
    );
    expect(unexplained).toEqual([]);
  });

  it("carries the same placeholders in both languages", () => {
    // A dropped `{count}` renders a sentence with a hole in it, and the type
    // system can't see inside a string.
    const placeholders = (value: string) =>
      (value.match(/\{(\w+)\}/g) ?? []).sort().join(",");

    const mismatched = Object.keys(en).filter(
      (key) =>
        placeholders(en[key as keyof typeof en]) !==
        placeholders(MESSAGES[locale][key as keyof typeof en]),
    );
    expect(mismatched).toEqual([]);
  });
});

describe("closed enums that render as text", () => {
  // These aren't catalog entries — they're a fixed set the schema owns, so a
  // new one should fail the build in every language rather than fall back to
  // English. The check is here anyway, because "the type system covers it" is
  // exactly what was assumed about the vocabularies that shipped untranslated.
  it("names every muscle", () => {
    for (const muscle of muscleSchema.options) {
      expect(Object.keys(en)).toContain(`muscle.${muscle}`);
    }
  });

  it("names every training split", () => {
    for (const split of new Set(Object.values(SPLIT_FOR_PATTERN))) {
      expect(Object.keys(en)).toContain(`split.${split}`);
    }
  });
});

describe("plural keys", () => {
  it("always provide an 'other' form", () => {
    // `t.plural` falls back to `.other` for any category a locale doesn't use,
    // so that one is the only form guaranteed to be reached.
    const bases = new Set(
      Object.keys(en)
        .filter((key) => key.endsWith(".one") || key.endsWith(".other"))
        .map((key) => key.replace(/\.(one|other)$/, "")),
    );

    for (const base of bases) {
      expect(Object.keys(en)).toContain(`${base}.other`);
      for (const locale of TRANSLATIONS) {
        expect(Object.keys(MESSAGES[locale])).toContain(`${base}.other`);
      }
    }
  });
});
