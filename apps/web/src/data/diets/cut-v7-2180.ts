import { everyDay, item, onDays, swap } from "./authoring";
import { dietPlanSchema, type DietPlan, type Weekday } from "./schema";

/**
 * The aggressive cut, and the first plan written around a training week rather
 * than one day repeated seven times.
 *
 * Three things change across the week, and each is a day variant:
 * - **Dinner rotates** three turkey, three pork, one beef. Pork is there for
 *   thiamin, which nothing else in the plan carries much of; beef for iron,
 *   zinc and B12.
 * - **The rest day** has no pre-workout drink and no K.E.M., and takes the
 *   beef, whose fat keeps its calories near the training days'.
 * - **Which day rests** is Sunday, the source's own example order. Nothing
 *   depends on it beyond giving the day picker a fixed week to show.
 *
 * So no single day *is* the plan, and the targets are the source's weekly
 * average. `macros.test.ts` checks the mean of the seven days against them,
 * and each day's calories against the total the source gives for that dinner.
 *
 * Like v4 and v5, the source counts tortillas and avocado at total carbs. It
 * also counts K.E.M.'s amino acids as 8.5 g of protein, which the label
 * doesn't, so the training days really come to about 8 g less protein than
 * the source says.
 *
 * The plain water drunk with each meal isn't transcribed — the hydration card
 * derives that from your own weight. The water that belongs to a product is
 * kept, since the glycerol needs its litre to work.
 *
 * TDEE is the middle of the source's 3,250–3,550 range, which counts the
 * treadmill sessions.
 */
const TRAINING_DAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat"];

export const cutV7: DietPlan = dietPlanSchema.parse({
  slug: "cut-v7-2180",
  name: "Cut v7 — 2,180 kcal",
  goal: "cutting",
  tdeeKcal: 3400,
  targetKcal: 2180,
  targets: { protein: 212, carbs: 198, fat: 59 },
  meals: [
    {
      name: "Breakfast",
      note: "08:30 — a yogurt bowl and a scramble.",
      variants: [
        everyDay(
          item("oats-dry", 30, "dry weight, in the yogurt"),
          item("greek-yogurt", 200),
          item("chia-seeds", 10, "mixed into the yogurt — never eat it dry"),
          item("strawberries", 100, "frozen, about 7 — weigh 7 once to learn your bag"),
          item("peanut-butter", 15),
          item("whole-egg", 2),
          item("liquid-egg-whites", 100, "before cooking"),
          item("turkey-ham", 30, "2 slices, in the scramble — keep it near 30 g a day"),
          item("cooking-oil", 3, "to cook the eggs"),
          item("ketchup", 20),
          item("salmon-oil-capsule", 2),
          item("magnesium-d3", 1),
        ),
      ],
    },
    {
      name: "Lunch",
      note: "13:00, with a 600 ml Coke Zero.",
      variants: [
        {
          options: [
            swap(
              "Chicken breast",
              item("chicken-breast-raw", 200, "raw — one package"),
              item("basmati-rice-cooked", 120),
              item("frozen-veggies", 250),
              item("cooking-oil", 2, "for the pan"),
              item("avocado", 20, "flesh only"),
            ),
            swap(
              "Turkey breast",
              item("turkey-breast-raw", 200, "Costco"),
              item("basmati-rice-cooked", 120),
              item("frozen-veggies", 250),
              item("cooking-oil", 2, "for the pan"),
              item("avocado", 20, "flesh only"),
            ),
          ],
        },
      ],
    },
    {
      name: "Afternoon shake",
      note: "16:30. Or straight after training, with dinner pushed to ~23:45 — the totals don't change.",
      variants: [
        everyDay(
          item("whey-protein", 1, "mix with the milk"),
          item("high-protein-milk", 200),
        ),
      ],
    },
    {
      name: "Pre-workout meal",
      note: "18:30. Low in fat and fibre so it's digested by 20:00 — which is why it's the pancake and not the yogurt bowl.",
      variants: [
        everyDay(
          item("protein-flour", 45, "dry, mix with water → hotcakes"),
          item("butter", 5, "on top or in the pan"),
        ),
      ],
    },
    {
      name: "Pre-workout drink",
      note: "19:20–19:40, with 2 scoops of EVP 3D in a 600 ml shaker. Refill it with 400 ml of water and finish it during the warm-up.",
      variants: [
        onDays("Training days", TRAINING_DAYS, {
          items: [item("evp-aq", 30)],
        }),
      ],
    },
    {
      name: "During training",
      note: "20:00–22:30, in 1 L of water with 1.5 g of salt (≈590 mg sodium) — the sodium is what lets the glycerol hold water.",
      variants: [
        onDays("Training days", TRAINING_DAYS, {
          items: [item("amino-kem", 1)],
        }),
      ],
    },
    {
      name: "Dinner",
      note: "23:30, tacos — after the treadmill on cardio days.",
      variants: [
        onDays("Turkey tacos", ["mon", "wed", "fri"], {
          items: [
            item("turkey-breast-raw", 180, "Costco"),
            item("corn-tortilla", 2),
            item("refried-beans", 50),
            item("frozen-veggies", 250),
            item("cooking-oil", 1, "cooking spray"),
          ],
        }),
        onDays("Pork tacos", ["tue", "thu", "sat"], {
          items: [
            item(
              "pork-loin-raw",
              180,
              "Costco, fat cap trimmed — cook to 63 °C and rest 3 minutes",
            ),
            item("corn-tortilla", 2),
            item("refried-beans", 50),
            item("frozen-veggies", 250),
            item("cooking-oil", 1, "cooking spray"),
          ],
        }),
        onDays("Beef tacos", ["sun"], {
          items: [
            item(
              "ground-beef-88-12-raw",
              150,
              "Costco — dry pan, no spray: it cooks in its own fat",
            ),
            item("corn-tortilla", 2),
            item("refried-beans", 50),
            item("frozen-veggies", 250),
          ],
        }),
      ],
    },
  ],
  supplements: [
    {
      name: "Evoburn",
      dose: "1 serving (~250 mg caffeine)",
      timing: "08:00, on an empty stomach",
      note: "With 300 ml of water. Cut only — stop it for maintenance and the bulk, and drop it first if your blood pressure goes above ~130/80 or you get palpitations or bad sleep.",
    },
    {
      name: "EVP 3D",
      dose: "2 scoops",
      timing: "Pre-workout, in the EVP AQ shaker",
      note: "Stimulant-free, with 2.5 g of creatine on top of your daily dose. Use it instead of Xtreme N.O., whose 200 mg of caffeine is too close to bed for an evening session.",
    },
    {
      name: "Vitamin D3",
      dose: "1,000 IU",
      timing: "With breakfast",
      note: "With the 400 IU in the magnesium capsules, it brings vitamin D up to target.",
    },
    // Creatine is left out for the reason v5 gives: the plan panel works out a
    // dose from your own lean mass, and a transcribed "3 g" beside it would be
    // the same advice twice with two numbers.
    {
      name: "Carnigen",
      dose: "1 serving",
      timing: "With dinner",
      note: "Optional — the weakest product in the stack. It only builds up in muscle taken with carbs over many weeks.",
    },
  ],
  notes: [
    "The targets are the week's average: turkey days come to ~2,170 kcal, pork days ~2,200 and the beef rest day ~2,140, so a single day reads a few grams off them.",
    "Sunday is the rest day here — no pre-workout drink or K.E.M., and beef at dinner. If yours falls on another day, move the beef with it.",
    "Meats are weighed raw, basmati cooked, oats and pancake mix dry.",
    "Caffeine comes to ~300 mg a day (Evoburn ~250, Coke Zero ~57), all before 16:00. Protect your sleep: 7–9 hours, because short sleep on a diet takes the loss out of muscle instead of fat.",
    "If EVP AQ is new to you, start with 15 ml — glycerol can cause bloating or a headache. Don't drink more than ~1 L of water an hour.",
    "Weeks 1–2: the fast 2–4 kg drop is water and glycogen, so don't adjust yet. From week 3, aim to lose 0.7–1.0% of your body weight a week, judged on the weekly average weigh-in.",
    "Losing more than 1% a week, or main lifts down more than ~10%: add 150–200 kcal on cardio days first — a second 45 g pancake, or 175 g of cooked basmati at dinner. Under 0.5% a week for two weeks: drop the avocado and the peanut butter (~150 kcal) or add steps.",
    "Every 6–8 weeks, eat at maintenance (~3,000–3,200 kcal) for 1–2 weeks. Around 18–20% body fat, slow down to ~0.5% a week.",
    "Swaps: 30 g turkey ham ≈ 20 g raw chicken or turkey · 1 scoop whey ≈ 230 g egg whites · 120 g cooked basmati ≈ 35 g dry jasmine ≈ 2 corn tortillas ≈ 2 slices white bread · 15 g peanut butter ≈ 15 g pistachios ≈ 50 g avocado ≈ 8 ml oil ≈ 10 g butter.",
    "Frozen vegetables are nearly free (~38 kcal per 100 g): add more at lunch and dinner when you're hungry. So are hot sauce, lime, chile powder, pepper, garlic or onion powder, and cinnamon or sweetener on the yogurt. Salsa macha, extra butter and Biscoff are not.",
    "Vitamin E is the gap this plan leaves. 20 g of almonds a day closes it — or Costco nuts with almonds in them, in place of the peanut butter.",
    "Estimates only. With high blood pressure, heart issues, kidney problems or any medication, check with a doctor before taking this stimulant stack or running a deficit this size.",
  ],
});
