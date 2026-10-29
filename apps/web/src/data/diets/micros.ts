import type { Micros } from "./schema";

/**
 * Vitamins, minerals and omega-3s for every built-in food, on the same basis
 * as its macros — per 100 g/ml, or per one unit for a `unit` food.
 *
 * ## Where these numbers come from
 *
 * **Typical values, not label values.** Food labels in Mexico print macros and
 * sodium and almost nothing else, so the point of this table is that nobody
 * has to type 22 numbers off a package that doesn't have them. Whole foods use
 * USDA FoodData Central's figures for the closest match (cooked or raw to
 * match the food's own `state`). Packaged foods with no USDA twin — protein
 * flour, the two cereals, salsa macha, the greens powder — use the nearest
 * generic product, rounded, and fortification is assumed only where it's
 * near-universal (enriched bread, a "light" breakfast cereal).
 *
 * The supplements are the exception: their labels state their content, so
 * those numbers are the label's.
 *
 * A food left out of this table has *no data*, which the nutrition scores
 * report as a coverage gap — counting it as zero would make a plan built on
 * your own foods look deficient in everything. A nutrient left out of an entry
 * is zero (or close enough to it not to matter at a serving's size).
 *
 * Precision is to the level the source supports: these vary by brand, soil,
 * breed and cooking, and the scores read them as estimates, saying so.
 */
export const MICROS: Record<string, Micros> = {
  // — Eggs and dairy ———————————————————————————————————————————
  "whole-egg": {
    vitaminA: 80, vitaminD: 1, vitaminE: 0.5, riboflavin: 0.23, niacin: 0.04,
    vitaminB6: 0.09, folate: 24, vitaminB12: 0.45, choline: 147, calcium: 28,
    phosphorus: 99, magnesium: 6, iron: 0.88, zinc: 0.65, selenium: 15.4,
    potassium: 69, sodium: 71, epaDha: 0.03,
  },
  "liquid-egg-whites": {
    riboflavin: 0.44, niacin: 0.1, folate: 4, vitaminB12: 0.09, choline: 1,
    calcium: 7, phosphorus: 15, magnesium: 11, iron: 0.08, zinc: 0.03,
    selenium: 20, potassium: 163, sodium: 166,
  },
  "manchego-low-fat": {
    vitaminA: 200, vitaminD: 0.3, vitaminE: 0.3, vitaminK: 2, riboflavin: 0.3,
    vitaminB12: 1.2, choline: 15, calcium: 800, phosphorus: 550, magnesium: 30,
    zinc: 3.5, selenium: 15, potassium: 90, sodium: 600,
  },
  "high-protein-milk": {
    vitaminA: 50, vitaminD: 1.2, thiamin: 0.04, riboflavin: 0.2, vitaminB6: 0.04,
    folate: 5, vitaminB12: 0.5, choline: 15, calcium: 180, phosphorus: 140,
    magnesium: 15, zinc: 0.5, selenium: 3, potassium: 200, sodium: 50,
  },
  "greek-yogurt": {
    riboflavin: 0.23, vitaminB6: 0.06, folate: 7, vitaminB12: 0.75, choline: 15,
    calcium: 110, phosphorus: 135, magnesium: 11, zinc: 0.52, selenium: 9.7,
    potassium: 141, sodium: 36,
  },
  "light-yogurt-plain": {
    riboflavin: 0.2, vitaminB12: 0.5, choline: 15, calcium: 120,
    phosphorus: 120, magnesium: 12, zinc: 0.6, selenium: 3, potassium: 160,
    sodium: 50,
  },
  "light-yogurt-strawberry": {
    vitaminC: 2, riboflavin: 0.2, vitaminB12: 0.5, choline: 15, calcium: 120,
    phosphorus: 120, magnesium: 12, zinc: 0.6, selenium: 3, potassium: 160,
    sodium: 50,
  },
  "whole-milk": {
    vitaminA: 46, vitaminD: 1.3, thiamin: 0.05, riboflavin: 0.17,
    vitaminB6: 0.04, folate: 5, vitaminB12: 0.45, choline: 14, calcium: 113,
    phosphorus: 84, magnesium: 10, zinc: 0.37, selenium: 3.7, potassium: 132,
    sodium: 43,
  },
  "milk-2percent": {
    vitaminA: 55, vitaminD: 1.2, riboflavin: 0.19, vitaminB12: 0.5, choline: 16,
    calcium: 120, phosphorus: 92, magnesium: 11, zinc: 0.48, selenium: 2.5,
    potassium: 140, sodium: 47,
  },
  "cheddar-cheese": {
    vitaminA: 265, vitaminD: 0.6, vitaminE: 0.7, vitaminK: 2.4,
    riboflavin: 0.43, vitaminB6: 0.07, folate: 27, vitaminB12: 1.1, choline: 16,
    calcium: 710, phosphorus: 457, magnesium: 27, zinc: 3.6, selenium: 28.5,
    potassium: 76, sodium: 653,
  },
  "mozzarella-part-skim": {
    vitaminA: 127, riboflavin: 0.3, vitaminB12: 0.8, choline: 15, calcium: 782,
    phosphorus: 463, magnesium: 23, zinc: 2.8, selenium: 17, potassium: 95,
    sodium: 619,
  },
  "cottage-cheese-lowfat": {
    vitaminA: 20, riboflavin: 0.2, vitaminB12: 0.5, choline: 18, calcium: 90,
    phosphorus: 160, magnesium: 8, zinc: 0.4, selenium: 10, potassium: 90,
    sodium: 360,
  },

  // — Meat and fish ————————————————————————————————————————————
  bacon: {
    thiamin: 0.03, riboflavin: 0.02, niacin: 0.9, vitaminB6: 0.03,
    vitaminB12: 0.1, choline: 9, phosphorus: 40, magnesium: 3, iron: 0.1,
    zinc: 0.3, selenium: 5, potassium: 45, sodium: 190,
  },
  "turkey-ham": {
    niacin: 4, vitaminB6: 0.3, vitaminB12: 0.4, choline: 50, calcium: 10,
    phosphorus: 200, magnesium: 18, iron: 1.1, zinc: 2, selenium: 20,
    potassium: 250, sodium: 1000,
  },
  "chicken-breast-cooked": {
    vitaminA: 9, vitaminE: 0.27, thiamin: 0.07, riboflavin: 0.11, niacin: 13.7,
    vitaminB6: 0.6, folate: 4, vitaminB12: 0.34, choline: 85, calcium: 15,
    phosphorus: 228, magnesium: 29, iron: 1, zinc: 1, selenium: 27.6,
    potassium: 256, sodium: 74, epaDha: 0.02,
  },
  "chicken-breast-raw": {
    vitaminA: 9, vitaminE: 0.56, thiamin: 0.09, riboflavin: 0.14, niacin: 9.6,
    vitaminB6: 0.81, folate: 4, vitaminB12: 0.21, choline: 73, calcium: 5,
    phosphorus: 213, magnesium: 28, iron: 0.37, zinc: 0.68, selenium: 22.8,
    potassium: 334, sodium: 45, epaDha: 0.02,
  },
  "carne-asada-raw": {
    vitaminE: 0.3, thiamin: 0.06, riboflavin: 0.14, niacin: 6.6, vitaminB6: 0.5,
    folate: 8, vitaminB12: 2, choline: 65, calcium: 20, phosphorus: 200,
    magnesium: 21, iron: 1.6, zinc: 4, selenium: 23, potassium: 330, sodium: 55,
  },
  "pork-loin-raw": {
    vitaminD: 0.5, vitaminE: 0.2, thiamin: 0.9, riboflavin: 0.23, niacin: 6,
    vitaminB6: 0.55, vitaminB12: 0.6, choline: 70, calcium: 6, phosphorus: 220,
    magnesium: 25, iron: 0.5, zinc: 1.8, selenium: 37, potassium: 380,
    sodium: 50,
  },
  "turkey-breast-raw": {
    thiamin: 0.05, riboflavin: 0.1, niacin: 10, vitaminB6: 0.7, vitaminB12: 0.5,
    choline: 65, calcium: 10, phosphorus: 220, magnesium: 30, iron: 0.7,
    zinc: 1.2, selenium: 25, potassium: 300, sodium: 60,
  },
  "salmon-cooked": {
    vitaminA: 13, vitaminD: 13, vitaminE: 1.1, thiamin: 0.34, riboflavin: 0.14,
    niacin: 8, vitaminB6: 0.65, folate: 34, vitaminB12: 2.8, choline: 90,
    calcium: 15, phosphorus: 252, magnesium: 30, iron: 0.34, zinc: 0.43,
    selenium: 41, potassium: 384, sodium: 61, epaDha: 2,
  },
  "ground-beef-90-10-cooked": {
    riboflavin: 0.2, niacin: 6, vitaminB6: 0.4, vitaminB12: 2.6, choline: 85,
    calcium: 12, phosphorus: 220, magnesium: 22, iron: 2.8, zinc: 6.5,
    selenium: 21, potassium: 350, sodium: 75,
  },
  "ground-beef-88-12-raw": {
    vitaminE: 0.4, vitaminK: 1.4, thiamin: 0.04, riboflavin: 0.15, niacin: 4.9,
    vitaminB6: 0.33, folate: 7, vitaminB12: 2.4, choline: 60, calcium: 15,
    phosphorus: 180, magnesium: 18, iron: 2.2, zinc: 4.6, selenium: 15,
    potassium: 290, sodium: 67,
  },
  "tuna-canned-water": {
    vitaminD: 1.7, niacin: 13.3, vitaminB6: 0.35, vitaminB12: 2.6, choline: 30,
    calcium: 14, phosphorus: 217, magnesium: 27, iron: 1, zinc: 0.8,
    selenium: 70, potassium: 237, sodium: 247, epaDha: 0.27,
  },
  shrimp: {
    vitaminE: 1.4, niacin: 2.6, vitaminB6: 0.14, vitaminB12: 1.5, choline: 135,
    calcium: 70, phosphorus: 214, magnesium: 35, iron: 0.3, zinc: 1.6,
    selenium: 41, potassium: 170, sodium: 111, epaDha: 0.26,
  },
  tilapia: {
    vitaminD: 3.7, vitaminE: 0.8, niacin: 4.7, vitaminB6: 0.12, vitaminB12: 1.9,
    choline: 50, calcium: 14, phosphorus: 204, magnesium: 34, iron: 0.7,
    zinc: 0.4, selenium: 54, potassium: 380, sodium: 56, epaDha: 0.13,
  },
  "pork-chop": {
    vitaminD: 0.6, thiamin: 0.8, riboflavin: 0.3, niacin: 9, vitaminB6: 0.65,
    vitaminB12: 0.7, choline: 90, calcium: 20, phosphorus: 250, magnesium: 28,
    iron: 0.8, zinc: 2.4, selenium: 45, potassium: 370, sodium: 60,
  },

  // — Grains and tubers ————————————————————————————————————————
  "protein-flour": {
    thiamin: 0.4, riboflavin: 0.3, niacin: 4, vitaminB6: 0.1, folate: 100,
    choline: 30, calcium: 200, phosphorus: 400, magnesium: 60, iron: 3,
    zinc: 2, selenium: 20, potassium: 400, sodium: 600,
  },
  "white-rice-cooked": {
    thiamin: 0.02, niacin: 0.4, vitaminB6: 0.09, folate: 3, choline: 2,
    calcium: 10, phosphorus: 43, magnesium: 12, iron: 0.2, zinc: 0.5,
    selenium: 7.5, potassium: 35, sodium: 1,
  },
  "basmati-rice-cooked": {
    niacin: 0.4, vitaminB6: 0.09, folate: 3, choline: 2, calcium: 3,
    phosphorus: 40, magnesium: 12, iron: 0.2, zinc: 0.4, selenium: 7,
    potassium: 30, sodium: 1,
  },
  "jasmine-rice-dry": {
    thiamin: 0.07, niacin: 1.6, vitaminB6: 0.16, folate: 8, choline: 6,
    calcium: 28, phosphorus: 115, magnesium: 25, iron: 0.8, zinc: 1.1,
    selenium: 15, potassium: 115, sodium: 5,
  },
  // Nixtamalised with lime, which is why a tortilla carries real calcium.
  "corn-tortilla": {
    vitaminE: 0.1, thiamin: 0.03, niacin: 0.45, vitaminB6: 0.07, folate: 1.5,
    choline: 4, calcium: 50, phosphorus: 90, magnesium: 22, iron: 0.4,
    zinc: 0.3, selenium: 2, potassium: 55, sodium: 15,
  },
  "white-bread": {
    vitaminE: 0.2, thiamin: 0.5, riboflavin: 0.3, niacin: 5, vitaminB6: 0.1,
    folate: 170, choline: 12, calcium: 150, phosphorus: 100, magnesium: 23,
    iron: 3.6, zinc: 0.7, selenium: 22, potassium: 120, sodium: 490,
  },
  "oats-dry": {
    vitaminE: 0.4, vitaminK: 2, thiamin: 0.46, riboflavin: 0.16, niacin: 1.1,
    vitaminB6: 0.1, folate: 32, choline: 40, calcium: 52, phosphorus: 410,
    magnesium: 138, iron: 4.3, zinc: 3.6, selenium: 29, potassium: 362,
    sodium: 6,
  },
  "oats-cooked": {
    thiamin: 0.08, riboflavin: 0.02, niacin: 0.23, folate: 6, choline: 7,
    calcium: 9, phosphorus: 77, magnesium: 27, iron: 0.9, zinc: 1,
    selenium: 5.4, potassium: 70, sodium: 4,
  },
  "protein-cereal": {
    vitaminE: 1, thiamin: 0.3, niacin: 3, vitaminB6: 0.2, folate: 40,
    calcium: 100, phosphorus: 250, magnesium: 80, iron: 4, zinc: 2,
    selenium: 10, potassium: 300, sodium: 300,
  },
  // A typical fortified flake: most of what's here was added at the factory.
  "light-cereal": {
    vitaminA: 200, vitaminC: 15, vitaminD: 2, thiamin: 1.1, riboflavin: 1.2,
    niacin: 13, vitaminB6: 1.3, folate: 300, vitaminB12: 2, calcium: 40,
    phosphorus: 100, magnesium: 30, iron: 12, zinc: 4, selenium: 10,
    potassium: 150, sodium: 450,
  },
  salmas: {
    niacin: 0.1, calcium: 6, phosphorus: 15, magnesium: 3, iron: 0.1,
    potassium: 10, sodium: 25,
  },
  "quinoa-cooked": {
    vitaminE: 0.63, thiamin: 0.11, riboflavin: 0.11, niacin: 0.41,
    vitaminB6: 0.12, folate: 42, choline: 23, calcium: 17, phosphorus: 152,
    magnesium: 64, iron: 1.5, zinc: 1.1, selenium: 2.8, potassium: 172,
    sodium: 7,
  },
  "brown-rice-cooked": {
    thiamin: 0.18, niacin: 2.6, vitaminB6: 0.12, folate: 4, choline: 9,
    calcium: 3, phosphorus: 77, magnesium: 39, iron: 0.4, zinc: 0.6,
    selenium: 5.8, potassium: 79, sodium: 1,
  },
  "whole-wheat-pasta-cooked": {
    vitaminE: 0.3, thiamin: 0.17, riboflavin: 0.06, niacin: 2.3, vitaminB6: 0.1,
    folate: 5, choline: 15, calcium: 15, phosphorus: 127, magnesium: 53,
    iron: 1.7, zinc: 1.2, selenium: 36, potassium: 96, sodium: 4,
  },
  "sweet-potato-cooked": {
    vitaminA: 961, vitaminC: 19.6, vitaminE: 0.71, vitaminK: 2.3, thiamin: 0.1,
    riboflavin: 0.1, niacin: 1.5, vitaminB6: 0.29, folate: 6, choline: 13,
    calcium: 38, phosphorus: 54, magnesium: 27, iron: 0.7, zinc: 0.3,
    potassium: 475, sodium: 36,
  },
  "potato-russet": {
    vitaminC: 5.7, vitaminK: 1.8, thiamin: 0.08, niacin: 1, vitaminB6: 0.35,
    folate: 14, choline: 12, calcium: 13, phosphorus: 57, magnesium: 23,
    iron: 0.86, zinc: 0.29, potassium: 417, sodium: 5,
  },
  "rice-cakes": {
    thiamin: 0.06, niacin: 7.8, vitaminB6: 0.15, calcium: 11, phosphorus: 359,
    magnesium: 131, iron: 1.5, zinc: 3, selenium: 5, potassium: 290,
    sodium: 100,
  },
  "cream-of-rice": {
    niacin: 1.5, calcium: 5, phosphorus: 100, magnesium: 30, zinc: 1,
    selenium: 15, potassium: 50,
  },
  // Farina is iron-fortified as a rule; that's the figure here.
  "cream-of-wheat": {
    thiamin: 0.5, riboflavin: 0.3, niacin: 5, folate: 160, calcium: 20,
    phosphorus: 100, magnesium: 25, iron: 28, zinc: 0.9, selenium: 20,
    potassium: 120,
  },
  popcorn: {
    vitaminE: 0.3, thiamin: 0.1, niacin: 2.3, vitaminB6: 0.16, folate: 31,
    calcium: 7, phosphorus: 358, magnesium: 144, iron: 3.2, zinc: 3.1,
    selenium: 6, potassium: 329, sodium: 8,
  },
  "bagel-plain": {
    thiamin: 0.5, riboflavin: 0.3, niacin: 4.4, folate: 160, choline: 15,
    calcium: 20, phosphorus: 90, magnesium: 25, iron: 3.8, zinc: 0.9,
    selenium: 28, potassium: 100, sodium: 440,
  },

  // — Legumes ——————————————————————————————————————————————————
  "black-beans-cooked": {
    vitaminK: 3.3, thiamin: 0.24, riboflavin: 0.06, niacin: 0.5,
    vitaminB6: 0.07, folate: 149, choline: 33, calcium: 27, phosphorus: 140,
    magnesium: 70, iron: 2.1, zinc: 1.1, selenium: 1.2, potassium: 355,
    sodium: 1, ala: 0.1,
  },
  "refried-beans": {
    thiamin: 0.05, folate: 30, choline: 18, calcium: 35, phosphorus: 85,
    magnesium: 40, iron: 1.5, zinc: 0.7, selenium: 1.5, potassium: 340,
    sodium: 380,
  },
  "tofu-firm": {
    thiamin: 0.16, folate: 29, choline: 28, calcium: 680, phosphorus: 190,
    magnesium: 58, iron: 2.7, zinc: 1.6, selenium: 17, potassium: 240,
    sodium: 14, ala: 0.6,
  },
  edamame: {
    vitaminA: 15, vitaminC: 6.1, vitaminE: 0.68, vitaminK: 26.7, thiamin: 0.2,
    riboflavin: 0.16, niacin: 0.92, vitaminB6: 0.1, folate: 311, choline: 56,
    calcium: 63, phosphorus: 169, magnesium: 64, iron: 2.3, zinc: 1.4,
    selenium: 0.8, potassium: 436, sodium: 6, ala: 0.36,
  },
  chickpeas: {
    vitaminC: 1.3, vitaminE: 0.35, vitaminK: 4, thiamin: 0.12, riboflavin: 0.06,
    niacin: 0.53, vitaminB6: 0.14, folate: 172, choline: 43, calcium: 49,
    phosphorus: 168, magnesium: 48, iron: 2.9, zinc: 1.5, selenium: 3.7,
    potassium: 291, sodium: 7, ala: 0.1,
  },

  // — Vegetables ———————————————————————————————————————————————
  "frozen-veggies": {
    vitaminA: 200, vitaminC: 10, vitaminE: 0.4, vitaminK: 20, thiamin: 0.07,
    riboflavin: 0.06, niacin: 0.9, vitaminB6: 0.07, folate: 30, choline: 12,
    calcium: 25, phosphorus: 50, magnesium: 20, iron: 0.7, zinc: 0.4,
    selenium: 0.3, potassium: 170, sodium: 40,
  },
  broccoli: {
    vitaminA: 31, vitaminC: 89, vitaminE: 0.78, vitaminK: 102, thiamin: 0.07,
    riboflavin: 0.12, niacin: 0.64, vitaminB6: 0.18, folate: 63, choline: 19,
    calcium: 47, phosphorus: 66, magnesium: 21, iron: 0.73, zinc: 0.41,
    selenium: 2.5, potassium: 316, sodium: 33,
  },
  spinach: {
    vitaminA: 469, vitaminC: 28, vitaminE: 2, vitaminK: 483, thiamin: 0.08,
    riboflavin: 0.19, niacin: 0.72, vitaminB6: 0.2, folate: 194, choline: 19,
    calcium: 99, phosphorus: 49, magnesium: 79, iron: 2.7, zinc: 0.53,
    selenium: 1, potassium: 558, sodium: 79, ala: 0.14,
  },
  "green-beans": {
    vitaminA: 35, vitaminC: 12, vitaminE: 0.41, vitaminK: 14, thiamin: 0.08,
    riboflavin: 0.1, niacin: 0.73, vitaminB6: 0.14, folate: 33, choline: 15,
    calcium: 37, phosphorus: 38, magnesium: 25, iron: 1, zinc: 0.24,
    potassium: 211, sodium: 6,
  },
  asparagus: {
    vitaminA: 38, vitaminC: 5.6, vitaminE: 1.1, vitaminK: 42, thiamin: 0.14,
    riboflavin: 0.14, niacin: 0.98, vitaminB6: 0.09, folate: 52, choline: 16,
    calcium: 24, phosphorus: 52, magnesium: 14, iron: 2.1, zinc: 0.54,
    selenium: 2.3, potassium: 202, sodium: 2,
  },
  "bell-pepper-red": {
    vitaminA: 157, vitaminC: 128, vitaminE: 1.6, vitaminK: 4.9, thiamin: 0.05,
    riboflavin: 0.09, niacin: 1, vitaminB6: 0.29, folate: 46, choline: 5.6,
    calcium: 7, phosphorus: 26, magnesium: 12, iron: 0.43, zinc: 0.25,
    potassium: 211, sodium: 4,
  },
  carrots: {
    vitaminA: 835, vitaminC: 5.9, vitaminE: 0.66, vitaminK: 13, thiamin: 0.07,
    riboflavin: 0.06, niacin: 0.98, vitaminB6: 0.14, folate: 19, choline: 9,
    calcium: 33, phosphorus: 35, magnesium: 12, iron: 0.3, zinc: 0.24,
    potassium: 320, sodium: 69,
  },
  cauliflower: {
    vitaminC: 48, vitaminE: 0.08, vitaminK: 15.5, thiamin: 0.05,
    riboflavin: 0.06, niacin: 0.51, vitaminB6: 0.18, folate: 57, choline: 44,
    calcium: 22, phosphorus: 44, magnesium: 15, iron: 0.42, zinc: 0.27,
    potassium: 299, sodium: 30,
  },
  cucumber: {
    vitaminA: 5, vitaminC: 2.8, vitaminK: 16.4, folate: 7, calcium: 16,
    phosphorus: 24, magnesium: 13, iron: 0.28, zinc: 0.2, potassium: 147,
    sodium: 2,
  },
  mushrooms: {
    vitaminD: 0.2, thiamin: 0.08, riboflavin: 0.4, niacin: 3.6, vitaminB6: 0.1,
    folate: 17, choline: 17, calcium: 3, phosphorus: 86, magnesium: 9,
    iron: 0.5, zinc: 0.52, selenium: 9.3, potassium: 318, sodium: 5,
  },
  zucchini: {
    vitaminA: 10, vitaminC: 17.9, vitaminE: 0.12, vitaminK: 4.3,
    riboflavin: 0.09, niacin: 0.45, vitaminB6: 0.16, folate: 24, choline: 9.5,
    calcium: 16, phosphorus: 38, magnesium: 18, iron: 0.37, zinc: 0.32,
    potassium: 261, sodium: 8,
  },

  // — Fruit ————————————————————————————————————————————————————
  avocado: {
    vitaminA: 7, vitaminC: 10, vitaminE: 2.07, vitaminK: 21, thiamin: 0.07,
    riboflavin: 0.13, niacin: 1.74, vitaminB6: 0.26, folate: 81, choline: 14,
    calcium: 12, phosphorus: 52, magnesium: 29, iron: 0.55, zinc: 0.64,
    selenium: 0.4, potassium: 485, sodium: 7, ala: 0.11,
  },
  banana: {
    vitaminA: 3, vitaminC: 8.7, vitaminE: 0.1, riboflavin: 0.07, niacin: 0.67,
    vitaminB6: 0.37, folate: 20, choline: 9.8, calcium: 5, phosphorus: 22,
    magnesium: 27, iron: 0.26, zinc: 0.15, selenium: 1, potassium: 358,
    sodium: 1,
  },
  apple: {
    vitaminA: 3, vitaminC: 4.6, vitaminE: 0.18, vitaminK: 2.2, folate: 3,
    choline: 3.4, calcium: 6, phosphorus: 11, magnesium: 5, potassium: 107,
  },
  blueberries: {
    vitaminA: 3, vitaminC: 9.7, vitaminE: 0.57, vitaminK: 19.3, vitaminB6: 0.05,
    folate: 6, choline: 6, calcium: 6, phosphorus: 12, magnesium: 6, iron: 0.28,
    potassium: 77,
  },
  strawberries: {
    vitaminA: 1, vitaminC: 58.8, vitaminE: 0.29, vitaminK: 2.2, niacin: 0.39,
    vitaminB6: 0.05, folate: 24, choline: 5.7, calcium: 16, phosphorus: 24,
    magnesium: 13, iron: 0.41, zinc: 0.14, potassium: 153,
  },
  orange: {
    vitaminA: 11, vitaminC: 53.2, vitaminE: 0.18, thiamin: 0.09,
    vitaminB6: 0.06, folate: 30, choline: 8.4, calcium: 40, phosphorus: 14,
    magnesium: 10, potassium: 181,
  },
  grapes: {
    vitaminA: 3, vitaminC: 3.2, vitaminE: 0.19, vitaminK: 14.6, thiamin: 0.07,
    vitaminB6: 0.09, calcium: 10, phosphorus: 20, magnesium: 7, iron: 0.36,
    potassium: 191,
  },

  // — Fats, nuts and seeds ——————————————————————————————————————
  "peanut-butter": {
    vitaminE: 9.1, vitaminK: 0.3, thiamin: 0.15, riboflavin: 0.19, niacin: 13.1,
    vitaminB6: 0.44, folate: 87, choline: 63, calcium: 49, phosphorus: 339,
    magnesium: 168, iron: 1.7, zinc: 2.8, selenium: 4.1, potassium: 558,
    sodium: 350, ala: 0.03,
  },
  "chia-seeds": {
    vitaminE: 0.5, thiamin: 0.62, riboflavin: 0.17, niacin: 8.8, folate: 49,
    calcium: 631, phosphorus: 860, magnesium: 335, iron: 7.7, zinc: 4.6,
    selenium: 55, potassium: 407, sodium: 16, ala: 17.8,
  },
  flaxseed: {
    vitaminE: 0.3, vitaminK: 4.3, thiamin: 1.64, riboflavin: 0.16, niacin: 3.1,
    vitaminB6: 0.47, folate: 87, choline: 79, calcium: 255, phosphorus: 642,
    magnesium: 392, iron: 5.7, zinc: 4.3, selenium: 25.4, potassium: 813,
    sodium: 30, ala: 22.8,
  },
  almonds: {
    vitaminE: 25.6, thiamin: 0.2, riboflavin: 1.1, niacin: 3.6, vitaminB6: 0.14,
    folate: 44, choline: 52, calcium: 269, phosphorus: 481, magnesium: 270,
    iron: 3.7, zinc: 3.1, selenium: 4.1, potassium: 733, sodium: 1,
  },
  "mixed-nuts": {
    vitaminE: 8, thiamin: 0.3, niacin: 3, vitaminB6: 0.3, folate: 50,
    choline: 50, calcium: 100, phosphorus: 450, magnesium: 230, iron: 3,
    zinc: 4, selenium: 30, potassium: 600, sodium: 5, ala: 1,
  },
  pistachios: {
    vitaminA: 26, vitaminE: 2.9, vitaminK: 13, thiamin: 0.87, riboflavin: 0.16,
    niacin: 1.3, vitaminB6: 1.7, folate: 51, choline: 72, calcium: 105,
    phosphorus: 490, magnesium: 121, iron: 3.9, zinc: 2.2, selenium: 7,
    potassium: 1025, sodium: 1, ala: 0.3,
  },
  walnuts: {
    vitaminE: 0.7, vitaminK: 2.7, thiamin: 0.34, vitaminB6: 0.54, folate: 98,
    choline: 39, calcium: 98, phosphorus: 346, magnesium: 158, iron: 2.9,
    zinc: 3.1, selenium: 4.9, potassium: 441, sodium: 2, ala: 9.1,
  },
  cashews: {
    vitaminE: 0.9, vitaminK: 34, thiamin: 0.42, niacin: 1.1, vitaminB6: 0.42,
    folate: 25, choline: 61, calcium: 37, phosphorus: 593, magnesium: 292,
    iron: 6.7, zinc: 5.8, selenium: 19.9, potassium: 660, sodium: 12,
  },
  "olive-oil": { vitaminE: 14.4, vitaminK: 60, ala: 0.76 },
  "cooking-oil": { vitaminE: 8, vitaminK: 120, ala: 6 },
  "canola-oil": { vitaminE: 17.5, vitaminK: 71, ala: 9.1 },
  "avocado-oil": { vitaminE: 7, ala: 1 },
  "coconut-oil": { vitaminE: 0.1 },
  // Salted, which is what's sold in Mexico.
  butter: {
    vitaminA: 684, vitaminD: 1.5, vitaminE: 2.3, vitaminK: 7, choline: 19,
    calcium: 24, phosphorus: 24, potassium: 24, sodium: 600,
  },
  "salsa-macha": {
    vitaminA: 100, vitaminE: 5, vitaminK: 15, magnesium: 30, iron: 1,
    potassium: 100, sodium: 400,
  },

  // — Sweets and sauces ————————————————————————————————————————
  ketchup: {
    vitaminA: 26, vitaminC: 4, vitaminE: 1.5, vitaminK: 3, niacin: 1.4,
    vitaminB6: 0.16, folate: 9, calcium: 15, phosphorus: 26, magnesium: 13,
    iron: 0.35, zinc: 0.17, potassium: 315, sodium: 900,
  },
  "biscoff-spread": {
    vitaminE: 3, calcium: 20, magnesium: 10, iron: 1, potassium: 80,
    sodium: 200,
  },
  "granulated-sugar": {},
  honey: { vitaminC: 0.5, calcium: 6, magnesium: 2, iron: 0.4, potassium: 52 },
  "maple-syrup": {
    riboflavin: 1.3, calcium: 102, magnesium: 21, zinc: 1.5, potassium: 212,
    sodium: 12,
  },
  "dark-chocolate": {
    vitaminE: 0.6, vitaminK: 7.3, niacin: 1.1, calcium: 73, phosphorus: 308,
    magnesium: 228, iron: 11.9, zinc: 3.3, selenium: 6.8, potassium: 715,
    sodium: 20,
  },

  // — Supplements ——————————————————————————————————————————————
  "whey-protein": {
    riboflavin: 0.2, vitaminB12: 0.3, choline: 10, calcium: 120,
    phosphorus: 100, magnesium: 20, zinc: 0.5, potassium: 150, sodium: 60,
  },
  "mass-gainer": { calcium: 150, phosphorus: 100, potassium: 200, sodium: 100 },
  "greens-reds": {
    vitaminA: 50, vitaminC: 10, vitaminK: 30, folate: 20, iron: 0.5,
    potassium: 100, sodium: 30,
  },
  "fiber-supplement": {},
  // The label: 0.30 g EPA + 0.20 g DHA a capsule. DPA isn't counted.
  "salmon-oil-capsule": { epaDha: 0.5 },
  // The label: 105 mg magnesium, 10 µg (400 IU) D3 per two capsules.
  "magnesium-d3": { vitaminD: 10, magnesium: 105 },
  // The label: 250 mg vitamin C per 30 ml.
  "evp-aq": { vitaminC: 833 },
  // The label: 100 mg vitamin C, 40 mg magnesium, 90 mg potassium and 100 mg
  // sodium a scoop.
  "amino-kem": { vitaminC: 100, magnesium: 40, potassium: 90, sodium: 100 },
};
