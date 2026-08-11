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
  "palette.groupWorkout": "Entrenamiento",
  "palette.groupTheme": "Tema",
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
  "modifier.ladder": "Escalera: {positions}",

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
    "Programas, semana por semana. Abre un día para empezar.",
  "index.dest.progress":
    "Récords por ejercicio, pesajes, FFMI y gráficas de tendencia.",
  "index.dest.nutrition": "El plan de dieta, comida por comida, y una calculadora de macros.",
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
  "volume.setsSuffix": "{total} sets en total",
  "volume.referenceBand": "{min}\u2013{max} sets, el rango habitual",
  "volume.split": "Empuje, jal\u00f3n y pierna",
  "volume.splitBody":
    "Las \u00faltimas {weeks} semanas: {push} de empuje, {pull} de jal\u00f3n, {legs} de pierna. El cardio se cuenta aparte \u2014 no es volumen de pesas.",
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

  "split.push": "Empuje",
  "split.pull": "Jal\u00f3n",
  "split.legs": "Pierna",
  "split.cardio": "Cardio",

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
  "nutrition.targetsBody":
    "{protein}g de proteína · {carbs}g de carbohidratos · {fat}g de grasa. El anillo muestra a cuánto suman de verdad las comidas de abajo.",
  "nutrition.targetsBodyPerKg":
    "{protein}g de proteína · {carbs}g de carbohidratos · {fat}g de grasa — {perKg}g de proteína por kg según tu último pesaje. El anillo muestra a cuánto suman de verdad las comidas de abajo.",
  "nutrition.hydrationBody":
    "Una coca sin azúcar cuenta para el total, pero no uno a uno — las alternativas están enlistadas, no calculadas.",
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
