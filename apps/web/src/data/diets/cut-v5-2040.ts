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
 * The current cut. Lower than v4 by ~220 kcal, to break a two-week plateau.
 *
 * The lunch is where the two day types diverge: at the office the chicken
 * arrives already cooked and that's the weight you control, at home you're
 * holding the raw meat before it goes on. Hence the same meal carrying both a
 * cooked and a raw chicken entry — they aren't the same number twice.
 */
export const cutV5: DietPlan = dietPlanSchema.parse({
  slug: "cut-v5-2040",
  name: "Cut v5 — 2,040 kcal",
  goal: "cutting",
  tdeeKcal: 3150,
  targetKcal: 2040,
  targets: { protein: 187, carbs: 173, fat: 67 },
  meals: [
    {
      name: "Breakfast",
      variants: [
        everyDay(
          item("whole-egg", 2),
          item("liquid-egg-whites", 240, "before cooking"),
          item("bacon", 1),
          item("manchego-low-fat", 20, "weighed raw"),
          item("protein-flour", 60, "dry, mix with water → hotcakes"),
        ),
      ],
    },
    {
      name: "Lunch",
      variants: [
        onDays("Office days", OFFICE_DAYS, {
          items: [
            item(
              "chicken-breast-cooked",
              150,
              "1 breast from the cafeteria, grilled or steamed, no sauce",
            ),
            item("white-rice-cooked", 80, "from the rice cooker, bring in a container"),
            item("corn-tortilla", 3),
            item("avocado", 120, "flesh only"),
          ],
        }),
        onDays(
          "Home days",
          HOME_DAYS,
          swap(
            "Carne asada",
            item("carne-asada-raw", 211),
            item("white-rice-cooked", 91),
            item("corn-tortilla", 3),
            item("avocado", 86, "flesh only"),
          ),
          swap(
            "Pork loin",
            item("pork-loin-raw", 221),
            item("white-rice-cooked", 85),
            item("corn-tortilla", 3),
            item("avocado", 104, "flesh only"),
          ),
          swap(
            "Turkey breast",
            item("turkey-breast-raw", 194, "Costco"),
            item("white-rice-cooked", 73),
            item("corn-tortilla", 3),
            item("avocado", 143, "flesh only"),
          ),
          swap(
            "Chicken breast",
            item("chicken-breast-raw", 202),
            item("white-rice-cooked", 75),
            item("corn-tortilla", 3),
            item("avocado", 136, "flesh only"),
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
          item("manchego-low-fat", 20, "1 thin slice"),
          item("peanut-butter", 15, "on the bread or in the yogurt"),
          item("white-bread", 63, "2 slices"),
        ),
      ],
    },
  ],
  supplements: [
    {
      name: "Evoburn",
      dose: "Full scoop",
      timing: "With breakfast",
      note: "Not fasted.",
    },
    {
      name: "Carnigen",
      dose: "1 serving with 500ml water",
      timing: "Pre-lifting or pre-cardio",
    },
    { name: "Whey", dose: "1 scoop", timing: "With dinner", note: "Already in the plan." },
    // Creatine is deliberately absent: the plan panel computes a dose from
    // your own fat-free mass, and a transcribed "5g daily" beside it is the
    // same advice stated twice — with two different numbers whenever you're
    // not the person the doc was written for.
    { name: "Magnesium glycinate", dose: "300–400mg", timing: "Before bed" },
  ],
  notes: [
    "Protein is 2.1g per kg of lean mass — still inside the muscle-protective range at this deficit.",
    "Office-day chicken is weighed cooked; every home-day meat is weighed raw, before cooking.",
  ],
});
