/**
 * Spanish (Mexico) names for the authored data.
 *
 * `src/data/` stays the canonical English source and is not touched — adding an
 * exercise doesn't require speaking Spanish, and `i18n.test.ts` reports what's
 * missing rather than letting a gap render as an id.
 *
 * Two kinds of key, for two kinds of vocabulary:
 *
 * - **By id**, where the data already has a stable identifier — exercises,
 *   movements, poses, foods, routines, diet plans.
 * - **By English source string**, where it doesn't. A day is labelled
 *   `"Shoulder/Traps"` in the program file with no id attached, and the same
 *   goes for meal names, variant labels, supplement timings and the notes on a
 *   food. The English string *is* the key there, which is only safe because
 *   these are closed sets the test walks.
 *
 * Terminology is Mexican gym Spanish, not textbook Spanish: "lagartijas" rather
 * than "flexiones", "curl" kept as the loanword everyone actually says, and
 * machine names left in the form they're printed on the machine.
 */

/** Exercise id → name. */
export const exerciseNames: Record<string, string> = {
  // Chest
  "flat-barbell-bench-press": "Press de banca plano con barra",
  "close-grip-bench-press": "Press de banca con agarre cerrado",
  "flat-dumbbell-press": "Press plano con mancuernas",
  "flat-smith-bench-press": "Press plano en máquina Smith",
  "flat-machine-chest-press": "Press de pecho plano en máquina",
  "incline-barbell-bench-press": "Press inclinado con barra",
  "incline-dumbbell-press": "Press inclinado con mancuernas",
  "incline-dumbbell-neutral-press": "Press inclinado con mancuernas agarre neutro",
  "incline-smith-bench-press": "Press inclinado en máquina Smith",
  "incline-dumbbell-fly": "Aperturas inclinadas con mancuernas",
  "pec-deck": "Pec deck (mano abierta)",
  "cable-crossover-mid": "Cruce de poleas (medio)",
  "cable-fly": "Aperturas en poleas",
  "chest-dip": "Fondos de pecho",
  "machine-chest-dip": "Fondos en máquina (pecho)",
  "machine-triceps-dip": "Fondos en máquina (tríceps)",
  "feet-elevated-push-up": "Lagartijas con pies elevados",
  "push-up": "Lagartija",
  "standing-cable-chest-press": "Press de pecho en polea de pie",
  "dumbbell-pullover": "Pullover con mancuerna",
  "machine-pullover": "Pullover en máquina",
  "cable-pullover": "Pullover en polea",

  // Back
  "lat-pulldown-wide": "Jalón al pecho agarre abierto",
  "lat-pulldown-close": "Jalón al pecho agarre cerrado",
  "lat-pulldown-reverse": "Jalón al pecho agarre supino",
  "wide-grip-pull-up": "Dominadas agarre abierto",
  "cable-straight-arm-pulldown": "Jalón con brazos rectos en polea",
  "rope-straight-arm-pulldown": "Jalón con brazos rectos con cuerda",
  "t-bar-row-wide": "Remo en T agarre abierto",
  "t-bar-row-shoulder": "Remo en T agarre a la anchura de hombros",
  "t-bar-row-v-bar": "Remo en T con agarre V",
  "barbell-row-underhand": "Remo con barra agarre supino",
  "barbell-row-overhand": "Remo con barra agarre prono",
  "single-arm-dumbbell-row": "Remo a una mano con mancuerna",
  "single-arm-dumbbell-high-row": "Remo alto a una mano con mancuerna",
  "incline-bench-dumbbell-row": "Remo con mancuernas en banco inclinado",
  "low-cable-row-mag": "Remo bajo en polea (agarre mag)",
  "low-cable-row-rope": "Remo bajo en polea (cuerda)",
  "low-cable-row-v-bar": "Remo bajo en polea (agarre V)",
  "machine-mid-row-neutral": "Remo medio en máquina (agarre neutro)",
  "machine-mid-row-overhand": "Remo medio en máquina agarre prono",
  hyperextension: "Hiperextensiones",
  "weighted-hyperextension": "Hiperextensiones con peso",
  "single-leg-hyperextension": "Hiperextensiones a una pierna",
  "glute-biased-hyperextension": "Hiperextensiones con enfoque en glúteo",

  // Shoulders and traps
  "seated-barbell-shoulder-press": "Press militar sentado con barra",
  "dumbbell-shoulder-press": "Press de hombro con mancuernas",
  "machine-shoulder-press-neutral": "Press de hombro en máquina (agarre neutro)",
  "smith-shoulder-press": "Press de hombro en máquina Smith",
  "seated-dumbbell-lateral-raise": "Elevaciones laterales sentado con mancuernas",
  "single-arm-cable-lateral-raise": "Elevación lateral a una mano en polea",
  "cable-lateral-raise": "Elevación lateral en polea",
  "machine-lateral-raise": "Elevación lateral en máquina",
  "dumbbell-front-raise": "Elevaciones frontales de pie con mancuernas",
  "dumbbell-front-raise-together":
    "Elevaciones frontales de pie con mancuernas (brazos juntos)",
  "plate-front-raise": "Elevación frontal con disco",
  "steering-wheel-front-raise": "Elevación frontal tipo volante",
  "spider-bench-front-raise": "Elevación frontal en banco spider (agarre prono)",
  "incline-dumbbell-front-raise": "Elevación frontal inclinada con mancuernas",
  "bent-over-dumbbell-rear-delt-raise":
    "Elevación posterior inclinado con mancuernas (agarre prono)",
  "seated-bent-over-rear-delt-raise":
    "Elevación posterior sentado inclinado (agarre prono)",
  "reverse-fly-machine": "Máquina de deltoide posterior",
  "cable-rear-delt-fly": "Aperturas posteriores en polea",
  "cable-face-pull": "Face pull en polea",
  "barbell-upright-row": "Remo al mentón de pie con barra",
  "barbell-shrug": "Encogimientos de pie con barra",
  "dumbbell-shrug": "Encogimientos con mancuernas",
  "smith-shrug": "Encogimientos en máquina Smith",
  "cable-shrug": "Encogimientos en polea",

  // Biceps
  "standing-barbell-curl": "Curl de bíceps de pie con barra",
  "standing-ez-bar-curl": "Curl de pie con barra Z",
  "ez-bar-reverse-curl": "Curl inverso de pie con barra Z",
  "standing-dumbbell-curl": "Curl de pie con mancuernas",
  "standing-dumbbell-curl-together": "Curl de pie con mancuernas (brazos juntos)",
  "alternating-dumbbell-curl": "Curl alterno con mancuernas",
  "spider-bench-dumbbell-curl": "Curl con mancuernas en banco spider",
  "waiter-curl": "Curl del mesero",
  "standing-hammer-curl": "Curl martillo de pie",
  "alternating-hammer-curl": "Curl martillo alterno",
  "rope-hammer-curl": "Curl martillo con cuerda",
  "incline-hammer-curl": "Curl martillo en banco inclinado",
  "machine-preacher-curl": "Curl predicador en máquina",
  "single-arm-machine-preacher-curl": "Curl predicador en máquina a una mano",
  "ez-bar-preacher-curl": "Curl predicador con barra Z",
  "low-cable-curl-straight-bar": "Curl en polea baja (barra recta)",
  "incline-cable-curl": "Curl inclinado de pie en polea",
  "front-double-bicep-cable-curl": "Curl en polea doble bíceps frontal",

  // Triceps
  "rope-pushdown": "Extensión de tríceps con cuerda",
  "cable-pushdown": "Extensión de tríceps en polea",
  "straight-bar-pushdown": "Extensión de tríceps con barra recta",
  "cambered-bar-pushdown": "Extensión de tríceps con barra curva",
  "reverse-grip-pushdown": "Extensión de tríceps agarre supino",
  "single-arm-reverse-pushdown": "Extensión de tríceps a una mano agarre supino",
  "ez-bar-skull-crusher": "Rompecráneos con barra Z",
  "dumbbell-skull-crusher": "Rompecráneos con mancuernas",
  "rope-overhead-extension": "Extensión de tríceps sobre la cabeza con cuerda",
  "dumbbell-seated-overhead-extension":
    "Extensión sobre la cabeza sentado con mancuerna",
  "single-arm-dumbbell-overhead-extension":
    "Extensión sobre la cabeza sentado a una mano",
  "dumbbell-kickback": "Patada de tríceps con mancuerna (palmas abajo)",
  "dumbbell-kickback-pinky-up": "Patada de tríceps con mancuerna (meñique arriba)",

  // Forearms
  "barbell-wrist-curl": "Curl de muñeca con barra sentado",
  "dumbbell-wrist-curl": "Curl de muñeca con mancuerna sentado",
  "barbell-reverse-wrist-curl": "Curl de muñeca inverso con barra sentado",
  "dumbbell-reverse-wrist-curl": "Curl de muñeca inverso con mancuerna sentado",
  "farmers-carry": "Caminata del granjero",

  // Legs
  "back-squat": "Sentadilla con barra",
  "front-squat": "Sentadilla frontal con barra",
  "dumbbell-squat": "Sentadilla con mancuernas",
  "smith-machine-squat": "Sentadilla en máquina Smith",
  "power-squat-machine": "Máquina de sentadilla",
  "hack-squat": "Sentadilla hack",
  "hack-squat-narrow": "Sentadilla hack (postura cerrada)",
  "hack-squat-sumo": "Sentadilla hack (postura sumo)",
  "leg-press-45": "Prensa de piernas a 45°",
  "leg-extension": "Extensión de cuádriceps",
  "leg-extension-toes-pointed": "Extensión de cuádriceps (puntas estiradas)",
  "walking-lunge": "Zancadas caminando",
  "alternating-dumbbell-lunge": "Zancadas alternas con mancuernas",
  "smith-lunge": "Zancadas en máquina Smith",
  "smith-bulgarian-split-squat": "Sentadilla búlgara en máquina Smith",
  "cable-step-up": "Subida al cajón en polea",
  "dumbbell-step-up": "Subida al cajón con mancuernas",
  "smith-step-up": "Subida al cajón en máquina Smith",
  "lying-leg-curl": "Curl femoral acostado",
  "seated-leg-curl": "Curl femoral sentado",
  "standing-single-leg-curl": "Curl femoral de pie a una pierna",
  "nordic-curl": "Curl nórdico",
  "dumbbell-stiff-leg-deadlift": "Peso muerto piernas rectas con mancuernas",
  "barbell-stiff-leg-deadlift": "Peso muerto piernas rectas con barra",
  "standing-calf-raise": "Elevación de talones de pie",
  "seated-calf-raise": "Elevación de talones sentado",
  "calf-extension-toes-in": "Máquina de pantorrilla (puntas adentro)",
  "calf-extension-toes-out": "Máquina de pantorrilla (puntas afuera)",
  "donkey-calf-raise": "Elevación de talones burro",
  "single-leg-calf-raise": "Elevación de talones a una pierna con mancuerna",

  // Cadera
  "barbell-hip-thrust": "Empuje de cadera con barra",
  "machine-hip-thrust": "Empuje de cadera en máquina",
  "single-leg-hip-thrust": "Empuje de cadera a una pierna",
  "barbell-glute-bridge": "Puente de glúteo con barra",
  "cable-glute-kickback": "Patada de glúteo en polea",
  "machine-hip-abduction": "Máquina de abductores sentado",
  "cable-hip-abduction": "Abducción de cadera en polea",
  "banded-hip-abduction": "Abducción de cadera con banda",
  "machine-hip-adduction": "Máquina de aductores sentado",
  "cable-hip-adduction": "Aducción de cadera en polea",
  "copenhagen-plank": "Plancha copenhague",

  // Core
  "machine-ab-crunch": "Crunch en máquina",
  "decline-reverse-crunch": "Crunch inverso en banco declinado",
  "hanging-leg-raise": "Elevación de piernas colgado",
  plank: "Plancha",
  "ab-wheel-rollout": "Rodillo abdominal",
  "cable-kneeling-crunch": "Crunch de rodillas en polea",
  "pallof-press": "Press Pallof",
  "side-plank": "Plancha lateral",
  "suitcase-carry": "Caminata de maleta",
  "cable-woodchop": "Leñador en polea",
  "russian-twist": "Giro ruso",

  // Cardio
  "liss-cardio": "Cardio continuo de baja intensidad",
};

/** Movement id → name. The rollup a variant belongs to. */
export const movementNames: Record<string, string> = {
  "bench-press": "Press de banca",
  "incline-press": "Press inclinado",
  "chest-fly": "Aperturas de pecho",
  "incline-chest-fly": "Aperturas de pecho inclinadas",
  "cable-chest-press": "Press de pecho en polea",
  dip: "Fondos",
  "push-up": "Lagartijas",
  "incline-push-up": "Lagartijas inclinadas (pies elevados)",
  pullover: "Pullover",
  "lat-pulldown": "Jalón al pecho",
  "pull-up": "Dominadas",
  "straight-arm-pulldown": "Jalón con brazos rectos",
  "t-bar-row": "Remo en T",
  "barbell-row": "Remo con barra",
  "dumbbell-row": "Remo con mancuerna",
  "cable-row": "Remo en polea",
  "machine-row": "Remo en máquina",
  "back-extension": "Extensión lumbar",
  "overhead-press": "Press militar",
  "lateral-raise": "Elevación lateral",
  "front-raise": "Elevación frontal",
  "rear-delt-fly": "Aperturas posteriores",
  "face-pull": "Face pull",
  "upright-row": "Remo al mentón",
  shrug: "Encogimientos",
  "barbell-curl": "Curl con barra",
  "dumbbell-curl": "Curl con mancuernas",
  "hammer-curl": "Curl martillo",
  "preacher-curl": "Curl predicador",
  "cable-curl": "Curl en polea",
  "triceps-pushdown": "Extensión de tríceps",
  "skull-crusher": "Rompecráneos",
  "overhead-triceps-extension": "Extensión de tríceps sobre la cabeza",
  "triceps-kickback": "Patada de tríceps",
  "wrist-curl": "Curl de muñeca",
  "reverse-wrist-curl": "Curl de muñeca inverso",
  "farmers-carry": "Caminata del granjero",
  squat: "Sentadilla",
  "hack-squat": "Sentadilla hack",
  "leg-press": "Prensa de piernas",
  "leg-extension": "Extensión de cuádriceps",
  lunge: "Zancadas",
  "split-squat": "Sentadilla búlgara",
  "step-up": "Subida al cajón",
  "leg-curl": "Curl femoral",
  "nordic-hamstring-curl": "Curl nórdico femoral",
  "romanian-deadlift": "Peso muerto rumano",
  "calf-raise": "Elevación de talones",
  "bent-knee-calf-raise": "Elevación de talones sentado",
  "hip-thrust": "Empuje de cadera",
  "glute-bridge": "Puente de glúteo",
  "glute-kickback": "Patada de glúteo",
  "hip-abduction": "Abducción de cadera",
  "hip-adduction": "Aducción de cadera",
  "copenhagen-plank": "Plancha copenhague",
  "ab-crunch": "Crunch abdominal",
  "plank-hold": "Plancha",
  "ab-wheel-rollout": "Rodillo abdominal",
  "pallof-press": "Press Pallof",
  "side-plank": "Plancha lateral",
  "trunk-rotation": "Rotación de torso",
  "steady-state-cardio": "Cardio continuo",
};

/** Pose id → name. The eight classic mandatory poses. */
export const poseNames: Record<string, string> = {
  "most-muscular": "Más muscular",
  "front-double-biceps": "Doble bíceps frontal",
  "back-double-biceps": "Doble bíceps de espalda",
  "front-lat-spread": "Expansión dorsal frontal",
  "rear-lat-spread": "Expansión dorsal de espalda",
  "side-chest": "Pecho lateral",
  "side-triceps": "Tríceps lateral",
  "quad-flex": "Cuádriceps",
};

/** Food id → name. */
export const foodNames: Record<string, string> = {
  "whole-egg": "Huevos enteros",
  "liquid-egg-whites": "Claras de huevo líquidas",
  bacon: "Tocino",
  "manchego-low-fat": "Manchego bajo en grasa",
  "protein-flour": "Harina proteica",
  "chicken-breast-cooked": "Pechuga de pollo",
  "chicken-breast-raw": "Pechuga de pollo",
  "carne-asada-raw": "Carne asada",
  "pork-loin-raw": "Lomo de cerdo",
  "turkey-breast-raw": "Pechuga de pavo",
  "white-rice-cooked": "Arroz blanco",
  "corn-tortilla": "Tortillas de maíz",
  avocado: "Aguacate",
  "whey-protein": "Proteína de suero",
  "high-protein-milk": "Leche alta en proteína",
  "greek-yogurt": "Yogur proteico",
  "peanut-butter": "Crema de cacahuate",
  "white-bread": "Pan blanco",
  "oats-cooked": "Avena",
  "quinoa-cooked": "Quinoa",
  "brown-rice-cooked": "Arroz integral",
  "whole-wheat-pasta-cooked": "Pasta integral",
  "sweet-potato-cooked": "Camote",
  "black-beans-cooked": "Frijoles negros",
  "granulated-sugar": "Azúcar granulada",
  almonds: "Almendras",
  "olive-oil": "Aceite de oliva",
  "chia-seeds": "Semillas de chía",
  "salmon-cooked": "Salmón",
  "ground-beef-90-10-cooked": "Carne molida (90/10)",
  "tuna-canned-water": "Atún (enlatado en agua)",
  "cottage-cheese-lowfat": "Queso cottage",
  "tofu-firm": "Tofu",
  "mass-gainer": "Ganador de masa",
  broccoli: "Brócoli",
  spinach: "Espinaca",
  "green-beans": "Ejotes",
  asparagus: "Espárragos",
  "bell-pepper-red": "Pimiento rojo",
  carrots: "Zanahorias",
  cauliflower: "Coliflor",
  cucumber: "Pepino",
  mushrooms: "Champiñones",
  zucchini: "Calabacita",
  banana: "Plátano",
  apple: "Manzana",
  blueberries: "Arándanos",
  strawberries: "Fresas",
  orange: "Naranja",
  grapes: "Uvas",
  "rice-cakes": "Tortitas de arroz",
  "cream-of-rice": "Crema de arroz",
  "cream-of-wheat": "Crema de trigo",
  popcorn: "Palomitas de maíz",
  "bagel-plain": "Bagel",
  "potato-russet": "Papa",
  shrimp: "Camarones",
  tilapia: "Tilapia",
  "pork-chop": "Chuleta de cerdo",
  "whole-milk": "Leche entera",
  "milk-2percent": "Leche semidescremada (2%)",
  "cheddar-cheese": "Queso cheddar",
  "mozzarella-part-skim": "Queso mozzarella",
  walnuts: "Nueces",
  cashews: "Anacardos",
  "coconut-oil": "Aceite de coco",
  "avocado-oil": "Aceite de aguacate",
  "canola-oil": "Aceite de canola",
  honey: "Miel",
  "maple-syrup": "Jarabe de maple",
  "dark-chocolate": "Chocolate amargo",
  edamame: "Edamame",
  chickpeas: "Garbanzos",
  "turkey-ham": "Jamón de pavo",
  "basmati-rice-cooked": "Arroz basmati",
  "jasmine-rice-dry": "Arroz jazmín",
  "frozen-veggies": "Verduras congeladas mixtas",
  "salsa-macha": "Salsa macha",
  "light-yogurt-plain": "Yogur light (natural)",
  "light-yogurt-strawberry": "Yogur light (fresa)",
  "oats-dry": "Avena",
  "protein-cereal": "Cereal proteico",
  "light-cereal": "Cereal light",
  salmas: "Salmas",
  "refried-beans": "Frijoles refritos",
  "greens-reds": "Greens & Reds",
  "fiber-supplement": "Suplemento de fibra",
  "cooking-oil": "Aceite para cocinar",
  butter: "Mantequilla",
  "mixed-nuts": "Nueces mixtas",
  pistachios: "Pistaches",
  flaxseed: "Linaza",
  ketchup: "Cátsup",
  "biscoff-spread": "Crema Biscoff",
  "salmon-oil-capsule": "Aceite de salmón",
  "magnesium-d3": "Magnesio + D3",
  "evp-aq": "EVP AQ",
  "amino-kem": "Amino K.E.M.",
  "ground-beef-88-12-raw": "Carne molida (88/12)",
};

/** Routine slug → name. */
export const routineNames: Record<string, string> = {
  "bulking-program": "Plan de volumen",
  "cutting-program": "Plan de definición",
  "arms-program": "Programa de brazos",
  "back-program": "Programa de espalda",
  "big-wheels-program": "Programa de piernas",
  "chest-arms-program": "Programa de pecho y brazos",
  "ppl-x2-program": "Empuje/Tirón/Pierna ×2",
  "ppl-rolling-program": "Empuje/Tirón/Pierna rotativo de 5 días",
  "glute-priority-program": "Tren inferior/superior con prioridad en glúteo",
};

/** Bar id → name. */
export const barNames: Record<string, string> = {
  "olympic-20": "Barra olímpica",
  "womens-15": "Barra olímpica de mujer",
  "training-10": "Barra de entrenamiento",
  "ez-7.5": "Barra Z",
  "trap-25": "Barra hexagonal",
  "safety-squat-25": "Barra de sentadilla segura",
  "olympic-45lb": "Barra olímpica",
  "womens-35lb": "Barra olímpica de mujer",
  "ez-15lb": "Barra Z",
};

/** Diet plan slug → name. The kcal figure reads the same in both languages. */
export const dietPlanNames: Record<string, string> = {
  "cut-v7-2180": "Definición v7 — 2,180 kcal",
  "cut-v6-2068": "Definición v6 — 2,068 kcal",
  "cut-v5-2040": "Definición v5 — 2,040 kcal",
  "cut-v4-2252": "Definición v4 — 2,252 kcal",
};

/**
 * Everything keyed by its English source string, because the data carries no id
 * for it: day labels, meal names, variant labels, supplement timings and doses,
 * and the free notes on foods, plans and hydration.
 *
 * Day labels are the muscle groups a training day covers. The "/" is kept as
 * written — it's the source's own separator, not prose.
 */
export const text: Record<string, string> = {
  // Program goals, which the data carries as bare words rather than ids.
  cutting: "definición",
  bulking: "volumen",
  maintenance: "mantenimiento",

  // FFMI bands. Descriptive on purpose — see the note in `ffmi.ts` about why
  // they stay coarse.
  "Below average": "Bajo el promedio",
  Average: "Promedio",
  "Above average": "Sobre el promedio",
  Excellent: "Excelente",
  Superior: "Superior",
  Suspicious: "Sospechoso",
  Unlikely: "Improbable",

  // Day labels
  Arms: "Brazos",
  "Arms/Calves": "Brazos/Pantorrillas",
  Back: "Espalda",
  "Back/Biceps": "Espalda/Bíceps",
  "Back/Chest": "Espalda/Pecho",
  "Back/Rear Delts": "Espalda/Deltoides posteriores",
  Chest: "Pecho",
  "Chest/Arms": "Pecho/Brazos",
  "Chest/Back": "Pecho/Espalda",
  "Chest/Triceps": "Pecho/Tríceps",
  "Hamstrings/Calves": "Femorales/Pantorrillas",
  Legs: "Piernas",
  "Shoulder/Arms": "Hombro/Brazos",
  "Shoulder/Calves": "Hombro/Pantorrillas",
  "Shoulder/Traps": "Hombro/Trapecios",
  "Shoulders/Arms": "Hombros/Brazos",
  "Shoulders/Traps/Quads": "Hombros/Trapecios/Cuádriceps",
  // Split-named days, from the evidence-based programs.
  "Push A": "Empuje A",
  "Push B": "Empuje B",
  "Pull A": "Tirón A",
  "Pull B": "Tirón B",
  "Legs A": "Pierna A",
  "Legs B": "Pierna B",
  "Upper A": "Tren superior A",
  "Upper B": "Tren superior B",
  "Glutes/Hamstrings": "Glúteos/Femorales",
  "Glutes/Quads": "Glúteos/Cuádriceps",
  "Glutes/Legs": "Glúteos/Piernas",

  // Program styles
  "Push/Pull/Legs": "Empuje/Tirón/Pierna",
  "Lower/Upper": "Inferior/Superior",

  // Program notes
  "Built from the hypertrophy research rather than one coach's method: every muscle twice a week, about 10-20 hard sets per muscle per week.":
    "Basado en la investigación sobre hipertrofia y no en el método de un solo entrenador: cada músculo dos veces por semana, unas 10-20 series duras por músculo a la semana.",
  "Take every working set to 0-3 reps short of failure. Rep range matters much less than effort — anything from 6 to 20 grows muscle when the set is hard.":
    "Lleva cada serie efectiva a 0-3 repeticiones del fallo. El rango de repeticiones importa mucho menos que el esfuerzo: de 6 a 20 todo construye músculo si la serie es dura.",
  "Exercises that load the muscle at long lengths were picked where there was a choice: incline press, cable fly, overhead triceps extension, incline curls, seated leg curl, deep squats and RDLs.":
    "Donde había opción se eligieron ejercicios que cargan el músculo estirado: press inclinado, aperturas en polea, extensión de tríceps sobre la cabeza, curl inclinado, curl femoral sentado, sentadilla profunda y peso muerto rumano.",
  "Leg extension stays because squats barely grow the rectus femoris. Seated leg curl beat lying curls for hamstring growth, and standing calf raises beat seated ones.":
    "La extensión de pierna se queda porque la sentadilla apenas desarrolla el recto femoral. El curl femoral sentado superó al acostado para los femorales, y la elevación de talones de pie superó a la sentada.",
  "Add reps until you hit the top of the range on every set, then add weight. Deload for a week every 6-8 weeks or when performance stalls.":
    "Suma repeticiones hasta llegar al tope del rango en todas las series y luego sube el peso. Haz una semana de descarga cada 6-8 semanas o cuando el rendimiento se estanque.",
  "The first lift of each day opens with two warmup sets: about half your working weight for 8, then about three-quarters for 3-5. They aren't logged or counted as volume.":
    "El primer ejercicio de cada día empieza con dos series de calentamiento: cerca de la mitad de tu peso de trabajo por 8, y luego cerca de tres cuartos por 3-5. No se registran ni cuentan como volumen.",
  "Some isolation lifts end on a drop set: at failure, cut the weight by about a quarter and go to failure again. It grows as much as an extra set would, in less time.":
    "Algunos ejercicios de aislamiento terminan con una serie descendente: al llegar al fallo, baja el peso cerca de una cuarta parte y sigue hasta el fallo otra vez. Desarrolla lo mismo que una serie extra, en menos tiempo.",
  "Five gym days a week: the six-session rotation keeps rolling instead of restarting each Monday, so legs aren't stuck at once a week.":
    "Cinco días de gimnasio a la semana: la rotación de seis sesiones sigue corriendo en lugar de reiniciarse cada lunes, así la pierna no se queda en una vez por semana.",
  "Lower body three days a week, priority glutes, then quads, then hamstrings — set by how many weekly sets each gets, and by which lift opens each day.":
    "Tren inferior tres días a la semana, con prioridad en glúteos, luego cuádriceps y luego femorales: lo marcan las series semanales de cada uno y el ejercicio que abre cada día.",
  "Squats built glutes as well as hip thrusts did in a head-to-head trial, plus more quads and adductors, so deep squats, split squats and step-ups do much of the glute work. Thrusts add heavy load at full hip extension.":
    "En un estudio comparativo, la sentadilla desarrolló el glúteo igual que el hip thrust, y además más cuádriceps y aductores, así que sentadilla profunda, sentadilla búlgara y subidas al cajón hacen buena parte del trabajo de glúteo. El hip thrust suma carga pesada con la cadera en extensión completa.",
  "Hip thrusts and squats didn't grow the upper glutes (medius and minimus). Hip abduction is the lift for those, so it shows up twice a week.":
    "Ni el hip thrust ni la sentadilla desarrollaron el glúteo superior (medio y menor). Para eso está la abducción de cadera, por eso aparece dos veces por semana.",
  "Go deep: full-depth squats outgrew half squats for the glutes and adductors. On split squats and step-ups, lean slightly forward to shift more of the work to the glutes.":
    "Baja profundo: la sentadilla completa superó a la media sentadilla para glúteos y aductores. En búlgaras y subidas al cajón, inclínate un poco hacia adelante para llevar más trabajo al glúteo.",
  "Women build muscle at the same relative rate as men. Train every working set to 0-3 reps short of failure and add weight once you hit the top of the rep range.":
    "Las mujeres ganan músculo al mismo ritmo relativo que los hombres. Lleva cada serie efectiva a 0-3 repeticiones del fallo y sube el peso al llegar al tope del rango.",
  "Upper body is trained as two full upper sessions so every muscle still gets hit twice a week.":
    "El tren superior se entrena en dos sesiones completas para que cada músculo se siga trabajando dos veces por semana.",

  // One program labels a rest day in its own data rather than leaving it to
  // the app's word for it, so the string needs an entry like any other.
  Rest: "Descanso",

  // Meals and day variants
  Breakfast: "Desayuno",
  Lunch: "Comida",
  Dinner: "Cena",
  "Office days": "Días de oficina",
  "Home days": "Días en casa",

  // Swap-option labels. Same words as the foods they name, but they arrive
  // here as free strings on the option rather than as a food id.
  "Carne asada": "Carne asada",
  "Pork loin": "Lomo de cerdo",
  "Turkey breast": "Pechuga de pavo",
  "Chicken breast": "Pechuga de pollo",

  // Supplements, doses and timings
  Whey: "Proteína de suero",
  "Magnesium glycinate": "Glicinato de magnesio",
  Carnigen: "Carnigen",
  Evoburn: "Evoburn",
  "1 scoop": "1 medida",
  "Full scoop": "1 medida completa",
  "5g": "5 g",
  "300–400mg": "300–400 mg",
  "1 serving with 500ml water": "1 porción con 500 ml de agua",
  Daily: "Diario",
  "With breakfast": "Con el desayuno",
  "With dinner": "Con la cena",
  "Before bed": "Antes de dormir",
  "Pre-lifting or pre-cardio": "Antes de pesas o de cardio",
  "Already in the plan.": "Ya está en el plan.",

  // Food notes
  "weighed raw": "pesado en crudo",
  "before cooking": "antes de cocinar",
  "measured before cooking": "medido antes de cocinar",
  "1 thin slice": "1 rebanada delgada",
  "1 thin slice, weighed raw": "1 rebanada delgada, pesada en crudo",
  "2 slices": "2 rebanadas",
  "flesh only": "solo la pulpa",
  "~50g each": "~50 g cada uno",
  "1 strip, ~15g": "1 tira, ~15 g",
  "~30g each": "~30 g cada una",
  "1 scoop, 31g": "1 medida, 31 g",
  "1 scoop, 62.8g": "1 medida, 62.8 g",
  "1 toast, 6g": "1 tostada, 6 g",
  packaged: "empaquetados",
  "1 serving": "1 porción",
  "1 capsule, 1.3g": "1 cápsula, 1.3 g",
  "2 capsules": "2 cápsulas",
  // Plan v6
  "Ramp the fibre up over two weeks: the vegetables first, then the oats, then the chia. Too fast means bloating and gas.":
    "Sube la fibra en dos semanas: primero las verduras, luego la avena, luego la chía. Demasiado rápido causa inflamación y gases.",
  "Drink your water — more fibre without more water makes digestion worse, not better.":
    "Toma tu agua: más fibra sin más agua empeora la digestión en vez de mejorarla.",
  "Chia always goes into the yogurt, never dry; mixing it in before the sandwich gives it a few minutes to soften.":
    "La chía siempre va en el yogur, nunca seca; mezclarla antes del sándwich le da unos minutos para suavizarse.",
  "Swaps: 30 g protein cereal for 30 g of the oats · 30 g light cereal for 50 g of the rice · 15 g pistachios or 15 g mixed nuts for the avocado.":
    "Cambios: 30 g de cereal proteico por 30 g de la avena · 30 g de cereal light por 50 g del arroz · 15 g de pistaches o 15 g de nueces mixtas por el aguacate.",
  "Carne asada (~215 g raw) also replaces the chicken if you skip the avocado — about 4 g more fat than the plan.":
    "La carne asada (~215 g en crudo) también sustituye al pollo si quitas el aguacate: unos 4 g más de grasa que el plan.",
  "Want fruit back? 100 g strawberries is 28 kcal and 2 g fibre; drop 30 g of cooked rice to keep the calories flat.":
    "¿Quieres fruta de vuelta? 100 g de fresas son 28 kcal y 2 g de fibra; quita 30 g de arroz cocido para mantener las calorías.",
  "Measure oil with a teaspoon, never pour. Weigh butter, ketchup, peanut butter and salsa macha for a week until you can eyeball them — salsa macha is almost pure oil.":
    "Mide el aceite con cucharadita, nunca lo sirvas directo. Pesa la mantequilla, la cátsup, la crema de cacahuate y la salsa macha una semana hasta poder calcularlas a ojo: la salsa macha es casi puro aceite.",
  "to cook the eggs": "para cocinar los huevos",
  "diced into the eggs (a 250 g pack = 5 days)":
    "en cubitos con los huevos (un paquete de 250 g = 5 días)",
  "for the hotcakes pan": "para el sartén de los hotcakes",
  "on the hotcakes": "sobre los hotcakes",
  "about 1 tablespoon": "más o menos 1 cucharada",
  "raw — about 150 g cooked": "en crudo — unos 150 g cocido",
  "for the pan (1 teaspoon)": "para el sartén (1 cucharadita)",
  "cooked without oil": "cocidas sin aceite",
  "on the meat": "sobre la carne",
  raw: "en crudo",
  "Plain light yogurt": "Yogur light natural",
  "Strawberry light yogurt": "Yogur light de fresa",
  "mixed 1:1 with the light yogurt": "mezclado 1:1 con el yogur light",
  "dry weight, in the yogurt": "peso en seco, en el yogur",
  "mixed into the yogurt — never eat it dry": "mezclada en el yogur — nunca la comas seca",
  "2 slices, cheese sandwich": "2 rebanadas, sándwich de queso",
  "in the sandwich": "en el sándwich",
  "dry, before cooking": "seco, antes de cocinar",
  "air-popped": "reventadas al aire",
  "part-skim": "parcialmente descremado",
  "70-85% cacao": "70-85% cacao",
  "~31.5g a slice": "~31.5 g por rebanada",
  "flesh only, weighed after peeling": "solo la pulpa, pesada ya pelada",
  Costco: "Costco",
  "dry, mix with water → hotcakes": "en seco, mezclar con agua → hotcakes",
  "weighed dry, mix with water → hotcakes":
    "pesada en seco, mezclar con agua → hotcakes",
  "from the rice cooker, bring in a container":
    "de la arrocera, llévalo en un táper",
  "from the rice cooker": "de la arrocera",
  "mix with the milk": "mezclar con la leche",
  "on the bread or in the yogurt": "en el pan o en el yogur",
  "in the yogurt or on the bread": "en el yogur o en el pan",
  "1 breast from the cafeteria, grilled or steamed, no sauce":
    "1 pechuga de la cafetería, a la plancha o al vapor, sin salsa",
  "raw — about 250g once cooked": "en crudo — unos 250 g ya cocida",
  "No rice.": "Sin arroz.",
  "Not fasted.": "Sin ayuno.",
  "Cook it the night before.": "Cocínalo la noche anterior.",

  // Plan v7
  "Afternoon shake": "Batido de la tarde",
  "Pre-workout meal": "Colación preentreno",
  "Pre-workout drink": "Bebida preentreno",
  "During training": "Durante el entrenamiento",
  "Training days": "Días de entrenamiento",
  "Turkey tacos": "Tacos de pavo",
  "Pork tacos": "Tacos de lomo",
  "Beef tacos": "Tacos de res",
  "08:30 — a yogurt bowl and a scramble.":
    "08:30 — un bowl de yogur y unos huevos revueltos.",
  "13:00, with a 600 ml Coke Zero.": "13:00, con una Coca-Cola Sin Azúcar de 600 ml.",
  "16:30. Or straight after training, with dinner pushed to ~23:45 — the totals don't change.":
    "16:30. O justo después de entrenar, con la cena a las ~23:45: los totales no cambian.",
  "18:30. Low in fat and fibre so it's digested by 20:00 — which is why it's the pancake and not the yogurt bowl.":
    "18:30. Baja en grasa y en fibra para que esté digerida a las 20:00: por eso es el hotcake y no el bowl de yogur.",
  "19:20–19:40, with 2 scoops of EVP 3D in a 600 ml shaker. Refill it with 400 ml of water and finish it during the warm-up.":
    "19:20–19:40, con 2 medidas de EVP 3D en un shaker de 600 ml. Rellénalo con 400 ml de agua y termínalo durante el calentamiento.",
  "20:00–22:30, in 1 L of water with 1.5 g of salt (≈590 mg sodium) — the sodium is what lets the glycerol hold water.":
    "20:00–22:30, en 1 L de agua con 1.5 g de sal (≈590 mg de sodio): el sodio es lo que permite que el glicerol retenga agua.",
  "23:30, tacos — after the treadmill on cardio days.":
    "23:30, tacos — después de la caminadora en los días de cardio.",
  "frozen, about 7 — weigh 7 once to learn your bag":
    "congeladas, unas 7 — pesa 7 una vez para conocer tu bolsa",
  "2 slices, in the scramble — keep it near 30 g a day":
    "2 rebanadas, en los huevos revueltos — mantenlo cerca de 30 g al día",
  "raw — one package": "en crudo — un paquete",
  "for the pan": "para el sartén",
  "on top or in the pan": "encima o en el sartén",
  "cooking spray": "aceite en aerosol",
  "Costco, fat cap trimmed — cook to 63 °C and rest 3 minutes":
    "Costco, sin la capa de grasa — cocínalo a 63 °C y déjalo reposar 3 minutos",
  "Costco — dry pan, no spray: it cooks in its own fat":
    "Costco — sartén seco, sin aerosol: se cocina en su propia grasa",
  "1 serving (~250 mg caffeine)": "1 porción (~250 mg de cafeína)",
  "08:00, on an empty stomach": "08:00, en ayunas",
  "With 300 ml of water. Cut only — stop it for maintenance and the bulk, and drop it first if your blood pressure goes above ~130/80 or you get palpitations or bad sleep.":
    "Con 300 ml de agua. Solo en la definición: suspéndelo en el mantenimiento y el volumen, y quítalo primero si tu presión pasa de ~130/80 o tienes palpitaciones o duermes mal.",
  "EVP 3D": "EVP 3D",
  "2 scoops": "2 medidas",
  "Pre-workout, in the EVP AQ shaker": "Preentreno, en el shaker del EVP AQ",
  "Stimulant-free, with 2.5 g of creatine on top of your daily dose. Use it instead of Xtreme N.O., whose 200 mg of caffeine is too close to bed for an evening session.":
    "Sin estimulantes, con 2.5 g de creatina además de tu dosis diaria. Úsalo en lugar del Xtreme N.O., cuyos 200 mg de cafeína quedan muy cerca de la hora de dormir para una sesión nocturna.",
  "Vitamin D3": "Vitamina D3",
  "1,000 IU": "1,000 UI",
  "With the 400 IU in the magnesium capsules, it brings vitamin D up to target.":
    "Junto con las 400 UI de las cápsulas de magnesio, lleva la vitamina D a la meta.",
  "Optional — the weakest product in the stack. It only builds up in muscle taken with carbs over many weeks.":
    "Opcional: el producto más débil del stack. Solo se acumula en el músculo si se toma con carbohidratos durante muchas semanas.",
  "The targets are the week's average: turkey days come to ~2,170 kcal, pork days ~2,200 and the beef rest day ~2,140, so a single day reads a few grams off them.":
    "Las metas son el promedio de la semana: los días de pavo suman ~2,170 kcal, los de lomo ~2,200 y el día de descanso con res ~2,140, así que un solo día queda unos gramos fuera de ellas.",
  "Sunday is the rest day here — no pre-workout drink or K.E.M., and beef at dinner. If yours falls on another day, move the beef with it.":
    "Aquí el domingo es el día de descanso: sin bebida preentreno ni K.E.M., y res en la cena. Si el tuyo cae en otro día, mueve la res con él.",
  "Meats are weighed raw, basmati cooked, oats and pancake mix dry.":
    "Las carnes se pesan en crudo, el basmati cocido, y la avena y la harina de hotcakes en seco.",
  "Caffeine comes to ~300 mg a day (Evoburn ~250, Coke Zero ~57), all before 16:00. Protect your sleep: 7–9 hours, because short sleep on a diet takes the loss out of muscle instead of fat.":
    "La cafeína suma ~300 mg al día (Evoburn ~250, Coca-Cola Sin Azúcar ~57), toda antes de las 16:00. Cuida tu sueño: 7–9 horas, porque dormir poco a dieta hace que lo que pierdes salga del músculo en vez de la grasa.",
  "If EVP AQ is new to you, start with 15 ml — glycerol can cause bloating or a headache. Don't drink more than ~1 L of water an hour.":
    "Si el EVP AQ es nuevo para ti, empieza con 15 ml: el glicerol puede causar inflamación o dolor de cabeza. No tomes más de ~1 L de agua por hora.",
  "Weeks 1–2: the fast 2–4 kg drop is water and glycogen, so don't adjust yet. From week 3, aim to lose 0.7–1.0% of your body weight a week, judged on the weekly average weigh-in.":
    "Semanas 1–2: la bajada rápida de 2–4 kg es agua y glucógeno, así que todavía no ajustes. Desde la semana 3, busca bajar 0.7–1.0% de tu peso por semana, según el promedio semanal de tus pesajes.",
  "Losing more than 1% a week, or main lifts down more than ~10%: add 150–200 kcal on cardio days first — a second 45 g pancake, or 175 g of cooked basmati at dinner. Under 0.5% a week for two weeks: drop the avocado and the peanut butter (~150 kcal) or add steps.":
    "Si bajas más de 1% por semana, o tus levantamientos principales caen más de ~10%: suma 150–200 kcal primero en los días de cardio — un segundo hotcake de 45 g, o 175 g de basmati cocido en la cena. Si bajas menos de 0.5% por semana durante dos semanas: quita el aguacate y la crema de cacahuate (~150 kcal) o camina más.",
  "Every 6–8 weeks, eat at maintenance (~3,000–3,200 kcal) for 1–2 weeks. Around 18–20% body fat, slow down to ~0.5% a week.":
    "Cada 6–8 semanas, come en mantenimiento (~3,000–3,200 kcal) durante 1–2 semanas. Alrededor de 18–20% de grasa corporal, baja el ritmo a ~0.5% por semana.",
  "Swaps: 200 g Costco turkey for the lunch chicken · 30 g turkey ham ≈ 20 g raw chicken or turkey · 1 scoop whey ≈ 230 g egg whites · 120 g cooked basmati ≈ 35 g dry jasmine ≈ 2 corn tortillas ≈ 2 slices white bread · 15 g peanut butter ≈ 15 g pistachios ≈ 50 g avocado ≈ 8 ml oil ≈ 10 g butter.":
    "Cambios: 200 g de pavo de Costco por el pollo de la comida · 30 g de jamón de pavo ≈ 20 g de pollo o pavo en crudo · 1 medida de proteína de suero ≈ 230 g de claras · 120 g de basmati cocido ≈ 35 g de arroz jazmín en seco ≈ 2 tortillas de maíz ≈ 2 rebanadas de pan blanco · 15 g de crema de cacahuate ≈ 15 g de pistaches ≈ 50 g de aguacate ≈ 8 ml de aceite ≈ 10 g de mantequilla.",
  "Frozen vegetables are nearly free (~38 kcal per 100 g): add more at lunch and dinner when you're hungry. So are hot sauce, lime, chile powder, pepper, garlic or onion powder, and cinnamon or sweetener on the yogurt. Salsa macha, extra butter and Biscoff are not.":
    "Las verduras congeladas casi no cuentan (~38 kcal por 100 g): agrega más en la comida y la cena cuando tengas hambre. Tampoco cuentan la salsa picante, el limón, el chile en polvo, la pimienta, el ajo o la cebolla en polvo, ni la canela o el endulzante en el yogur. La salsa macha, la mantequilla extra y la Biscoff sí cuentan.",
  "Vitamin E is the gap this plan leaves. 20 g of almonds a day closes it — or Costco nuts with almonds in them, in place of the peanut butter.":
    "La vitamina E es lo que le falta a este plan. 20 g de almendras al día lo cubren — o nueces de Costco que traigan almendras, en lugar de la crema de cacahuate.",
  "Estimates only. With high blood pressure, heart issues, kidney problems or any medication, check with a doctor before taking this stimulant stack or running a deficit this size.":
    "Solo son estimaciones. Si tienes presión alta, problemas del corazón o de los riñones, o tomas algún medicamento, consulta a un médico antes de tomar este stack de estimulantes o de hacer un déficit de este tamaño.",

  // Plan notes
  "Protein is 2.1g per kg of lean mass — still inside the muscle-protective range at this deficit.":
    "La proteína es de 2.1 g por kg de masa magra — sigue dentro del rango que protege el músculo con este déficit.",
  "Office-day chicken is weighed cooked; every home-day meat is weighed raw, before cooking.":
    "El pollo de los días de oficina se pesa cocido; toda la carne de los días en casa se pesa cruda, antes de cocinar.",
  "Protein holds at 220g — muscle protection is the one thing an aggressive deficit doesn't get to touch.":
    "La proteína se mantiene en 220 g — proteger el músculo es lo único que un déficit agresivo no puede tocar.",
  "The volume came out of carbs: 260g → 190g, and dinner lost its rice entirely.":
    "El recorte salió de los carbohidratos: 260 g → 190 g, y la cena perdió el arroz por completo.",
  "The food adds to about 222g of protein against a 220g target — the source states both numbers and they disagree by two grams, which is inside the rounding on its own rows.":
    "La comida suma unos 222 g de proteína contra una meta de 220 g — la fuente da ambas cifras y difieren por dos gramos, lo cual cae dentro del redondeo de sus propios renglones.",

  // Hydration
  "plus 500ml during the session": "más 500 ml durante la sesión",
};
