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
  "feet-elevated-push-up": "Lagartijas con pies elevados (pecho)",
  "standing-cable-chest-press": "Press de pecho en polea de pie",
  "dumbbell-pullover": "Pullover con mancuerna",

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

  // Shoulders and traps
  "seated-barbell-shoulder-press": "Press militar sentado con barra",
  "dumbbell-shoulder-press": "Press de hombro con mancuernas",
  "machine-shoulder-press-neutral": "Press de hombro en máquina (agarre neutro)",
  "smith-shoulder-press": "Press de hombro en máquina Smith",
  "seated-dumbbell-lateral-raise": "Elevaciones laterales sentado con mancuernas",
  "single-arm-cable-lateral-raise": "Elevación lateral a una mano en polea",
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
  "cable-face-pull": "Face pull en polea",
  "barbell-upright-row": "Remo al mentón de pie con barra",
  "barbell-shrug": "Encogimientos de pie con barra",
  "dumbbell-shrug": "Encogimientos con mancuernas",
  "smith-shrug": "Encogimientos en máquina Smith",

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
  "smith-bulgarian-split-squat": "Sentadilla búlgara en máquina Smith",
  "lying-leg-curl": "Curl femoral acostado",
  "seated-leg-curl": "Curl femoral sentado",
  "standing-single-leg-curl": "Curl femoral de pie a una pierna",
  "dumbbell-stiff-leg-deadlift": "Peso muerto piernas rectas con mancuernas",
  "standing-calf-raise": "Elevación de talones de pie",
  "seated-calf-raise": "Elevación de talones sentado",
  "calf-extension-toes-in": "Máquina de pantorrilla (puntas adentro)",
  "calf-extension-toes-out": "Máquina de pantorrilla (puntas afuera)",

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

  // Core
  "machine-ab-crunch": "Crunch en máquina",
  "decline-reverse-crunch": "Crunch inverso en banco declinado",
  "hanging-leg-raise": "Elevación de piernas colgado",

  // Cardio
  "liss-cardio": "Cardio continuo de baja intensidad",
};

/** Movement id → name. The rollup a variant belongs to. */
export const movementNames: Record<string, string> = {
  "bench-press": "Press de banca",
  "incline-press": "Press inclinado",
  "chest-fly": "Aperturas de pecho",
  "cable-chest-press": "Press de pecho en polea",
  dip: "Fondos",
  "push-up": "Lagartijas",
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
  squat: "Sentadilla",
  "hack-squat": "Sentadilla hack",
  "leg-press": "Prensa de piernas",
  "leg-extension": "Extensión de cuádriceps",
  lunge: "Zancadas",
  "split-squat": "Sentadilla búlgara",
  "leg-curl": "Curl femoral",
  "romanian-deadlift": "Peso muerto rumano",
  "calf-raise": "Elevación de talones",
  "hip-thrust": "Empuje de cadera",
  "glute-bridge": "Puente de glúteo",
  "glute-kickback": "Patada de glúteo",
  "hip-abduction": "Abducción de cadera",
  "hip-adduction": "Aducción de cadera",
  "ab-crunch": "Crunch abdominal",
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
  "greek-yogurt": "Yogur griego",
  "peanut-butter": "Crema de cacahuate",
  "white-bread": "Pan blanco",
};

/** Routine slug → name. */
export const routineNames: Record<string, string> = {
  "bulking-program": "Plan de volumen",
  "cutting-program": "Plan de definición",
  "arms-program": "Programa de brazos",
  "back-program": "Programa de espalda",
  "big-wheels-program": "Programa de piernas",
  "chest-arms-program": "Programa de pecho y brazos",
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
