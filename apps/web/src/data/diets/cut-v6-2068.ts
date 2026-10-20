import { everyDay, item, swap } from "./authoring";
import { dietPlanSchema, type DietPlan } from "./schema";

/**
 * The current cut, and the first one written entirely off real labels.
 *
 * The change from v5 isn't mostly calories — it's fibre. v5 came to about
 * 15 g a day; v6 is built to reach the 14 g per 1,000 kcal guideline (~29 g),
 * from protein flour, tortillas, a bag of frozen vegetables, oats and chia.
 *
 * There is no office/home split any more, so every meal is one variant. The
 * swap table in the source is half meal-level and half item-level: the two
 * protein swaps for lunch are whole options here, since they move the avocado
 * too, and the cereal and nut swaps stay as notes. Carne asada is a note
 * rather than a third option because at 215 g it lands ~4 g of fat over the
 * day, which is a swap you make knowingly rather than one the plan promises
 * is equivalent.
 */
export const cutV6: DietPlan = dietPlanSchema.parse({
  slug: "cut-v6-2068",
  name: "Cut v6 — 2,068 kcal",
  goal: "cutting",
  tdeeKcal: 3056,
  targetKcal: 2068,
  targets: { protein: 193, carbs: 197, fat: 57 },
  meals: [
    {
      name: "Breakfast",
      variants: [
        everyDay(
          item("whole-egg", 1),
          item("liquid-egg-whites", 250, "before cooking"),
          item("cooking-oil", 3, "to cook the eggs"),
          item("turkey-ham", 50, "diced into the eggs (a 250 g pack = 5 days)"),
          item("protein-flour", 70, "dry, mix with water → hotcakes"),
          item("butter", 5, "for the hotcakes pan"),
          item("peanut-butter", 12, "on the hotcakes"),
          item("ketchup", 15, "about 1 tablespoon"),
        ),
      ],
    },
    {
      name: "Lunch",
      variants: [
        {
          options: [
            swap(
              "Chicken breast",
              item("chicken-breast-raw", 205, "raw — about 150 g cooked"),
              item("cooking-oil", 5, "for the pan (1 teaspoon)"),
              item("basmati-rice-cooked", 70),
              item("frozen-veggies", 200, "cooked without oil"),
              item("corn-tortilla", 3),
              item("avocado", 25, "flesh only"),
              item("salsa-macha", 5, "on the meat"),
            ),
            swap(
              "Pork loin",
              item("pork-loin-raw", 225, "raw"),
              item("cooking-oil", 5, "for the pan (1 teaspoon)"),
              item("basmati-rice-cooked", 70),
              item("frozen-veggies", 200, "cooked without oil"),
              item("corn-tortilla", 3),
              item("salsa-macha", 5, "on the meat"),
            ),
          ],
        },
      ],
    },
    {
      name: "Dinner",
      variants: [
        {
          options: [
            swap(
              "Plain light yogurt",
              item("whey-protein", 1),
              item("high-protein-milk", 250),
              item("greek-yogurt", 100, "mixed 1:1 with the light yogurt"),
              item("light-yogurt-plain", 100),
              item("oats-dry", 40, "dry weight, in the yogurt"),
              item("chia-seeds", 10, "mixed into the yogurt — never eat it dry"),
              item("white-bread", 63, "2 slices, cheese sandwich"),
              item("manchego-low-fat", 20, "in the sandwich"),
            ),
            swap(
              "Strawberry light yogurt",
              item("whey-protein", 1),
              item("high-protein-milk", 250),
              item("greek-yogurt", 100, "mixed 1:1 with the light yogurt"),
              item("light-yogurt-strawberry", 100),
              item("oats-dry", 40, "dry weight, in the yogurt"),
              item("chia-seeds", 10, "mixed into the yogurt — never eat it dry"),
              item("white-bread", 63, "2 slices, cheese sandwich"),
              item("manchego-low-fat", 20, "in the sandwich"),
            ),
          ],
        },
      ],
    },
  ],
  supplements: [],
  notes: [
    "Ramp the fibre up over two weeks: the vegetables first, then the oats, then the chia. Too fast means bloating and gas.",
    "Drink your water — more fibre without more water makes digestion worse, not better.",
    "Chia always goes into the yogurt, never dry; mixing it in before the sandwich gives it a few minutes to soften.",
    "Swaps: 30 g protein cereal for 30 g of the oats · 30 g light cereal for 50 g of the rice · 15 g pistachios or 15 g mixed nuts for the avocado.",
    "Carne asada (~215 g raw) also replaces the chicken if you skip the avocado — about 4 g more fat than the plan.",
    "Want fruit back? 100 g strawberries is 28 kcal and 2 g fibre; drop 30 g of cooked rice to keep the calories flat.",
    "Measure oil with a teaspoon, never pour. Weigh butter, ketchup, peanut butter and salsa macha for a week until you can eyeball them — salsa macha is almost pure oil.",
  ],
});
