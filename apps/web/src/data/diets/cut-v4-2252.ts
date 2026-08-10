import {
  HOME_DAYS,
  OFFICE_DAYS,
  everyDay,
  item,
  onDays,
  swap,
} from "./authoring";
import { dietPlanSchema, type DietPlan } from "./schema";

/**
 * The previous cut, kept because it's the one v5 is a step down from.
 *
 * Same three meals and the same breakfast and dinner shape; the difference is
 * almost entirely lunch, where the chicken is weighed raw and there is nearly
 * twice the rice.
 */
export const cutV4: DietPlan = dietPlanSchema.parse({
  slug: "cut-v4-2252",
  name: "Cut v4 — 2,252 kcal",
  goal: "cutting",
  tdeeKcal: 3354,
  targetKcal: 2252,
  targets: { protein: 220, carbs: 190, fat: 68 },
  meals: [
    {
      name: "Breakfast",
      note: "Cook it the night before.",
      variants: [
        everyDay(
          item("whole-egg", 2),
          item("liquid-egg-whites", 240, "measured before cooking"),
          item("bacon", 1),
          item("manchego-low-fat", 20, "weighed raw"),
          item("protein-flour", 60, "weighed dry, mix with water → hotcakes"),
        ),
      ],
    },
    {
      name: "Lunch",
      variants: [
        onDays("Office days", OFFICE_DAYS, {
          items: [
            item("chicken-breast-raw", 343, "raw — about 250g once cooked"),
            item("white-rice-cooked", 140, "from the rice cooker"),
            item("corn-tortilla", 3),
            item("avocado", 114, "flesh only, weighed after peeling"),
          ],
        }),
        onDays(
          "Home days",
          HOME_DAYS,
          swap(
            "Carne asada",
            item("carne-asada-raw", 359),
            item("white-rice-cooked", 167),
            item("corn-tortilla", 3),
            item("avocado", 29, "flesh only"),
          ),
          swap(
            "Pork loin",
            item("pork-loin-raw", 376),
            item("white-rice-cooked", 157),
            item("corn-tortilla", 3),
            item("avocado", 61, "flesh only"),
          ),
          swap(
            "Turkey breast",
            item("turkey-breast-raw", 329, "Costco"),
            item("white-rice-cooked", 136),
            item("corn-tortilla", 3),
            item("avocado", 126, "flesh only"),
          ),
          swap(
            "Chicken breast",
            item("chicken-breast-raw", 343),
            item("white-rice-cooked", 140),
            item("corn-tortilla", 3),
            item("avocado", 114, "flesh only"),
          ),
        ),
      ],
    },
    {
      name: "Dinner",
      note: "No rice.",
      variants: [
        everyDay(
          item("whey-protein", 1, "mix with the milk"),
          item("high-protein-milk", 200),
          item("greek-yogurt", 200),
          item("manchego-low-fat", 20, "1 thin slice, weighed raw"),
          item("peanut-butter", 20, "in the yogurt or on the bread"),
          item("white-bread", 63, "2 slices"),
        ),
      ],
    },
  ],
  notes: [
    "Protein holds at 220g — muscle protection is the one thing an aggressive deficit doesn't get to touch.",
    "The volume came out of carbs: 260g → 190g, and dinner lost its rice entirely.",
    "The food adds to about 222g of protein against a 220g target — the source states both numbers and they disagree by two grams, which is inside the rounding on its own rows.",
  ],
});
