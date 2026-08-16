/**
 * The app's own strings. English is the source: this object's keys are the type
 * every other locale is checked against, so a translation can't drift from it.
 *
 * Keys are dotted by area, and the leaf names what the string *is* rather than
 * what it says — `records.empty`, not `records.noRecordsLogged` — so rewording
 * the copy doesn't rename the key.
 *
 * `{placeholders}` are filled by `t(key, vars)`. Plurals come in `.one`/`.other`
 * pairs selected by `Intl.PluralRules`, never by `n === 1`.
 */
export const en = {
  // ── Navigation and chrome ────────────────────────────────────────────────
  "nav.home": "Home",
  "nav.routines": "Routines",
  "nav.progress": "Progress",
  "nav.nutrition": "Nutrition",
  "nav.calculators": "Calculators",
  "nav.plates": "Plate loader",
  "nav.searchHint": "Press {key} to search",
  "nav.language": "Language",
  "nav.darkMode": "Dark mode",
  "nav.account": "Account",
  "profile.title": "Profile",
  "profile.subtitle":
    "Standing facts about your body — used for FFMI and your natural-potential estimate. Works with no account.",
  "profile.cardTitle": "About you",
  "profile.cardBody":
    "Stored once and applied everywhere it's used, so correcting a typo here recalculates FFMI and the potential estimate together.",
  "profile.heightHint": "Needed for FFMI and the potential estimate.",
  "profile.sex": "Sex",
  "profile.sexHint": "Only picks the reference scale FFMI is read against.",
  "profile.sexUnset": "Not set",
  "profile.male": "Male",
  "profile.female": "Female",
  "profile.wristCm": "Wrist (cm)",
  "profile.wristHint": "Below the bone. Used by the natural-potential estimate.",
  "profile.ankleCm": "Ankle (cm)",
  "profile.ankleHint": "Above the bone. Used by the natural-potential estimate.",
  "profile.edit": "Edit",
  "profile.done": "Done",
  "profile.clear": "Clear",
  "profile.cleared": "Cleared your profile",

  "account.title": "Account",
  "account.subtitle": "Sign in to sync your data across devices.",
  "account.localNote": "Without an account, everything stays on this device.",
  "account.email": "Email",
  "account.password": "Password",
  "account.emailError": "Enter a valid email",
  "account.passwordError": "At least 6 characters",
  "account.signIn": "Sign in",
  "account.createAccount": "Create account",
  "account.signOut": "Sign out",
  "account.signedInAs": "Signed in as {email}",
  "account.signedOut": "Signed out",
  "account.checkEmail": "Check your inbox to confirm your account",
  "account.continueGoogle": "Continue with Google",
  "account.or": "or",
  "account.providerError": "Couldn't start sign-in",
  "account.handle": "Handle",
  "account.handleHelp":
    "Unique, and the only name anything public would ever show. Letters, numbers and underscores.",
  "account.handleSave": "Claim",
  "account.handleSaved": "Handle claimed",
  "account.handleTaken": "Someone already has that one",
  "account.handleProblem.too-short": "At least 3 characters",
  "account.handleProblem.too-long": "At most 20 characters",
  "account.handleProblem.shape":
    "Letters, numbers and underscores only, starting with a letter",
  "account.handleProblem.reserved": "That one's reserved",
  "account.username": "Display name",
  "account.usernamePlaceholder": "What should we call you?",
  "account.usernameHelp":
    "Private — only you see it, and it follows your account to your other devices.",
  "account.unavailable":
    "Accounts aren't set up in this build. Everything still works — your data stays on this device.",
  "account.signInError": "Couldn't sign in",
  "account.signUpError": "Couldn't create the account",
  "account.signOutError": "Couldn't sign out",
  "account.upload.title": "This device's data",
  "account.upload.body":
    "Copy anything on this device that isn't in your account yet. Safe to press twice — nothing is duplicated, and nothing is removed from this device.",
  "account.upload.action": "Upload to my account",
  "account.upload.uploading": "Uploading...",
  "account.upload.done.one": "{count} item uploaded",
  "account.upload.done.other": "{count} items uploaded",
  "account.upload.none": "Your account already has everything on this device",
  "account.upload.error": "Upload failed",
  "account.upload.checking": "Checking...",
  "account.upload.confirmTitle": "Upload this to your account?",
  "account.upload.confirmBody":
    "This is what this device has that your account doesn't. Nothing is removed from this device.",
  "account.upload.confirmAction": "Upload",
  "account.upload.otherAccount":
    "A different account uploaded from this device before, so some of this may not be yours. Check the numbers above before continuing.",

  "account.delete.title": "Delete your account",
  "account.delete.body":
    "Removes your account and everything in it, on every device. There is no undo.",
  "account.delete.exportFirst": "Download your data first",
  "account.delete.action": "Delete my account",
  "account.delete.confirmTitle": "Delete your account?",
  "account.delete.confirmBody":
    "Your training log, weigh-ins, measurements, meals and everything you wrote will be deleted from the server, along with your handle. This cannot be undone. Data still on this device is left alone and will show again the next time you open the app.",
  "account.delete.typeEmail": "Type {email} to confirm",
  "account.delete.confirmAction": "Delete everything",
  "account.delete.done": "Your account has been deleted",
  "account.delete.error": "Couldn't delete the account",

  "palette.placeholder": "Search pages and routines...",
  "palette.empty": "No results.",
  "palette.loading": "Loading routines...",
  "palette.groupPages": "Pages",
  "palette.groupRoutines": "Routines",
  "palette.groupPlans": "Diet plans",
  "palette.groupWorkout": "Workout",
  "palette.groupTheme": "Theme",
  "palette.groupCreate": "Create",
  "palette.resumeWorkout": "Resume workout",
  "palette.switchLight": "Switch to light mode",
  "palette.switchDark": "Switch to dark mode",
  "palette.toggleTheme": "Toggle dark mode theme",

  // ── Shared ───────────────────────────────────────────────────────────────
  "common.weight": "Weight",
  "common.reps": "Reps",
  "common.date": "Date",
  "common.exercise": "Exercise",
  "common.bodyweight": "Bodyweight",
  "common.optional": "Optional",
  "common.searchExercises": "Search exercises...",
  "common.noExerciseFound": "No exercise found.",
  "common.weightUnit": "Weight unit",
  "common.cardio": "Cardio",
  // Real-world reference distances for the cardio tab's "you've gone the
  // distance from..." line — approximate, flavor text rather than a survey
  // measurement. Ascending order matches `ROUTES` in `features/log/cardio.ts`.
  "cardio.route.5k": "a 5K",
  "cardio.route.10k": "a 10K",
  "cardio.route.halfMarathon": "a half marathon",
  "cardio.route.marathon": "a marathon",
  "cardio.route.londonBrighton": "London to Brighton",
  "cardio.route.laSanDiego": "Los Angeles to San Diego",
  "cardio.route.madridValencia": "Madrid to Valencia",
  "cardio.route.sfLa": "San Francisco to Los Angeles",
  "cardio.route.parisBerlin": "Paris to Berlin",
  "cardio.route.ukLength": "the length of Great Britain",
  "cardio.route.nyLa": "New York to Los Angeles",
  "cardio.route.madridMexicoCity": "Madrid to Mexico City",
  "cardio.route.earthCircumference": "once around the Earth",
  "cardio.log.action": "Log distance",
  "cardio.log.thisSession": "Log this session",
  "cardio.log.saving": "Saving session...",
  "cardio.log.saved": "Logged {entry}",
  "cardio.log.saveError": "Couldn't save that session",
  "cardio.log.durationMinutes": "Duration (min)",
  "cardio.distanceError": "Enter how far you went",
  "cardio.durationError": "Enter minutes, or leave blank",
  "common.distance": "Distance",
  "common.distanceUnit": "Distance unit",
  "cardio.history.noEntries": "nothing logged",
  "cardio.history.editEntry": "Edit {entry}",
  "cardio.history.editTitle": "Correct this session",
  "cardio.history.saved": "Session updated",
  "cardio.history.deleteEntry": "Delete {entry}",
  "cardio.history.deleted": "Deleted {entry}",
  "cardio.tab": "Cardio",
  "cardio.empty.title": "No cardio logged yet",
  "cardio.empty.body": "Log a distance from a cardio block in a session and it shows up here.",
  "cardio.total.title": "Total distance",
  "cardio.total.value": "{km} km",
  "cardio.total.thisWeek": "{km} km this week",
  "cardio.milestone.passed": "That's {route} — and {remainder} km further.",
  "cardio.milestone.toward": "That's {remaining} km short of {route}.",
  "cardio.sessions.title": "Sessions",
  "common.finisher": "Finisher",
  "common.bodyFatPercent": "Body fat (%)",
  "common.heightCm": "Height (cm)",
  "common.none": "—",

  // ── Formatting a prescription ────────────────────────────────────────────
  // Small fragments assembled by `features/routines/lib/format.ts`. They read
  // oddly on their own because they're parts of a line, not sentences.
  "format.or": "or",
  "format.hold": "{seconds}s hold",
  "format.rest": "{seconds}s rest",
  "format.perSide": "/side",
  "format.seconds": "{count}s",
  "format.secondsRange": "{value}s",
  "format.minutes": "{count} min",
  "format.repsRange": "{range} reps",
  "format.setCount.one": "{count} set",
  "format.setCount.other": "{count} sets",
  "format.repsPerSide": "{range} reps per side",
  "format.repsOnly": "{range} reps",

  "modifier.forcedReps": "Forced reps",
  "modifier.negatives": "Negatives",
  "modifier.partials": "Partials",
  "modifier.staticHolds": "Static holds",
  "modifier.dropSet": "Drop set",
  "modifier.restPause": "Rest-pause",
  "modifier.ladder": "Ladder: {positions}",

  // ── Segmented sets ───────────────────────────────────────────────────────
  "segment.hold": "{seconds}s hold",
  "segment.pulses": "{count} pulses",
  "segment.repsPulsed": "{count} reps, pulse each",
  "segment.label": "Part {index} of {total}",
  "segment.next": "next: {what}",
  "segment.sequence": "This set: {sequence}",

  // ── Index ────────────────────────────────────────────────────────────────
  "index.title": "!natty",
  "index.subtitle":
    "Pick a program, open a day, and hit start — the app walks you through every set and times your rest.",
  "index.stats.setsLogged": "Sets logged",
  "index.stats.exercisesTrained": "Exercises trained",
  "index.stats.recordsHeld": "Records held",
  "index.stats.latestWeighIn": "Latest weigh-in",
  "index.stats.weekAverage": "Week avg {weight}",
  "index.stats.weekAverageDelta": "Week avg {weight} · {delta} vs last",
  "index.start.title": "Nothing in progress",
  "index.start.body":
    "Pick a program and this card will tell you what to train today.",
  "index.start.action": "Browse programs",
  "index.today.title": "Today",
  "index.today.restBody": "Rest day.",
  "index.today.upNext": "Next: {day}",
  // The deload banner — see `plateau.ts` for the detection rule.
  "deload.title": "Consider a deload week",
  "deload.body":
    "No new record on {exercises} in 3 sessions in a row. A lighter week often gets a stalled lift moving again.",
  "deload.acknowledge": "Got it, deloading this week",
  "index.resume.title": "Workout in progress",
  "index.resume.upNext": "Up next: {exercise}",
  "index.resume.allDone": "All sets done.",
  "index.resume.action": "Resume",
  "index.resume.discard": "Discard",
  "index.resume.discarded": "Workout discarded",
  // ── The home cards ───────────────────────────────────────────────────────
  "home.training": "Training",
  "home.training.empty":
    "No sets logged yet. Open a program and start a day — the app walks you through it.",
  "home.streakDays.one": "{count} day streak",
  "home.streakDays.other": "{count} day streak",
  "home.setsThisWeek.one": "{count} set this week",
  "home.setsThisWeek.other": "{count} sets this week",
  "home.recordsHeld.one": "{count} record",
  "home.recordsHeld.other": "{count} records",

  "home.body": "Body",
  "home.body.empty": "No weigh-ins yet. One takes a second and the rest follows.",
  "home.weekAverage": "Week avg {weight} · {delta} vs last",
  "home.bodyFat": "{percent}% body fat",
  "home.notLoggedToday": "Not logged today",
  "home.noBodyFat": "No body fat reading",
  "home.ffmi": "FFMI {value}",
  "home.needHeight": "Set your height for FFMI",

  "home.measurements": "Measurements",
  "home.measurements.empty":
    "Nothing measured yet. Arms and waist say what the scale can't.",
  "home.sinceStart": "{delta} {unit} since you started",
  "home.siteValue": "{site} {value}",

  "home.food": "Today's food",
  "home.food.empty": "Nothing logged today.",
  "home.food.emptyMeals.one": "{count} meal to tick off today.",
  "home.food.emptyMeals.other": "{count} meals to tick off today.",
  "home.kcalOfTarget": "{eaten} / {target} kcal",
  "home.mealsTicked": "{ticked} of {total} meals ticked",
  "home.macrosSoFar": "P{protein} · C{carbs} · F{fat}",

  "index.dest.routines":
    "Programs week by week, or write your own. Open a day to start the player.",
  "index.dest.progress":
    "Records, volume per muscle, a year of training days, your measurements, and your own exercises.",
  "index.dest.nutrition":
    "What you ate and how it trended, diet plans meal by meal, your own foods and recipes, and a macro calculator.",
  "index.dest.calculators": "One-rep max, RPE and RIR, and natural potential.",
  "index.dest.plates": "What to hang on each end, from the plates your gym has.",

  // ── Volume ───────────────────────────────────────────────────────────────
  "volume.tab": "Volume",
  "volume.thisWeek": "This week",
  "volume.partial": "still running",
  "volume.thisWeekBody": "Week of {week} · {sets} working sets so far.",
  "volume.noSetsThisWeek": "Nothing logged this week yet.",
  "volume.direct": "Direct",
  "volume.indirect": "Indirect",
  "volume.setsSuffix.one": "{count} set in total",
  "volume.setsSuffix.other": "{count} sets in total",
  "volume.referenceBand": "{min}\u2013{max} sets, the usual range",
  "volume.split": "Push, pull, legs and core",
  "volume.splitBody":
    "The last {weeks} weeks: {push} push, {pull} pull, {legs} legs, {core} core. Cardio is counted elsewhere \u2014 it isn't resistance volume.",
  "volume.needTwoWeeks": "Two weeks of logging and the trend shows up here.",
  "volume.sets": "Sets",
  "volume.setsAxis": "Sets",
  "volume.splitAria": "Sets per week, split into push, pull and legs",
  "volume.gaps": "Going without direct work",
  "volume.gapsBody": "Muscles with no direct sets across the last {weeks} weeks.",
  "volume.gapsNote":
    "A direct set is one where the muscle is the point of the exercise; an indirect one is where it came along for the ride. The two are never added together \u2014 the usual half-a-set convention is a convention, not a measurement.",
  "volume.indirectCount": "\u00b7 {count} indirect",
  "volume.reason.indirect-only": "Only ever worked indirectly",
  "volume.reasonBody.indirect-only":
    "These take load on other lifts but never get a set of their own.",
  "volume.reason.never-direct": "No exercise here trains these directly",
  "volume.reasonBody.never-direct":
    "Nothing in the library lists these as the primary muscle, so no amount of logging will move them out of this list. Adding a direct exercise for them is a change to the exercise library, not to your training.",
  "volume.reason.not-trained": "Not trained in this window",
  "volume.reasonBody.not-trained":
    "The library can train these directly \u2014 you just haven't lately.",
  "volume.empty.title": "Nothing to measure yet",
  "volume.empty.body":
    "Log some sets and this breaks them down by muscle and by push, pull and legs.",

  // ── Movement patterns ────────────────────────────────────────────────────
  // Shown when you add your own exercise: the pattern is what puts it in push,
  // pull or legs, so it has to be a word you can pick, not an id.
  "pattern.horizontal-press": "Horizontal press",
  "pattern.incline-press": "Incline press",
  "pattern.overhead-press": "Overhead press",
  "pattern.chest-fly": "Chest fly",
  "pattern.vertical-pull": "Vertical pull",
  "pattern.horizontal-pull": "Horizontal pull (row)",
  "pattern.pullover": "Pullover",
  "pattern.lateral-raise": "Lateral raise",
  "pattern.front-raise": "Front raise",
  "pattern.rear-delt": "Rear delt",
  "pattern.shrug": "Shrug",
  "pattern.elbow-flexion": "Curl",
  "pattern.elbow-extension": "Triceps extension",
  "pattern.squat": "Squat",
  "pattern.hinge": "Hinge",
  "pattern.lunge": "Lunge",
  "pattern.knee-extension": "Knee extension",
  "pattern.knee-flexion": "Knee flexion",
  "pattern.hip-extension": "Hip extension",
  "pattern.hip-abduction": "Hip abduction",
  "pattern.hip-adduction": "Hip adduction",
  "pattern.calf-raise": "Calf raise",
  "pattern.spinal-extension": "Spinal extension",
  "pattern.cardio": "Cardio",

  // ── Your own exercises ─────────────────────────────────────
  "library.tab": "Library",
  "library.title": "Your own exercises",
  "library.body":
    "Anything the built-in list doesn't have. They log, count toward volume and set records exactly like the rest.",
  "library.add": "Add an exercise",
  "library.create": "Add it",
  "library.createNamed": "Add \"{name}\"",
  "library.edit": "Edit {name}",
  "library.name": "Name",
  "library.nameRequired": "Give it a name",
  "library.aliases": "Also known as",
  "library.aliasesHint": "Other spellings you might type, separated by commas.",
  "library.pattern": "Movement pattern",
  "library.patternHint": "What kind of movement it is. This decides push, pull or legs.",
  "library.primaryMuscles": "Worked directly",
  "library.primaryRequired": "Pick at least one muscle",
  "library.primaryHint": "The muscles this exercise is for.",
  "library.secondaryMuscles": "Worked indirectly",
  "library.secondaryHint": "Muscles that help but aren't the point. Optional.",
  "library.save": "Save",
  "library.saving": "Saving\u2026",
  "library.saved": "Saved {name}",
  "library.saveError": "Couldn't save that",
  "library.archive": "Archive",
  "library.archived": "Archived",
  "library.archiveHint":
    "Hidden from the pickers. Everything you already logged against it still reads correctly.",
  "library.archivedNotice": "{name} archived",
  "library.restore": "Restore",
  "library.restored": "{name} is back",
  "library.delete": "Delete",
  "library.deleted": "Deleted {name}",
  "library.deleteBlocked":
    "You've logged {count} against this. Archive it instead \u2014 deleting would leave those sets with no name.",
  "library.setsLogged.one": "{count} set",
  "library.setsLogged.other": "{count} sets",
  "library.custom": "Yours",
  "library.empty.title": "No exercises of your own yet",
  "library.empty.body":
    "Add one when a lift you do isn't in the built-in list \u2014 or straight from the exercise picker, by typing a name it doesn't know.",
  "library.showArchived": "Show archived",

  // ── Writing your own routine ─────────────────────────────────────────────
  "builder.new": "New routine",
  "builder.yours": "Yours",
  "builder.edit": "Edit",
  "builder.newTitle": "Write a routine",
  "builder.newBody":
    "A cycle of days that repeats. Seven of them is a week; add eight for push/pull/legs/rest twice over, or three for a rolling PPL \u2014 the cycle is however many days you write, not however many are in a week.",
  "builder.editTitle": "Editing {name}",
  "builder.name": "Name",
  "builder.nameRequired": "Give it a name",
  "builder.style": "Style",
  "builder.stylePlaceholder": "Push/pull/legs, upper/lower…",
  "builder.days": "Days",
  "builder.addDay": "Add a day",
  "builder.dayLabel": "What it's for",
  "builder.dayLabelPlaceholder": "Glutes, Chest, Pull\u2026",
  "builder.restDay": "Rest day",
  "builder.moveDayUp": "Move day {number} earlier",
  "builder.moveDayDown": "Move day {number} later",
  "builder.removeDay": "Remove day {number}",
  "builder.noDays": "No days yet. Add one to start.",
  "builder.exercises": "Exercises",
  "builder.linkSuperset": "Superset with the one above",
  "builder.unlink": "Break it up",
  "builder.transition": "Between (s)",
  "builder.addExercise": "Add an exercise",
  "builder.removeExercise": "Remove {name}",
  "builder.noExercises": "Nothing on this day yet.",
  "builder.pickExercise": "Pick an exercise",
  "builder.createNamed": "Add \"{name}\" as your own exercise",
  "builder.exerciseKind": "Kind",
  "builder.edited": "Edited",
  "builder.editingBuiltIn":
    "This one came with the app. Saving keeps your version and hides the original from the list — the original stays put, so you can put it back any time.",
  "builder.reset": "Reset to the original",
  "builder.resetTitle": "Put the original back?",
  "builder.resetBody":
    "Your changes to this program are dropped and the version that came with the app returns. Nothing you've logged is affected.",
  "builder.reset.done": "{name} is back to the original",
  "builder.alternatives": "Or one of these",
  "builder.alternativesHint":
    "Lifts you'd equally accept. The player offers them as a swap mid-set, and logs against whichever you actually did.",
  "builder.addAlternative": "Add a substitute...",
  "builder.removeAlternative": "Remove {name}",
  "builder.cardioHint":
    "Cardio is a duration, not reps. Add a second block for intervals — four rounds of three minutes is four sets, or two blocks at different lengths.",
  // No unit in the label — the picker beside the box carries it now.
  "builder.duration": "How long",
  "builder.durationUnit": "Minutes or seconds",
  "builder.minutes": "min",
  "builder.seconds": "sec",
  "builder.weekNumber": "Week {number}",
  "builder.addWeek": "Add a second week",
  "builder.duplicateWeek": "Add a week",
  "builder.weekFromCopy": "Start from a copy of",
  "builder.weekOpen": "(open)",
  "builder.weekFromEmpty": "Start from an empty week",
  "builder.weekFromEmptyHint": "For a program that changes its split partway.",
  "builder.removeWeek": "Remove week {number}",
  "builder.daysInWeek": "Days — week {week}",
  "builder.oneWeekHint":
    "One cycle, repeated for as long as you run the program. Add a week only if the numbers change between them.",
  "builder.weeksHint":
    "{count} weeks, run in order and then repeated. A new one starts as a copy of whichever week you pick, so you only change what moves.",
  "builder.restBetween": "Rest between (s)",
  "builder.intensity": "How hard",
  "builder.intensity.none": "Not stated",
  "builder.load": "Load",
  // Distinct from "same weight": unsaid lets the player read a ramp off a
  // falling rep target, which is how most programs write one.
  "builder.load.unsaid": "Don't say",
  "intensity.low": "Easy",
  "intensity.moderate": "Moderate",
  "intensity.high": "Hard",
  "builder.setStyle.timed": "Timed",
  "builder.sets": "Sets",
  "builder.reps": "Reps",
  "builder.repsTo": "to",
  "builder.rest": "Rest (s)",
  "builder.finisher.none": "Not a finisher",
  "builder.finisher.noneBody": "An ordinary exercise. Its sets are whatever you write.",
  "builder.finisher.pose": "Pose hold",
  "builder.finisher.poseBody":
    "7 sets of 15-20, 30s rest, ending on a 10-second pose. Pick the pose below.",
  "builder.finisher.ramp": "Hold and pulse",
  "builder.finisher.rampBody":
    "4 sets, each a 10s hold → 12 pulses → 12 reps with a pulse → 10s hold → 12 pulses. The reps fall 12/10/8/6 as the weight goes up.",
  "builder.finisher.overwrites": "This replaces the sets you've entered.",
  // Saving with no pose chosen is allowed on purpose — see draft.ts — but
  // nothing said so until this, and it's what let a finisher reach the gym
  // with no hold and no cue.
  "builder.finisher.poseUnset": "Pick a pose, or this finisher won't show one.",
  "builder.pose": "Pose",
  // "Not chosen" rather than "None": a finisher without a pose isn't a
  // finisher, so this reads as a gap to fill rather than a valid answer.
  "builder.pose.none": "Not chosen",
  "builder.holdSeconds": "Hold (s)",
  "builder.phases": "Phases",
  "builder.addPhase": "Add a phase",
  "builder.removePhase": "Remove phase {number}",
  "builder.phaseHint":
    "A phase is a run of identical sets. Add a second one for a ramp \u2014 heavier sets with a different rep target.",
  "builder.setStyle": "How the set runs",
  "builder.setStyle.plain": "Straight reps",
  "builder.setStyle.segments": "A sequence",
  "builder.segments": "The sequence, in order",
  "builder.addSegment": "Add a part",
  "builder.removeSegment": "Remove part {number}",
  "builder.segmentKind": "Part",
  "builder.segmentKind.reps": "Reps",
  "builder.segmentKind.pulses": "Pulses",
  "builder.segmentKind.hold": "Hold",
  "builder.segmentCount": "How many",
  "builder.segmentSeconds": "Seconds",
  "builder.pulsePerRep": "A pulse on every rep",
  "builder.segmentsHint":
    "For a set that runs as a fixed sequence \u2014 a hold, then pulses, then reps. Each part becomes its own step in the player, and holds get a countdown.",
  "builder.needTwoSegments": "A sequence needs at least two parts",
  "builder.modifiers": "Intensity techniques",
  "builder.notePlaceholder": "Anything worth remembering about this program",
  "builder.save": "Save routine",
  "builder.saving": "Saving\u2026",
  "builder.saved": "Saved {name}",
  "builder.saveError": "Couldn't save that",
  "builder.cancel": "Cancel",
  "builder.delete": "Delete routine",
  "builder.deleted": "Deleted {name}",
  "builder.deleteTitle": "Delete this routine?",
  "builder.deleteBody":
    "The sets you logged against it stay in your history and keep counting \u2014 only the plan goes.",
  "builder.duplicate": "Start from a copy",
  "builder.duplicateHint":
    "Copy a built-in program and change it, instead of starting from nothing.",
  "builder.duplicateOf": "{name} (copy)",
  "builder.notFound": "That routine doesn't exist",

  // ── Cooking methods ──────────────────────────────────────────────────────
  // Recorded on a recipe because it tells you how to cook the thing. None of
  // them carry macros: fat you cook in is an ingredient line you type.
  "method.none": "No cooking",
  "method.steam": "Steamed",
  "method.boil": "Boiled",
  "method.grill": "Grilled",
  "method.bake": "Baked",
  "method.pan-fry": "Pan-fried",
  "method.deep-fry": "Deep-fried",
  "method.air-fry": "Air-fried",
  "method.slow-cook": "Slow-cooked",

  // ── Your own foods and recipes ───────────────────────────────────────────
  "pantry.tab": "Pantry",
  "pantry.title": "Your own foods and recipes",
  "pantry.body":
    "Anything the built-in list doesn't have, and dishes you make from them. Both go into a plan exactly like the rest.",
  "pantry.foods": "Foods",
  "pantry.recipes": "Recipes",
  "pantry.addFood": "Add a food",
  "pantry.addRecipe": "Add a recipe",
  "pantry.name": "Name",
  "pantry.nameRequired": "Give it a name",
  "pantry.unit": "Measured in",
  "pantry.unit.g": "Grams",
  "pantry.unit.ml": "Millilitres",
  "pantry.unit.unit": "Whole units",
  "pantry.per100": "Macros per 100",
  "pantry.perUnit": "Macros per unit",
  "pantry.protein": "Protein (g)",
  "pantry.carbs": "Carbs (g)",
  "pantry.fat": "Fat (g)",
  "pantry.kcal": "{kcal} kcal",
  "pantry.state": "Weighed",
  "pantry.state.none": "Doesn't matter",
  "pantry.state.raw": "Raw",
  "pantry.state.cooked": "Cooked",
  "pantry.stateHint":
    "Raw and cooked are different foods, never a conversion — a gram of cooked chicken holds a third more protein than a gram of raw.",
  "pantry.unitNote": "What one unit is",
  "pantry.unitNoteHint": "\"~50g each\", \"1 scoop\". Optional.",
  "pantry.ingredients": "Ingredients",
  "pantry.addIngredient": "Add an ingredient",
  "pantry.removeIngredient": "Remove {name}",
  "pantry.needIngredient": "A recipe needs at least one ingredient",
  "pantry.method": "Cooked by",
  "pantry.methodHint":
    "How to cook it. It adds no macros on its own — if you cook in oil or butter, add that as an ingredient.",
  "pantry.addFat": "Add the fat you cook in",
  "pantry.portioning": "Measured out by",
  "pantry.portioning.servings": "Servings",
  "pantry.portioning.weight": "Cooked weight",
  "pantry.servings": "Makes how many",
  "pantry.cookedGrams": "Finished weight (g)",
  "pantry.cookedGramsHint":
    "Weigh the dish once it's cooked. It can't be worked out from the ingredients — water leaves while cooking, and how much depends on the method.",
  "pantry.recipeTotal": "The whole batch",
  "pantry.perServing": "Per serving",
  "pantry.per100Cooked": "Per 100 g cooked",
  "pantry.serving": "1 serving",
  "pantry.save": "Save",
  "pantry.saving": "Saving\u2026",
  "pantry.saved": "Saved {name}",
  "pantry.saveError": "Couldn't save that",
  "pantry.edit": "Edit {name}",
  "pantry.archive": "Archive",
  "pantry.archived": "Archived",
  "pantry.archivedNotice": "{name} archived",
  "pantry.restore": "Restore",
  "pantry.restored": "{name} is back",
  "pantry.delete": "Delete",
  "pantry.deleted": "Deleted {name}",
  "pantry.showArchived": "Show archived",
  "pantry.inUse": "Used by {count}",
  "pantry.recipeCount.one": "{count} recipe",
  "pantry.recipeCount.other": "{count} recipes",
  "pantry.empty.foods": "No foods of your own yet",
  "pantry.empty.foodsBody":
    "Add one when something you eat isn't in the built-in list.",
  "pantry.empty.recipes": "No recipes yet",
  "pantry.empty.recipesBody":
    "A recipe is a list of ingredients plus how you cooked it. It then drops into a meal like any other food.",
  "pantry.yours": "Yours",
  "pantry.recipe": "Recipe",
  "pantry.category": "Kind of food",
  "pantry.categoryHint":
    "Groups it in the picker. Leave it blank and it groups by whichever macro it's mostly made of.",
  "pantry.category.none": "Work it out from the macros",

  // ── Food picker headings ─────────────────────────────────────────────────
  // The authored families, then the four the macros fall back to.
  "foodGroup.vegetables": "Vegetables",
  "foodGroup.fruits": "Fruit",
  "foodGroup.grains": "Cereals and grains",
  "foodGroup.tubers": "Potatoes and tubers",
  "foodGroup.legumes": "Beans and legumes",
  "foodGroup.dairy-eggs": "Dairy and eggs",
  "foodGroup.meat-fish": "Meat and fish",
  "foodGroup.fats": "Fats and oils",
  "foodGroup.sweets": "Sweets and snacks",
  "foodGroup.supplements": "Supplements",
  "foodGroup.protein": "Mostly protein",
  "foodGroup.carbs": "Mostly carbs",
  "foodGroup.fat": "Mostly fat",
  "foodGroup.mixed": "Mixed",
  "pantry.ingredientCount.one": "{count} ingredient",
  "pantry.ingredientCount.other": "{count} ingredients",

  // ── Writing your own diet plan ───────────────────────────────────────────
  "dietBuilder.new": "New plan",
  "dietBuilder.newTitle": "Write a plan",
  "dietBuilder.newBody":
    "Your meals, in order, with the swaps you actually rotate. Every total is worked out from what you put in.",
  "dietBuilder.editTitle": "Editing {name}",
  "dietBuilder.edit": "Edit",
  "dietBuilder.yours": "Yours",
  "dietBuilder.name": "Name",
  "dietBuilder.goal": "Goal",
  "dietBuilder.goal.cutting": "Cutting",
  "dietBuilder.goal.bulking": "Bulking",
  "dietBuilder.goal.maintenance": "Maintenance",
  "dietBuilder.tdee": "Maintenance calories",
  "dietBuilder.tdeeHint":
    "Optional. What you burn in a day — if your weight has held steady for a couple of weeks, whatever you were eating is your maintenance. Failing that, roughly 30–33 kcal per kg of bodyweight.",
  "dietBuilder.targetHint":
    "Optional. What you'll actually eat. Leave it blank and it's worked out from your macro targets.",
  "dietBuilder.target": "Daily target",
  "dietBuilder.targets": "Macro targets",
  "dietBuilder.targetsHint":
    "What you're aiming for. The meals below are checked against it, not derived from it.",
  "dietBuilder.fromMacros": "Take these from the Macros tab",
  "dietBuilder.meals": "Meals",
  "dietBuilder.addMeal": "Add a meal",
  "dietBuilder.removeMeal": "Remove {name}",
  "dietBuilder.mealName": "Called",
  "dietBuilder.mealNote": "Note",
  "dietBuilder.mealNotePlaceholder": "Mix with water, from the cafeteria\u2026",
  "dietBuilder.options": "Swaps",
  "dietBuilder.addOption": "Add a swap",
  "dietBuilder.removeOption": "Remove swap {number}",
  "dietBuilder.optionLabel": "Called",
  "dietBuilder.optionLabelPlaceholder": "Chicken, Salmon\u2026",
  "dietBuilder.optionsHint":
    "Interchangeable versions of the same meal. Each one is a complete list \u2014 swapping the protein usually moves the rest with it.",
  "dietBuilder.items": "What's in it",
  "dietBuilder.addItem": "Add something",
  "dietBuilder.removeItem": "Remove {name}",
  "dietBuilder.itemNote": "Note",
  "dietBuilder.running": "So far: {macros}",
  "dietBuilder.vsTarget": "{value} vs target",
  "dietBuilder.gapsTitle": "Doesn't hit your targets",
  "dietBuilder.gapsBody":
    "Save it as a draft and come back to it — it'll be marked unfinished so you can tell at a glance.",
  "dietBuilder.keepEditing": "Keep editing",
  "dietBuilder.saveDraft": "Save as draft",
  "dietBuilder.draft": "Draft",
  "dietBuilder.draftBody":
    "This plan doesn't add up to its targets yet. Edit it and save again to clear this.",
  "dietBuilder.notes": "Notes",
  "dietBuilder.addNote": "Add a note",
  "dietBuilder.removeNote": "Remove note",
  "dietBuilder.notePlaceholder": "Anything worth remembering about this plan",
  "dietBuilder.save": "Save plan",
  "dietBuilder.saving": "Saving\u2026",
  "dietBuilder.saved": "Saved {name}",
  "dietBuilder.saveError": "Couldn't save that",
  "dietBuilder.cancel": "Cancel",
  "dietBuilder.delete": "Delete plan",
  "dietBuilder.deleted": "Deleted {name}",
  "dietBuilder.targetsDisagree":
    "These macros come to {fromMacros} kcal, but the daily target above says {statedKcal} — a difference of {delta}. Change one of them, or clear the daily target and it'll be worked out from these.",
  "dietBuilder.editingBuiltIn":
    "This one came with the app. Saving keeps your version and hides the original from the picker — the original stays put, so you can put it back any time.",
  "dietBuilder.reset": "Reset to the original",
  "dietBuilder.resetTitle": "Put the original back?",
  "dietBuilder.resetBody":
    "Your changes to this plan are dropped and the version that came with the app returns. Meals you've already ticked off aren't affected.",
  "dietBuilder.reset.done": "{name} is back to the original",
  "dietBuilder.deleteTitle": "Delete this plan?",
  "dietBuilder.deleteBody": "Nothing else is affected \u2014 no intake is logged against a plan.",
  "dietBuilder.duplicate": "Start from a copy",
  "dietBuilder.duplicateHint": "Copy a built-in plan and change it.",
  "dietBuilder.duplicateOf": "{name} (copy)",
  "dietBuilder.variantWarning":
    "This plan writes different meals on different days. A copy keeps the first version of each and applies it every day.",
  "dietBuilder.notFound": "That plan doesn't exist",
  "dietBuilder.noMeals": "No meals yet. Add one to start.",
  "dietBuilder.nothingIn": "Nothing in this one yet.",

  // ── Export and import ────────────────────────────────────────────────────
  // ── What you ate ─────────────────────────────────────────────────────────
  // ── The guide ───────────────────────────────────────────────────
  "nav.about": "Guide",
  "index.dest.about":
    "How every part of the app works, and why it works that way.",
  "about.title": "How this works",
  "about.subtitle":
    "Every feature, what it's for, and the handful of decisions behind it that aren't obvious from clicking around.",

  "about.storage.title": "Where your data lives",
  "about.storage.body":
    "In this browser, on this device — unless you sign in, which syncs everything you log and everything you write to your account.",
  "about.storage.p1":
    "That makes it private by construction — but it also means clearing your browser data deletes it, and it doesn't follow you to your phone.",
  "about.storage.p2":
    "Export a backup now and again. The half you can't reconstruct is the exercises, routines, foods, recipes and plans you wrote.",
  "about.storage.p3":
    "The six training programs and the built-in foods are compiled into the app, so those are never at risk.",
  "about.storage.link": "Back up your data",

  "about.account.title": "Your account",
  "about.account.body":
    "Optional, and off by default. The app is fully usable without one; signing in is what makes your data follow you to another device.",
  "about.account.p1":
    "Nothing moves by itself. Uploading this device's data is one button on the account page — safe to press twice, since the account keeps one copy of each thing.",
  "about.account.p2":
    "Signing out brings back this device's own data untouched. The account keeps what you uploaded, ready for the next device.",
  "about.account.p3":
    "Backups still work signed in — the export covers whatever the app is showing right now, so it's your way out of the server too.",
  "about.account.link": "Go to your account",
  "about.profile.title": "Profile",
  "about.profile.body":
    "Height, sex, wrist and ankle — the standing facts FFMI and the natural-potential estimate both read.",
  "about.profile.p1":
    "One edit surface, not two: this used to be a height and sex field on the body tab and a second copy of height, wrist and ankle on the potential calculator, and a typo fixed on one left the other wrong.",
  "about.profile.p2":
    "Reachable from the avatar menu in the header or the sidebar, whether you're signed in or not — FFMI shouldn't need an account to configure, so the signed-out state opens a menu now instead of going straight to a sign-in page.",
  "about.profile.link": "Open your profile",

  "about.routines.title": "Programs and days",
  "about.routines.body":
    "Six transcribed programs plus anything you write. Each one is weeks of days, and each day is a list of exercises with sets, reps and rest.",
  "about.routines.p1":
    "A program row shows the training days of its first week, so you can tell a push/pull split from an arms specialisation without opening it.",
  "about.routines.p2":
    "Open a day to see the whole thing before you start: how many exercises, how many working sets, and a rough time.",
  "about.routines.p3":
    "The marks under each exercise are one per set, so a seven-set finisher visibly outweighs a three-set accessory.",
  "about.routines.link": "Browse the programs",

  "about.player.title": "Running a session",
  "about.player.body":
    "Start a day and the app walks you through it one step at a time — each work set, each rest, each pose hold.",
  "about.player.p1":
    "Rest timers start themselves when you tap Done; a cardio block waits for you to press Start, because you decide when you're on the machine.",
  "about.player.p2":
    "The button stays in the same place on every step. That's deliberate — it's the control you press forty times a session.",
  "about.player.p3":
    "You can step back and forward freely. Ending early asks first, because it throws away your place in the day.",
  "about.player.p4":
    "Warmup sets are shown and timed but never logged. Two ramp-ups at half your working weight aren't a record and aren't volume, so they stay out of both — and out of the day's set count.",
  "about.player.p5":
    "If a routine lists substitutes, you can swap mid-session and the set is logged against the lift you actually did. The swap lasts the session only — someone being on the machine today isn't an edit to your program.",
  "about.player.p6":
    "A set written as a sequence — a hold, then pulses, then reps — runs itself. You cannot tap a phone between the parts of one set, so holds are timed exactly, counted parts are paced, and you get +10s, skip and pause if the pace isn't yours.",
  "about.player.p7":
    "Every hold counts you in with a 3-2-1 before it starts, and beeps when it ends. A hold whose clock starts while you're still getting into position is a hold you did for seven seconds, not ten.",

  "about.logging.title": "Logging sets and personal records",
  "about.logging.body":
    "Log a set from the player, or backfill one later from the Records tab. Weight is optional — bodyweight work counts.",
  "about.logging.p1":
    "Nothing is logged unless you submit the form. Moving through a workout records nothing on its own.",
  "about.logging.p2":
    "A record isn't one number. It's the best weight at each rep count, dropping any row beaten on both — so 120x1, 110x3 and 90x8 can all stand as records at once.",
  "about.logging.p3":
    "Units are stored exactly as you enter them. A machine marked in pounds reads back in pounds; only comparisons convert.",
  "about.logging.link": "See your records",

  "about.exercises.title": "Exercises the library doesn't have",
  "about.exercises.body":
    "113 lifts ship with the app. Add your own and they work everywhere the built-in ones do — logging, records, volume, the split chart.",
  "about.exercises.p1":
    "You name the muscles it works and the movement pattern, rather than picking from a list of 42 movements. That's what lets the volume charts read it with no special case.",
  "about.exercises.p2":
    "Once you've logged against one it archives rather than deletes — deleting would leave those sets pointing at nothing.",
  "about.exercises.link": "Your exercise library",

  "about.builder.title": "Writing your own routine",
  "about.builder.body":
    "Build a program from scratch, or start from a copy of a built-in one and change what you don't like.",
  "about.builder.p1":
    "A routine is a cycle of days that repeats — seven is a week, eight is push/pull/legs/rest twice over. Add more weeks when the numbers change between them, starting from a copy of whichever week you pick.",
  "about.builder.p2":
    "You can edit the programs that came with the app. Your version replaces it in the list, the original stays compiled in, and \"Reset to the original\" hands it back.",
  "about.builder.p3":
    "Sets can carry intensity techniques — drop sets, rest-pause, partials, negatives, forced reps — and can be built from parts, like a hold into pulses into reps. A warmup phase is shown and timed but never logged.",
  "about.builder.p4":
    "Cardio is a duration rather than reps, in minutes or seconds, with how hard to go. A second block makes it intervals.",
  "about.builder.p5":
    "Type a lift the picker doesn't know and it offers to create it there and then. Name substitutes on an exercise and the player lets you swap mid-session, logging against whichever you actually did.",
  "about.builder.p6":
    "\"Superset with the one above\" links two exercises into a rotation — a third makes it a circuit. The rest between them stops being prescribed, which is what a superset is; the round's rest is the last one's.",
  "about.builder.link": "Write a routine",

  "about.progress.title": "Progress",
  "about.progress.body":
    "Five views over the same log: what you've lifted, how much, when, and against what.",
  "about.progress.p1":
    "Records — every personal record, searchable and grouped by exercise. Fix or delete a mistyped set here and everything downstream corrects itself.",
  "about.progress.p2":
    "Volume — weekly sets per muscle, and a push/pull/legs/core split. Direct and indirect sets are counted separately rather than blended.",
  "about.progress.p3":
    "History — a year of training days as a grid, and your current streak. It counts back from today, so a broken streak reads zero.",
  "about.progress.p4":
    "Body — weigh-ins, body fat and FFMI against the population bands. Set your height on that tab or the numbers can't be computed.",
  "about.progress.p5":
    "Measurements — girths over time, kept apart from Body because a tape and a scale answer different questions.",
  "about.progress.link": "Open progress",

  "about.nutrition.title": "Nutrition",
  "about.nutrition.body":
    "A plan describes what to eat; the Today tab records whether you did.",
  "about.nutrition.p1":
    "Today — tick meals off the plan as you eat them, and add anything off-plan. Nothing is logged until you tick it.",
  "about.nutrition.p2":
    "A ticked meal remembers which meal and which swap, not a copy of its foods — so correcting the plan corrects what you logged, including days already past.",
  "about.nutrition.p3":
    "Plan — the diet as a reference, per weekday, with swap options and hydration worked out from your body weight.",
  "about.nutrition.p4":
    "Macros — drag the split and watch the grams and calories move, then send the result back as your plan's targets.",
  "about.nutrition.p5":
    "Writing a plan checks it against itself: if your macro targets don't come to the daily calorie figure you typed, it says so and by how much.",
  "about.nutrition.link": "Open nutrition",

  "about.supplements.title": "Supplements",
  "about.supplements.body":
    "What you take every day, and whether you've taken it. Tick them off on the Today tab beside your meals.",
  "about.supplements.p1":
    "They carry no macros on purpose. Three fish-oil capsules have calories on paper and nobody counts them — what you want to know is whether you took them, so nothing here moves the day's total.",
  "about.supplements.p2":
    "The dose is stored on the supplement, not on the tick. Correct it and every day you already logged says the new amount, which is right for a standing instruction you follow.",
  "about.supplements.p3":
    "Stopping one archives it rather than deleting it, so the months you were taking it still read correctly. The creatine card can add itself here at the dose it worked out for you.",
  "about.supplements.link": "Open Today",
  "about.pantry.title": "Your foods and recipes",
  "about.pantry.body":
    "Add ingredients the built-in list doesn't have, and cook them into recipes you can drop into a meal like any other food.",
  "about.pantry.p1":
    "A recipe is portioned either into servings or by the weight of the finished dish. Weigh it cooked — it weighs less than its ingredients, and nothing here guesses by how much.",
  "about.pantry.p2":
    "Raw and cooked are different foods, never a conversion. A gram of cooked chicken holds a third more protein than a gram of raw.",
  "about.pantry.p3":
    "The cooking method carries no macros of its own. Fat you cook in is an ingredient line with an amount you typed.",
  "about.pantry.link": "Open your pantry",

  "about.calculators.title": "Calculators",
  "about.calculators.body":
    "Three tabs of arithmetic. Nothing here reads or writes your log, beyond filling one field from your latest weigh-in.",
  "about.calculators.p1":
    "One-rep max — five published formulas at once, because they disagree by 5kg or more at high reps and a single number would hide that. It works backwards too: the load for a set of eight.",
  "about.calculators.p2":
    "RPE — what a set at a given weight, reps and RPE implies. Off-chart input returns nothing rather than extrapolating past where the published table stops.",
  "about.calculators.p3":
    "Natural potential — an empirical model of peak lean mass from your height, wrist and ankle. It's a fit to a population, not a ceiling.",
  "about.calculators.link": "Open the calculators",

  "about.plates.title": "Plate loader",
  "about.plates.body":
    "A target weight in, the plates per side out — or plates in, the total out. Its own page, because you open it standing at the rack.",
  "about.plates.p1":
    "It doesn't just grab the heaviest plate that fits. Tell it your gym is out of 10s and it finds a combination that still hits the number, where the obvious approach would come up short.",
  "about.plates.p2":
    "Inventory is counted in pairs, since a single plate can't be loaded evenly. Set a size to zero and it plans around it.",
  "about.plates.link": "Open the plate loader",

  "about.trends.title": "Eating over time",
  "about.trends.body":
    "Twelve weeks of what you actually ate, and how often you did what the plan said.",
  "about.trends.p1":
    "Only days you logged are plotted, and the averages are over those days too. A fortnight you didn't open the app would otherwise drag the mean down and read as a crash diet.",
  "about.trends.p2":
    "Two grids, because they answer questions that can disagree: whether you ticked the plan's meals, and whether the day landed on its calorie target. Ticking every meal and then eating a second dinner is 100% on one and well over on the other.",
  "about.trends.p3":
    "The calorie grid is the one place colour runs two ways — under and over are different outcomes, so merging them into \"how far off\" would lose the thing you'd act on. Landing on target is the pale cell, because that's the day with nothing to look at.",
  "about.trends.link": "See your trends",

  "about.measurements.title": "Measurements",
  "about.measurements.body":
    "Girths over time — arms, waist and legs to begin with, and anything else you want to add.",
  "about.measurements.p1":
    "Each site gets its own chart rather than all of them sharing one. A neck and a chest on one axis would flatten the neck to a line, and the change you're looking for is a centimetre.",
  "about.measurements.p2":
    "Left and right are recorded separately only if you ask for it, and then they're two lines on one chart — comparing them is the whole reason to have written down a side.",
  "about.measurements.p3":
    "Six of the sites are the ones the natural-potential calculator predicts, so what you measure and what it estimates are directly comparable.",
  "about.measurements.link": "Take a measurement",

  "about.sharing.title": "Backups and sharing",
  "about.sharing.body":
    "Export everything as one file, or hand someone a single routine, plan, recipe, food or exercise — the ones that came with the app included.",
  "about.sharing.p1":
    "Restoring a full backup replaces what's in the browser. Importing a shared item adds to it and touches nothing you have.",
  "about.sharing.p2":
    "A shared item arrives with new ids, so importing the same file twice gives you two copies rather than overwriting. It also brings what it needs — a routine carries its custom exercises, a plan carries its recipes.",
  "about.sharing.p3":
    "Nothing is uploaded. Export is a download, import is a file read, and sharing means sending someone the file yourself.",
  "about.sharing.link": "Back up or import",

  "about.gettingAround.title": "Getting around",
  "about.gettingAround.body":
    "A few things that save time once you know they're there.",
  "about.gettingAround.p1":
    "Ctrl+K searches every page, tab and program, and jumps straight to creating a routine, plan, food or recipe.",
  "about.gettingAround.p2":
    "Tabs live in the address bar, so a view can be bookmarked, shared as a link, and survives a refresh.",
  "about.gettingAround.p3":
    "Language and dark mode are at the bottom of the sidebar. Both stick.",

  "intake.tab": "Today",

  // ── Intake over time ─────────────────────────────────────────────────────
  "trends.tab": "Trends",
  "trends.daysLogged": "Days logged",
  "trends.daysComplete": "Full days",
  "trends.averageKcal": "Average kcal",
  "trends.averageProtein": "Average protein",
  "trends.averageNote":
    "Averages are over the {days} days you logged, not the whole window — {protein}g protein, {carbs}g carbs, {fat}g fat, {kcal} kcal.",
  "trends.overTime": "What you ate",
  "trends.overTimeBody":
    "Only days you logged. A gap is a day you didn't record, not a day you ate nothing.",
  "trends.macros": "Macros",
  "trends.macrosAria": "Protein, carbs and fat per day, in grams",
  "trends.calories": "Calories",
  "trends.caloriesAria": "Calories per day",
  "trends.axisGrams": "Grams",
  "trends.axisKcal": "kcal",
  "trends.grams": "Grams",
  "trends.kcal": "Calories",
  "trends.targetLine": "Target {kcal}",
  "trends.notEnough.title": "Not enough to draw yet",
  "trends.notEnough.body": "Two logged days and the trend shows up here.",

  "trends.consistency": "How often",
  "trends.consistencyBody":
    "Two questions that can disagree: whether you followed the plan, and whether you hit the numbers. Ticking every meal and then eating a second dinner is both at once.",
  "trends.adherence": "Meals ticked off the plan",
  "trends.adherenceCaption": "Share of the day's meals you ticked",
  "trends.mealsOf": "{ticked} of {total} meals",
  "trends.nothingTicked": "Nothing ticked",
  "trends.caloriesCaption": "How far the day landed from its target",
  "trends.under": "Under",
  "trends.over": "Over",
  "trends.onTarget": "On target",
  "trends.kcalOff": "{delta} kcal",
  "trends.noKcal": "Nothing logged",
  "trends.needTarget":
    "This plan states no calorie target, so there's nothing to measure a day against. Add one on the plan and this fills in.",
  "trends.empty.title": "Nothing logged yet",
  "trends.empty.body":
    "Tick a meal off on the Today tab and it starts showing up here.",
  "intake.today": "Today",
  "intake.yesterday": "Yesterday",
  "intake.previousDay": "Previous day",
  "intake.nextDay": "Next day",
  "intake.eaten": "Eaten",
  "intake.ofTarget": "{kcal} of {target} kcal",
  "intake.noTarget": "{kcal} kcal",
  "intake.planMeals": "From the plan",
  "supplements.creatine": "Creatine",
  "supplements.trackCreatine": "Track it daily",
  "supplements.creatineTracked": "On your daily checklist, under Today.",
  "supplements.title": "Supplements",
  "supplements.body": "What you take daily, and whether you've taken it.",
  "supplements.takenOf": "{taken} of {total} taken",
  "supplements.empty":
    "Nothing here yet. Add what you take and it appears on every day.",
  "supplements.add": "Add a supplement",
  "supplements.formBody":
    "A name and a dose. Supplements are tracked for adherence, not for macros — nothing here counts toward the day's calories.",
  "supplements.editTitle": "Editing {name}",
  "supplements.edit": "Edit {name}",
  "supplements.remove": "Remove {name}",
  "supplements.name": "Name",
  "supplements.namePlaceholder": "Omega 3, magnesium, creatine…",
  "supplements.nameRequired": "Give it a name",
  "supplements.amount": "How much",
  "supplements.amountRequired": "Needs a number above zero",
  "supplements.servingsPerDay": "Servings per day",
  "supplements.servingsHint":
    "How many times a day you take this dose. Two pills taken together is one serving; three capsules spread through the day is three — each gets its own box to tick.",
  "supplements.servingsRequired": "Needs a whole number, one or more",
  "supplements.unit": "Unit",
  "supplements.unit.pill.one": "pill",
  "supplements.unit.pill.other": "pills",
  "supplements.unit.scoop.one": "scoop",
  "supplements.unit.scoop.other": "scoops",
  "supplements.unit.g.one": "g",
  "supplements.unit.g.other": "g",
  "supplements.unit.mg.one": "mg",
  "supplements.unit.mg.other": "mg",
  "supplements.unit.ml.one": "ml",
  "supplements.unit.ml.other": "ml",
  "supplements.dose": "{amount} {unit}",
  "supplements.timing": "When",
  "supplements.timingPlaceholder": "With breakfast, pre-workout…",
  "supplements.timingHint": "Optional, and only a note to yourself.",
  "supplements.save": "Save",
  "supplements.create": "Add it",
  "supplements.saving": "Saving…",
  "supplements.saved": "Saved {name}",
  "supplements.saveError": "Couldn't save that",
  "supplements.servingOf": "Serving {number} of {total}",
  "supplements.taken": "Taken {name}",
  "supplements.unticked": "Unticked {name}",
  "supplements.archived": "Archived {name}",
  "supplements.archivedTag": "Archived",
  "supplements.deleted": "Deleted {name}",
  "supplements.orphaned.one":
    "{count} tick is against a supplement no longer on the list.",
  "supplements.orphaned.other":
    "{count} ticks are against supplements no longer on the list.",
  "intake.planMealsBody":
    "Tick a meal once you've eaten it. Nothing is recorded until you do.",
  "intake.extras": "Anything else",
  "intake.extrasBody": "Whatever you ate that the plan doesn't name.",
  "intake.add": "Add",
  "intake.remove": "Remove",
  "intake.removed": "Removed",
  "intake.gone": "No longer in your pantry",

  "data.tab": "Data",
  "data.title": "Back up and share",
  "data.body":
    "Everything lives in this browser. Export a file you can keep, restore it on another device, or hand someone a single routine, plan or recipe.",
  "data.export": "Export everything",
  "data.importShare": "Add a shared item",
  "data.restoreFile": "Restore a backup",
  "data.localOnly":
    "The file is saved to this device and read from it. Nothing is uploaded anywhere.",
  "data.exported": "Backup downloaded",
  "data.notJson": "That file isn't JSON",
  "data.notOurs": "That doesn't look like a natty file",
  "data.wrongVersion": "That file is version {version}, which this build doesn't read",
  "data.invalid": "That file didn't validate \u2014 {detail}",
  "data.empty": "There's nothing in it",
  "data.countNow": "Now",
  "data.countAfter": "After",
  "data.restoreEmpty":
    "There's nothing in this file. Restoring it would leave you with nothing.",
  "data.notABackup":
    "That's a shared item, not a full backup. Use “Add a shared item” to bring it in alongside your data.",
  "data.notAShare":
    "That's a full backup, not a shared item. Use “Restore a backup” if you mean to replace everything.",
  "data.cancel": "Cancel",
  "data.restoreTitle": "Restore everything?",
  "data.restoreBody":
    "This replaces what's in the browser now with what's in the file. Your current data is overwritten, so export it first if you want to keep it.",
  "data.restoreAction": "Replace everything",
  "data.restored": "Restored",
  "data.mergeTitle": "Add this to yours?",
  "data.mergeBody":
    "Nothing you have is touched. What's in the file arrives alongside it, with new ids so it can't overwrite anything \u2014 importing twice gives you two copies.",
  "data.mergeAction": "Add it",
  "data.merged": "Added",
  // ── Girth measurements ───────────────────────────────────────────────────
  "measure.tab": "Measurements",
  "measure.title": "Take your measurements",
  "measure.body":
    "The scale says which direction you're going. A tape says where it went — two people at the same weight can have completely different arms.",
  "measure.unit": "Measured in",
  "measure.addSite": "Measure something else",
  "measure.bothSides": "Both sides",
  "measure.removeSite": "Stop measuring {site}",
  "measure.noneTracked":
    "Nothing on the form. Add whatever you measure — arms, waist and legs are the usual three.",
  "measure.save": "Save",
  "measure.saved.one": "{count} measurement saved",
  "measure.saved.other": "{count} measurements saved",
  "measure.delete": "Delete",
  "measure.deleted": "Measurement deleted",
  "measure.change": "{delta} {unit} since you started",
  "measure.trend": "Over time",
  "measure.history": "Every reading",
  "measure.siteSide": "{site} ({side})",
  "measure.empty.title": "Nothing measured yet",
  "measure.empty.body":
    "Fill in whatever you measured above. One reading is a starting point; the trend shows up from the second.",
  "measure.chart.axis": "Girth ({unit})",
  "measure.chart.aria": "{site} over time, in {unit}",
  "measure.chart.latest": "Now {value} {unit}",
  "measure.chart.latestSide": "{side}, now {value} {unit}",
  "measure.chart.notEnough.title": "Not enough to draw yet",
  "measure.chart.notEnough.body":
    "A site needs two readings before there's a line between them.",

  "measure.side.left": "Left",
  "measure.side.right": "Right",
  "measure.site.neck": "Neck",
  "measure.site.shoulders": "Shoulders",
  "measure.site.chest": "Chest",
  "measure.site.upperArm": "Upper arm",
  "measure.site.forearm": "Forearm",
  "measure.site.waist": "Waist",
  "measure.site.hips": "Hips",
  "measure.site.thigh": "Thigh",
  "measure.site.calf": "Calf",

  "data.kind.sets": "Logged sets",
  "data.kind.cardio": "Cardio sessions",
  "data.kind.bodyEntries": "Weigh-ins",
  "data.kind.measurements": "Measurements",
  "data.kind.exercises": "Your exercises",
  "data.kind.routines": "Your routines",
  "data.kind.foods": "Your foods",
  "data.kind.recipes": "Your recipes",
  "data.kind.diets": "Your diet plans",
  "data.kind.intake": "Meals eaten",
  "data.kind.supplements": "Supplements",
  "data.kind.profile": "Your profile",
  "data.share": "Share",
  "data.shareMissing": "Couldn't find that to share",
  "data.shareError": "Couldn't build the file",
  "data.shared": "File downloaded",

  "split.push": "Push",
  "split.pull": "Pull",
  "split.legs": "Legs",
  "split.cardio": "Cardio",
  "split.core": "Core",
  "volume.splitFacetAria": "{split} sets per week",

  "muscle.chest": "Chest",
  "muscle.upper-chest": "Upper chest",
  "muscle.lats": "Lats",
  "muscle.upper-back": "Upper back",
  "muscle.traps": "Traps",
  "muscle.front-delts": "Front delts",
  "muscle.side-delts": "Side delts",
  "muscle.rear-delts": "Rear delts",
  "muscle.biceps": "Biceps",
  "muscle.triceps": "Triceps",
  "muscle.forearms": "Forearms",
  "muscle.quads": "Quads",
  "muscle.hamstrings": "Hamstrings",
  "muscle.glutes": "Glutes",
  "muscle.adductors": "Adductors",
  "muscle.calves": "Calves",
  "muscle.spinal-erectors": "Spinal erectors",
  "muscle.abs": "Abs",

  // ── History ──────────────────────────────────────────────────────────────
  "history.tab": "History",
  "history.title": "Every day you trained",
  "history.body":
    "A year of logged days. Tap one to see what you did \u2014 and to fix it if a number went in wrong.",
  "history.logged": "Days you logged, which isn't quite days you trained.",
  "history.less": "Less",
  "history.more": "More",
  "history.daysTrained": "Days trained",
  "history.setsLogged": "Sets logged",
  "history.longestStreak": "Longest streak",
  "history.currentStreak": "Current streak",
  "history.streakRule":
    "A streak counts training days and survives up to two rest days in a row. Three days off ends it.",
  "history.days.one": "{count} day",
  "history.days.other": "{count} days",
  "history.setsOnDay.one": "{count} set",
  "history.setsOnDay.other": "{count} sets",
  "history.exercises.one": "{count} exercise",
  "history.exercises.other": "{count} exercises",
  "history.daySummary": "{sets} across {exercises}",
  "history.noSets": "nothing logged",
  "history.empty.title": "No history yet",
  "history.empty.body":
    "Log a few sessions and a year of them shows up here, a square per day.",
  "history.editSet": "Edit {set}",
  "history.editTitle": "Correct this set",
  "history.save": "Save",
  "history.saving": "Saving\u2026",
  "history.saved": "Set updated",
  "history.saveError": "Couldn't save that change",
  "history.deleteSet": "Delete {set}",
  "history.deleted": "Deleted {set}",
  "history.undo": "Undo",
  "detail.loggedSets": "Every set logged",

  // ── Progress ─────────────────────────────────────────────────────────────
  "progress.title": "Progress",
  "progress.subtitle":
    "What you've lifted and how your body composition is tracking.",
  "progress.tab.records": "Records",
  "progress.tab.body": "Body",

  // ── Records ──────────────────────────────────────────────────────────────
  "records.logSet.title": "Log a set",
  "records.logSet.body":
    "For work done outside the player, or to catch up on a session you didn't log at the time.",
  "records.title": "Records",
  "records.body":
    "The best weight at each rep count, per exercise — a set only shows here when nothing beat it on both weight and reps.",
  "records.searchLabel": "Search records by exercise",
  "records.empty": "No records logged yet.",
  "records.emptySearch": 'No records match "{search}".',
  "records.nothingLogged.title": "Nothing logged yet",
  "records.nothingLogged.body":
    "Log a set above, or start a workout and record your sets as you go.",
  "records.count.one": "{count} record",
  "records.count.other": "{count} records",
  "records.columnSet": "Set",
  "records.chartAria": "Chart {exercise}",

  // ── Exercise detail ──────────────────────────────────────────────────────
  "detail.loading": "Loading your history…",
  // No new record on the top set for 3 sessions in a row — see `plateau.ts`.
  "detail.plateaued": "Plateaued",
  "detail.nothingLogged": "Nothing logged for this one yet.",
  "detail.summary": "{sets} · {records} · best {best}",
  "detail.summaryNoBest": "{sets} · {records}",
  "detail.sets.one": "{count} set logged",
  "detail.sets.other": "{count} sets logged",
  "detail.overTime": "Every set, over time",
  "detail.overTimeAria": "Every logged set over time, with records marked",
  "detail.overTimeNote":
    "Raw load can't be compared across rep counts, so the line is Epley's estimated one-rep max — it puts a heavy triple and a long set of twelve on the same axis.",
  "detail.strengthCurve": "Strength curve",
  "detail.strengthCurveAria": "Best weight at each rep count",
  "detail.strengthCurveNote":
    "Your best weight at each rep count — the same records as the table, as a shape. How steeply it falls is how fast your strength drops off as the set runs long.",
  "detail.needTwoSets":
    "One loaded set is a point, not a trend — log another and this fills in.",
  "detail.needTwoRepCounts": "This needs records at two different rep counts.",
  "detail.empty.title": "Nothing to plot yet",
  "detail.empty.body":
    "Log a set for this exercise and its history shows up here.",
  "detail.empty.bodyweight":
    "Every set logged for this one was bodyweight, so there's no load to chart.",
  "detail.legend.set": "Set",
  "detail.legend.record": "Record",
  "detail.legend.estimate": "Estimated 1RM",
  "detail.axis.load": "Load ({unit})",

  // ── Logging a set ────────────────────────────────────────────────────────
  "log.pickExercise": "Pick an exercise",
  "log.weightError": "Enter a weight, or leave blank for bodyweight",
  "log.repsError": "Enter how many reps you did",
  "log.saving": "Saving set...",
  "log.saved": "Logged {set}",
  "log.newRecord": "New record",
  "log.saveError": "Couldn't save that set",
  "log.action": "Log set",
  "log.another": "Log another",
  "log.thisSet": "Log this set",
  "log.nothingUntilLogged": "Nothing is recorded until you log it.",
  "log.alreadyHere": "Already here: {sets}. Logging adds another.",
  "log.pr": "PR",
  "log.last": "Last",
  "log.firstTime": "First time logging this one.",
  // Double progression's suggested next target — see `overload.ts`.
  "log.try": "Try",
  "log.countLogged": "{count} logged",

  // ── Body ─────────────────────────────────────────────────────────────────
  "body.latest.title": "Latest",
  "body.latest.needHeight": "Add your height to see FFMI.",
  "body.latest.needHeightLink": "Set it on your profile",
  "body.latest.needBodyFat": "Add a body-fat reading to a weigh-in to see FFMI.",
  "body.latest.body": "Fat-free mass index — lean mass over height squared.",
  "body.latest.carried": "Carried",
  "body.latest.carriedBodyFat": "Body fat carried from your {date} reading.",
  "body.stat.leanMass": "Lean mass",
  "body.stat.ffmi": "FFMI",
  "body.stat.normalized": "Normalized",
  "body.stat.bodyFat": "Body fat",
  "body.logEntry.title": "Log a weigh-in",
  "body.logEntry.notToday": "Nothing logged today yet.",
  "body.logEntry.body": "Body fat is optional — weight alone is still worth tracking.",
  "body.logEntry.action": "Log weigh-in",
  "body.logEntry.weightError": "Enter your weight",
  "body.logEntry.bodyFatError":
    "Enter a percentage between 0 and 100, or leave it blank",
  "body.logEntry.saving": "Saving...",
  "body.logEntry.saved": "Logged {weight}",
  "body.logEntry.savedBodyFat": "{percent}% body fat",
  "body.logEntry.saveError": "Couldn't save that weigh-in",
  "body.trend.title": "Trend",
  "body.trend.body":
    "Weight and body fat on their own scales — one chart each, since a shared axis would only invite reading a crossing point as meaningful.",
  "body.history.title": "History",
  "body.history.body": "Most recent first.",
  "body.history.needSex":
    "Set your sex on your profile to see where a normalized figure sits against population norms.",
  "body.history.empty": "No weigh-ins logged yet.",
  "body.history.editEntry": "Edit {weight}",
  "body.history.editTitle": "Correct this weigh-in",
  "body.history.deleteEntry": "Delete {weight}",
  "body.history.deleted": "Deleted",
  "body.history.saved": "Weigh-in updated",
  "body.chart.notEnough.title": "Not enough weigh-ins yet",
  "body.chart.notEnough.body": "Log a second one and the trend shows up here.",
  "body.chart.weightAria": "Body weight in {unit} over time, with the weekly average",
  "body.chart.bodyFatAria": "Body fat percentage over time",
  "body.chart.bodyFatNeedsTwo":
    "Body fat is optional, so this needs two weigh-ins that carry a reading.",
  "body.chart.axisWeight": "Weight ({unit})",
  "body.chart.axisBodyFat": "Body fat (%)",
  "body.chart.legendDaily": "Each weigh-in",
  "body.chart.legendWeekly": "Weekly average",
  "body.chart.legendPartial": "This week so far ({count} of {total} days)",
  "body.chart.midweekNote":
    "Each average is plotted mid-week, on the Thursday, so the line sits over the days it summarises. {from} onwards.",

  // ── Weekly average ───────────────────────────────────────────────────────
  "weekly.title": "Weekly average",
  "weekly.partialBadge": "{count} of {total} days",
  "weekly.partialBody":
    "This week is still running, so it's an average of the days so far — it'll move as the week fills in.",
  "weekly.body":
    "Monday to Sunday. A day-to-day change is mostly water; a week-to-week one isn't.",
  "weekly.weekOf": "Week of {date}",
  "weekly.versus": "vs week of {date}",
  "weekly.needAnother": "One more week of weigh-ins and this shows the change.",
  "weekly.recent": "Recent weeks",
  "weekly.soFar": "{date} · so far",

  // ── Routines ─────────────────────────────────────────────────────────────
  "routines.title": "Routines",
  "routines.subtitle":
    "{count} programs. Each one lists the split it runs.",
  "routines.weeks.one": "{count} week",
  "routines.weeks.other": "{count} weeks",
  "routines.trainingDays.one": "{count} training day",
  "routines.trainingDays.other": "{count} training days",
  "routines.restDay": "Rest",
  "routines.restDayTitle": "Rest day",
  "routines.restDayBody": "No training scheduled — recovery day.",
  "routines.dayCycle": "{count}-day cycle",
  "routines.restDays": "{count} rest",
  "routines.exerciseCount.one": "{count} exercise",
  "routines.exerciseCount.other": "{count} exercises",
  "routines.dayLabel": "Day {number} — {label}",
  "routines.defaultPrescription": "Default: {value}",
  "routines.notFound": "Routine not found",
  "routines.notFoundBody": "This program doesn't exist.",
  "routines.backToList": "Back to routines",
  "common.cancel": "Cancel",
  "routines.dayNotFound": "Day not found",
  "routines.dayNotFoundBody": "That week/day doesn't exist in this program.",
  "routines.holding": "holding",
  "routines.resting": "resting",
  "routines.replace.title": "Replace current workout?",
  "routines.replace.body":
    "You have a workout in progress on another day. Starting this one discards that progress.",
  "routines.replace.confirm": "Start anyway",
  "routines.week": "Week {number}",
  "routines.day": "Day {number}",
  "routines.startWorkout": "Start workout",
  "routines.noExercises": "No exercises listed",
  "routines.noExercisesBody": "This day has no exercises recorded.",
  // The program you've picked as the one you're running — a preference, not
  // a claim about which day you're on (that's derived from the log).
  "routines.setActive": "Make this my program",
  "routines.activeProgram": "Your active program",
  "routines.active": "Active",
  // The activate-program popover — the choice only ever seeds the first
  // "Today" read, before anything is logged; see `ActivateProgramButton`.
  "routines.activate.default": "From the beginning",
  "routines.activate.defaultBody": "Start at day 1. Today tracks where you are from what you log from here.",
  "routines.activate.custom": "From a specific day",
  "routines.activate.customBody": "Picking up mid-cycle? Choose which day is today.",
  "routines.activate.day": "Day",
  "routines.activate.confirm": "Activate",
  "routines.weekDayLabel": "Week {week} · {day}",
  "routines.warmup": "Warm-up & stretching",
  "routines.phase.main": "Main work",
  "routines.phase.mobility": "Mobility",
  "routines.phase.stretch": "Stretch",
  "routines.phase.cardio": "Cardio",
  "routines.summary.exercises": "Exercises",
  "routines.summary.workingSets": "Working sets",
  "routines.summary.roughTime": "Rough time",
  "routines.summary.finishers.one": "Finisher",
  "routines.summary.finishers.other": "Finishers",
  "routines.setOf": "set {number} of {total}",
  "routines.warmupSetOf": "warmup {number} of {total}",
  // Distinct from `routines.warmup`, which is the day's mobility block. This
  // is a light set of the lift you're about to do properly.
  "routines.superset": "Superset",
  "routines.circuitOf": "Circuit of {count}",
  // Shown on a finisher whose phases have no pose picked yet — the same gap
  // that let a finisher run in the gym with no hold and no cue at all.
  "routines.finisherNoPose": "No pose set",
  // On the connector between two supersetted/circuited exercises, only when
  // the entry before the gap carries a transition — most pairs have none.
  "routines.transitionSeconds": "{seconds}s transition",
  "player.supersetRound": "Superset · round {round} of {total}",
  "player.circuitRound": "Circuit · round {round} of {total}",
  "routines.warmupSet": "Warmup",
  // The plural form alone: on the day strip the count is the tile's value, so
  // interpolating it here would print it twice. Same shape as
  // `routines.summary.finishers`.
  "routines.warmupSets.one": "Warmup set",
  "routines.warmupSets.other": "Warmup sets",

  // ── The player ───────────────────────────────────────────────────────────
  "player.stepOf": "Step {current} of {total} · {left} to go",
  "player.exerciseOf": "Exercise {current} of {total}",
  "player.swap": "Swap",
  "player.swapTitle": "Doing instead",
  "player.swappedFrom": "instead of {name}",
  "player.set": "Set",
  "player.setValue": "{number} of {total}",
  "player.target": "Target",
  "player.then": "Then",
  "player.thenRest": "{seconds}s rest",
  "player.thenHold": "{seconds}s hold",
  "player.thenStraightOn": "Straight on",
  "player.thenEnd": "End of day",
  "player.loggedToday": "Logged today",
  "player.nothingLoggedYet": "Nothing yet — log a set and it shows up here.",
  "player.pose": "Pose",
  "player.back": "Back",
  "player.done": "Done",
  "player.doneRest": "Done — rest {clock}",
  "player.doneHold": "Done — hold {seconds}s",
  "player.startNextSet": "Start next set",
  "player.startTimed": "Start {label}",
  "player.startClock": "Start the clock",
  "player.finish": "Finish workout",
  "player.rest": "Rest",
  "player.hold": "Hold",
  "player.nextUp": "Next up",
  "player.timesUp": "Time's up",
  "player.holdComplete": "Hold complete.",
  "player.restComplete": "Rest complete — go when you're ready.",
  "player.endWorkout": "End workout",
  "player.endConfirm.title": "End this workout?",
  "player.endConfirm.body":
    "You're on step {current} of {total}. Every set you've logged is kept — only your place in the day goes.",
  "player.endConfirm.cancel": "Keep going",
  "player.ended": "Workout ended",
  "player.endedBody": "{day} — anything you logged is kept.",
  "player.complete": "Workout complete",
  "player.stale.title": "Nothing left in this workout",
  "player.stale.body": "{day} — this session is further along than the day now goes.",
  "player.stale.action": "Clear it",
  // The ramp: every set of the exercise, as the figures that change.
  "player.plan": "The plan",
  "player.load.heavier": "Go heavier",
  "player.load.same": "Same weight",
  "player.load.lighter": "Go lighter",
  "player.loadStated": "The program asks for this.",
  "player.loadInferred": "Read off the rep target falling from the last set.",
  "player.afterThis": "After this:",
  "player.nextExercise": "Next exercise",
  // A set that runs as a sequence, and the clock that runs it.
  "player.getSet": "Get set",
  "player.startSequence": "Start the set",
  "player.partOf": "Part {current} of {total}",
  "player.partCount": "{count} parts · {clock}",
  "player.pacedSeconds": "≈{count}s",
  "player.sequenceIntro": "One set, runs itself — {clock}",
  "player.sequenceDone": "Set complete.",
  "player.lastPart": "Last part",
  "player.paused": "Paused",
  "player.pause": "Pause",
  "player.resume": "Resume",
  "player.nextPart": "Next part",
  "player.cuesOn": "Sound and vibration on",
  "player.cuesOff": "Sound and vibration off",
  // Intensity techniques as instructions rather than labels. Lower-case and
  // unpunctuated at the start because each one follows its own name and an
  // em dash: "Drop set — at failure, strip …".
  "player.techniqueOne": "How to run this set",
  "player.techniqueOrder": "Run it in this order",
  "player.logEachDrop": "Log each drop as its own entry.",
  "modifier.ladderName": "Ladder",
  "technique.forcedReps":
    "at failure, a spotter helps you through two or three more.",
  "technique.negatives":
    "fight the lowering — three to four seconds down, every rep.",
  "technique.partials":
    "when full reps stop, keep going through the range you still have.",
  "technique.staticHolds":
    "hold the contracted position rather than passing through it.",
  "technique.dropSet":
    "at failure, strip about a quarter of the load and go straight back in — no rest.",
  "technique.restPause":
    "at failure, rack it, breathe for about fifteen seconds, then get more at the same weight.",
  "technique.ladder": "one rep is the whole ladder: {positions}.",

  // ── Calculators ──────────────────────────────────────────────────────────
  "calc.title": "Calculators",
  "body.chart.ffmiCaption":
    "Normalized FFMI against {sex} population norms. Descriptive only — the upper bands describe what is typically observed drug-free, not evidence about anyone in particular.",
  "body.profile.maleAdj": "male",
  "body.profile.femaleAdj": "female",
  "calc.orm.median": "Median of the five",
  "calc.orm.forGivenSetBody":
    "The same formula run backwards, off its own estimate — so the row matching the set you entered reads back as the weight you lifted.",
  "calc.potential.measurementsBody":
    "Height, wrist and ankle come from your profile — wrist and ankle at their narrowest point. Body fat starts from your last weigh-in and you can move it to see what changes.",
  "calc.potential.lastWeighIn": "Last weigh-in: {percent}%.",
  "calc.potential.maxBody":
    "Dr Casey Butt's model, fitted to the measurements of drug-free bodybuilders. The second, smaller figure against each is 95% of the maximum — the one usually described as realistically achievable.",
  "calc.potential.explain1":
    "The model predicts peak lean body mass — everything that isn't fat, so muscle plus bone, organs and water — from four numbers, with height, wrist and ankle in centimetres and the result in kilograms. Wrist and ankle stand in for skeletal frame, since they're mostly bone and tendon and barely move with training.",
  "calc.potential.explain2":
    "It's a curve fitted to a population of drug-free bodybuilders, not a law. Genetics, muscle insertions, training history and endocrine variation all move the real answer, and none of them are inputs here. Read it as roughly where the distribution sits for a frame like yours, not as a limit on you in particular.",
  "calc.potential.explain3":
    "The girth predictions are the same model's estimates for the size each measurement reaches at that lean mass — chest and biceps from wrist and height, thigh and calf from ankle and height.",
  "plates.strip": "Strip the bar",
  "calc.subtitle": "The arithmetic around training, none of it touching your log.",
  "calc.tab.oneRepMax": "One-rep max",
  "calc.tab.rpe": "RPE & RIR",
  "calc.tab.potential": "Natural potential",
  "calc.setYouDid": "The set you did",
  "calc.setYouDidBody":
    "A hard set, taken close to failure. A set with three left in the tank estimates a max you don't have — use the RPE tab for those.",
  "calc.orm.repsRange": "2 to {max}.",
  "calc.orm.needTwoBody":
    "A single already is your one-rep max, and past {max} reps these curves stop agreeing with reality.",
  "calc.orm.body":
    "Five fits of the same data. The spread between them is the honest error bar on any single one.",
  "calc.example100": "e.g. 100",
  "calc.orm.title": "Estimated one-rep max",
  "calc.orm.needTwo": "Enter a set of two or more",
  "calc.orm.forGivenSet": "What to lift for a given set",
  "calc.orm.formula": "Formula",
  "calc.orm.load": "Load",
  "calc.orm.ofMax": "Of max",
  "calc.rpe.implies": "What that set implies",
  "calc.rpe.setBody":
    "RPE is how hard the set was out of 10; reps in reserve is the same statement counted the other way. RPE 8 and 2 in reserve are one thing said twice.",
  "calc.rpe.impliesBody": "{reps} reps at RPE {rpe} is {percent}% of a one-rep max.",
  "calc.rpe.inReserve": "{count} in reserve",
  "calc.rpe.chartBody":
    "Loads against the {max} {unit} estimate above. Your set is highlighted.",
  "calc.rpe.chart": "The chart",
  "calc.rpe.shareOfMax": "Share of max",
  "calc.rpe.offChart":
    "That combination is off the published chart — it stops at twelve reps to failure.",
  "calc.rpe.percentNote":
    "Percentages of a one-rep max. Enter a set above to see them as weights.",
  "calc.potential.measurements": "Your measurements",
  "calc.potential.body":
    "Height, wrist and ankle write straight through to your profile. Body fat is a what-if dial here — the log owns the real history.",
  "calc.potential.fillAllBody":
    "Height, wrist, ankle and body fat are all inputs to the formula.",
  "calc.potential.editFrame": "Edit on your profile",
  "calc.potential.setFrame": "Set them on your profile",
  "calc.potential.needFrame": "Height, wrist and ankle live on your profile.",
  "calc.potential.leanMax": "Maximum lean body mass",
  "calc.potential.realistic": "{value} kg realistic",
  "calc.potential.needWeighIn":
    "Log a weigh-in with a body-fat reading to see where you are against it.",
  "calc.potential.standing":
    "You're at {lean} kg lean — {percent}% of the maximum, {realistic}% of the realistic figure.",
  "calc.potential.exampleBodyFat": "e.g. 12",
  "calc.potential.noWeighIn": "No weigh-in to draw from yet.",
  "calc.potential.max": "Maximum realistic size",
  "calc.potential.girths": "Girths at that size",
  "calc.potential.fillAll": "Fill in all four",
  "calc.potential.whatThisIs": "What this is, and isn't",
  "calc.potential.neck": "Neck",
  "calc.potential.chest": "Chest",
  "calc.potential.biceps": "Biceps",
  "calc.potential.forearm": "Forearm",
  "calc.potential.thigh": "Thigh",
  "calc.potential.calf": "Calf",

  // ── Plate loader ─────────────────────────────────────────────────────────
  "plates.title": "Plate loader",
  "plates.subtitle": "What to hang on each end, from the plates your gym has.",
  "plates.loadWeight": "Load a weight",
  "plates.addUp": "Add plates up",
  "plates.theBar": "The bar",
  "plates.bar": "Bar",
  "plates.units": "Units",
  "plates.rack": "What's on the rack",
  "plates.perSide": "Per side:",
  "plates.exact": "Exact",
  "plates.barIncluded": "Every total below includes the bar's {weight} {unit}.",
  "plates.rackBody":
    "Pairs of each disc — one for each end. Set a denomination to zero and the loader stops using it, which is the point: it will find a longer combination that still lands exactly rather than rounding.",
  "plates.loadBody": "The fewest discs that reach the target without going over.",
  "plates.target": "Target ({unit})",
  "plates.belowBar": "That's less than the bar on its own ({weight} {unit}).",
  "plates.short": "{short} {unit} short — no combination on the rack lands exactly",
  "plates.justTheBar": "nothing, just the bar",
  "plates.addBody":
    "The same thing backwards: put discs on one end and read the total. Tap a disc below to add a pair, or tap one on the bar to take a pair off.",
  "plates.barPlusSide": "{weight} {unit} bar + {side} {unit} a side",
  "plates.addPair": "Add a pair of {weight} {unit}",
  "plates.removePair": "Remove a pair of {weight} {unit}",
  "plates.clear": "Clear the bar",
  "plates.pairsLabel": "Pairs of {weight} {unit}",
  "plates.emptyBar": "An empty bar",

  // ── Nutrition ────────────────────────────────────────────────────────────
  "nutrition.title": "Nutrition",
  "nutrition.subtitle": "The diet as a reference, and the arithmetic behind it.",
  "nutrition.tab.plan": "Plan",
  "nutrition.tab.macros": "Macros",
  "nutrition.day": "Day",
  "nutrition.today": "today",
  "nutrition.dailyTargets": "Daily targets",
  "nutrition.perKg": "{perKg}g of protein per kg at your last weigh-in",
  "nutrition.ringNote": "The ring shows what the meals below actually add to.",
  "nutrition.noTargets":
    "This plan doesn't state a target. The ring shows what the meals below add to.",
  "nutrition.fromMacros": "from your macros",
  "nutrition.useAsTargets": "Use as my targets",
  "nutrition.startPlanWith": "Start a plan with these",
  "nutrition.targetsSaved": "Targets updated",
  "nutrition.hydrationBody": "Worked out from your last weigh-in, {weight}.",
  "nutrition.hydrationNoWeight": "No weigh-in yet",
  "nutrition.hydrationLogWeight":
    "Log your weight and this works out how much water to drink.",
  "nutrition.hydrationHours": "assumes {hours} hour of training",
  "nutrition.hydrationFormula":
    "{perKg}ml per kg, plus {creatine}ml for creatine, plus {perHour}ml per hour of training. A rule of thumb — heat and how much you sweat move it a lot.",
  "nutrition.creatine": "Creatine",
  "nutrition.creatineSimple":
    "{grams} g a day covers almost everyone — the rest of this is only worth reading if you're far from average.",
  "nutrition.creatineDaily": "Your daily dose",
  "nutrition.creatineLoading": "Loading (optional)",
  "nutrition.creatineLoadingNote":
    "{perDose} g × {doses} a day for {days} days, then drop to the daily dose. Skipping it only means saturating a few weeks later.",
  "nutrition.creatineFromLean":
    "Scaled from {mass} kg of fat-free mass — creatine is stored in muscle, so that's the part worth scaling by.",
  "nutrition.creatineFromWeight":
    "Scaled from {mass} kg of bodyweight. Log a body-fat percentage and this uses your fat-free mass instead, which is what actually stores it.",
  "nutrition.creatineNoWeight": "No weigh-in yet",
  "nutrition.kcalPerDay": "kcal/day",
  "nutrition.kgPerWeek": "kg/week",
  "nutrition.tdee": "TDEE",
  "nutrition.target": "Target",
  "nutrition.deficit": "Deficit",
  "nutrition.surplus": "Surplus",
  "nutrition.pace": "Rough pace",
  "nutrition.notes": "Notes",
  "nutrition.amount": "Amount",
  "nutrition.item": "Item",
  "nutrition.protein": "Protein",
  "nutrition.carbs": "Carbs",
  "nutrition.fat": "Fat",
  "nutrition.fibre": "Fibre",
  // The slider's accessible name. It read "Carbs in grams" in every language,
  // because it was built by concatenation from a hard-coded English label.
  "nutrition.gramsOf": "{macro} in grams",
  "nutrition.calories": "Calories",
  "nutrition.fibreAria": "Fibre in grams",
  "nutrition.resetToPlan": "Reset to plan",
  "nutrition.fibreNote":
    "Counted inside the carbs above, at roughly {fibreKcal} kcal a gram rather than {carbKcal} — fibre is a carbohydrate the body only partly gets at, not a fourth macro.",
  "nutrition.buildSplit": "Build a split",
  "nutrition.kcalADay": "{kcal} kcal a day",
  "nutrition.above": "{kcal} kcal above {plan}.",
  "nutrition.below": "{kcal} kcal below {plan}.",
  "nutrition.exactly": "Exactly {plan}.",
  "formula.epley": "The common default. Linear in reps, and near the middle throughout.",
  "formula.brzycki": "Lowest of the five on short sets, among the highest past ten reps.",
  "formula.lander": "Tracks Brzycki closely, and climbs highest of all on long sets.",
  "formula.lombardi":
    "A power curve: near the top on short sets, clearly lowest on long ones.",
  "formula.mayhew": "Fitted to bench press, and the highest of the five on short sets.",
  "nutrition.splitBody": "Starting from {plan}. Drag a macro and everything else follows.",
  "nutrition.swapHint":
    "Pick one — the rest of the meal moves to keep the day's macros matched.",
  "nutrition.option": "Option {number}",
  "nutrition.hydration": "Hydration",
  "nutrition.waterOnly": "water only",
  "nutrition.zeroCokes.one": "+ {count} zero coke",
  "nutrition.zeroCokes.other": "+ {count} zero cokes",
  "nutrition.supplements": "Supplements",
  "nutrition.mealShare": "{percent}% of the day",
  "nutrition.restDay": "Rest day",
  "nutrition.trainingDay": "Training day",
  "nutrition.raw": "Raw",
  "nutrition.cooked": "Cooked",

  // ── Privacy and terms ────────────────────────────────────────────────────
  // Written against what the code does, not from a template. If the analytics
  // rule or the fork-on-session behaviour changes, these are wrong.
  "legal.updated": "Last updated {date}",

  "privacy.title": "Privacy",
  "privacy.subtitle":
    "What this app knows about you, where it goes, and how to get it back.",
  "privacy.summary.title": "The short version",
  "privacy.summary.p1":
    "Without an account, nothing you log leaves your device. With one, your training data is stored so it follows you to your other devices — and that is the only reason it is stored.",
  "privacy.summary.p2":
    "Nothing is sold, rented, or shared with anyone. There is no advertising, and no third party is given your data to profile you with.",

  "privacy.local.title": "Without an account",
  "privacy.local.p1":
    "Everything — your sets, weigh-ins, measurements, meals, and anything you write — lives in your browser's storage on the device you are using. It is never sent anywhere.",
  "privacy.local.p2":
    "That also means clearing your browser data deletes it, and it does not follow you to your phone. Progress → Data exports the lot to a file you keep.",

  "privacy.account.title": "With an account",
  "privacy.account.p1":
    "Signing in stores your email address. If you sign in with Google, the app also receives the name and profile picture on your Google account — nothing else, and never your password.",
  "privacy.account.p2":
    "Your account then holds what you choose to sync: the display name and handle you pick, your profile (height, sex, and the wrist and ankle measurements the calculators use), and the data you log — sets, weigh-ins, girth measurements and meals — along with the exercises, routines, foods, recipes and plans you write yourself.",
  "privacy.account.p3":
    "Nothing is uploaded automatically. This device's existing data moves to your account only when you press the upload button on the account page, and signing out leaves this device's own copy exactly where it was.",

  "privacy.where.title": "Where it is stored",
  "privacy.where.p1":
    "Account data is held in a Postgres database run by Supabase, in the region the project was created in. The app itself is served by Vercel. Both are processors here: they hold the data so the app can work, not for their own purposes.",
  "privacy.where.p2":
    "Every read and write is scoped to the account that asked for it, checked on the server against a revalidated session rather than anything the browser claims.",

  "privacy.analytics.title": "Analytics",
  "privacy.analytics.p1":
    "Page views are counted with Vercel Web Analytics and Speed Insights, which use no cookies and build no cross-site profile.",
  "privacy.analytics.p2":
    "Pages are reported as their route pattern and never their real address — a program you wrote is counted as a program page, never by its name. That is deliberate: names you typed are the one thing that would otherwise leave the device, so the app strips them before anything is sent.",

  "privacy.cookies.title": "Cookies",
  "privacy.cookies.p1":
    "One kind: the cookie that keeps you signed in. There are no advertising or tracking cookies, and signing out clears it.",

  "privacy.control.title": "Your data, and getting it out",
  "privacy.control.p1":
    "Progress → Data exports everything to a single file at any time, signed in or not. It is plain JSON, readable without this app, and importing it anywhere puts you back exactly where you were.",
  "privacy.control.p2":
    "Individual entries can be edited or deleted wherever they appear, and deleting is immediate rather than a request you file.",
  "privacy.control.p3":
    "Deleting your account is a button on the account page, and it removes everything the server holds — your log, your measurements, your meals, what you wrote, and your handle. Signing out on its own deletes nothing; it just stops syncing.",

  "privacy.contact.title": "Contact",
  "privacy.contact.p1":
    "This app is made by one person. Questions about any of the above, or a deletion request, go to anthonysteiner96@gmail.com.",

  "terms.title": "Terms",
  "terms.subtitle": "What this app is, and what it is not.",
  "terms.what.title": "What this is",
  "terms.what.p1":
    "A training log: somewhere to record what you lifted, what you weighed and what you ate, and to see it added up. It is a personal project, offered as-is and free to use.",

  "terms.health.title": "This is not medical advice",
  "terms.health.p1":
    "Nothing here is medical, nutritional or clinical advice, and nothing here is a diagnosis. The app is a calculator and a notebook: it applies published formulas to numbers you typed in, and it has never examined you.",
  "terms.health.p2":
    "Calorie and macro targets, hydration figures, the creatine dose, FFMI readings, one-rep-max estimates and the natural-potential model are all general-population formulas. They can be wrong for you specifically, and they take no account of any condition, medication or injury you have.",
  "terms.health.p3":
    "Talk to a doctor or a registered dietitian before changing how you eat or train, especially if you are pregnant, have a medical condition, or are taking anything. If something hurts, stop.",

  "terms.estimates.title": "The numbers are estimates",
  "terms.estimates.p1":
    "Where formulas disagree, the app shows you that rather than hiding it behind one confident figure — five one-rep-max estimates instead of one, a band rather than a score.",
  "terms.estimates.p2":
    "Anything derived from what you logged is only as good as what you logged. The app cannot tell a mistyped weight from a real one.",

  "terms.account.title": "Your account",
  "terms.account.p1":
    "One account is for one person. Keep access to it to yourself — anyone who can open your email or your Google account can reach your data.",
  "terms.account.p2":
    "Handles are first come, first served, and picking one that impersonates someone else is not allowed.",

  "terms.content.title": "What you write stays yours",
  "terms.content.p1":
    "The exercises, routines, foods, recipes and plans you write are yours. No ownership of them is claimed, and they are not used for anything beyond running the app for you.",
  "terms.content.p2":
    "Sharing one produces a file that you hand over yourself. Nothing is published, and there is nowhere in this app for anyone else to see your data.",

  "terms.availability.title": "Availability",
  "terms.availability.p1":
    "This is a personal project, not a service with an uptime guarantee. It may change, break, or stop, and no promise is made about any of that.",
  "terms.availability.p2":
    "Which is the real reason the export exists: keep a copy of anything you would miss. To the extent the law allows, use of the app is at your own risk and no liability is accepted for any loss arising from it.",

  "terms.changes.title": "Changes",
  "terms.changes.p1":
    "These terms and the privacy policy may change as the app does. The date at the top is when they last did.",

  // ── Tonnage ──────────────────────────────────────────────────────────────
  "tonnage.title": "Total lifted",
  "tonnage.body": "Every kilogram you've actually moved.",
  "tonnage.scopeLabel": "Period",
  "tonnage.scope.week": "This week",
  "tonnage.scope.month": "This month",
  "tonnage.scope.year": "This year",
  "tonnage.scope.all": "All time",
  "tonnage.kg": "{value} kg",
  "tonnage.tonnes": "{value} t",
  "tonnage.context": "across {sets} sets and {reps} reps",
  "tonnage.comparisonsToggle": "What that's like",
  "tonnage.muscle": "Muscle",
  "tonnage.direct": "Direct",
  "tonnage.indirect": "Indirect",
  "tonnage.doesNotSum":
    "One set of squats is work for your quads and your glutes, so these count what reached each muscle rather than dividing the total between them — they add up to more than the figure above, on purpose.",
  "tonnage.unweighted.one":
    "{count} set carried no weight, so it counts for nothing here",
  "tonnage.unweighted.other":
    "{count} sets carried no weight, so they count for nothing here",
  "tonnage.like.piano.one": "About {count} grand piano",
  "tonnage.like.piano.other": "About {count} grand pianos",
  "tonnage.like.horse.one": "About {count} horse",
  "tonnage.like.horse.other": "About {count} horses",
  "tonnage.like.car.one": "About {count} car",
  "tonnage.like.car.other": "About {count} cars",
  "tonnage.like.elephant.one": "About {count} elephant",
  "tonnage.like.elephant.other": "About {count} elephants",
  "tonnage.like.bus.one": "About {count} double-decker bus",
  "tonnage.like.bus.other": "About {count} double-decker buses",
  "tonnage.like.whale.one": "About {count} blue whale",
  "tonnage.like.whale.other": "About {count} blue whales",
  "tonnage.like.eiffel.one": "About {count} Eiffel Tower",
  "tonnage.like.eiffel.other": "About {count} Eiffel Towers",
} as const;
