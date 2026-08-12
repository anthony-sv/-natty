import type { en } from "./en";

/**
 * Spanish (Mexico).
 *
 * Typed as `Record<keyof typeof en, string>`, so a missing key, a misspelled
 * one, or a key deleted from English all fail the build rather than rendering a
 * raw key at runtime.
 *
 * Register is the same as the English: direct, second person singular ("tú",
 * not "usted"), and it says what it means rather than softening it. Gym
 * vocabulary is Mexican — "pesas" for lifting, "récord" for a PR, "cardio"
 * kept as-is because that's what people say.
 */
export const esMX: Record<keyof typeof en, string> = {
  // ── Navigation and chrome ────────────────────────────────────────────────
  "nav.home": "Inicio",
  "nav.routines": "Rutinas",
  "nav.progress": "Progreso",
  "nav.nutrition": "Nutrición",
  "nav.calculators": "Calculadoras",
  "nav.plates": "Cargar la barra",
  "nav.searchHint": "Presiona {key} para buscar",
  "nav.language": "Idioma",
  "nav.darkMode": "Modo oscuro",

  "palette.placeholder": "Busca páginas y rutinas...",
  "palette.empty": "Sin resultados.",
  "palette.loading": "Cargando rutinas...",
  "palette.groupPages": "Páginas",
  "palette.groupRoutines": "Rutinas",
  "palette.groupPlans": "Planes de dieta",
  "palette.groupWorkout": "Entrenamiento",
  "palette.groupTheme": "Tema",
  "palette.groupCreate": "Crear",
  "palette.resumeWorkout": "Retomar el entrenamiento",
  "palette.switchLight": "Cambiar a modo claro",
  "palette.switchDark": "Cambiar a modo oscuro",
  "palette.toggleTheme": "Cambiar el modo oscuro",

  // ── Shared ───────────────────────────────────────────────────────────────
  "common.weight": "Peso",
  "common.reps": "Reps",
  "common.date": "Fecha",
  "common.exercise": "Ejercicio",
  "common.bodyweight": "Peso corporal",
  "common.optional": "Opcional",
  "common.searchExercises": "Busca ejercicios...",
  "common.noExerciseFound": "No se encontró el ejercicio.",
  "common.weightUnit": "Unidad de peso",
  "common.cardio": "Cardio",
  "common.finisher": "Finisher",
  "common.bodyFatPercent": "Grasa corporal (%)",
  "common.heightCm": "Estatura (cm)",
  "common.none": "—",

  // ── Formatting a prescription ────────────────────────────────────────────
  "format.or": "o",
  "format.hold": "{seconds}s de pose",
  "format.rest": "{seconds}s de descanso",
  "format.perSide": "/lado",
  "format.seconds": "{count}s",
  "format.secondsRange": "{value}s",
  "format.minutes": "{count} min",
  "format.repsRange": "{range} reps",
  "format.setCount.one": "{count} set",
  "format.setCount.other": "{count} sets",
  "format.repsPerSide": "{range} reps por lado",
  "format.repsOnly": "{range} reps",

  "modifier.forcedReps": "Reps forzadas",
  "modifier.negatives": "Negativas",
  "modifier.partials": "Parciales",
  "modifier.staticHolds": "Isométricos",
  "modifier.dropSet": "Drop set",
  "modifier.ladder": "Escalera: {positions}",

  // ── Sets por partes ──────────────────────────────────────────────────────
  "segment.hold": "{seconds}s de aguante",
  "segment.pulses": "{count} pulsos",
  "segment.repsPulsed": "{count} reps, con pulso cada una",
  "segment.label": "Parte {index} de {total}",
  "segment.next": "sigue: {what}",
  "segment.sequence": "Este set: {sequence}",

  // ── Index ────────────────────────────────────────────────────────────────
  "index.title": "!natty",
  "index.subtitle":
    "Elige un programa, abre un día y dale a empezar — la app te lleva set por set y te cronometra el descanso.",
  "index.stats.setsLogged": "Sets registrados",
  "index.stats.exercisesTrained": "Ejercicios entrenados",
  "index.stats.recordsHeld": "Récords vigentes",
  "index.stats.latestWeighIn": "Último pesaje",
  "index.stats.weekAverage": "Prom. semanal {weight}",
  "index.stats.weekAverageDelta": "Prom. semanal {weight} · {delta} vs la anterior",
  "index.start.title": "Nada en curso",
  "index.start.body":
    "Empieza un entrenamiento desde cualquier día y aquí lo retomas si sales de la página.",
  "index.start.action": "Ver programas",
  "index.resume.title": "Entrenamiento en curso",
  "index.resume.upNext": "Sigue: {exercise}",
  "index.resume.allDone": "Todos los sets hechos.",
  "index.resume.action": "Retomar",
  "index.resume.discard": "Descartar",
  "index.resume.discarded": "Entrenamiento descartado",
  "index.dest.routines":
    "Programas semana por semana, o escribe el tuyo. Abre un día para empezar.",
  "index.dest.progress":
    "Récords, volumen por músculo, un año de días entrenados y tus propios ejercicios.",
  "index.dest.nutrition":
    "Planes de dieta comida por comida, tus propios alimentos y recetas, y una calculadora de macros.",
  "index.dest.calculators": "Máximo de una rep, RPE y RIR, y potencial natural.",
  "index.dest.plates": "Qué colgar en cada extremo, con los discos que tiene tu gym.",

  // ── Volume ───────────────────────────────────────────────────────────────
  "volume.tab": "Volumen",
  "volume.thisWeek": "Esta semana",
  "volume.partial": "en curso",
  "volume.thisWeekBody": "Semana del {week} \u00b7 {sets} sets efectivos hasta ahora.",
  "volume.noSetsThisWeek": "Todav\u00eda no has registrado nada esta semana.",
  "volume.direct": "Directo",
  "volume.indirect": "Indirecto",
  "volume.setsSuffix.one": "{count} set en total",
  "volume.setsSuffix.other": "{count} sets en total",
  "volume.referenceBand": "{min}\u2013{max} sets, el rango habitual",
  "volume.split": "Empuje, jal\u00f3n, pierna y core",
  "volume.splitBody":
    "Las \u00faltimas {weeks} semanas: {push} de empuje, {pull} de jal\u00f3n, {legs} de pierna, {core} de core. El cardio se cuenta aparte \u2014 no es volumen de pesas.",
  "volume.needTwoWeeks": "Dos semanas de registro y aqu\u00ed aparece la tendencia.",
  "volume.sets": "Sets",
  "volume.setsAxis": "Sets",
  "volume.splitAria": "Sets por semana, divididos en empuje, jal\u00f3n y pierna",
  "volume.gaps": "Sin trabajo directo",
  "volume.gapsBody": "M\u00fasculos sin sets directos en las \u00faltimas {weeks} semanas.",
  "volume.gapsNote":
    "Un set directo es aquel donde el m\u00fasculo es el punto del ejercicio; uno indirecto es donde solo va de pasajero. Los dos nunca se suman \u2014 lo de contar medio set es una convenci\u00f3n, no una medici\u00f3n.",
  "volume.indirectCount": "\u00b7 {count} indirectos",
  "volume.reason.indirect-only": "Solo trabajados de forma indirecta",
  "volume.reasonBody.indirect-only":
    "Reciben carga en otros ejercicios pero nunca les toca un set propio.",
  "volume.reason.never-direct": "Ning\u00fan ejercicio de aqu\u00ed los trabaja directo",
  "volume.reasonBody.never-direct":
    "Nada en el cat\u00e1logo los tiene como m\u00fasculo principal, as\u00ed que por m\u00e1s que registres no van a salir de esta lista. Agregarles un ejercicio directo es un cambio al cat\u00e1logo, no a tu entrenamiento.",
  "volume.reason.not-trained": "Sin entrenar en este periodo",
  "volume.reasonBody.not-trained":
    "El cat\u00e1logo s\u00ed puede trabajarlos directo \u2014 simplemente no lo has hecho \u00faltimamente.",
  "volume.empty.title": "Todav\u00eda no hay nada que medir",
  "volume.empty.body":
    "Registra algunos sets y aqu\u00ed se desglosan por m\u00fasculo y por empuje, jal\u00f3n y pierna.",

  // ── Patrones de movimiento ─────────────────────────────────
  "pattern.horizontal-press": "Press horizontal",
  "pattern.incline-press": "Press inclinado",
  "pattern.overhead-press": "Press por encima de la cabeza",
  "pattern.chest-fly": "Apertura de pecho",
  "pattern.vertical-pull": "Jal\u00f3n vertical",
  "pattern.horizontal-pull": "Jal\u00f3n horizontal (remo)",
  "pattern.pullover": "Pullover",
  "pattern.lateral-raise": "Elevaci\u00f3n lateral",
  "pattern.front-raise": "Elevaci\u00f3n frontal",
  "pattern.rear-delt": "Deltoide posterior",
  "pattern.shrug": "Encogimiento",
  "pattern.elbow-flexion": "Curl",
  "pattern.elbow-extension": "Extensi\u00f3n de tr\u00edceps",
  "pattern.squat": "Sentadilla",
  "pattern.hinge": "Bisagra de cadera",
  "pattern.lunge": "Zancada",
  "pattern.knee-extension": "Extensi\u00f3n de rodilla",
  "pattern.knee-flexion": "Flexi\u00f3n de rodilla",
  "pattern.hip-extension": "Extensi\u00f3n de cadera",
  "pattern.hip-abduction": "Abducci\u00f3n de cadera",
  "pattern.hip-adduction": "Aducci\u00f3n de cadera",
  "pattern.calf-raise": "Elevaci\u00f3n de talones",
  "pattern.spinal-extension": "Extensi\u00f3n de espalda baja",
  "pattern.cardio": "Cardio",

  // ── Tus propios ejercicios ────────────────────────────────
  "library.tab": "Biblioteca",
  "library.title": "Tus propios ejercicios",
  "library.body":
    "Lo que la lista incluida no tenga. Se registran, cuentan para el volumen y marcan r\u00e9cords igual que los dem\u00e1s.",
  "library.add": "Agregar un ejercicio",
  "library.create": "Agregarlo",
  "library.createNamed": "Agregar \"{name}\"",
  "library.edit": "Editar {name}",
  "library.name": "Nombre",
  "library.nameRequired": "Ponle un nombre",
  "library.aliases": "Tambi\u00e9n conocido como",
  "library.aliasesHint": "Otras formas en que podr\u00edas escribirlo, separadas por comas.",
  "library.pattern": "Patr\u00f3n de movimiento",
  "library.patternHint":
    "Qu\u00e9 tipo de movimiento es. Esto decide si cuenta como empuje, jal\u00f3n o pierna.",
  "library.primaryMuscles": "Trabaja directamente",
  "library.primaryRequired": "Elige al menos un m\u00fasculo",
  "library.primaryHint": "Los m\u00fasculos para los que es este ejercicio.",
  "library.secondaryMuscles": "Trabaja indirectamente",
  "library.secondaryHint": "M\u00fasculos que ayudan pero no son el objetivo. Opcional.",
  "library.save": "Guardar",
  "library.saving": "Guardando\u2026",
  "library.saved": "Se guard\u00f3 {name}",
  "library.saveError": "No se pudo guardar",
  "library.archive": "Archivar",
  "library.archived": "Archivado",
  "library.archiveHint":
    "Se oculta de los selectores. Todo lo que ya registraste con \u00e9l se sigue leyendo bien.",
  "library.archivedNotice": "{name} archivado",
  "library.restore": "Restaurar",
  "library.restored": "{name} volvi\u00f3",
  "library.delete": "Eliminar",
  "library.deleted": "Se elimin\u00f3 {name}",
  "library.deleteBlocked":
    "Tienes {count} registrados con esto. Mejor arch\u00edvalo \u2014 eliminarlo dejar\u00eda esos sets sin nombre.",
  "library.setsLogged.one": "{count} set",
  "library.setsLogged.other": "{count} sets",
  "library.custom": "Tuyo",
  "library.empty.title": "Todav\u00eda no tienes ejercicios propios",
  "library.empty.body":
    "Agrega uno cuando hagas un ejercicio que no est\u00e9 en la lista incluida \u2014 o directo desde el selector, escribiendo un nombre que no conozca.",
  "library.showArchived": "Mostrar archivados",

  // ── Escribir tu propia rutina ────────────────────────────────────────────
  "builder.new": "Nueva rutina",
  "builder.yours": "Tuya",
  "builder.edit": "Editar",
  "builder.newTitle": "Escribe una rutina",
  "builder.newBody":
    "Una semana de entrenamiento. Se repite \u2014 as\u00ed que un d\u00eda que haces cada lunes se escribe una sola vez.",
  "builder.editTitle": "Editando {name}",
  "builder.name": "Nombre",
  "builder.nameRequired": "Ponle un nombre",
  "builder.style": "Estilo",
  "builder.stylePlaceholder": "Empuje/jal\u00f3n/pierna, torso/pierna, como le digas",
  "builder.days": "D\u00edas",
  "builder.addDay": "Agregar un d\u00eda",
  "builder.dayLabel": "De qu\u00e9 es",
  "builder.dayLabelPlaceholder": "Gl\u00fateo, Pecho, Jal\u00f3n\u2026",
  "builder.restDay": "D\u00eda de descanso",
  "builder.removeDay": "Quitar el d\u00eda {number}",
  "builder.noDays": "Todav\u00eda no hay d\u00edas. Agrega uno para empezar.",
  "builder.exercises": "Ejercicios",
  "builder.addExercise": "Agregar un ejercicio",
  "builder.removeExercise": "Quitar {name}",
  "builder.noExercises": "Todav\u00eda no hay nada en este d\u00eda.",
  "builder.pickExercise": "Elige un ejercicio",
  "builder.createNamed": "Agregar \"{name}\" como ejercicio tuyo",
  "builder.exerciseKind": "Tipo",
  "builder.sets": "Sets",
  "builder.reps": "Reps",
  "builder.repsTo": "a",
  "builder.rest": "Descanso (s)",
  "builder.phases": "Fases",
  "builder.addPhase": "Agregar una fase",
  "builder.removePhase": "Quitar la fase {number}",
  "builder.phaseHint":
    "Una fase es una serie de sets iguales. Agrega otra para una rampa \u2014 sets m\u00e1s pesados con otro objetivo de reps.",
  "builder.setStyle": "C\u00f3mo corre el set",
  "builder.setStyle.plain": "Reps normales",
  "builder.setStyle.segments": "Una secuencia",
  "builder.segments": "La secuencia, en orden",
  "builder.addSegment": "Agregar una parte",
  "builder.removeSegment": "Quitar la parte {number}",
  "builder.segmentKind": "Parte",
  "builder.segmentKind.reps": "Reps",
  "builder.segmentKind.pulses": "Pulsos",
  "builder.segmentKind.hold": "Aguante",
  "builder.segmentCount": "Cu\u00e1ntos",
  "builder.segmentSeconds": "Segundos",
  "builder.pulsePerRep": "Un pulso en cada rep",
  "builder.segmentsHint":
    "Para un set que corre como una secuencia fija \u2014 un aguante, luego pulsos, luego reps. Cada parte es su propio paso en el reproductor, y los aguantes llevan cron\u00f3metro.",
  "builder.needTwoSegments": "Una secuencia necesita al menos dos partes",
  "builder.modifiers": "T\u00e9cnicas de intensidad",
  "builder.save": "Guardar rutina",
  "builder.saving": "Guardando\u2026",
  "builder.saved": "Se guard\u00f3 {name}",
  "builder.saveError": "No se pudo guardar",
  "builder.cancel": "Cancelar",
  "builder.delete": "Eliminar rutina",
  "builder.deleted": "Se elimin\u00f3 {name}",
  "builder.deleteTitle": "\u00bfEliminar esta rutina?",
  "builder.deleteBody":
    "Los sets que registraste con ella se quedan en tu historial y siguen contando \u2014 solo se va el plan.",
  "builder.duplicate": "Empezar desde una copia",
  "builder.duplicateHint":
    "Copia un programa incluido y c\u00e1mbialo, en vez de empezar de cero.",
  "builder.duplicateOf": "{name} (copia)",
  "builder.notFound": "Esa rutina no existe",

  // ── Métodos de cocción ───────────────────────────────────────────────────
  "method.none": "Sin cocinar",
  "method.steam": "Al vapor",
  "method.boil": "Hervido",
  "method.grill": "A la parrilla",
  "method.bake": "Al horno",
  "method.pan-fry": "A la sart\u00e9n",
  "method.deep-fry": "Frito",
  "method.air-fry": "En air fryer",
  "method.slow-cook": "Cocci\u00f3n lenta",

  // ── Tus propios alimentos y recetas ──────────────────────────────────────
  "pantry.tab": "Despensa",
  "pantry.title": "Tus propios alimentos y recetas",
  "pantry.body":
    "Lo que la lista incluida no tenga, y platillos que hagas con ellos. Los dos entran a un plan igual que los dem\u00e1s.",
  "pantry.foods": "Alimentos",
  "pantry.recipes": "Recetas",
  "pantry.addFood": "Agregar un alimento",
  "pantry.addRecipe": "Agregar una receta",
  "pantry.name": "Nombre",
  "pantry.nameRequired": "Ponle un nombre",
  "pantry.unit": "Se mide en",
  "pantry.unit.g": "Gramos",
  "pantry.unit.ml": "Mililitros",
  "pantry.unit.unit": "Piezas",
  "pantry.per100": "Macros por 100",
  "pantry.perUnit": "Macros por pieza",
  "pantry.protein": "Prote\u00edna (g)",
  "pantry.carbs": "Carbohidratos (g)",
  "pantry.fat": "Grasa (g)",
  "pantry.kcal": "{kcal} kcal",
  "pantry.state": "Se pesa",
  "pantry.state.none": "Da igual",
  "pantry.state.raw": "Crudo",
  "pantry.state.cooked": "Cocido",
  "pantry.stateHint":
    "Crudo y cocido son alimentos distintos, nunca una conversi\u00f3n \u2014 un gramo de pollo cocido tiene un tercio m\u00e1s de prote\u00edna que uno crudo.",
  "pantry.unitNote": "Qu\u00e9 es una pieza",
  "pantry.unitNoteHint": "\"~50g cada una\", \"1 scoop\". Opcional.",
  "pantry.ingredients": "Ingredientes",
  "pantry.addIngredient": "Agregar un ingrediente",
  "pantry.removeIngredient": "Quitar {name}",
  "pantry.needIngredient": "Una receta necesita al menos un ingrediente",
  "pantry.method": "Cocinado",
  "pantry.methodHint":
    "C\u00f3mo se cocina. No agrega macros por s\u00ed solo \u2014 si cocinas con aceite o mantequilla, agr\u00e9galo como ingrediente.",
  "pantry.addFat": "Agrega la grasa con la que cocinas",
  "pantry.portioning": "Se reparte por",
  "pantry.portioning.servings": "Porciones",
  "pantry.portioning.weight": "Peso cocido",
  "pantry.servings": "Cu\u00e1ntas salen",
  "pantry.cookedGrams": "Peso final (g)",
  "pantry.cookedGramsHint":
    "Pesa el platillo ya cocinado. No se puede sacar de los ingredientes \u2014 el agua se va al cocinar, y cu\u00e1nta depende del m\u00e9todo.",
  "pantry.recipeTotal": "Todo el lote",
  "pantry.perServing": "Por porci\u00f3n",
  "pantry.per100Cooked": "Por 100 g cocido",
  "pantry.serving": "1 porci\u00f3n",
  "pantry.save": "Guardar",
  "pantry.saving": "Guardando\u2026",
  "pantry.saved": "Se guard\u00f3 {name}",
  "pantry.saveError": "No se pudo guardar",
  "pantry.edit": "Editar {name}",
  "pantry.archive": "Archivar",
  "pantry.archived": "Archivado",
  "pantry.archivedNotice": "{name} archivado",
  "pantry.restore": "Restaurar",
  "pantry.restored": "{name} volvi\u00f3",
  "pantry.delete": "Eliminar",
  "pantry.deleted": "Se elimin\u00f3 {name}",
  "pantry.showArchived": "Mostrar archivados",
  "pantry.inUse": "Lo usan {count}",
  "pantry.recipeCount.one": "{count} receta",
  "pantry.recipeCount.other": "{count} recetas",
  "pantry.empty.foods": "Todav\u00eda no tienes alimentos propios",
  "pantry.empty.foodsBody":
    "Agrega uno cuando comas algo que no est\u00e9 en la lista incluida.",
  "pantry.empty.recipes": "Todav\u00eda no hay recetas",
  "pantry.empty.recipesBody":
    "Una receta es una lista de ingredientes m\u00e1s c\u00f3mo la cocinaste. Despu\u00e9s entra a una comida como cualquier otro alimento.",
  "pantry.yours": "Tuyo",
  "pantry.recipe": "Receta",
  "pantry.group.recipes": "Tus recetas",
  "pantry.group.foods": "Tus alimentos",
  "pantry.group.builtIn": "Alimentos incluidos",
  "pantry.ingredientCount.one": "{count} ingrediente",
  "pantry.ingredientCount.other": "{count} ingredientes",

  // ── Escribir tu propio plan ──────────────────────────────────────────────
  "dietBuilder.new": "Nuevo plan",
  "dietBuilder.newTitle": "Escribe un plan",
  "dietBuilder.newBody":
    "Tus comidas, en orden, con los cambios que de verdad rotas. Cada total sale de lo que pongas.",
  "dietBuilder.editTitle": "Editando {name}",
  "dietBuilder.edit": "Editar",
  "dietBuilder.yours": "Tuyo",
  "dietBuilder.name": "Nombre",
  "dietBuilder.goal": "Objetivo",
  "dietBuilder.goal.cutting": "Definici\u00f3n",
  "dietBuilder.goal.bulking": "Volumen",
  "dietBuilder.goal.maintenance": "Mantenimiento",
  "dietBuilder.tdee": "Calor\u00edas de mantenimiento",
  "dietBuilder.tdeeHint":
    "Opcional. Lo que quemas al d\u00eda \u2014 si tu peso lleva un par de semanas estable, lo que estabas comiendo es tu mantenimiento. Si no, m\u00e1s o menos 30\u201333 kcal por kg de peso corporal.",
  "dietBuilder.targetHint":
    "Opcional. Lo que de verdad vas a comer. D\u00e9jalo en blanco y sale de tus objetivos de macros.",
  "dietBuilder.target": "Objetivo diario",
  "dietBuilder.targets": "Objetivos de macros",
  "dietBuilder.targetsHint":
    "A lo que le apuntas. Las comidas de abajo se comparan contra esto, no salen de aqu\u00ed.",
  "dietBuilder.fromMacros": "Tomarlos de la pesta\u00f1a Macros",
  "dietBuilder.meals": "Comidas",
  "dietBuilder.addMeal": "Agregar una comida",
  "dietBuilder.removeMeal": "Quitar {name}",
  "dietBuilder.mealName": "Se llama",
  "dietBuilder.mealNote": "Nota",
  "dietBuilder.mealNotePlaceholder": "Mezclar con agua, de la cafeter\u00eda\u2026",
  "dietBuilder.options": "Cambios",
  "dietBuilder.addOption": "Agregar un cambio",
  "dietBuilder.removeOption": "Quitar el cambio {number}",
  "dietBuilder.optionLabel": "Se llama",
  "dietBuilder.optionLabelPlaceholder": "Pollo, Salm\u00f3n\u2026",
  "dietBuilder.optionsHint":
    "Versiones intercambiables de la misma comida. Cada una es una lista completa \u2014 cambiar la prote\u00edna casi siempre mueve lo dem\u00e1s con ella.",
  "dietBuilder.items": "Qu\u00e9 lleva",
  "dietBuilder.addItem": "Agregar algo",
  "dietBuilder.removeItem": "Quitar {name}",
  "dietBuilder.itemNote": "Nota",
  "dietBuilder.running": "Hasta ahora: {macros}",
  "dietBuilder.vsTarget": "{value} vs objetivo",
  "dietBuilder.gapsTitle": "No llega a tus objetivos",
  "dietBuilder.gapsBody":
    "Guárdalo como borrador y regresa después — va a quedar marcado como sin terminar para que se note de un vistazo.",
  "dietBuilder.keepEditing": "Seguir editando",
  "dietBuilder.saveDraft": "Guardar como borrador",
  "dietBuilder.draft": "Borrador",
  "dietBuilder.draftBody":
    "Este plan todavía no suma a sus objetivos. Edítalo y vuelve a guardar para quitar esto.",
  "dietBuilder.save": "Guardar plan",
  "dietBuilder.saving": "Guardando\u2026",
  "dietBuilder.saved": "Se guard\u00f3 {name}",
  "dietBuilder.saveError": "No se pudo guardar",
  "dietBuilder.cancel": "Cancelar",
  "dietBuilder.delete": "Eliminar plan",
  "dietBuilder.deleted": "Se elimin\u00f3 {name}",
  "dietBuilder.deleteTitle": "\u00bfEliminar este plan?",
  "dietBuilder.deleteBody": "No afecta nada m\u00e1s \u2014 no se registra consumo contra un plan.",
  "dietBuilder.duplicate": "Empezar desde una copia",
  "dietBuilder.duplicateHint": "Copia un plan incluido y c\u00e1mbialo.",
  "dietBuilder.duplicateOf": "{name} (copia)",
  "dietBuilder.variantWarning":
    "Este plan escribe comidas distintas seg\u00fan el d\u00eda. Una copia se queda con la primera versi\u00f3n de cada una y la aplica todos los d\u00edas.",
  "dietBuilder.notFound": "Ese plan no existe",
  "dietBuilder.noMeals": "Todav\u00eda no hay comidas. Agrega una para empezar.",
  "dietBuilder.nothingIn": "Todav\u00eda no hay nada en esta.",

  // ── Exportar e importar ──────────────────────────────────────────────────
  // ── Lo que comiste ───────────────────────────────────────────────────────
  // ── La guía ────────────────────────────────────────────────────
  "nav.about": "Guía",
  "index.dest.about":
    "Cómo funciona cada parte de la app, y por qué funciona así.",
  "about.title": "Cómo funciona esto",
  "about.subtitle":
    "Cada función, para qué sirve, y las pocas decisiones detrás que no son obvias con solo darle clic.",

  "about.storage.title": "Dónde viven tus datos",
  "about.storage.body":
    "En este navegador, en este dispositivo. No hay cuenta y no se manda nada a ningún lado.",
  "about.storage.p1":
    "Eso lo hace privado por construcción — pero también significa que borrar los datos del navegador los elimina, y que no te siguen al celular.",
  "about.storage.p2":
    "Exporta un respaldo de vez en cuando. Lo que no puedes reconstruir son los ejercicios, rutinas, alimentos, recetas y planes que escribiste.",
  "about.storage.p3":
    "Los seis programas y los alimentos de la lista base vienen dentro de la app, así que esos nunca corren riesgo.",
  "about.storage.link": "Respalda tus datos",

  "about.routines.title": "Programas y días",
  "about.routines.body":
    "Seis programas transcritos más lo que tú escribas. Cada uno son semanas de días, y cada día es una lista de ejercicios con series, reps y descanso.",
  "about.routines.p1":
    "Cada renglón muestra los días de entrenamiento de su primera semana, para distinguir un push/pull de una especialización de brazo sin abrirlo.",
  "about.routines.p2":
    "Abre un día para verlo completo antes de empezar: cuántos ejercicios, cuántas series efectivas y un tiempo aproximado.",
  "about.routines.p3":
    "Las marcas debajo de cada ejercicio son una por serie, así que un finisher de siete series pesa visiblemente más que un accesorio de tres.",
  "about.routines.link": "Ver los programas",

  "about.player.title": "Hacer una sesión",
  "about.player.body":
    "Inicia un día y la app te lleva paso por paso — cada serie, cada descanso, cada pose.",
  "about.player.p1":
    "Los descansos arrancan solos cuando marcas Listo; un bloque de cardio espera a que le des Iniciar, porque tú decides cuándo estás en la máquina.",
  "about.player.p2":
    "El botón se queda en el mismo lugar en cada paso. Es a propósito — es el control que aprietas cuarenta veces por sesión.",
  "about.player.p3":
    "Puedes ir y regresar libremente. Terminar antes te pregunta primero, porque tira tu lugar en el día.",

  "about.logging.title": "Registrar series y récords",
  "about.logging.body":
    "Registra una serie desde el reproductor, o captúrala después desde la pestaña de Récords. El peso es opcional — el trabajo con peso corporal cuenta.",
  "about.logging.p1":
    "No se registra nada si no envías el formulario. Avanzar por el entrenamiento no guarda nada por su cuenta.",
  "about.logging.p2":
    "Un récord no es un solo número. Es el mejor peso en cada cantidad de reps, quitando cualquier renglón que pierda por los dos lados — así 120x1, 110x3 y 90x8 pueden ser récords al mismo tiempo.",
  "about.logging.p3":
    "Las unidades se guardan tal como las escribes. Una máquina marcada en libras se lee en libras; solo las comparaciones convierten.",
  "about.logging.link": "Ver tus récords",

  "about.exercises.title": "Ejercicios que no están en la lista",
  "about.exercises.body":
    "La app trae 113 ejercicios. Agrega los tuyos y funcionan en todo lo que los de la lista base — registro, récords, volumen, la gráfica del split.",
  "about.exercises.p1":
    "Tú dices qué músculos trabaja y qué patrón de movimiento es, en vez de escoger entre 42 movimientos. Eso es lo que deja que las gráficas de volumen lo lean sin ningún caso especial.",
  "about.exercises.p2":
    "Una vez que registraste algo contra uno, se archiva en lugar de borrarse — borrarlo dejaría esas series apuntando a nada.",
  "about.exercises.link": "Tu biblioteca de ejercicios",

  "about.builder.title": "Escribir tu propia rutina",
  "about.builder.body":
    "Arma un programa desde cero, o parte de una copia de uno de los que ya vienen y cambia lo que no te guste.",
  "about.builder.p1":
    "Una rutina tuya es una semana, que se repite. Copiar uno de los que vienen toma su primera semana.",
  "about.builder.p2":
    "Las series pueden traer técnicas de intensidad — drop sets, parciales, negativas, repeticiones forzadas — y pueden armarse por partes, como un hold que entra a pulsos y luego a reps.",
  "about.builder.p3":
    "Escribe un ejercicio que el buscador no conozca y te ofrece crearlo ahí mismo.",
  "about.builder.link": "Escribir una rutina",

  "about.progress.title": "Progreso",
  "about.progress.body":
    "Cinco vistas sobre el mismo registro: qué levantaste, cuánto, cuándo y contra qué.",
  "about.progress.p1":
    "Récords — todos tus récords, buscables y agrupados por ejercicio. Corrige o borra aquí una serie mal escrita y todo lo demás se corrige solo.",
  "about.progress.p2":
    "Volumen — series semanales por músculo, y un split de push/pull/pierna/core. Las series directas e indirectas se cuentan aparte en vez de mezclarse.",
  "about.progress.p3":
    "Historial — un año de días de entrenamiento en cuadrícula, y tu racha actual. Cuenta hacia atrás desde hoy, así que una racha rota marca cero.",
  "about.progress.p4":
    "Cuerpo — pesajes, grasa corporal y FFMI contra las bandas de referencia. Pon tu estatura en esa pestaña o los números no se pueden calcular.",
  "about.progress.link": "Abrir progreso",

  "about.nutrition.title": "Nutrición",
  "about.nutrition.body":
    "Un plan describe qué comer; la pestaña Hoy registra si lo hiciste.",
  "about.nutrition.p1":
    "Hoy — marca las comidas del plan conforme te las comes, y agrega lo que esté fuera del plan. No se registra nada hasta que lo marcas.",
  "about.nutrition.p2":
    "Una comida marcada recuerda cuál comida y cuál opción, no una copia de sus alimentos — así que corregir el plan corrige lo que registraste, incluso en días que ya pasaron.",
  "about.nutrition.p3":
    "Plan — la dieta como referencia, por día de la semana, con opciones de intercambio e hidratación calculada desde tu peso.",
  "about.nutrition.p4":
    "Macros — mueve el reparto y mira cómo cambian los gramos y las calorías, luego manda el resultado como los objetivos de tu plan.",
  "about.nutrition.link": "Abrir nutrición",

  "about.pantry.title": "Tus alimentos y recetas",
  "about.pantry.body":
    "Agrega ingredientes que no estén en la lista base, y cocínalos en recetas que puedes meter a una comida como cualquier otro alimento.",
  "about.pantry.p1":
    "Una receta se porciona en raciones o por el peso del platillo terminado. Pésalo ya cocido — pesa menos que sus ingredientes, y aquí nada adivina cuánto menos.",
  "about.pantry.p2":
    "Crudo y cocido son alimentos distintos, nunca una conversión. Un gramo de pollo cocido trae un tercio más de proteína que uno crudo.",
  "about.pantry.p3":
    "El método de cocción no trae macros propios. La grasa en la que cocinas es un renglón de ingrediente con una cantidad que tú escribes.",
  "about.pantry.link": "Abrir tu despensa",

  "about.calculators.title": "Calculadoras",
  "about.calculators.body":
    "Tres pestañas de aritmética. Nada de aquí lee ni escribe tu registro, más allá de llenar un campo con tu último pesaje.",
  "about.calculators.p1":
    "Máximo de una repetición — cinco fórmulas publicadas a la vez, porque difieren 5kg o más en reps altas y un solo número lo escondería. También va al revés: el peso para una serie de ocho.",
  "about.calculators.p2":
    "RPE — qué implica una serie con cierto peso, reps y RPE. Los valores fuera de tabla no devuelven nada en vez de extrapolar más allá de donde la tabla publicada se detiene.",
  "about.calculators.p3":
    "Potencial natural — un modelo empírico de masa magra máxima a partir de tu estatura, muñeca y tobillo. Es un ajuste a una población, no un techo.",
  "about.calculators.link": "Abrir las calculadoras",

  "about.plates.title": "Cargador de discos",
  "about.plates.body":
    "Metes un peso objetivo y salen los discos por lado — o metes discos y sale el total. Tiene su propia página porque la abres parado frente al rack.",
  "about.plates.p1":
    "No solo agarra el disco más pesado que quepa. Dile que tu gym no tiene discos de 10 y encuentra una combinación que sí llega al número, donde lo obvio se quedaría corto.",
  "about.plates.p2":
    "El inventario se cuenta en pares, porque un disco suelto no se carga parejo. Pon una medida en cero y lo planea sin ella.",
  "about.plates.link": "Abrir el cargador de discos",

  "about.sharing.title": "Respaldos y compartir",
  "about.sharing.body":
    "Exporta todo en un archivo, o pásale a alguien una sola rutina, plan, receta, alimento o ejercicio — incluyendo los que vienen con la app.",
  "about.sharing.p1":
    "Restaurar un respaldo completo reemplaza lo que hay en el navegador. Importar algo compartido se suma y no toca nada de lo tuyo.",
  "about.sharing.p2":
    "Lo compartido llega con ids nuevos, así que importar el mismo archivo dos veces te deja dos copias en vez de sobrescribir. También trae lo que necesita — una rutina lleva sus ejercicios propios, un plan lleva sus recetas.",
  "about.sharing.p3":
    "No se sube nada. Exportar es una descarga, importar es leer un archivo, y compartir es que tú le mandes el archivo a alguien.",
  "about.sharing.link": "Respaldar o importar",

  "about.gettingAround.title": "Moverte por la app",
  "about.gettingAround.body":
    "Unas cuantas cosas que ahorran tiempo cuando sabes que están ahí.",
  "about.gettingAround.p1":
    "Ctrl+K busca en cada página, pestaña y programa, y salta directo a crear una rutina, plan, alimento o receta.",
  "about.gettingAround.p2":
    "Las pestañas viven en la barra de direcciones, así que una vista se puede guardar, compartir como liga y sobrevive a recargar.",
  "about.gettingAround.p3":
    "El idioma y el modo oscuro están al fondo de la barra lateral. Los dos se quedan.",

  "intake.tab": "Hoy",
  "intake.today": "Hoy",
  "intake.yesterday": "Ayer",
  "intake.previousDay": "Día anterior",
  "intake.nextDay": "Día siguiente",
  "intake.eaten": "Comido",
  "intake.ofTarget": "{kcal} de {target} kcal",
  "intake.noTarget": "{kcal} kcal",
  "intake.planMeals": "Del plan",
  "intake.planMealsBody":
    "Marca una comida cuando ya te la comiste. No se registra nada hasta que lo hagas.",
  "intake.extras": "Cualquier otra cosa",
  "intake.extrasBody": "Lo que comiste que el plan no menciona.",
  "intake.add": "Agregar",
  "intake.remove": "Quitar",
  "intake.removed": "Quitado",
  "intake.gone": "Ya no está en tu despensa",

  "data.tab": "Datos",
  "data.title": "Respalda y comparte",
  "data.body":
    "Todo vive en este navegador. Exporta un archivo que puedas guardar, restáuralo en otro dispositivo, o p\u00e1sale a alguien una sola rutina, plan o receta.",
  "data.export": "Exportar todo",
  "data.import": "Importar un archivo",
  "data.localOnly":
    "El archivo se guarda en este dispositivo y se lee de aqu\u00ed. No se sube a ning\u00fan lado.",
  "data.exported": "Respaldo descargado",
  "data.notJson": "Ese archivo no es JSON",
  "data.notOurs": "Eso no parece un archivo de natty",
  "data.wrongVersion": "Ese archivo es versi\u00f3n {version}, y esta build no la lee",
  "data.invalid": "Ese archivo no pas\u00f3 la validaci\u00f3n \u2014 {detail}",
  "data.empty": "No trae nada",
  "data.cancel": "Cancelar",
  "data.restoreTitle": "\u00bfRestaurar todo?",
  "data.restoreBody":
    "Esto reemplaza lo que hay en el navegador con lo que trae el archivo. Tus datos actuales se sobrescriben, as\u00ed que exp\u00f3rtalos primero si los quieres conservar.",
  "data.restoreAction": "Reemplazar todo",
  "data.restored": "Restaurado",
  "data.mergeTitle": "\u00bfAgregar esto a lo tuyo?",
  "data.mergeBody":
    "Nada de lo tuyo se toca. Lo del archivo llega aparte, con ids nuevos para que no pueda sobrescribir nada \u2014 importar dos veces te deja dos copias.",
  "data.mergeAction": "Agregarlo",
  "data.merged": "Agregado",
  "data.kind.sets": "Sets registrados",
  "data.kind.bodyEntries": "Pesajes",
  "data.kind.exercises": "Tus ejercicios",
  "data.kind.routines": "Tus rutinas",
  "data.kind.foods": "Tus alimentos",
  "data.kind.recipes": "Tus recetas",
  "data.kind.diets": "Tus planes de dieta",
  "data.kind.intake": "Comidas registradas",
  "data.share": "Compartir",
  "data.shared": "Archivo descargado",

  "split.push": "Empuje",
  "split.pull": "Jal\u00f3n",
  "split.legs": "Pierna",
  "split.cardio": "Cardio",
  "split.core": "Core",
  "volume.splitFacetAria": "Sets de {split} por semana",

  "muscle.chest": "Pecho",
  "muscle.upper-chest": "Pecho superior",
  "muscle.lats": "Dorsales",
  "muscle.upper-back": "Espalda alta",
  "muscle.traps": "Trapecios",
  "muscle.front-delts": "Deltoides anterior",
  "muscle.side-delts": "Deltoides lateral",
  "muscle.rear-delts": "Deltoides posterior",
  "muscle.biceps": "B\u00edceps",
  "muscle.triceps": "Tr\u00edceps",
  "muscle.forearms": "Antebrazos",
  "muscle.quads": "Cu\u00e1driceps",
  "muscle.hamstrings": "Femorales",
  "muscle.glutes": "Gl\u00fateos",
  "muscle.adductors": "Aductores",
  "muscle.calves": "Pantorrillas",
  "muscle.spinal-erectors": "Erectores espinales",
  "muscle.abs": "Abdominales",

  // ── History ──────────────────────────────────────────────────────────────
  "history.tab": "Historial",
  "history.title": "Cada d\u00eda que entrenaste",
  "history.body":
    "Un a\u00f1o de d\u00edas registrados. Toca uno para ver qu\u00e9 hiciste \u2014 y para corregirlo si un n\u00famero entr\u00f3 mal.",
  "history.logged": "D\u00edas que registraste, que no es exactamente d\u00edas que entrenaste.",
  "history.less": "Menos",
  "history.more": "M\u00e1s",
  "history.daysTrained": "D\u00edas entrenados",
  "history.setsLogged": "Sets registrados",
  "history.longestStreak": "Racha m\u00e1s larga",
  "history.currentStreak": "Racha actual",
  "history.days.one": "{count} d\u00eda",
  "history.days.other": "{count} d\u00edas",
  "history.setsOnDay.one": "{count} set",
  "history.setsOnDay.other": "{count} sets",
  "history.exercises.one": "{count} ejercicio",
  "history.exercises.other": "{count} ejercicios",
  "history.daySummary": "{sets} en {exercises}",
  "history.noSets": "nada registrado",
  "history.empty.title": "Todav\u00eda no hay historial",
  "history.empty.body":
    "Registra algunas sesiones y aqu\u00ed aparece un a\u00f1o de ellas, un cuadro por d\u00eda.",
  "history.editSet": "Editar {set}",
  "history.editTitle": "Corregir este set",
  "history.save": "Guardar",
  "history.saving": "Guardando\u2026",
  "history.saved": "Set actualizado",
  "history.saveError": "No se pudo guardar el cambio",
  "history.deleteSet": "Eliminar {set}",
  "history.deleted": "Eliminado {set}",
  "history.undo": "Deshacer",
  "detail.loggedSets": "Todos los sets registrados",

  // ── Progress ─────────────────────────────────────────────────────────────
  "progress.title": "Progreso",
  "progress.subtitle": "Lo que has levantado y cómo va tu composición corporal.",
  "progress.tab.records": "Récords",
  "progress.tab.body": "Cuerpo",

  // ── Records ──────────────────────────────────────────────────────────────
  "records.logSet.title": "Registrar un set",
  "records.logSet.body":
    "Para trabajo hecho fuera de la app, o para ponerte al corriente con una sesión que no registraste en el momento.",
  "records.title": "Récords",
  "records.body":
    "El mejor peso en cada número de reps, por ejercicio — un set solo aparece aquí si nada lo superó en peso y en reps a la vez.",
  "records.searchLabel": "Buscar récords por ejercicio",
  "records.empty": "Todavía no hay récords registrados.",
  "records.emptySearch": 'Ningún récord coincide con "{search}".',
  "records.nothingLogged.title": "Todavía no has registrado nada",
  "records.nothingLogged.body":
    "Registra un set aquí arriba, o empieza un entrenamiento y ve anotando tus sets sobre la marcha.",
  "records.count.one": "{count} récord",
  "records.count.other": "{count} récords",
  "records.columnSet": "Set",
  "records.chartAria": "Ver gráficas de {exercise}",

  // ── Exercise detail ──────────────────────────────────────────────────────
  "detail.loading": "Cargando tu historial…",
  "detail.nothingLogged": "Todavía no has registrado nada de este ejercicio.",
  "detail.summary": "{sets} · {records} · mejor {best}",
  "detail.summaryNoBest": "{sets} · {records}",
  "detail.sets.one": "{count} set registrado",
  "detail.sets.other": "{count} sets registrados",
  "detail.overTime": "Cada set, a lo largo del tiempo",
  "detail.overTimeAria":
    "Cada set registrado a lo largo del tiempo, con los récords marcados",
  "detail.overTimeNote":
    "El peso en bruto no se puede comparar entre distintos números de reps, así que la línea es el máximo de una rep estimado con Epley — pone un triple pesado y un set largo de doce en el mismo eje.",
  "detail.strengthCurve": "Curva de fuerza",
  "detail.strengthCurveAria": "Mejor peso en cada número de reps",
  "detail.strengthCurveNote":
    "Tu mejor peso en cada número de reps — los mismos récords de la tabla, pero como forma. Qué tan rápido cae es qué tan rápido pierdes fuerza conforme el set se alarga.",
  "detail.needTwoSets":
    "Un solo set con carga es un punto, no una tendencia — registra otro y esto se llena.",
  "detail.needTwoRepCounts":
    "Esto necesita récords en dos números de reps distintos.",
  "detail.empty.title": "Todavía no hay nada que graficar",
  "detail.empty.body":
    "Registra un set de este ejercicio y aquí aparece su historial.",
  "detail.empty.bodyweight":
    "Todos los sets registrados de este ejercicio fueron a peso corporal, así que no hay carga que graficar.",
  "detail.legend.set": "Set",
  "detail.legend.record": "Récord",
  "detail.legend.estimate": "1RM estimado",
  "detail.axis.load": "Carga ({unit})",

  // ── Logging a set ────────────────────────────────────────────────────────
  "log.pickExercise": "Elige un ejercicio",
  "log.weightError": "Pon un peso, o déjalo vacío si fue a peso corporal",
  "log.repsError": "Pon cuántas reps hiciste",
  "log.saving": "Guardando el set...",
  "log.saved": "Registrado {set}",
  "log.newRecord": "Nuevo récord",
  "log.saveError": "No se pudo guardar ese set",
  "log.action": "Registrar set",
  "log.another": "Registrar otro",
  "log.thisSet": "Registrar este set",
  "log.nothingUntilLogged": "Nada se guarda hasta que lo registres.",
  "log.alreadyHere": "Ya hay aquí: {sets}. Al registrar se agrega otro.",
  "log.pr": "Récord",
  "log.last": "Último",
  "log.firstTime": "Es la primera vez que registras este.",
  "log.countLogged": "{count} registrados",

  // ── Body ─────────────────────────────────────────────────────────────────
  "body.profile.title": "Sobre ti",
  "body.profile.body":
    "Se guarda una vez y se aplica a cada pesaje, así que corregir un error aquí recalcula todo el historial.",
  "body.profile.heightHint": "Necesaria para el FFMI.",
  "body.profile.sex": "Sexo",
  "body.profile.sexHint": "Solo elige la escala de referencia.",
  "body.profile.sexUnset": "Sin definir",
  "body.profile.male": "Hombre",
  "body.profile.female": "Mujer",
  "body.latest.title": "Lo más reciente",
  "body.latest.needHeight": "Agrega tu estatura arriba para ver el FFMI.",
  "body.latest.needBodyFat":
    "Agrega un porcentaje de grasa a un pesaje para ver el FFMI.",
  "body.latest.body":
    "Índice de masa libre de grasa — masa magra sobre estatura al cuadrado.",
  "body.stat.leanMass": "Masa magra",
  "body.stat.ffmi": "FFMI",
  "body.stat.normalized": "Normalizado",
  "body.stat.bodyFat": "Grasa corporal",
  "body.logEntry.title": "Registrar un pesaje",
  "body.logEntry.body":
    "La grasa corporal es opcional — el peso solo ya vale la pena registrarlo.",
  "body.logEntry.action": "Registrar pesaje",
  "body.logEntry.weightError": "Pon tu peso",
  "body.logEntry.bodyFatError":
    "Pon un porcentaje entre 0 y 100, o déjalo vacío",
  "body.logEntry.saving": "Guardando...",
  "body.logEntry.saved": "Registrado {weight}",
  "body.logEntry.savedBodyFat": "{percent}% de grasa corporal",
  "body.logEntry.saveError": "No se pudo guardar ese pesaje",
  "body.trend.title": "Tendencia",
  "body.trend.body":
    "Peso y grasa corporal en sus propias escalas — una gráfica para cada uno, porque un eje compartido solo invitaría a leer el cruce como si significara algo.",
  "body.history.title": "Historial",
  "body.history.body": "Del más reciente al más antiguo.",
  "body.history.needSex":
    "Define tu sexo arriba para ver dónde cae la cifra normalizada frente a las normas poblacionales.",
  "body.history.empty": "Todavía no hay pesajes registrados.",
  "body.chart.notEnough.title": "Todavía no hay pesajes suficientes",
  "body.chart.notEnough.body": "Registra un segundo y aquí aparece la tendencia.",
  "body.chart.weightAria":
    "Peso corporal en {unit} a lo largo del tiempo, con el promedio semanal",
  "body.chart.bodyFatAria": "Porcentaje de grasa corporal a lo largo del tiempo",
  "body.chart.bodyFatNeedsTwo":
    "La grasa corporal es opcional, así que esto necesita dos pesajes que la traigan.",
  "body.chart.axisWeight": "Peso ({unit})",
  "body.chart.axisBodyFat": "Grasa corporal (%)",
  "body.chart.legendDaily": "Cada pesaje",
  "body.chart.legendWeekly": "Promedio semanal",
  "body.chart.legendPartial": "Esta semana hasta ahora ({count} de {total} días)",
  "body.chart.midweekNote":
    "Cada promedio se grafica a media semana, el jueves, para que la línea quede sobre los días que resume. Desde el {from}.",

  // ── Weekly average ───────────────────────────────────────────────────────
  "weekly.title": "Promedio semanal",
  "weekly.partialBadge": "{count} de {total} días",
  "weekly.partialBody":
    "Esta semana sigue corriendo, así que es el promedio de los días que llevas — se va a mover conforme la semana se llene.",
  "weekly.body":
    "De lunes a domingo. Un cambio de un día a otro es casi todo agua; uno de una semana a otra no.",
  "weekly.weekOf": "Semana del {date}",
  "weekly.versus": "vs la semana del {date}",
  "weekly.needAnother": "Una semana más de pesajes y aquí sale el cambio.",
  "weekly.recent": "Semanas recientes",
  "weekly.soFar": "{date} · hasta ahora",

  // ── Routines ─────────────────────────────────────────────────────────────
  "routines.title": "Rutinas",
  "routines.subtitle":
    "{count} programas. Cada uno enlista el split que corre.",
  "routines.weeks.one": "{count} semana",
  "routines.weeks.other": "{count} semanas",
  "routines.trainingDays.one": "{count} día de entrenamiento",
  "routines.trainingDays.other": "{count} días de entrenamiento",
  "routines.restDay": "Descanso",
  "routines.restDayTitle": "Día de descanso",
  "routines.restDayBody": "Nada programado — día de recuperación.",
  "routines.dayCycle": "ciclo de {count} días",
  "routines.restDays": "{count} de descanso",
  "routines.exerciseCount.one": "{count} ejercicio",
  "routines.exerciseCount.other": "{count} ejercicios",
  "routines.dayLabel": "Día {number} — {label}",
  "routines.defaultPrescription": "Por defecto: {value}",
  "routines.notFound": "Rutina no encontrada",
  "routines.notFoundBody": "Este programa no existe.",
  "routines.backToList": "Volver a rutinas",
  "common.cancel": "Cancelar",
  "routines.dayNotFound": "Día no encontrado",
  "routines.dayNotFoundBody": "Esa semana o ese día no existen en este programa.",
  "routines.holding": "sosteniendo",
  "routines.resting": "descansando",
  "routines.replace.title": "¿Reemplazar el entrenamiento actual?",
  "routines.replace.body":
    "Tienes un entrenamiento en curso en otro día. Al empezar este se descarta ese avance.",
  "routines.replace.confirm": "Empezar de todas formas",
  "routines.week": "Semana {number}",
  "routines.day": "Día {number}",
  "routines.startWorkout": "Empezar entrenamiento",
  "routines.noExercises": "Sin ejercicios",
  "routines.noExercisesBody": "Este día no tiene ejercicios registrados.",
  "routines.warmup": "Calentamiento y estiramiento",
  "routines.phase.main": "Trabajo principal",
  "routines.phase.mobility": "Movilidad",
  "routines.phase.stretch": "Estiramiento",
  "routines.phase.cardio": "Cardio",
  "routines.summary.exercises": "Ejercicios",
  "routines.summary.workingSets": "Sets efectivos",
  "routines.summary.roughTime": "Tiempo aprox.",
  "routines.summary.finishers.one": "Finisher",
  "routines.summary.finishers.other": "Finishers",
  "routines.setOf": "set {number} de {total}",

  // ── The player ───────────────────────────────────────────────────────────
  "player.stepOf": "Paso {current} de {total} · faltan {left}",
  "player.exerciseOf": "Ejercicio {current} de {total}",
  "player.set": "Set",
  "player.setValue": "{number} de {total}",
  "player.target": "Meta",
  "player.then": "Luego",
  "player.thenRest": "{seconds}s de descanso",
  "player.thenHold": "{seconds}s de pose",
  "player.thenStraightOn": "Directo",
  "player.thenEnd": "Fin del día",
  "player.loggedToday": "Registrado hoy",
  "player.nothingLoggedYet": "Nada aún — registra un set y aparece aquí.",
  "player.pose": "Pose",
  "player.back": "Atrás",
  "player.done": "Listo",
  "player.doneRest": "Listo — descansa {clock}",
  "player.doneHold": "Listo — sostén {seconds}s",
  "player.startNextSet": "Empezar el siguiente set",
  "player.startTimed": "Empezar {label}",
  "player.startClock": "Arrancar el cronómetro",
  "player.finish": "Terminar el entrenamiento",
  "player.rest": "Descanso",
  "player.hold": "Pose",
  "player.nextUp": "Sigue",
  "player.timesUp": "Se acabó el tiempo",
  "player.holdComplete": "Pose completa.",
  "player.restComplete": "Descanso completo — cuando estés listo.",
  "player.endWorkout": "Terminar",
  "player.endConfirm.title": "¿Terminar este entrenamiento?",
  "player.endConfirm.body":
    "Vas en el paso {current} de {total}. Todos los sets que registraste se quedan — solo pierdes tu lugar en el día.",
  "player.endConfirm.cancel": "Seguir",
  "player.ended": "Entrenamiento terminado",
  "player.endedBody": "{day} — lo que registraste se queda.",
  "player.complete": "Entrenamiento completado",
  "player.stale.title": "No queda nada en este entrenamiento",
  "player.stale.body": "{day} — esta sesión va más adelante de donde llega el día.",
  "player.stale.action": "Borrarla",

  // ── Calculators ──────────────────────────────────────────────────────────
  "calc.title": "Calculadoras",
  "body.chart.ffmiCaption":
    "FFMI normalizado contra las normas poblacionales {sex}. Solo descriptivo — las bandas altas describen lo que se observa normalmente sin fármacos, no evidencia sobre nadie en particular.",
  "body.profile.maleAdj": "masculinas",
  "body.profile.femaleAdj": "femeninas",
  "calc.orm.median": "Mediana de las cinco",
  "calc.orm.forGivenSetBody":
    "La misma fórmula al revés, sobre su propia estimación — así el renglón que corresponde al set que pusiste te devuelve el peso que levantaste.",
  "calc.potential.measurementsBody":
    "Muñeca y tobillo en su punto más angosto. La estatura, la muñeca y el tobillo se guardan en tu perfil; la grasa corporal parte de tu último pesaje y la puedes mover para ver qué cambia.",
  "calc.potential.lastWeighIn": "Último pesaje: {percent}%.",
  "calc.potential.maxBody":
    "El modelo del Dr. Casey Butt, ajustado a las medidas de fisicoculturistas sin fármacos. La segunda cifra, más chica, es el 95% del máximo — la que suele describirse como realmente alcanzable.",
  "calc.potential.explain1":
    "El modelo predice la masa magra máxima — todo lo que no es grasa, o sea músculo más hueso, órganos y agua — a partir de cuatro números, con la estatura, la muñeca y el tobillo en centímetros y el resultado en kilogramos. La muñeca y el tobillo representan la estructura ósea, porque son casi puro hueso y tendón y apenas cambian con el entrenamiento.",
  "calc.potential.explain2":
    "Es una curva ajustada a una población de fisicoculturistas sin fármacos, no una ley. La genética, las inserciones musculares, el historial de entrenamiento y la variación hormonal mueven la respuesta real, y ninguno de esos es una entrada aquí. Léelo como más o menos dónde cae la distribución para una estructura como la tuya, no como un límite para ti en particular.",
  "calc.potential.explain3":
    "Las predicciones de perímetros son las estimaciones del mismo modelo para el tamaño que alcanza cada medida con esa masa magra — pecho y bíceps a partir de la muñeca y la estatura, muslo y pantorrilla a partir del tobillo y la estatura.",
  "plates.strip": "Vaciar la barra",
  "calc.subtitle":
    "La aritmética alrededor del entrenamiento, sin tocar tu registro.",
  "calc.tab.oneRepMax": "Máximo de una rep",
  "calc.tab.rpe": "RPE y RIR",
  "calc.tab.potential": "Potencial natural",
  "calc.setYouDid": "El set que hiciste",
  "calc.setYouDidBody":
    "Un set duro, llevado cerca del fallo. Un set con tres reps en reserva estima un máximo que no tienes — para esos usa la pestaña de RPE.",
  "calc.orm.repsRange": "De 2 a {max}.",
  "calc.orm.needTwoBody":
    "Una sola rep ya es tu máximo, y pasadas las {max} reps estas curvas dejan de coincidir con la realidad.",
  "calc.orm.body":
    "Cinco ajustes de los mismos datos. La diferencia entre ellos es el margen de error honesto de cualquiera por separado.",
  "calc.example100": "ej. 100",
  "calc.orm.title": "Máximo de una rep estimado",
  "calc.orm.needTwo": "Pon un set de dos reps o más",
  "calc.orm.forGivenSet": "Qué levantar para un set dado",
  "calc.orm.formula": "Fórmula",
  "calc.orm.load": "Carga",
  "calc.orm.ofMax": "Del máximo",
  "calc.rpe.implies": "Lo que implica ese set",
  "calc.rpe.setBody":
    "El RPE es qué tan duro fue el set sobre 10; las reps en reserva son lo mismo contado al revés. RPE 8 y 2 en reserva son una sola cosa dicha dos veces.",
  "calc.rpe.impliesBody": "{reps} reps a RPE {rpe} es el {percent}% de un máximo de una rep.",
  "calc.rpe.inReserve": "{count} en reserva",
  "calc.rpe.chartBody":
    "Cargas contra la estimación de {max} {unit} de arriba. Tu set está resaltado.",
  "calc.rpe.chart": "La tabla",
  "calc.rpe.shareOfMax": "Porcentaje del máximo",
  "calc.rpe.offChart":
    "Esa combinación queda fuera de la tabla publicada — se detiene en doce reps al fallo.",
  "calc.rpe.percentNote":
    "Porcentajes de un máximo de una rep. Pon un set arriba para verlos como pesos.",
  "calc.potential.measurements": "Tus medidas",
  "calc.potential.body":
    "La estatura, la muñeca y el tobillo se guardan directo en tu perfil. La grasa corporal aquí es una perilla de simulación — el registro es el dueño del historial real.",
  "calc.potential.fillAllBody":
    "La estatura, la muñeca, el tobillo y la grasa corporal son todos entradas de la fórmula.",
  "calc.potential.leanMax": "Masa magra máxima",
  "calc.potential.realistic": "{value} kg realista",
  "calc.potential.needWeighIn":
    "Registra un pesaje con porcentaje de grasa para ver dónde estás frente a esto.",
  "calc.potential.standing":
    "Vas en {lean} kg de masa magra — {percent}% del máximo, {realistic}% de la cifra realista.",
  "calc.potential.exampleHeight": "ej. 179",
  "calc.potential.exampleWrist": "ej. 18",
  "calc.potential.exampleAnkle": "ej. 23",
  "calc.potential.exampleBodyFat": "ej. 12",
  "calc.potential.wristCm": "Muñeca (cm)",
  "calc.potential.wristHint": "Debajo del hueso.",
  "calc.potential.ankleCm": "Tobillo (cm)",
  "calc.potential.ankleHint": "Arriba del hueso.",
  "calc.potential.noWeighIn": "Todavía no hay un pesaje del cual partir.",
  "calc.potential.max": "Tamaño máximo realista",
  "calc.potential.girths": "Perímetros a ese tamaño",
  "calc.potential.fillAll": "Llena los cuatro campos",
  "calc.potential.whatThisIs": "Qué es esto, y qué no",
  "calc.potential.neck": "Cuello",
  "calc.potential.chest": "Pecho",
  "calc.potential.biceps": "Bíceps",
  "calc.potential.forearm": "Antebrazo",
  "calc.potential.thigh": "Muslo",
  "calc.potential.calf": "Pantorrilla",

  // ── Plate loader ─────────────────────────────────────────────────────────
  "plates.title": "Cargar la barra",
  "plates.subtitle": "Qué colgar en cada extremo, con los discos que tiene tu gym.",
  "plates.loadWeight": "Cargar un peso",
  "plates.addUp": "Sumar discos",
  "plates.theBar": "La barra",
  "plates.bar": "Barra",
  "plates.units": "Unidades",
  "plates.rack": "Lo que hay en el rack",
  "plates.perSide": "Por lado:",
  "plates.exact": "Exacto",
  "plates.barIncluded": "Cada total de abajo incluye los {weight} {unit} de la barra.",
  "plates.rackBody":
    "Pares de cada disco — uno para cada lado. Pon una denominación en cero y el cargador deja de usarla, que es justo el punto: va a encontrar una combinación más larga que igual dé exacto en vez de redondear.",
  "plates.loadBody": "La menor cantidad de discos que llega al objetivo sin pasarse.",
  "plates.target": "Objetivo ({unit})",
  "plates.belowBar": "Eso es menos que la barra sola ({weight} {unit}).",
  "plates.short": "Faltan {short} {unit} — ninguna combinación del rack da exacto",
  "plates.justTheBar": "nada, solo la barra",
  "plates.addBody":
    "Lo mismo al revés: pon discos en un lado y lee el total. Toca un disco de abajo para agregar un par, o toca uno de la barra para quitarlo.",
  "plates.barPlusSide": "barra de {weight} {unit} + {side} {unit} por lado",
  "plates.addPair": "Agregar un par de {weight} {unit}",
  "plates.removePair": "Quitar un par de {weight} {unit}",
  "plates.clear": "Vaciar la barra",
  "plates.pairsLabel": "Pares de {weight} {unit}",
  "plates.emptyBar": "Una barra vacía",

  // ── Nutrition ────────────────────────────────────────────────────────────
  "nutrition.title": "Nutrición",
  "nutrition.subtitle": "La dieta como referencia, y la aritmética detrás.",
  "nutrition.tab.plan": "Plan",
  "nutrition.tab.macros": "Macros",
  "nutrition.day": "Día",
  "nutrition.today": "hoy",
  "nutrition.dailyTargets": "Metas diarias",
  "nutrition.perKg": "{perKg}g de proteína por kg según tu último pesaje",
  "nutrition.ringNote": "El anillo muestra a cuánto suman de verdad las comidas de abajo.",
  "nutrition.noTargets":
    "Este plan no fija una meta. El anillo muestra a cuánto suman las comidas de abajo.",
  "nutrition.fromMacros": "de tus macros",
  "nutrition.useAsTargets": "Usar como mis objetivos",
  "nutrition.startPlanWith": "Empezar un plan con esto",
  "nutrition.targetsSaved": "Objetivos actualizados",
  "nutrition.hydrationBody": "Calculado con tu último pesaje, {weight}.",
  "nutrition.hydrationNoWeight": "Todavía no hay pesaje",
  "nutrition.hydrationLogWeight":
    "Registra tu peso y aquí sale cuánta agua tomar.",
  "nutrition.hydrationHours": "asume {hours} hora de entrenamiento",
  "nutrition.hydrationFormula":
    "{perKg}ml por kg, más {creatine}ml por la creatina, más {perHour}ml por cada hora de entrenamiento. Es una regla general — el calor y lo que sudes lo mueven bastante.",
  "nutrition.kcalPerDay": "kcal/día",
  "nutrition.kgPerWeek": "kg/semana",
  "nutrition.tdee": "TDEE",
  "nutrition.target": "Meta",
  "nutrition.deficit": "Déficit",
  "nutrition.surplus": "Superávit",
  "nutrition.pace": "Ritmo aprox.",
  "nutrition.notes": "Notas",
  "nutrition.amount": "Cantidad",
  "nutrition.item": "Alimento",
  "nutrition.protein": "Proteína",
  "nutrition.carbs": "Carbohidratos",
  "nutrition.fat": "Grasa",
  "nutrition.fibre": "Fibra",
  "nutrition.calories": "Calorías",
  "nutrition.fibreAria": "Fibra en gramos",
  "nutrition.resetToPlan": "Volver al plan",
  "nutrition.fibreNote":
    "Contada dentro de los carbohidratos de arriba, a unas {fibreKcal} kcal por gramo en vez de {carbKcal} — la fibra es un carbohidrato que el cuerpo solo aprovecha en parte, no un cuarto macro.",
  "nutrition.buildSplit": "Arma un reparto",
  "nutrition.kcalADay": "{kcal} kcal al día",
  "nutrition.above": "{kcal} kcal por encima de {plan}.",
  "nutrition.below": "{kcal} kcal por debajo de {plan}.",
  "nutrition.exactly": "Exactamente {plan}.",
  "formula.epley": "La opción común. Lineal en reps, y cerca del promedio en todo el rango.",
  "formula.brzycki": "La más baja de las cinco en sets cortos, de las más altas pasadas las diez reps.",
  "formula.lander": "Sigue de cerca a Brzycki, y es la que más sube en sets largos.",
  "formula.lombardi":
    "Una curva de potencia: casi la más alta en sets cortos y claramente la más baja en los largos.",
  "formula.mayhew": "Ajustada al press de banca, y la más alta de las cinco en sets cortos.",
  "nutrition.splitBody": "Partiendo de {plan}. Mueve un macro y todo lo demás se acomoda.",
  "nutrition.swapHint":
    "Elige uno — el resto de la comida se ajusta para que los macros del día cuadren.",
  "nutrition.option": "Opción {number}",
  "nutrition.hydration": "Hidratación",
  "nutrition.waterOnly": "solo agua",
  "nutrition.zeroCokes.one": "+ {count} coca zero",
  "nutrition.zeroCokes.other": "+ {count} cocas zero",
  "nutrition.supplements": "Suplementos",
  "nutrition.mealShare": "{percent}% del día",
  "nutrition.restDay": "Día de descanso",
  "nutrition.trainingDay": "Día de entrenamiento",
  "nutrition.raw": "Crudo",
  "nutrition.cooked": "Cocido",
};
