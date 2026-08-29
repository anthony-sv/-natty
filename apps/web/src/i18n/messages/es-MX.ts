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
  "nav.account": "Cuenta",
  "profile.title": "Perfil",
  "profile.subtitle":
    "Datos fijos de tu cuerpo — se usan para el FFMI y tu estimado de potencial natural. Funciona sin cuenta.",
  "profile.cardTitle": "Sobre ti",
  "profile.cardBody":
    "Se guarda una vez y se aplica en todos lados donde se usa, así que corregir un error de dedo aquí recalcula el FFMI y el estimado de potencial juntos.",
  "profile.heightHint": "Se necesita para el FFMI y el estimado de potencial.",
  "profile.sex": "Sexo",
  "profile.sexHint": "Solo elige la escala de referencia contra la que se lee el FFMI.",
  "profile.sexUnset": "Sin definir",
  "profile.male": "Hombre",
  "profile.female": "Mujer",
  "profile.birthDate": "Fecha de nacimiento",
  "profile.birthDateHint": "Se usa para estimar tu frecuencia cardíaca máxima y tus necesidades calóricas.",
  "profile.birthDateUnset": "Sin definir",
  "profile.wristCm": "Muñeca (cm)",
  "profile.wristHint": "Debajo del hueso. Se usa en el estimado de potencial natural.",
  "profile.ankleCm": "Tobillo (cm)",
  "profile.ankleHint": "Arriba del hueso. Se usa en el estimado de potencial natural.",
  "profile.edit": "Editar",
  "profile.done": "Listo",
  "profile.clear": "Borrar",
  "profile.cleared": "Se borró tu perfil",

  "account.title": "Cuenta",
  "account.subtitle": "Inicia sesión para sincronizar tus datos entre dispositivos.",
  "account.localNote": "Sin cuenta, todo se queda en este dispositivo.",
  "account.email": "Correo electrónico",
  "account.password": "Contraseña",
  "account.emailError": "Escribe un correo válido",
  "account.passwordError": "Mínimo 6 caracteres",
  "account.signIn": "Iniciar sesión",
  "account.createAccount": "Crear cuenta",
  "account.signOut": "Cerrar sesión",
  "account.signedInAs": "Sesión iniciada como {email}",
  "account.signedOut": "Sesión cerrada",
  "account.checkEmail": "Revisa tu correo para confirmar tu cuenta",
  "account.continueGoogle": "Continuar con Google",
  "account.or": "o",
  "account.providerError": "No se pudo iniciar el acceso",
  "account.handle": "Usuario",
  "account.handleHelp":
    "Único, y el único nombre que aparecería en algo público. Letras, números y guiones bajos.",
  "account.handleSave": "Reservar",
  "account.handleSaved": "Usuario reservado",
  "account.handleTaken": "Alguien ya lo tiene",
  "account.handleProblem.too-short": "Mínimo 3 caracteres",
  "account.handleProblem.too-long": "Máximo 20 caracteres",
  "account.handleProblem.shape":
    "Sólo letras, números y guiones bajos, empezando con letra",
  "account.handleProblem.reserved": "Ese está reservado",
  "account.username": "Nombre visible",
  "account.usernamePlaceholder": "¿Cómo te llamamos?",
  "account.usernameHelp":
    "Privado — sólo tú lo ves, y te sigue a tus otros dispositivos con tu cuenta.",
  "account.unavailable":
    "Esta versión no tiene cuentas configuradas. Todo sigue funcionando — tus datos se quedan en este dispositivo.",
  "account.signInError": "No se pudo iniciar sesión",
  "account.signUpError": "No se pudo crear la cuenta",
  "account.signOutError": "No se pudo cerrar sesión",
  "account.upload.title": "Los datos de este dispositivo",
  "account.upload.body":
    "Copia a tu cuenta lo que este dispositivo tenga y allá falte. Puedes presionarlo dos veces sin problema — no se duplica nada, y no se borra nada de este dispositivo.",
  "account.upload.action": "Subir a mi cuenta",
  "account.upload.uploading": "Subiendo...",
  "account.upload.done.one": "{count} elemento subido",
  "account.upload.done.other": "{count} elementos subidos",
  "account.upload.none": "Tu cuenta ya tiene todo lo de este dispositivo",
  "account.upload.error": "No se pudo subir",
  "account.upload.checking": "Revisando...",
  "account.upload.confirmTitle": "¿Subir esto a tu cuenta?",
  "account.upload.confirmBody":
    "Esto es lo que este dispositivo tiene y tu cuenta no. No se quita nada de este dispositivo.",
  "account.upload.confirmAction": "Subir",
  "account.upload.otherAccount":
    "Otra cuenta subió datos desde este dispositivo antes, así que parte de esto podría no ser tuyo. Revisa los números de arriba antes de continuar.",

  "account.delete.title": "Eliminar tu cuenta",
  "account.delete.body":
    "Borra tu cuenta y todo lo que contiene, en todos tus dispositivos. No se puede deshacer.",
  "account.delete.exportFirst": "Descarga tus datos primero",
  "account.delete.action": "Eliminar mi cuenta",
  "account.delete.confirmTitle": "¿Eliminar tu cuenta?",
  "account.delete.confirmBody":
    "Tu registro de entrenamiento, pesajes, medidas, comidas y todo lo que escribiste se borrarán del servidor, junto con tu usuario. Esto no se puede deshacer. Los datos que sigan en este dispositivo se quedan intactos y volverán a aparecer la próxima vez que abras la app.",
  "account.delete.typeEmail": "Escribe {email} para confirmar",
  "account.delete.confirmAction": "Eliminar todo",
  "account.delete.done": "Tu cuenta fue eliminada",
  "account.delete.error": "No se pudo eliminar la cuenta",

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
  "common.noFoodFound": "No se encontró ningún alimento o receta.",
  "common.weightUnit": "Unidad de peso",
  "common.cardio": "Cardio",
  "cardio.route.5k": "un 5K",
  "cardio.route.10k": "un 10K",
  "cardio.route.halfMarathon": "un medio maratón",
  "cardio.route.marathon": "un maratón",
  "cardio.route.londonBrighton": "Londres a Brighton",
  "cardio.route.laSanDiego": "Los Ángeles a San Diego",
  "cardio.route.madridValencia": "Madrid a Valencia",
  "cardio.route.sfLa": "San Francisco a Los Ángeles",
  "cardio.route.parisBerlin": "París a Berlín",
  "cardio.route.ukLength": "el largo de Gran Bretaña",
  "cardio.route.nyLa": "Nueva York a Los Ángeles",
  "cardio.route.madridMexicoCity": "Madrid a Ciudad de México",
  "cardio.route.earthCircumference": "una vuelta a la Tierra",
  "cardio.log.action": "Registrar distancia",
  "cardio.log.thisSession": "Registrar esta sesión",
  "cardio.log.saving": "Guardando sesión...",
  "cardio.log.saved": "Registrado {entry}",
  "cardio.log.saveError": "No se pudo guardar esa sesión",
  "cardio.log.durationMinutes": "Duración (min)",
  "cardio.distanceError": "Ingresa cuánto recorriste",
  "cardio.durationError": "Ingresa minutos, o déjalo en blanco",
  "common.distance": "Distancia",
  "common.distanceUnit": "Unidad de distancia",
  "cardio.history.noEntries": "nada registrado",
  "cardio.history.editEntry": "Editar {entry}",
  "cardio.history.editTitle": "Corregir esta sesión",
  "cardio.history.saved": "Sesión actualizada",
  "cardio.history.deleteEntry": "Eliminar {entry}",
  "cardio.history.deleted": "Eliminado {entry}",
  "cardio.tab": "Cardio",
  "cardio.empty.title": "Aún no hay cardio registrado",
  "cardio.empty.body": "Registra una distancia desde un bloque de cardio en una sesión y aparecerá aquí.",
  "cardio.zone2.title": "Meta de Zona 2",
  "cardio.zone2.description": "60-70% de tu frecuencia cardíaca máxima estimada.",
  "cardio.zone2.range": "{low}-{high} lpm",
  "cardio.zone2.noBirthDate": "Agrega tu fecha de nacimiento para ver una meta",
  "cardio.zone2.setBirthDate": "Configúrala en tu perfil",
  "cardio.total.title": "Distancia total",
  "cardio.total.value": "{km} km",
  "cardio.total.thisWeek": "{km} km esta semana",
  "cardio.milestone.passed": "Eso es {route} — y {remainder} km más.",
  "cardio.milestone.toward": "Eso es {remaining} km antes de {route}.",
  "cardio.sessions.title": "Sesiones",
  "common.finisher": "Finisher",
  "common.bodyFatPercent": "Grasa corporal (%)",
  "common.visceralFat": "Grasa visceral",
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
  "modifier.restPause": "Rest-pause",
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
    "Elige un programa y esta tarjeta te dirá qué entrenar hoy.",
  "index.start.action": "Ver programas",
  "index.today.title": "Hoy",
  "index.today.restBody": "Día de descanso.",
  "index.today.upNext": "Sigue: {day}",
  "deload.title": "Considera una semana de descarga",
  "deload.body":
    "Sin nuevo récord en {exercises} en 3 sesiones seguidas. Una semana más ligera suele volver a mover un ejercicio estancado.",
  "deload.acknowledge": "Entendido, descargo esta semana",
  "index.resume.title": "Entrenamiento en curso",
  "index.resume.upNext": "Sigue: {exercise}",
  "index.resume.allDone": "Todos los sets hechos.",
  "index.resume.action": "Retomar",
  "index.resume.discard": "Descartar",
  "index.resume.discarded": "Entrenamiento descartado",
  "home.training": "Entrenamiento",
  "home.training.empty":
    "Todavía no hay sets. Abre un programa y empieza un día — la app te va llevando.",
  "home.streakDays.one": "Racha de {count} día",
  "home.streakDays.other": "Racha de {count} días",
  "home.setsThisWeek.one": "{count} set esta semana",
  "home.setsThisWeek.other": "{count} sets esta semana",
  "home.recordsHeld.one": "{count} récord",
  "home.recordsHeld.other": "{count} récords",

  "home.body": "Cuerpo",
  "home.body.empty":
    "Todavía no hay pesajes. Uno toma un segundo y lo demás sale solo.",
  "home.weekAverage": "Prom. semanal {weight} · {delta} vs la anterior",
  "home.bodyFat": "{percent}% de grasa",
  "home.notLoggedToday": "No registrado hoy",
  "home.noBodyFat": "Sin medición de grasa",
  "home.ffmi": "FFMI {value}",
  "home.needHeight": "Pon tu estatura para el FFMI",

  "home.measurements": "Medidas",
  "home.measurements.empty":
    "Todavía no hay medidas. Brazos y cintura dicen lo que la báscula no.",
  "home.sinceStart": "{delta} {unit} desde que empezaste",
  "home.siteValue": "{site} {value}",

  "home.food": "La comida de hoy",
  "home.food.empty": "Hoy no has registrado nada.",
  "home.food.emptyMeals.one": "{count} comida por marcar hoy.",
  "home.food.emptyMeals.other": "{count} comidas por marcar hoy.",
  "home.kcalOfTarget": "{eaten} / {target} kcal",
  "home.mealsTicked": "{ticked} de {total} comidas marcadas",
  "home.macrosSoFar": "P{protein} · C{carbs} · G{fat}",

  "index.dest.routines":
    "Programas semana por semana, o escribe el tuyo. Abre un día para empezar.",
  "index.dest.progress":
    "Récords, volumen por músculo, un año de días entrenados, tus medidas y tus propios ejercicios.",
  "index.dest.nutrition":
    "Lo que comiste y cómo va, planes de dieta comida por comida, tus propios alimentos y recetas, y una calculadora de macros.",
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

  // -- Fatiga -----------------------------------------------------------
  "fatigue.title": "Fatiga",
  "fatigue.description":
    "Qu\u00e9 m\u00fasculos siguen en recuperaci\u00f3n, seg\u00fan cu\u00e1ndo los trabajaste directo por \u00faltima vez.",
  "fatigue.figureSummary": "Figura 3D de recuperaci\u00f3n muscular \u2014 arrastra para girar",
  "fatigue.spectrumToggle": "Colores completos de disposici\u00f3n (verde\u2013amarillo\u2013naranja)",
  "fatigue.state.recovering": "En recuperaci\u00f3n",
  "fatigue.state.nearly": "Casi listo",
  "fatigue.state.ready": "Listo",
  "fatigue.state.untrained": "Sin datos recientes",
  "fatigue.status": "{muscle} \u00b7 {state} \u00b7 trabajado {time}",
  "fatigue.status.untrained": "{muscle} \u00b7 {state}",
  "fatigue.indirectNote": "Tambi\u00e9n trabajado indirectamente {time}",
  "fatigue.recoveringHeading": "Todav\u00eda en recuperaci\u00f3n",
  "fatigue.allReady": "Todo listo para entrenar.",
  "fatigue.footnote":
    "Las ventanas de recuperaci\u00f3n son una referencia general \u2014 48h para m\u00fasculos peque\u00f1os, 72h para los m\u00e1s grandes \u2014 y solo cuentan las sesiones que registraste, ya sea con series anotadas o marcando el d\u00eda como terminado.",

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
  "pattern.wrist-flexion": "Curl de mu\u00f1eca",
  "pattern.wrist-extension": "Curl de mu\u00f1eca inverso",
  "pattern.loaded-carry": "Acarreo cargado",
  "pattern.squat": "Sentadilla",
  "pattern.hinge": "Bisagra de cadera",
  "pattern.lunge": "Zancada",
  "pattern.knee-extension": "Extensi\u00f3n de rodilla",
  "pattern.knee-flexion": "Flexi\u00f3n de rodilla",
  "pattern.nordic-curl": "Curl n\u00f3rdico",
  "pattern.hip-extension": "Extensi\u00f3n de cadera",
  "pattern.hip-abduction": "Abducci\u00f3n de cadera",
  "pattern.hip-adduction": "Aducci\u00f3n de cadera",
  "pattern.calf-raise": "Elevaci\u00f3n de talones",
  "pattern.seated-calf-raise": "Elevaci\u00f3n de talones sentado",
  "pattern.spinal-extension": "Extensi\u00f3n de espalda baja",
  "pattern.spinal-flexion": "Flexi\u00f3n abdominal",
  "pattern.core-stability": "Estabilidad del core",
  "pattern.anti-rotation": "Anti-rotaci\u00f3n",
  "pattern.anti-lateral-flexion": "Anti-flexi\u00f3n lateral",
  "pattern.rotation": "Rotaci\u00f3n",
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

  // ── Media de ejercicios ──────────────────────────────────────────────────
  "media.play": "Reproducir",
  "media.pause": "Pausar",
  "media.preview": "Vista previa de {name}",
  "media.viewPhoto": "Ver foto",

  // ── Escribir tu propia rutina ────────────────────────────────────────────
  "builder.new": "Nueva rutina",
  "builder.yours": "Tuya",
  "builder.edit": "Editar",
  "builder.newTitle": "Escribe una rutina",
  "builder.newBody":
    "Un ciclo de d\u00edas que se repite. Siete son una semana; pon ocho para push/pull/piernas/descanso dos veces, o tres para un PPL corrido \u2014 el ciclo son los d\u00edas que escribas, no los que trae una semana.",
  "builder.editTitle": "Editando {name}",
  "builder.name": "Nombre",
  "builder.nameRequired": "Ponle un nombre",
  "builder.style": "Estilo",
  "builder.stylePlaceholder": "Empuje/jal\u00f3n/pierna, torso/pierna\u2026",
  "builder.days": "D\u00edas",
  "builder.dayNumber": "D\u00eda {number}",
  "builder.addDay": "Agregar un d\u00eda",
  "builder.dayLabel": "De qu\u00e9 es",
  "builder.dayLabelPlaceholder": "Gl\u00fateo, Pecho, Jal\u00f3n\u2026",
  "builder.restDay": "D\u00eda de descanso",
  "builder.moveDayUp": "Mover el día {number} antes",
  "builder.moveDayDown": "Mover el día {number} después",
  "builder.removeDay": "Quitar el d\u00eda {number}",
  "builder.noDays": "Todav\u00eda no hay d\u00edas. Agrega uno para empezar.",
  "builder.exercises": "Ejercicios",
  "builder.linkSuperset": "Biserie con la de arriba",
  "builder.unlink": "Separarlas",
  "builder.transition": "Entre (s)",
  "builder.addExercise": "Agregar un ejercicio",
  "builder.removeExercise": "Quitar {name}",
  "builder.noExercises": "Todav\u00eda no hay nada en este d\u00eda.",
  "builder.pickExercise": "Elige un ejercicio",
  "builder.createNamed": "Agregar \"{name}\" como ejercicio tuyo",
  "builder.exerciseKind": "Tipo",
  "builder.edited": "Editada",
  "builder.editingBuiltIn":
    "Esta venía con la app. Al guardar se queda tu versión y la original se oculta de la lista — la original sigue ahí, así que puedes regresarla cuando quieras.",
  "builder.reset": "Regresar a la original",
  "builder.resetTitle": "¿Regresar la original?",
  "builder.resetBody":
    "Se descartan tus cambios a este programa y vuelve la versión que venía con la app. Nada de lo que registraste se ve afectado.",
  "builder.reset.done": "{name} volvió a la original",
  "builder.alternatives": "O alguno de estos",
  "builder.alternativesHint":
    "Ejercicios que aceptarías igual. El reproductor los ofrece como cambio a media serie, y registra el que de verdad hiciste.",
  "builder.addAlternative": "Agregar un sustituto...",
  "builder.removeAlternative": "Quitar {name}",
  "builder.cardioHint":
    "El cardio es tiempo, no reps. Agrega un segundo bloque para intervalos — cuatro rondas de tres minutos son cuatro sets, o dos bloques de distinta duración.",
  "builder.duration": "Cuánto dura",
  "builder.durationUnit": "Minutos o segundos",
  "builder.minutes": "min",
  "builder.seconds": "seg",
  "builder.weekNumber": "Semana {number}",
  "builder.addWeek": "Agregar una segunda semana",
  "builder.duplicateWeek": "Agregar una semana",
  "builder.weekFromCopy": "Empezar con una copia de",
  "builder.weekOpen": "(abierta)",
  "builder.weekFromEmpty": "Empezar con una semana vacía",
  "builder.weekFromEmptyHint": "Para un programa que cambia de split a medio camino.",
  "builder.removeWeek": "Quitar la semana {number}",
  "builder.daysInWeek": "Días — semana {week}",
  "builder.oneWeekHint":
    "Un ciclo, repetido todo el tiempo que corras el programa. Agrega una semana solo si los números cambian entre una y otra.",
  "builder.weeksHint":
    "{count} semanas, en orden y luego se repiten. Una nueva empieza como copia de la semana que elijas, así solo cambias lo que se mueve.",
  "builder.restBetween": "Descanso entre (s)",
  "builder.intensity": "Qué tan fuerte",
  "builder.intensity.none": "Sin especificar",
  "builder.load": "Peso",
  "builder.load.unsaid": "No decir",
  "intensity.low": "Suave",
  "intensity.moderate": "Moderado",
  "intensity.high": "Fuerte",
  "builder.setStyle.timed": "Por tiempo",
  "builder.sets": "Sets",
  "builder.reps": "Reps",
  "builder.repsTo": "a",
  "builder.rest": "Descanso (s)",
  "builder.finisher.none": "No es finisher",
  "builder.finisher.noneBody":
    "Un ejercicio normal. Sus sets son los que tú escribas.",
  "builder.finisher.pose": "Pose sostenida",
  "builder.finisher.poseBody":
    "7 sets de 15-20, 30s de descanso, cerrando con una pose de 10 segundos. Elige la pose abajo.",
  "builder.finisher.ramp": "Aguante y pulsos",
  "builder.finisher.rampBody":
    "4 sets, cada uno: aguante de 10s → 12 pulsos → 12 reps con pulso → aguante de 10s → 12 pulsos. Las reps bajan 12/10/8/6 mientras sube el peso.",
  "builder.finisher.overwrites": "Esto reemplaza los sets que escribiste.",
  "builder.finisher.poseUnset":
    "Elige una pose, o este finisher no mostrará ninguna.",
  "builder.pose": "Pose",
  "builder.pose.none": "Sin elegir",
  "builder.holdSeconds": "Aguante (s)",
  "builder.poseAlternatives": "O alguna de estas poses",
  "builder.poseAddAlternative": "Agregar una pose alterna...",
  "builder.removePoseAlternative": "Quitar {name}",
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
  "builder.notePlaceholder": "Algo que valga la pena recordar de este programa",
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
  "pantry.createNamed": "Agregar \"{name}\" a tu despensa",
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
  "pantry.category": "Tipo de alimento",
  "pantry.categoryHint":
    "Lo agrupa en el buscador. Déjalo en blanco y se agrupa por el macronutriente que más aporta.",
  "pantry.category.none": "Deducirlo de los macros",

  "foodGroup.vegetables": "Verduras",
  "foodGroup.fruits": "Frutas",
  "foodGroup.grains": "Cereales y granos",
  "foodGroup.tubers": "Papas y tubérculos",
  "foodGroup.legumes": "Frijoles y leguminosas",
  "foodGroup.dairy-eggs": "Lácteos y huevo",
  "foodGroup.meat-fish": "Carnes y pescados",
  "foodGroup.fats": "Grasas y aceites",
  "foodGroup.sweets": "Dulces y botanas",
  "foodGroup.supplements": "Suplementos",
  "foodGroup.protein": "Casi todo proteína",
  "foodGroup.carbs": "Casi todo carbohidrato",
  "foodGroup.fat": "Casi todo grasa",
  "foodGroup.mixed": "Mixto",
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
  "dietBuilder.tdeeSuggested": "Estimado a partir de tu perfil y tu rutina: {kcal} kcal.",
  "dietBuilder.useSuggested": "Usarlo",
  "dietBuilder.tdeeMissingIntro":
    "Opcional. Lo que quemas al d\u00eda \u2014 necesita",
  "dietBuilder.tdeeMissingProfileLink": "tu perfil",
  "dietBuilder.tdeeMissingWeightLink": "un registro de peso",
  "dietBuilder.tdeeMissingRoutineLink": "una rutina activa",
  "dietBuilder.tdeeMissingEnd": "para ver una estimaci\u00f3n.",
  "dietBuilder.targetSuggested": "Seg\u00fan el TDEE y tu objetivo: {kcal} kcal.",
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
  "dietBuilder.saveAsRecipe": "Guardar como receta",
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
  "dietBuilder.notes": "Notas",
  "dietBuilder.addNote": "Agregar nota",
  "dietBuilder.removeNote": "Quitar nota",
  "dietBuilder.notePlaceholder": "Algo que valga la pena recordar de este plan",
  "dietBuilder.save": "Guardar plan",
  "dietBuilder.saving": "Guardando\u2026",
  "dietBuilder.saved": "Se guard\u00f3 {name}",
  "dietBuilder.saveError": "No se pudo guardar",
  "dietBuilder.cancel": "Cancelar",
  "dietBuilder.delete": "Eliminar plan",
  "dietBuilder.deleted": "Se elimin\u00f3 {name}",
  "dietBuilder.targetsDisagree":
    "Estos macros dan {fromMacros} kcal, pero el objetivo diario de arriba dice {statedKcal} — una diferencia de {delta}. Cambia uno de los dos, o borra el objetivo diario y se calcula a partir de estos.",
  "dietBuilder.editingBuiltIn":
    "Este ven\u00eda con la app. Al guardar se queda tu versi\u00f3n y el original se oculta del selector \u2014 el original sigue ah\u00ed, as\u00ed que puedes regresarlo cuando quieras.",
  "dietBuilder.reset": "Regresar al original",
  "dietBuilder.resetTitle": "\u00bfRegresar el original?",
  "dietBuilder.resetBody":
    "Se descartan tus cambios a este plan y vuelve la versi\u00f3n que ven\u00eda con la app. Las comidas que ya marcaste no se ven afectadas.",
  "dietBuilder.reset.done": "{name} volvi\u00f3 al original",
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
    "En este navegador, en este dispositivo — a menos que inicies sesión, lo que sincroniza con tu cuenta todo lo que registras y todo lo que escribes.",
  "about.storage.p1":
    "Eso lo hace privado por construcción — pero también significa que borrar los datos del navegador los elimina, y que no te siguen al celular.",
  "about.storage.p2":
    "Exporta un respaldo de vez en cuando. Lo que no puedes reconstruir son los ejercicios, rutinas, alimentos, recetas y planes que escribiste.",
  "about.storage.p3":
    "Los seis programas y los alimentos de la lista base vienen dentro de la app, así que esos nunca corren riesgo.",
  "about.storage.link": "Respalda tus datos",

  "about.account.title": "Tu cuenta",
  "about.account.body":
    "Opcional, y desactivada por defecto. La app funciona completa sin cuenta; iniciar sesión es lo que hace que tus datos te sigan a otro dispositivo.",
  "about.account.p1":
    "Nada se mueve solo. Subir los datos de este dispositivo es un botón en la página de cuenta — seguro aunque lo presiones dos veces, porque la cuenta guarda una sola copia de cada cosa.",
  "about.account.p2":
    "Al cerrar sesión, este dispositivo vuelve a mostrar sus propios datos intactos. La cuenta conserva lo que subiste, listo para el siguiente dispositivo.",
  "about.account.p3":
    "Los respaldos siguen funcionando con sesión iniciada — la exportación cubre lo que la app muestra en ese momento, así que también es tu salida del servidor.",
  "about.account.link": "Ir a tu cuenta",
  "about.profile.title": "Perfil",
  "about.profile.body":
    "Estatura, sexo, muñeca y tobillo — los datos fijos que usan tanto el FFMI como el estimado de potencial natural.",
  "about.profile.p1":
    "Un solo lugar para editar, no dos: esto era un campo de estatura y sexo en la pestaña de cuerpo, y una segunda copia de estatura, muñeca y tobillo en la calculadora de potencial — corregir un error de dedo en un lado dejaba el otro mal.",
  "about.profile.p2":
    "Se llega desde el menú del avatar en el encabezado o la barra lateral, con o sin sesión iniciada — el FFMI no debería necesitar una cuenta para configurarse, así que el estado sin sesión ahora abre un menú en vez de ir directo a una página para iniciar sesión.",
  "about.profile.link": "Abrir tu perfil",

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

  "about.coverage.title": "Cobertura",
  "about.coverage.body":
    "Una tarjeta en cada página de programa que lee su propia lista de ejercicios — no tu registro — para decir qué nunca entrena.",
  "about.coverage.p1":
    "Es sobre el programa, no sobre ti: una rutina que escribiste hace cinco minutos y nunca has entrenado recibe una respuesta real, igual que una que llevas meses corriendo.",
  "about.coverage.p2":
    "La variedad de movimiento se agrupa por músculo, no por empuje/jalón/pierna — solo así puede decirte que presionas pero nunca haces aperturas, ya que ese split junta pecho, deltoides y tríceps.",
  "about.coverage.p3":
    "La mayoría de los músculos solo tienen un patrón de movimiento en todo el catálogo, así que una sección de variedad silenciosa es el caso normal, no evidencia de que la revisión no funciona.",
  "about.coverage.link": "Revisar un programa",

  "about.player.title": "Hacer una sesión",
  "about.player.body":
    "Inicia un día y la app te lleva paso por paso — cada serie, cada descanso, cada pose.",
  "about.player.p1":
    "Los descansos arrancan solos cuando marcas Listo; un bloque de cardio espera a que le des Iniciar, porque tú decides cuándo estás en la máquina.",
  "about.player.p2":
    "El botón se queda en el mismo lugar en cada paso. Es a propósito — es el control que aprietas cuarenta veces por sesión.",
  "about.player.p3":
    "Puedes ir y regresar libremente. Terminar antes te pregunta primero, porque tira tu lugar en el día.",
  "about.player.p4":
    "Los sets de calentamiento se muestran y se cronometran, pero nunca se registran. Dos series de aproximación a la mitad del peso no son un récord ni son volumen, así que quedan fuera de ambos — y de la cuenta de sets del día.",
  "about.player.p5":
    "Si una rutina lista sustitutos, puedes cambiar a media sesión y la serie se registra contra el ejercicio que de verdad hiciste. El cambio dura solo esa sesión — que alguien esté en la máquina hoy no es una edición a tu programa.",
  "about.player.p6":
    "Una serie escrita como secuencia — un aguante, luego pulsos, luego reps — se corre sola. No puedes andar tocando el teléfono entre las partes de una misma serie, así que los aguantes van cronometrados exactos, las partes contadas van a un ritmo estimado, y tienes +10s, saltar y pausa si el ritmo no es el tuyo.",
  "about.player.p7":
    "Todo aguante te cuenta 3-2-1 antes de empezar, y suena al terminar. Un aguante cuyo reloj arranca mientras todavía te estás acomodando es un aguante de siete segundos, no de diez.",

  "about.extras.title": "Trabajo extra",
  "about.extras.body":
    "Registra trabajo de gimnasio que no está en la rutina — un accesorio que agregaste, o para completar un día que dejaste a medias.",
  "about.extras.p1":
    "Es un ejercicio real, no solo un registro — el mismo editor que usa el constructor de rutinas, así que un calentamiento, una rampa o varias series distintas están sobre la mesa, no solo una serie sencilla.",
  "about.extras.p2":
    "También funciona en un día de descanso. Agrega algo y ese día se vuelve uno real para entrenar, directo desde el inicio — sin necesidad de abrir el reproductor primero.",
  "about.extras.p3":
    "Se borra sola en cuanto vuelvas a terminar ese día, así que es un extra de una sola vez y no un cambio permanente a la rutina — quítalo antes si lo agregaste por error.",
  "about.extras.p4":
    "Puede ser un finisher (de cualquiera de los dos tipos — pose o la rampa de aguante y pulso) o cardio también — y un ejercicio o finisher que agregues se corre antes del cardio propio del día, como realmente lo harías.",

  "about.logging.title": "Registrar series y récords",
  "about.logging.body":
    "Registra una serie desde el reproductor, o captúrala después desde la pestaña de Récords. El peso es opcional — el trabajo con peso corporal cuenta.",
  "about.logging.p1":
    "No se registra nada si no envías el formulario. Avanzar por el entrenamiento no guarda nada por su cuenta.",
  "about.logging.p2":
    "Un récord no es un solo número. Es el mejor peso en cada cantidad de reps, quitando cualquier renglón que pierda por los dos lados — así 120x1, 110x3 y 90x8 pueden ser récords al mismo tiempo.",
  "about.logging.p3":
    "Las unidades se guardan tal como las escribes. Una máquina marcada en libras se lee en libras; solo las comparaciones convierten.",
  "about.logging.p4":
    "Una foto de inicio/fin aparece en la ficha de récords, en la lista del día y a mitad de la serie en el reproductor, donde haya una disponible — unos 80 de los ejercicios incluidos, tomadas de un banco de dominio público. El resto simplemente no muestra nada, en vez de una foto adivinada.",
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
    "Una rutina es un ciclo de días que se repite — siete son una semana, ocho son push/pull/piernas/descanso dos veces. Agrega más semanas cuando los números cambien entre ellas, empezando desde una copia de la semana que elijas.",
  "about.builder.p2":
    "Puedes editar los programas que vienen con la app. Tu versión lo reemplaza en la lista, el original sigue compilado, y \"Regresar a la original\" te lo devuelve.",
  "about.builder.p3":
    "Las series pueden traer técnicas de intensidad — drop sets, rest-pause, parciales, negativas, repeticiones forzadas — y pueden armarse por partes, como un hold que entra a pulsos y luego a reps. Un set de calentamiento se muestra y se cronometra, pero nunca se registra.",
  "about.builder.p4":
    "El cardio es tiempo en vez de reps, en minutos o segundos, con qué tan fuerte ir. Un segundo bloque lo vuelve intervalos.",
  "about.builder.p5":
    "Escribe un ejercicio que el buscador no conozca y te ofrece crearlo ahí mismo. Si le pones sustitutos a un ejercicio, el reproductor te deja cambiar a media sesión y registra el que de verdad hiciste.",
  "about.builder.p6":
    "«Biserie con la de arriba» une dos ejercicios en una rotación; con un tercero se vuelve un circuito. El descanso entre ellos deja de existir, que es justo lo que es una biserie; el descanso de la ronda es el del último.",
  "about.builder.link": "Escribir una rutina",

  "about.progress.title": "Progreso",
  "about.progress.body":
    "Cinco vistas sobre el mismo registro: qué levantaste, cuánto, cuándo y contra qué.",
  "about.progress.p1":
    "Récords — todos tus récords, buscables y agrupados por ejercicio. Corrige o borra aquí una serie mal escrita y todo lo demás se corrige solo.",
  "about.progress.p2":
    "Volumen — series semanales por músculo, un split de push/pull/pierna/core, y un mapa de Fatiga con los músculos que siguen en recuperación. Las series directas e indirectas se cuentan aparte en vez de mezclarse.",
  "about.progress.p3":
    "Historial — un año de días de entrenamiento en cuadrícula, y tu racha actual. Cuenta hacia atrás desde hoy, así que una racha rota marca cero.",
  "about.progress.p4":
    "Cuerpo — pesajes, grasa corporal, grasa visceral y FFMI contra las bandas de referencia. Pon tu estatura en esa pestaña o los números no se pueden calcular.",
  "about.progress.p5":
    "Medidas — contornos con el tiempo, aparte de Cuerpo porque una cinta y una báscula responden preguntas distintas.",
  "about.progress.p6":
    "Cardio — distancia, y una meta de Zona 2 estimada a partir de tu fecha de nacimiento en el perfil.",
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
  "about.nutrition.p5":
    "Al escribir un plan se revisa contra sí mismo: si tus objetivos de macros no dan la cifra diaria de calorías que pusiste, te lo dice y por cuánto. También puede estimar tu TDEE y un objetivo por ti, a partir de tu perfil, tu último pesaje y cuántos días a la semana entrena tu rutina activa — una sugerencia que tú decides usar, nunca algo que se escribe solo.",
  "about.nutrition.link": "Abrir nutrición",

  "about.supplements.title": "Suplementos",
  "about.supplements.body":
    "Lo que tomas todos los días, y si ya te lo tomaste. Márcalos en la pestaña Hoy, junto a tus comidas.",
  "about.supplements.p1":
    "No llevan macros a propósito. Tres cápsulas de omega tienen calorías en el papel y nadie las cuenta: lo que quieres saber es si te las tomaste, así que nada de esto mueve el total del día.",
  "about.supplements.p2":
    "La dosis vive en el suplemento, no en la marca. Corrígela y todos los días ya registrados dirán la cantidad nueva, que es lo correcto para algo que tomas siempre igual.",
  "about.supplements.p3":
    "Si dejas de tomar uno se archiva en vez de borrarse, para que los meses en que sí lo tomabas sigan siendo correctos. La tarjeta de creatina puede agregarse sola aquí con la dosis que calculó para ti.",
  "about.supplements.link": "Abrir Hoy",
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

  "about.trends.title": "La comida con el tiempo",
  "about.trends.body":
    "Doce semanas de lo que de verdad comiste, y qué tan seguido hiciste lo que decía el plan.",
  "about.trends.p1":
    "Solo se grafican los días que registraste, y los promedios son sobre esos días. Si no, dos semanas sin abrir la app jalarían el promedio hacia abajo y se leería como una dieta salvaje.",
  "about.trends.p2":
    "Dos cuadrículas, porque responden preguntas que pueden no coincidir: si marcaste las comidas del plan, y si el día quedó en su objetivo de calorías. Marcar todo y luego cenar otra vez es 100% en una y muy pasado en la otra.",
  "about.trends.p3":
    "La cuadrícula de calorías es el único lugar donde el color va en dos direcciones — quedarse corto y pasarse son cosas distintas, y juntarlas en \"qué tan lejos\" perdería lo único accionable. Dar en el objetivo es la celda pálida, porque es el día que no tiene nada que ver.",
  "about.trends.link": "Ver tus tendencias",

  "about.measurements.title": "Medidas",
  "about.measurements.body":
    "Contornos con el tiempo — brazos, cintura y piernas para empezar, y lo demás que quieras agregar.",
  "about.measurements.p1":
    "Cada zona tiene su propia gráfica en vez de compartir una. Un cuello y un pecho en el mismo eje dejarían al cuello como una línea plana, y el cambio que buscas es de un centímetro.",
  "about.measurements.p2":
    "Izquierdo y derecho se registran por separado solo si lo pides, y entonces son dos líneas en una gráfica — compararlos es justo la razón de haber anotado el lado.",
  "about.measurements.p3":
    "Seis de las zonas son las que predice la calculadora de potencial natural, así que lo que mides y lo que estima se comparan directamente.",
  "about.measurements.link": "Tomar una medida",

  "about.sharing.title":"Respaldos y compartir",
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

  "trends.tab": "Tendencias",
  "trends.daysLogged": "Días registrados",
  "trends.daysComplete": "Días completos",
  "trends.averageKcal": "Promedio kcal",
  "trends.averageProtein": "Promedio proteína",
  "trends.averageNote":
    "Los promedios son sobre los {days} días que registraste, no sobre toda la ventana — {protein}g de proteína, {carbs}g de carbohidratos, {fat}g de grasa, {kcal} kcal.",
  "trends.overTime": "Lo que comiste",
  "trends.overTimeBody":
    "Solo los días que registraste. Un hueco es un día que no anotaste, no un día que no comiste.",
  "trends.macros": "Macros",
  "trends.macrosAria": "Proteína, carbohidratos y grasa por día, en gramos",
  "trends.calories": "Calorías",
  "trends.caloriesAria": "Calorías por día",
  "trends.axisGrams": "Gramos",
  "trends.axisKcal": "kcal",
  "trends.grams": "Gramos",
  "trends.kcal": "Calorías",
  "trends.targetLine": "Objetivo {kcal}",
  "trends.notEnough.title": "Aún no hay suficiente para graficar",
  "trends.notEnough.body": "Con dos días registrados aparece la tendencia.",

  "trends.consistency": "Qué tan seguido",
  "trends.consistencyBody":
    "Dos preguntas que pueden no coincidir: si seguiste el plan, y si diste con los números. Marcar todas las comidas y luego cenar otra vez es las dos cosas a la vez.",
  "trends.adherence": "Comidas marcadas del plan",
  "trends.adherenceCaption": "Qué parte de las comidas del día marcaste",
  "trends.mealsOf": "{ticked} de {total} comidas",
  "trends.nothingTicked": "Nada marcado",
  "trends.caloriesCaption": "Qué tan lejos quedó el día de su objetivo",
  "trends.under": "Por debajo",
  "trends.over": "Por encima",
  "trends.onTarget": "En el objetivo",
  "trends.kcalOff": "{delta} kcal",
  "trends.noKcal": "Nada registrado",
  "trends.needTarget":
    "Este plan no tiene objetivo de calorías, así que no hay contra qué medir un día. Ponle uno al plan y esto se llena.",
  "trends.empty.title": "Todavía no hay nada registrado",
  "trends.empty.body":
    "Marca una comida en la pestaña de Hoy y empieza a aparecer aquí.",
  "intake.today": "Hoy",
  "intake.yesterday": "Ayer",
  "intake.previousDay": "Día anterior",
  "intake.nextDay": "Día siguiente",
  "intake.eaten": "Comido",
  "intake.ofTarget": "{kcal} de {target} kcal",
  "intake.noTarget": "{kcal} kcal",
  "intake.planMeals": "Del plan",
  "supplements.creatine": "Creatina",
  "supplements.trackCreatine": "Registrarla a diario",
  "supplements.creatineTracked": "Está en tu lista diaria, en Hoy.",
  "supplements.title": "Suplementos",
  "supplements.body": "Lo que tomas a diario, y si ya te lo tomaste.",
  "supplements.takenOf": "{taken} de {total} tomados",
  "supplements.empty":
    "Aún no hay nada. Agrega lo que tomas y aparecerá todos los días.",
  "supplements.add": "Agregar un suplemento",
  "supplements.formBody":
    "Un nombre y una dosis. Los suplementos se registran para ver si los tomaste, no por sus macros: nada de esto cuenta en las calorías del día.",
  "supplements.editTitle": "Editando {name}",
  "supplements.edit": "Editar {name}",
  "supplements.remove": "Quitar {name}",
  "supplements.name": "Nombre",
  "supplements.namePlaceholder": "Omega 3, magnesio, creatina…",
  "supplements.nameRequired": "Ponle un nombre",
  "supplements.amount": "Cuánto",
  "supplements.amountRequired": "Necesita un número mayor a cero",
  "supplements.servingsPerDay": "Tomas al día",
  "supplements.servingsHint":
    "Cuántas veces al día tomas esta dosis. Dos pastillas juntas es una toma; tres cápsulas repartidas en el día son tres — cada una tiene su propia casilla.",
  "supplements.servingsRequired": "Necesita un número entero de uno o más",
  "supplements.unit": "Unidad",
  "supplements.unit.pill.one": "pastilla",
  "supplements.unit.pill.other": "pastillas",
  "supplements.unit.scoop.one": "medida",
  "supplements.unit.scoop.other": "medidas",
  "supplements.unit.g.one": "g",
  "supplements.unit.g.other": "g",
  "supplements.unit.mg.one": "mg",
  "supplements.unit.mg.other": "mg",
  "supplements.unit.ml.one": "ml",
  "supplements.unit.ml.other": "ml",
  "supplements.dose": "{amount} {unit}",
  "supplements.timing": "Cuándo",
  "supplements.timingPlaceholder": "Con el desayuno, antes de entrenar…",
  "supplements.timingHint": "Opcional, y solo es una nota para ti.",
  "supplements.save": "Guardar",
  "supplements.create": "Agregarlo",
  "supplements.saving": "Guardando…",
  "supplements.saved": "Se guardó {name}",
  "supplements.saveError": "No se pudo guardar",
  "supplements.servingOf": "Toma {number} de {total}",
  "supplements.taken": "{name} tomado",
  "supplements.unticked": "Se desmarcó {name}",
  "supplements.archived": "Se archivó {name}",
  "supplements.archivedTag": "Archivado",
  "supplements.deleted": "Se eliminó {name}",
  "supplements.orphaned.one":
    "{count} marca es de un suplemento que ya no está en la lista.",
  "supplements.orphaned.other":
    "{count} marcas son de suplementos que ya no están en la lista.",
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
  "data.importShare": "Agregar algo compartido",
  "data.restoreFile": "Restaurar un respaldo",
  "data.localOnly":
    "El archivo se guarda en este dispositivo y se lee de aqu\u00ed. No se sube a ning\u00fan lado.",
  "data.exported": "Respaldo descargado",
  "data.notJson": "Ese archivo no es JSON",
  "data.notOurs": "Eso no parece un archivo de natty",
  "data.wrongVersion": "Ese archivo es versi\u00f3n {version}, y esta build no la lee",
  "data.invalid": "Ese archivo no pas\u00f3 la validaci\u00f3n \u2014 {detail}",
  "data.empty": "No trae nada",
  "data.countNow": "Ahora",
  "data.countAfter": "Después",
  "data.restoreEmpty":
    "Este archivo no trae nada. Restaurarlo te dejaría sin nada.",
  "data.notABackup":
    "Eso es algo compartido, no un respaldo completo. Usa “Agregar algo compartido” para sumarlo a tus datos.",
  "data.notAShare":
    "Eso es un respaldo completo, no algo compartido. Usa “Restaurar un respaldo” si de verdad quieres reemplazar todo.",
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
  "measure.tab": "Medidas",
  "measure.title": "Toma tus medidas",
  "measure.body":
    "La báscula dice hacia dónde vas. La cinta dice a dónde llegó — dos personas con el mismo peso pueden tener brazos completamente distintos.",
  "measure.unit": "Medido en",
  "measure.addSite": "Medir algo más",
  "measure.bothSides": "Ambos lados",
  "measure.removeSite": "Dejar de medir {site}",
  "measure.noneTracked":
    "No hay nada en el formulario. Agrega lo que midas — brazos, cintura y piernas son las tres de siempre.",
  "measure.save": "Guardar",
  "measure.saved.one": "{count} medida guardada",
  "measure.saved.other": "{count} medidas guardadas",
  "measure.delete": "Eliminar",
  "measure.deleted": "Medida eliminada",
  "measure.change": "{delta} {unit} desde que empezaste",
  "measure.trend": "Con el tiempo",
  "measure.history": "Todas las lecturas",
  "measure.siteSide": "{site} ({side})",
  "measure.empty.title": "Todavía no hay medidas",
  "measure.empty.body":
    "Llena arriba lo que hayas medido. Una lectura es un punto de partida; la tendencia aparece desde la segunda.",
  "measure.chart.axis": "Contorno ({unit})",
  "measure.chart.aria": "{site} con el tiempo, en {unit}",
  "measure.chart.latest": "Ahora {value} {unit}",
  "measure.chart.latestSide": "{side}, ahora {value} {unit}",
  "measure.chart.notEnough.title": "Aún no hay suficiente para graficar",
  "measure.chart.notEnough.body":
    "Una zona necesita dos lecturas para que haya una línea entre ellas.",

  "measure.side.left": "Izquierdo",
  "measure.side.right": "Derecho",
  "measure.site.neck": "Cuello",
  "measure.site.shoulders": "Hombros",
  "measure.site.chest": "Pecho",
  "measure.site.upperArm": "Brazo",
  "measure.site.forearm": "Antebrazo",
  "measure.site.waist": "Cintura",
  "measure.site.hips": "Cadera",
  "measure.site.thigh": "Muslo",
  "measure.site.calf": "Pantorrilla",

  "data.kind.sets": "Sets registrados",
  "data.kind.cardio": "Sesiones de cardio",
  "data.kind.completions": "Entrenamientos completados",
  "data.kind.bodyEntries": "Pesajes",
  "data.kind.measurements": "Medidas",
  "data.kind.exercises": "Tus ejercicios",
  "data.kind.routines": "Tus rutinas",
  "data.kind.foods": "Tus alimentos",
  "data.kind.recipes": "Tus recetas",
  "data.kind.diets": "Tus planes de dieta",
  "data.kind.intake": "Comidas registradas",
  "data.kind.supplements": "Suplementos",
  "data.kind.extras": "Trabajo extra",
  "data.kind.profile": "Tu perfil",
  "data.share": "Compartir",
  "data.shareMissing": "No se encontró eso para compartir",
  "data.shareError": "No se pudo crear el archivo",
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
  "history.streakRule":
    "Una racha cuenta días de entrenamiento y aguanta hasta dos días de descanso seguidos. Tres días sin entrenar la rompen.",
  "history.days.one": "{count} d\u00eda",
  "history.days.other": "{count} d\u00edas",
  "history.setsOnDay.one": "{count} set",
  "history.setsOnDay.other": "{count} sets",
  "history.exercises.one": "{count} ejercicio",
  "history.exercises.other": "{count} ejercicios",
  "history.daySummary": "{sets} en {exercises}",
  "history.noSets": "nada registrado",
  "history.completedNoSets": "entrenamiento completado, nada registrado",
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
  "detail.plateaued": "Estancado",
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
  "log.try": "Prueba",
  "log.countLogged": "{count} registrados",

  // ── Body ─────────────────────────────────────────────────────────────────
  "body.latest.title": "Lo más reciente",
  "body.latest.needHeight": "Agrega tu estatura para ver el FFMI.",
  "body.latest.needHeightLink": "Ponla en tu perfil",
  "body.latest.needBodyFat":
    "Agrega un porcentaje de grasa a un pesaje para ver el FFMI.",
  "body.latest.body":
    "Índice de masa libre de grasa — masa magra sobre estatura al cuadrado.",
  "body.latest.carried": "Trasladado",
  "body.latest.carriedBodyFat": "Grasa corporal trasladada de tu registro del {date}.",
  "body.stat.leanMass": "Masa magra",
  "body.stat.ffmi": "FFMI",
  "body.stat.normalized": "Normalizado",
  "body.stat.bodyFat": "Grasa corporal",
  "body.stat.visceralFat": "Grasa visceral",
  "body.logEntry.title": "Registrar un pesaje",
  "body.logEntry.notToday": "Todavía no registras nada hoy.",
  "body.logEntry.body":
    "La grasa corporal es opcional — el peso solo ya vale la pena registrarlo.",
  "body.logEntry.action": "Registrar pesaje",
  "body.logEntry.weightError": "Pon tu peso",
  "body.logEntry.bodyFatError":
    "Pon un porcentaje entre 0 y 100, o déjalo vacío",
  "body.logEntry.visceralFatError":
    "Pon un valor entre 1 y 59, o déjalo vacío",
  "body.logEntry.saving": "Guardando...",
  "body.logEntry.saved": "Registrado {weight}",
  "body.logEntry.savedBodyFat": "{percent}% de grasa corporal",
  "body.logEntry.saveError": "No se pudo guardar ese pesaje",
  "body.trend.title": "Tendencia",
  "body.trend.body":
    "Peso, grasa corporal y grasa visceral en sus propias escalas — una gráfica para cada uno, porque un eje compartido solo invitaría a leer el cruce como si significara algo.",
  "body.history.title": "Historial",
  "body.history.body": "Del más reciente al más antiguo.",
  "body.history.needSex":
    "Define tu sexo en tu perfil para ver dónde cae la cifra normalizada frente a las normas poblacionales.",
  "body.history.empty": "Todavía no hay pesajes registrados.",
  "body.history.editEntry": "Editar {weight}",
  "body.history.editTitle": "Corregir este pesaje",
  "body.history.deleteEntry": "Eliminar {weight}",
  "body.history.deleted": "Eliminado",
  "body.history.saved": "Pesaje actualizado",
  "body.chart.notEnough.title": "Todavía no hay pesajes suficientes",
  "body.chart.notEnough.body": "Registra un segundo y aquí aparece la tendencia.",
  "body.chart.weightAria":
    "Peso corporal en {unit} a lo largo del tiempo, con el promedio semanal",
  "body.chart.bodyFatAria": "Porcentaje de grasa corporal a lo largo del tiempo",
  "body.chart.bodyFatNeedsTwo":
    "La grasa corporal es opcional, así que esto necesita dos pesajes que la traigan.",
  "body.chart.visceralFatAria": "Grasa visceral a lo largo del tiempo",
  "body.chart.visceralFatNeedsTwo":
    "La grasa visceral es opcional, así que esto necesita dos pesajes que la traigan.",
  "body.chart.axisWeight": "Peso ({unit})",
  "body.chart.axisBodyFat": "Grasa corporal (%)",
  "body.chart.axisVisceralFat": "Grasa visceral",
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
  "routines.setActive": "Hacer este mi programa",
  "routines.activeProgram": "Tu programa activo",
  "routines.active": "Activo",
  "routines.activate.default": "Desde el principio",
  "routines.activate.defaultBody":
    "Empieza en el día 1. Desde aquí, Hoy sigue dónde vas según lo que registres.",
  "routines.activate.custom": "Desde un día específico",
  "routines.activate.customBody":
    "¿Vas a mitad de ciclo? Elige cuál día es hoy.",
  "routines.activate.day": "Día",
  "routines.activate.confirm": "Activar",
  "routines.weekDayLabel": "Semana {week} · {day}",
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
  "routines.warmupSetOf": "calentamiento {number} de {total}",
  "routines.superset": "Biserie",
  "routines.circuitOf": "Circuito de {count}",
  "routines.finisherNoPose": "Sin pose elegida",
  "routines.transitionSeconds": "{seconds}s de transición",
  "player.supersetRound": "Biserie · ronda {round} de {total}",
  "player.circuitRound": "Circuito · ronda {round} de {total}",
  "routines.warmupSet": "Calentamiento",
  "routines.warmupSets.one": "Set de calentamiento",
  "routines.warmupSets.other": "Sets de calentamiento",

  // ── Routine coverage ─────────────────────────────────────────────────────
  "coverage.title": "Cobertura",
  "coverage.missingCount.one": "{count} patrón faltante",
  "coverage.missingCount.other": "{count} patrones faltantes",
  "coverage.indirectCount.one": "· {count} ejercicio indirecto",
  "coverage.indirectCount.other": "· {count} ejercicios indirectos",
  "coverage.clear": "Cobertura completa",
  "coverage.clearBody":
    "Todo músculo que el catálogo puede trabajar directo tiene un set aquí, con todos sus patrones disponibles en juego.",
  "coverage.neverDirectNote":
    "Ningún ejercicio del catálogo trabaja estos directo:",

  // ── The player ───────────────────────────────────────────────────────────
  "player.stepOf": "Paso {current} de {total} · faltan {left}",
  "player.exerciseOf": "Ejercicio {current} de {total}",
  "player.swap": "Cambiar",
  "player.swapTitle": "Estoy haciendo",
  "player.swappedFrom": "en vez de {name}",
  "player.poseSwapTitle": "Haciendo en vez de",
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
  "player.logLastSet": "¿Se te olvidó registrar esa serie?",
  "player.endWorkout": "Terminar",
  "player.endConfirm.title": "¿Terminar este entrenamiento?",
  "player.endConfirm.body":
    "Vas en el paso {current} de {total}. Todos los sets que registraste se quedan — solo pierdes tu lugar en el día.",
  "player.endConfirm.cancel": "Seguir",
  "player.ended": "Entrenamiento terminado",
  "player.endedBody": "{day} — lo que registraste se queda.",
  "player.complete": "Entrenamiento completado",
  "player.nothingLogged": "No registraste nada",
  "player.nothingLoggedBody":
    "No registraste ninguna serie ni cardio en esta sesión, así que no contará en tu historial — abre el control de registro en una serie la próxima vez para guardarla.",
  "player.stale.title": "No queda nada en este entrenamiento",
  "player.stale.body": "{day} — esta sesión va más adelante de donde llega el día.",
  "player.stale.action": "Borrarla",
  "player.plan": "El plan",
  "player.load.heavier": "Sube el peso",
  "player.load.same": "Mismo peso",
  "player.load.lighter": "Baja el peso",
  "player.loadStated": "El programa lo pide.",
  "player.loadInferred":
    "Deducido de las reps que bajan respecto a la serie anterior.",
  "player.afterThis": "Después de esto:",
  "player.nextExercise": "Siguiente ejercicio",
  "player.getSet": "Prepárate",
  "player.startSequence": "Empezar la serie",
  "player.partOf": "Parte {current} de {total}",
  "player.partCount": "{count} partes · {clock}",
  "player.pacedSeconds": "≈{count}s",
  "player.sequenceIntro": "Una serie, se corre sola — {clock}",
  "player.sequenceDone": "Serie completa.",
  "player.lastPart": "Última parte",
  "player.paused": "En pausa",
  "player.pause": "Pausar",
  "player.resume": "Reanudar",
  "player.nextPart": "Siguiente parte",
  "player.cuesOn": "Sonido y vibración activados",
  "player.cuesOff": "Sonido y vibración desactivados",
  "player.techniqueOne": "Cómo hacer esta serie",
  "player.techniqueOrder": "Hazlo en este orden",
  "player.logEachDrop": "Registra cada bajada de peso por separado.",
  "modifier.ladderName": "Escalera",
  "technique.forcedReps":
    "al fallo, alguien te ayuda a sacar dos o tres más.",
  "technique.negatives":
    "pelea la bajada — de tres a cuatro segundos, en cada rep.",
  "technique.partials":
    "cuando ya no salgan reps completas, sigue en el rango que te quede.",
  "technique.staticHolds":
    "sostén la posición contraída en vez de pasar por ella.",
  "technique.dropSet":
    "al fallo, quita como un cuarto del peso y entra de nuevo — sin descanso.",
  "technique.restPause":
    "al fallo, deja el peso, respira unos quince segundos y saca más con el mismo peso.",
  "technique.ladder": "una rep es toda la escalera: {positions}.",

  // ── Extra work ───────────────────────────────────────────────────────────
  "extras.addButton": "Agregar trabajo extra",
  "extras.title": "Agregar trabajo extra",
  "extras.description": "Se corre como un ejercicio real en {day} — con temporizador de descanso, récord y todo.",
  "extras.expiryHint": "Aparece la próxima vez que llegue este día, y se borra sola en cuanto lo termines.",
  "extras.action": "Agregar",
  "extras.saving": "Agregando...",
  "extras.saved": "Se agregó {name} a {day}",
  "extras.saveError": "No se pudo agregar",
  "extras.marker": "Trabajo extra",
  "extras.eyebrow": "Trabajo extra",
  "extras.addedOn": "Agregado el {date} · aparece una vez",
  "extras.remove": "Quitar {name}",
  "extras.removed": "Se quitó {name}",
  "extras.undo": "Deshacer",
  "extras.restDayBody": "Nada programado — pero registraste trabajo extra para hoy.",

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
    "La estatura, muñeca y tobillo vienen de tu perfil — muñeca y tobillo en su punto más angosto. La grasa corporal parte de tu último pesaje y puedes moverla para ver qué cambia.",
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
  "calc.potential.editFrame": "Editar en tu perfil",
  "calc.potential.setFrame": "Ponlos en tu perfil",
  "calc.potential.needFrame": "La estatura, muñeca y tobillo viven en tu perfil.",
  "calc.potential.leanMax": "Masa magra máxima",
  "calc.potential.realistic": "{value} kg realista",
  "calc.potential.needWeighIn":
    "Registra un pesaje con porcentaje de grasa para ver dónde estás frente a esto.",
  "calc.potential.standing":
    "Vas en {lean} kg de masa magra — {percent}% del máximo, {realistic}% de la cifra realista.",
  "calc.potential.exampleBodyFat": "ej. 12",
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
  "nutrition.setActive": "Hacer este mi plan",
  "nutrition.activePlan": "Tu plan activo",
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
  "nutrition.creatine": "Creatina",
  "nutrition.creatineSimple":
    "Con {grams} g al día le alcanza a casi cualquiera — lo demás sólo vale la pena si estás lejos del promedio.",
  "nutrition.creatineDaily": "Tu dosis diaria",
  "nutrition.creatineLoading": "Carga (opcional)",
  "nutrition.creatineLoadingNote":
    "{perDose} g × {doses} al día por {days} días, y luego bajas a la dosis diaria. Saltártela sólo significa saturar unas semanas después.",
  "nutrition.creatineFromLean":
    "Calculado con {mass} kg de masa libre de grasa — la creatina se almacena en el músculo, así que es la parte que vale la pena usar.",
  "nutrition.creatineFromWeight":
    "Calculado con {mass} kg de peso corporal. Registra tu porcentaje de grasa y usará tu masa libre de grasa, que es la que realmente la almacena.",
  "nutrition.creatineNoWeight": "Todavía no hay pesaje",
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
  "nutrition.gramsOf": "{macro} en gramos",
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

  // ── Privacidad y términos ────────────────────────────────────────────────
  "legal.updated": "Última actualización: {date}",

  "privacy.title": "Privacidad",
  "privacy.subtitle": "Qué sabe esta app de ti, a dónde va y cómo recuperarlo.",
  "privacy.summary.title": "La versión corta",
  "privacy.summary.p1":
    "Sin cuenta, nada de lo que registras sale de tu dispositivo. Con cuenta, tus datos de entrenamiento se guardan para que te sigan a tus otros dispositivos — y esa es la única razón por la que se guardan.",
  "privacy.summary.p2":
    "Nada se vende, se renta ni se comparte con nadie. No hay publicidad, y no se le entregan tus datos a ningún tercero para perfilarte.",

  "privacy.local.title": "Sin cuenta",
  "privacy.local.p1":
    "Todo — tus sets, pesajes, medidas, comidas y lo que escribas — vive en el almacenamiento del navegador, en el dispositivo que estés usando. Nunca se manda a ningún lado.",
  "privacy.local.p2":
    "Eso también significa que borrar los datos del navegador lo elimina, y que no te sigue al celular. En Progreso → Datos puedes exportarlo todo a un archivo que se queda contigo.",

  "privacy.account.title": "Con cuenta",
  "privacy.account.p1":
    "Iniciar sesión guarda tu correo electrónico. Si entras con Google, la app también recibe el nombre y la foto de perfil de tu cuenta de Google — nada más, y nunca tu contraseña.",
  "privacy.account.p2":
    "Tu cuenta guarda entonces lo que decidas sincronizar: el nombre visible y el usuario que elijas, tu perfil (estatura, sexo y las medidas de muñeca y tobillo que usan las calculadoras), y lo que registras — sets, pesajes, medidas y comidas — junto con los ejercicios, rutinas, alimentos, recetas y planes que escribas tú.",
  "privacy.account.p3":
    "Nada se sube solo. Los datos que ya tiene este dispositivo pasan a tu cuenta únicamente cuando presionas el botón de subir en la página de cuenta, y al cerrar sesión la copia de este dispositivo se queda tal cual estaba.",

  "privacy.where.title": "Dónde se guarda",
  "privacy.where.p1":
    "Los datos de la cuenta viven en una base de datos Postgres operada por Supabase, en la región donde se creó el proyecto. La app la sirve Vercel. Ambos son procesadores aquí: guardan los datos para que la app funcione, no para fines propios.",
  "privacy.where.p2":
    "Cada lectura y cada escritura se limitan a la cuenta que las pidió, verificado en el servidor contra una sesión revalidada y no contra lo que diga el navegador.",

  "privacy.analytics.title": "Analítica",
  "privacy.analytics.p1":
    "Las visitas se cuentan con Vercel Web Analytics y Speed Insights, que no usan cookies ni construyen un perfil entre sitios.",
  "privacy.analytics.p2":
    "Las páginas se reportan por su patrón de ruta y nunca por su dirección real — un programa que escribiste se cuenta como una página de programa, nunca por su nombre. Es a propósito: los nombres que tú escribiste son lo único que de otro modo saldría del dispositivo, así que la app los quita antes de mandar nada.",

  "privacy.cookies.title": "Cookies",
  "privacy.cookies.p1":
    "Una sola: la que mantiene tu sesión iniciada. No hay cookies de publicidad ni de rastreo, y cerrar sesión la borra.",

  "privacy.control.title": "Tus datos, y cómo sacarlos",
  "privacy.control.p1":
    "En Progreso → Datos puedes exportar todo a un solo archivo cuando quieras, con o sin sesión. Es JSON simple, legible sin esta app, e importarlo en cualquier lado te deja exactamente donde estabas.",
  "privacy.control.p2":
    "Cada registro se puede editar o borrar donde aparece, y borrar es inmediato, no una solicitud que se tramita.",
  "privacy.control.p3":
    "Eliminar tu cuenta es un botón en la página de cuenta, y borra todo lo que guarda el servidor — tu registro, tus medidas, tus comidas, lo que escribiste y tu usuario. Cerrar sesión por sí solo no borra nada; solo deja de sincronizar.",

  "privacy.contact.title": "Contacto",
  "privacy.contact.p1":
    "Esta app la hace una sola persona. Dudas sobre cualquiera de estos puntos, o una solicitud de eliminación, van a anthonysteiner96@gmail.com.",

  "terms.title": "Términos",
  "terms.subtitle": "Qué es esta app y qué no es.",
  "terms.what.title": "Qué es esto",
  "terms.what.p1":
    "Un registro de entrenamiento: un lugar para anotar qué levantaste, cuánto pesaste y qué comiste, y ver la suma. Es un proyecto personal, se ofrece tal cual y es de uso gratuito.",

  "terms.health.title": "Esto no es consejo médico",
  "terms.health.p1":
    "Nada de lo que hay aquí es consejo médico, nutricional ni clínico, y nada de esto es un diagnóstico. La app es una calculadora y una libreta: aplica fórmulas publicadas a números que tú escribiste, y nunca te ha examinado.",
  "terms.health.p2":
    "Las metas de calorías y macros, las cifras de hidratación, la dosis de creatina, el FFMI, las estimaciones de una repetición máxima y el modelo de potencial natural son todas fórmulas de población general. Pueden estar equivocadas para ti en particular, y no toman en cuenta ninguna condición, medicamento o lesión que tengas.",
  "terms.health.p3":
    "Consulta a un médico o a un nutriólogo antes de cambiar cómo comes o entrenas, sobre todo si estás embarazada, tienes alguna condición médica o tomas algo. Si algo duele, párale.",

  "terms.estimates.title": "Los números son estimaciones",
  "terms.estimates.p1":
    "Donde las fórmulas no coinciden, la app te lo enseña en vez de esconderlo detrás de una sola cifra segura de sí misma — cinco estimaciones de una repetición máxima en vez de una, un rango en vez de una calificación.",
  "terms.estimates.p2":
    "Todo lo que se deriva de lo que registraste vale lo que valga lo que registraste. La app no puede distinguir un peso mal escrito de uno real.",

  "terms.account.title": "Tu cuenta",
  "terms.account.p1":
    "Una cuenta es para una persona. Guárdate el acceso: quien pueda abrir tu correo o tu cuenta de Google puede llegar a tus datos.",
  "terms.account.p2":
    "Los usuarios se asignan por orden de llegada, y elegir uno que suplante a alguien más no está permitido.",

  "terms.content.title": "Lo que escribes sigue siendo tuyo",
  "terms.content.p1":
    "Los ejercicios, rutinas, alimentos, recetas y planes que escribas son tuyos. No se reclama ninguna propiedad sobre ellos, y no se usan para nada más que hacer funcionar la app para ti.",
  "terms.content.p2":
    "Compartir uno genera un archivo que entregas tú. Nada se publica, y no hay ningún lugar en esta app donde alguien más pueda ver tus datos.",

  "terms.availability.title": "Disponibilidad",
  "terms.availability.p1":
    "Esto es un proyecto personal, no un servicio con garantía de disponibilidad. Puede cambiar, fallar o dejar de existir, y no se promete nada al respecto.",
  "terms.availability.p2":
    "Que es la verdadera razón de que exista la exportación: guarda una copia de lo que extrañarías. Hasta donde la ley lo permita, usas la app bajo tu propio riesgo y no se acepta responsabilidad por ninguna pérdida derivada de ello.",

  "terms.changes.title": "Cambios",
  "terms.changes.p1":
    "Estos términos y el aviso de privacidad pueden cambiar conforme cambie la app. La fecha de arriba es la última vez que lo hicieron.",

  // ── Tonelaje ─────────────────────────────────────────────────────────────
  "tonnage.title": "Total levantado",
  "tonnage.body": "Cada kilo que de verdad has movido.",
  "tonnage.scopeLabel": "Periodo",
  "tonnage.scope.week": "Esta semana",
  "tonnage.scope.month": "Este mes",
  "tonnage.scope.year": "Este año",
  "tonnage.scope.all": "Desde siempre",
  "tonnage.kg": "{value} kg",
  "tonnage.tonnes": "{value} t",
  "tonnage.context": "en {sets} sets y {reps} repeticiones",
  "tonnage.comparisonsToggle": "A cuánto equivale",
  "tonnage.muscle": "Músculo",
  "tonnage.direct": "Directo",
  "tonnage.indirect": "Indirecto",
  "tonnage.doesNotSum":
    "Un set de sentadillas es trabajo para tus cuádriceps y para tus glúteos, así que esto cuenta lo que le llegó a cada músculo en vez de repartir el total entre ellos — suman más que la cifra de arriba, a propósito.",
  "tonnage.unweighted.one":
    "{count} set no llevaba peso, así que aquí no cuenta",
  "tonnage.unweighted.other":
    "{count} sets no llevaban peso, así que aquí no cuentan",
  "tonnage.like.piano.one": "Como {count} piano de cola",
  "tonnage.like.piano.other": "Como {count} pianos de cola",
  "tonnage.like.horse.one": "Como {count} caballo",
  "tonnage.like.horse.other": "Como {count} caballos",
  "tonnage.like.car.one": "Como {count} coche",
  "tonnage.like.car.other": "Como {count} coches",
  "tonnage.like.elephant.one": "Como {count} elefante",
  "tonnage.like.elephant.other": "Como {count} elefantes",
  "tonnage.like.bus.one": "Como {count} camión de dos pisos",
  "tonnage.like.bus.other": "Como {count} camiones de dos pisos",
  "tonnage.like.whale.one": "Como {count} ballena azul",
  "tonnage.like.whale.other": "Como {count} ballenas azules",
  "tonnage.like.eiffel.one": "Como {count} Torre Eiffel",
  "tonnage.like.eiffel.other": "Como {count} Torres Eiffel",
};
