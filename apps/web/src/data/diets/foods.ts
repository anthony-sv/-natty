import { MICROS } from "./micros";
import { foodSchema, type Food } from "./schema";

/**
 * Every food the plans reference, with its macros per 100 g/ml or per unit.
 *
 * ## Where these numbers come from
 *
 * All of them are **derived from the source docs' own item tables**, not looked
 * up elsewhere: dividing a stated row (343 g chicken → P78.9 F5.1 C0) by its
 * amount gives the per-100g value, and the two most detailed plan versions
 * agree with each other where they overlap. That agreement is why this table is
 * trustworthy enough to compute from.
 *
 * The four swap proteins are the exception. The docs give their weights and the
 * resulting day total but never their macros, so those were solved for: take
 * the day's target, subtract everything else in the meal, and divide by the
 * stated weight. Each one reconciles across *two* independent plan versions to
 * within a couple of kcal, which is a stronger check than a lookup table would
 * have been. `diets.test.ts` pins the result.
 *
 * The block below that — everything from oats on — isn't in any source doc at
 * all. It's a general library expansion, added in two passes: foods people
 * actually put on a diet that the six transcribed plans never happened to
 * name, so a plan you write yourself (`Your own exercises and routines`'s
 * counterpart for diets) had a real spread to draw from rather than only
 * whatever eighteen items a handful of authored plans mentioned. The second
 * pass exists because the first one, for all its spread of carb/fat/protein
 * sources, still had zero vegetables and zero fruit in it — every entry was a
 * grain, tuber, legume, dairy, meat, fat, sweet or supplement, which is a
 * strange gap for a *diet* to have nothing to say about produce. Figures are
 * per-100g from USDA FoodData Central, cooked/prepared where that's how the
 * food is actually eaten — `diets.test.ts`'s reconciliation only covers the
 * transcribed plans' own numbers, so these have no cross-check beyond the
 * source cited at each entry's addition.
 *
 * ## The label pass
 *
 * `food_labels.md` — the actual packages in the kitchen — is the authority
 * wherever it names a food, and it moved a few numbers: egg whites, bread, the
 * mass gainer, chia and strawberries now read off their own labels, and the
 * yogurt the plans called "Greek" is the protein yogurt on that sheet. It also
 * added every food Plan v6 uses that the table didn't have yet.
 *
 * **Carbs are available carbohydrate, and fibre is its own number.** Mexican
 * labels print "hidratos de carbono disponibles", which already excludes fibre,
 * while USDA figures are total carbohydrate with the fibre inside. Mixing the
 * two would count a gram of fibre as 4 kcal on one food and 0 on the next, so
 * every USDA figure here has its fibre subtracted, and so do the two
 * standard-value foods v6 leans on — tortillas and avocado — which is how v6's
 * own totals were worked out. v4 and v5 predate that and counted those two at
 * total carbs; `macros.test.ts` says so where it reconciles them.
 *
 * Fibre is absent, not zero, where a label prints a dash.
 *
 * ## Raw and cooked are different foods
 *
 * Not a flag on one entry — a gram of cooked chicken holds a third more protein
 * than a gram of raw, because the water left. Anything the docs weigh both ways
 * gets two entries.
 */
const RAW: Omit<Food, "micros">[] = [
  // — Breakfast ————————————————————————————————————————————————
  {
    id: "whole-egg",
    name: "Whole eggs",
    category: "dairy-eggs",
    unit: "unit",
    unitNote: "~50g each",
    macros: { protein: 6, fat: 5, carbs: 0.5, fiber: 0 },
  },
  {
    // The label: 10.5 P, 0 F, 0.6 C per 100. Poured by volume, so `ml`.
    id: "liquid-egg-whites",
    name: "Liquid egg whites",
    category: "dairy-eggs",
    unit: "ml",
    macros: { protein: 10.5, fat: 0, carbs: 0.6, fiber: 0 },
  },
  {
    id: "bacon",
    name: "Bacon",
    category: "meat-fish",
    unit: "unit",
    unitNote: "1 strip, ~15g",
    macros: { protein: 3, fat: 4.5, carbs: 0, fiber: 0 },
  },
  {
    id: "turkey-ham",
    name: "Turkey ham",
    category: "meat-fish",
    unit: "g",
    macros: { protein: 14.6, fat: 4.2, carbs: 5.3, fiber: 0.1 },
  },
  {
    id: "manchego-low-fat",
    name: "Low-fat manchego",
    category: "dairy-eggs",
    unit: "g",
    macros: { protein: 28, fat: 22, carbs: 15 },
  },
  {
    id: "protein-flour",
    name: "Protein flour",
    category: "grains",
    unit: "g",
    state: "raw",
    unitNote: "dry, before cooking",
    macros: { protein: 26, fat: 4, carbs: 51, fiber: 7 },
  },

  // — Lunch ————————————————————————————————————————————————————
  {
    id: "chicken-breast-cooked",
    name: "Chicken breast",
    category: "meat-fish",
    unit: "g",
    state: "cooked",
    macros: { protein: 31, fat: 3.6, carbs: 0, fiber: 0 },
  },
  {
    id: "chicken-breast-raw",
    name: "Chicken breast",
    category: "meat-fish",
    unit: "g",
    state: "raw",
    macros: { protein: 23, fat: 1.5, carbs: 0, fiber: 0 },
  },
  {
    id: "carne-asada-raw",
    name: "Carne asada",
    category: "meat-fish",
    unit: "g",
    state: "raw",
    macros: { protein: 21.8, fat: 5, carbs: 0, fiber: 0 },
  },
  {
    id: "pork-loin-raw",
    name: "Pork loin",
    category: "meat-fish",
    unit: "g",
    state: "raw",
    macros: { protein: 21, fat: 3.5, carbs: 0, fiber: 0 },
  },
  {
    id: "turkey-breast-raw",
    name: "Turkey breast",
    category: "meat-fish",
    unit: "g",
    state: "raw",
    macros: { protein: 24.1, fat: 1.05, carbs: 0, fiber: 0 },
  },
  {
    id: "white-rice-cooked",
    name: "White rice",
    category: "grains",
    unit: "g",
    state: "cooked",
    macros: { protein: 2.75, fat: 0.25, carbs: 28, fiber: 0.4 },
  },
  {
    // The label: 2 P, 0 F, 23 C, 1 fibre per 100 g cooked.
    id: "basmati-rice-cooked",
    name: "Basmati rice",
    category: "grains",
    unit: "g",
    state: "cooked",
    macros: { protein: 2, fat: 0, carbs: 23, fiber: 1 },
  },
  {
    // The label is per 50 g dry: 4 P, 0 F, 40 C, 1 fibre.
    id: "jasmine-rice-dry",
    name: "Jasmine rice",
    category: "grains",
    unit: "g",
    state: "raw",
    unitNote: "dry, before cooking",
    macros: { protein: 8, fat: 0, carbs: 80, fiber: 2 },
  },
  {
    // Standard values: 12 g total carbohydrate, ~1.5 of it fibre.
    id: "corn-tortilla",
    name: "Corn tortillas",
    category: "grains",
    unit: "unit",
    unitNote: "~30g each",
    macros: { protein: 1.5, fat: 0.7, carbs: 10.5, fiber: 1.5 },
  },
  {
    // Standard values: 9 g total carbohydrate per 100 g, 6.7 of it fibre.
    id: "avocado",
    name: "Avocado",
    category: "fats",
    unit: "g",
    unitNote: "flesh only",
    macros: { protein: 2, fat: 15, carbs: 2.3, fiber: 6.7 },
  },
  {
    // The label, per 100 g: 2 P, 0 F, 7.6 C, 3 fibre.
    id: "frozen-veggies",
    name: "Frozen mixed vegetables",
    category: "vegetables",
    unit: "g",
    macros: { protein: 2, fat: 0, carbs: 7.6, fiber: 3 },
  },
  {
    id: "salsa-macha",
    name: "Salsa macha",
    category: "fats",
    unit: "g",
    macros: { protein: 0, fat: 70, carbs: 0, fiber: 0 },
  },

  // — Dinner ———————————————————————————————————————————————————
  {
    id: "whey-protein",
    name: "Whey protein",
    category: "supplements",
    unit: "unit",
    unitNote: "1 scoop, 31g",
    macros: { protein: 24, fat: 1.5, carbs: 4 },
  },
  {
    id: "high-protein-milk",
    name: "High-protein milk",
    category: "dairy-eggs",
    unit: "ml",
    macros: { protein: 5.4, fat: 0.5, carbs: 5.1, fiber: 0 },
  },
  {
    // The id predates the label pass, when the plans called it Greek yogurt;
    // ids are provenance in a logged meal, so it keeps the old one.
    id: "greek-yogurt",
    name: "Protein yogurt",
    category: "dairy-eggs",
    unit: "g",
    macros: { protein: 10.1, fat: 1.7, carbs: 8.3 },
  },
  {
    id: "light-yogurt-plain",
    name: "Light yogurt (plain)",
    category: "dairy-eggs",
    unit: "g",
    macros: { protein: 9, fat: 0, carbs: 8.5, fiber: 0 },
  },
  {
    id: "light-yogurt-strawberry",
    name: "Light yogurt (strawberry)",
    category: "dairy-eggs",
    unit: "g",
    macros: { protein: 8, fat: 0, carbs: 9.1, fiber: 0 },
  },
  {
    id: "peanut-butter",
    name: "Peanut butter",
    category: "fats",
    unit: "g",
    macros: { protein: 24, fat: 49, carbs: 13, fiber: 8 },
  },
  {
    // The label: 2 slices (63 g) = 5.3 P, 1.6 F, 31.9 C, 1.5 fibre.
    id: "white-bread",
    name: "White bread",
    category: "grains",
    unit: "g",
    unitNote: "~31.5g a slice",
    macros: { protein: 8.41, fat: 2.54, carbs: 50.63, fiber: 2.38 },
  },
  {
    // The label is per 30 g dry: 4 P, 2.5 F, 16.6 C, 3.3 fibre. Its per-100
    // column is for oats *prepared with water*, so weighing them dry and
    // reading that column undercounts by two thirds — that's `oats-cooked`.
    id: "oats-dry",
    name: "Oats",
    category: "grains",
    unit: "g",
    state: "raw",
    unitNote: "dry, before cooking",
    macros: { protein: 13.33, fat: 8.33, carbs: 55.33, fiber: 11 },
  },
  {
    // The label: 17 P, 31 F, 0 available carbs, 34 fibre — chia's
    // carbohydrate is almost all fibre.
    id: "chia-seeds",
    name: "Chia seeds",
    category: "fats",
    unit: "g",
    state: "raw",
    macros: { protein: 17, fat: 31, carbs: 0, fiber: 34 },
  },

  // — From the label sheet, not in a plan yet ————————————————————
  {
    id: "protein-cereal",
    name: "Protein cereal",
    category: "grains",
    unit: "g",
    macros: { protein: 12.5, fat: 8.7, carbs: 69, fiber: 6.6 },
  },
  {
    id: "light-cereal",
    name: "Light cereal",
    category: "grains",
    unit: "g",
    macros: { protein: 6, fat: 0.8, carbs: 84, fiber: 3.5 },
  },
  {
    id: "salmas",
    name: "Salmas",
    category: "grains",
    unit: "unit",
    unitNote: "1 toast, 6g",
    macros: { protein: 0.4, fat: 0.3, carbs: 4.2 },
  },
  {
    id: "refried-beans",
    name: "Refried beans",
    category: "legumes",
    unit: "g",
    unitNote: "packaged",
    macros: { protein: 4.7, fat: 4.3, carbs: 10.3 },
  },
  {
    id: "greens-reds",
    name: "Greens & Reds",
    category: "supplements",
    unit: "unit",
    unitNote: "1 serving",
    macros: { protein: 0.5, fat: 0, carbs: 5, fiber: 4 },
  },
  {
    // Fibre is the whole product. The label prints 9 g carbs *and* 9 g fibre,
    // the same grams twice, so the available carbs are zero.
    id: "fiber-supplement",
    name: "Fiber supplement",
    category: "supplements",
    unit: "unit",
    unitNote: "1 serving",
    macros: { protein: 0, fat: 0, carbs: 0, fiber: 9 },
  },
  {
    id: "cooking-oil",
    name: "Cooking oil",
    category: "fats",
    unit: "ml",
    macros: { protein: 0, fat: 92, carbs: 0, fiber: 0 },
  },
  {
    id: "butter",
    name: "Butter",
    category: "fats",
    unit: "g",
    macros: { protein: 0.3, fat: 81.2, carbs: 0.5, fiber: 0 },
  },
  {
    id: "mixed-nuts",
    name: "Mixed nuts",
    category: "fats",
    unit: "g",
    unitNote: "Costco",
    macros: { protein: 18, fat: 40, carbs: 21, fiber: 16 },
  },
  {
    id: "pistachios",
    name: "Pistachios",
    category: "fats",
    unit: "g",
    macros: { protein: 21, fat: 50, carbs: 17, fiber: 11 },
  },
  {
    id: "flaxseed",
    name: "Flaxseed",
    category: "fats",
    unit: "g",
    state: "raw",
    macros: { protein: 18.3, fat: 39.9, carbs: 1.6, fiber: 27.3 },
  },
  {
    id: "ketchup",
    name: "Ketchup",
    category: "sweets",
    unit: "g",
    macros: { protein: 1.7, fat: 0.1, carbs: 6.2, fiber: 2.2 },
  },
  {
    id: "biscoff-spread",
    name: "Biscoff spread",
    category: "sweets",
    unit: "g",
    macros: { protein: 3, fat: 38, carbs: 57 },
  },
  {
    // 0.30 g EPA, 0.20 g DHA, 0.04 g DPA a capsule — `micros.ts` carries it.
    id: "salmon-oil-capsule",
    name: "Salmon oil",
    category: "supplements",
    unit: "unit",
    unitNote: "1 capsule, 1.3g",
    macros: { protein: 0.26, fat: 0.72, carbs: 0.09, fiber: 0 },
  },
  {
    // 105 mg magnesium and 10 µg vitamin D3 per two capsules.
    id: "magnesium-d3",
    name: "Magnesium + D3",
    category: "supplements",
    unit: "unit",
    unitNote: "2 capsules",
    macros: { protein: 0.17, fat: 0.03, carbs: 0.06, fiber: 0 },
  },

  // — A wider spread: carb quality, fat sources, protein sources ————
  // Per-100g figures from USDA FoodData Central, cooked where that's how
  // it's actually eaten, with the fibre taken out of the carbs (see the
  // header). Two "bad" carbs (sugar, and white bread/rice above) sit beside
  // the complex ones on purpose — a diet plan tracks what you eat, not just
  // what a coach would pick for you.
  {
    id: "oats-cooked",
    name: "Oats",
    category: "grains",
    unit: "g",
    state: "cooked",
    macros: { protein: 2.6, fat: 1.3, carbs: 10.3, fiber: 1.7 },
  },
  {
    id: "quinoa-cooked",
    name: "Quinoa",
    category: "grains",
    unit: "g",
    state: "cooked",
    macros: { protein: 4.4, fat: 1.9, carbs: 18.5, fiber: 2.8 },
  },
  {
    id: "brown-rice-cooked",
    name: "Brown rice",
    category: "grains",
    unit: "g",
    state: "cooked",
    macros: { protein: 2.7, fat: 1, carbs: 23.8, fiber: 1.8 },
  },
  {
    id: "whole-wheat-pasta-cooked",
    name: "Whole wheat pasta",
    category: "grains",
    unit: "g",
    state: "cooked",
    macros: { protein: 5.5, fat: 0.6, carbs: 22.1, fiber: 3.9 },
  },
  {
    id: "sweet-potato-cooked",
    name: "Sweet potato",
    category: "tubers",
    unit: "g",
    state: "cooked",
    macros: { protein: 2, fat: 0.15, carbs: 17.4, fiber: 3.3 },
  },
  {
    id: "black-beans-cooked",
    name: "Black beans",
    category: "legumes",
    unit: "g",
    state: "cooked",
    macros: { protein: 8.9, fat: 0.5, carbs: 15, fiber: 8.7 },
  },
  {
    id: "granulated-sugar",
    name: "Granulated sugar",
    category: "sweets",
    unit: "g",
    macros: { protein: 0, fat: 0, carbs: 99.8, fiber: 0 },
  },
  {
    id: "almonds",
    name: "Almonds",
    category: "fats",
    unit: "g",
    state: "raw",
    macros: { protein: 21.2, fat: 49.9, carbs: 9.1, fiber: 12.5 },
  },
  {
    id: "olive-oil",
    name: "Olive oil",
    category: "fats",
    unit: "g",
    macros: { protein: 0, fat: 100, carbs: 0, fiber: 0 },
  },
  {
    id: "salmon-cooked",
    name: "Salmon",
    category: "meat-fish",
    unit: "g",
    state: "cooked",
    macros: { protein: 20, fat: 13, carbs: 0, fiber: 0 },
  },
  {
    id: "ground-beef-90-10-cooked",
    name: "Ground beef (90/10)",
    category: "meat-fish",
    unit: "g",
    state: "cooked",
    macros: { protein: 25.2, fat: 10.7, carbs: 0, fiber: 0 },
  },
  {
    id: "tuna-canned-water",
    name: "Tuna (canned in water)",
    category: "meat-fish",
    unit: "g",
    macros: { protein: 25.5, fat: 0.8, carbs: 0, fiber: 0 },
  },
  {
    id: "cottage-cheese-lowfat",
    name: "Cottage cheese",
    category: "dairy-eggs",
    unit: "g",
    macros: { protein: 11, fat: 2.3, carbs: 4.3, fiber: 0 },
  },
  {
    id: "tofu-firm",
    name: "Tofu",
    category: "legumes",
    unit: "g",
    state: "raw",
    macros: { protein: 17.3, fat: 8.7, carbs: 0.5, fiber: 2.3 },
  },
  {
    id: "mass-gainer",
    name: "Mass gainer",
    category: "supplements",
    unit: "unit",
    // The label (Evogen), scaled down from its stated 5-scoop/314g serving
    // to the single scoop a `unit` food counts — 314g/5 = 62.8g, and each
    // macro divided the same way. Extra scoops are extra units, same as
    // `whey-protein`.
    unitNote: "1 scoop, 62.8g",
    macros: { protein: 10, fat: 2.4, carbs: 45.4, fiber: 0.8 },
  },

  // — Vegetables and fruit — the first entries in either category. Every
  // food above this line is a grain, tuber, legume, dairy, meat, fat,
  // sweet or supplement; a diet plan needing produce had nothing to pick
  // from until now. —————————————————————————————————————————————
  {
    id: "broccoli",
    name: "Broccoli",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 2.8, fat: 0.4, carbs: 4, fiber: 2.6 },
  },
  {
    id: "spinach",
    name: "Spinach",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 2.9, fat: 0.4, carbs: 1.4, fiber: 2.2 },
  },
  {
    id: "green-beans",
    name: "Green beans",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 1.8, fat: 0.2, carbs: 4.3, fiber: 2.7 },
  },
  {
    id: "asparagus",
    name: "Asparagus",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 2.2, fat: 0.1, carbs: 1.8, fiber: 2.1 },
  },
  {
    id: "bell-pepper-red",
    name: "Red bell pepper",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 1, fat: 0.3, carbs: 3.9, fiber: 2.1 },
  },
  {
    id: "carrots",
    name: "Carrots",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 0.9, fat: 0.2, carbs: 6.8, fiber: 2.8 },
  },
  {
    id: "cauliflower",
    name: "Cauliflower",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 1.6, fat: 0.2, carbs: 2.7, fiber: 2 },
  },
  {
    id: "cucumber",
    name: "Cucumber",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 0.6, fat: 0.2, carbs: 2.5, fiber: 0.5 },
  },
  {
    id: "mushrooms",
    name: "Mushrooms",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 3.1, fat: 0.3, carbs: 2.3, fiber: 1 },
  },
  {
    id: "zucchini",
    name: "Zucchini",
    category: "vegetables",
    unit: "g",
    state: "raw",
    macros: { protein: 1.2, fat: 0.3, carbs: 2.1, fiber: 1 },
  },
  {
    id: "banana",
    name: "Banana",
    category: "fruits",
    unit: "g",
    state: "raw",
    macros: { protein: 1.1, fat: 0.3, carbs: 20.2, fiber: 2.6 },
  },
  {
    id: "apple",
    name: "Apple",
    category: "fruits",
    unit: "g",
    state: "raw",
    macros: { protein: 0.3, fat: 0.2, carbs: 11.4, fiber: 2.4 },
  },
  {
    id: "blueberries",
    name: "Blueberries",
    category: "fruits",
    unit: "g",
    state: "raw",
    macros: { protein: 0.7, fat: 0.3, carbs: 12.1, fiber: 2.4 },
  },
  {
    // The label: 0 P, 0 F, 7 C, 2 fibre per 100 g.
    id: "strawberries",
    name: "Strawberries",
    category: "fruits",
    unit: "g",
    state: "raw",
    macros: { protein: 0, fat: 0, carbs: 7, fiber: 2 },
  },
  {
    id: "orange",
    name: "Orange",
    category: "fruits",
    unit: "g",
    state: "raw",
    macros: { protein: 0.9, fat: 0.1, carbs: 9.4, fiber: 2.4 },
  },
  {
    id: "grapes",
    name: "Grapes",
    category: "fruits",
    unit: "g",
    state: "raw",
    macros: { protein: 0.7, fat: 0.2, carbs: 17.2, fiber: 0.9 },
  },

  // — More carb sources, named directly by request —————————————————
  {
    id: "rice-cakes",
    name: "Rice cakes",
    category: "grains",
    unit: "g",
    macros: { protein: 8.2, fat: 2.8, carbs: 77.3, fiber: 4.2 },
  },
  {
    id: "cream-of-rice",
    name: "Cream of rice",
    category: "grains",
    unit: "g",
    state: "raw",
    unitNote: "dry, before cooking",
    macros: { protein: 6.3, fat: 0.5, carbs: 81.9, fiber: 0.5 },
  },
  {
    id: "cream-of-wheat",
    name: "Cream of wheat",
    category: "grains",
    unit: "g",
    state: "raw",
    unitNote: "dry, before cooking",
    macros: { protein: 11.6, fat: 1.4, carbs: 70.6, fiber: 2.6 },
  },
  {
    id: "popcorn",
    name: "Popcorn",
    category: "grains",
    unit: "g",
    state: "cooked",
    unitNote: "air-popped",
    macros: { protein: 12.9, fat: 4.5, carbs: 63.3, fiber: 14.5 },
  },
  {
    id: "bagel-plain",
    name: "Bagel",
    category: "grains",
    unit: "g",
    macros: { protein: 10, fat: 1.7, carbs: 48.1, fiber: 2.3 },
  },
  {
    id: "potato-russet",
    name: "Potato",
    category: "tubers",
    unit: "g",
    state: "raw",
    macros: { protein: 2, fat: 0.1, carbs: 16.2, fiber: 1.3 },
  },

  // — More lean protein ————————————————————————————————————————
  {
    id: "shrimp",
    name: "Shrimp",
    category: "meat-fish",
    unit: "g",
    state: "cooked",
    macros: { protein: 20.9, fat: 1.1, carbs: 0.2, fiber: 0 },
  },
  {
    id: "tilapia",
    name: "Tilapia",
    category: "meat-fish",
    unit: "g",
    state: "cooked",
    macros: { protein: 26.2, fat: 2.6, carbs: 0, fiber: 0 },
  },
  {
    id: "pork-chop",
    name: "Pork chop",
    category: "meat-fish",
    unit: "g",
    state: "cooked",
    macros: { protein: 29.4, fat: 10.1, carbs: 0, fiber: 0 },
  },

  // — Rounding out dairy and fats ——————————————————————————————
  {
    id: "whole-milk",
    name: "Whole milk",
    category: "dairy-eggs",
    unit: "ml",
    macros: { protein: 3.2, fat: 3.3, carbs: 4.8, fiber: 0 },
  },
  {
    id: "milk-2percent",
    name: "Milk (2%)",
    category: "dairy-eggs",
    unit: "ml",
    macros: { protein: 3.3, fat: 2, carbs: 4.8, fiber: 0 },
  },
  {
    id: "cheddar-cheese",
    name: "Cheddar cheese",
    category: "dairy-eggs",
    unit: "g",
    macros: { protein: 25, fat: 33, carbs: 1.3, fiber: 0 },
  },
  {
    id: "mozzarella-part-skim",
    name: "Mozzarella",
    category: "dairy-eggs",
    unit: "g",
    unitNote: "part-skim",
    macros: { protein: 24, fat: 20, carbs: 4.4, fiber: 0 },
  },
  {
    id: "walnuts",
    name: "Walnuts",
    category: "fats",
    unit: "g",
    state: "raw",
    macros: { protein: 15.2, fat: 65.2, carbs: 7, fiber: 6.7 },
  },
  {
    id: "cashews",
    name: "Cashews",
    category: "fats",
    unit: "g",
    state: "raw",
    macros: { protein: 18.2, fat: 43.8, carbs: 26.9, fiber: 3.3 },
  },
  {
    id: "coconut-oil",
    name: "Coconut oil",
    category: "fats",
    unit: "g",
    macros: { protein: 0, fat: 99.1, carbs: 0, fiber: 0 },
  },
  {
    id: "avocado-oil",
    name: "Avocado oil",
    category: "fats",
    unit: "g",
    macros: { protein: 0, fat: 100, carbs: 0, fiber: 0 },
  },
  {
    id: "canola-oil",
    name: "Canola oil",
    category: "fats",
    unit: "g",
    macros: { protein: 0, fat: 100, carbs: 0, fiber: 0 },
  },

  // — A couple more treats, tracked rather than forbidden ——————————
  {
    id: "honey",
    name: "Honey",
    category: "sweets",
    unit: "g",
    macros: { protein: 0.3, fat: 0, carbs: 82.2, fiber: 0.2 },
  },
  {
    id: "maple-syrup",
    name: "Maple syrup",
    category: "sweets",
    unit: "g",
    macros: { protein: 0, fat: 0, carbs: 67, fiber: 0 },
  },
  {
    id: "dark-chocolate",
    name: "Dark chocolate",
    category: "sweets",
    unit: "g",
    unitNote: "70-85% cacao",
    macros: { protein: 7.8, fat: 42.6, carbs: 35, fiber: 10.9 },
  },
  {
    id: "edamame",
    name: "Edamame",
    category: "legumes",
    unit: "g",
    state: "cooked",
    macros: { protein: 11.9, fat: 5.2, carbs: 3.7, fiber: 5.2 },
  },
  {
    id: "chickpeas",
    name: "Chickpeas",
    category: "legumes",
    unit: "g",
    state: "cooked",
    macros: { protein: 8.9, fat: 2.6, carbs: 20.1, fiber: 7.6 },
  },
];

export const foods: Food[] = RAW.map((food) =>
  foodSchema.parse({ ...food, micros: MICROS[food.id] }),
);

const byId = new Map(foods.map((food) => [food.id, food]));

/** A built-in food by id, or undefined. For anywhere a miss isn't fatal. */
export function findFood(id: string): Food | undefined {
  return byId.get(id);
}

/**
 * A food by id, or a throw.
 *
 * Same reasoning as `idFor` in the routines authoring helpers: a typo should
 * fail at import rather than render a blank row or silently drop macros out of
 * a day total.
 *
 * **Authoring only.** At runtime a food id can legitimately be one you wrote
 * yourself, which this table has never heard of — use `findFood`, or the
 * injected `FoodSource` in `features/nutrition/macros.ts`.
 */
export function getFood(id: string): Food {
  const food = byId.get(id);
  if (!food) {
    throw new Error(
      `Unknown food "${id}" — add it to src/data/diets/foods.ts.`,
    );
  }
  return food;
}
