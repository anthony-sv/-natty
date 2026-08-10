import { Store } from "@tanstack/store";

const STORAGE_KEY = "natty.locale.v1";

/**
 * The languages the app is actually translated into.
 *
 * Spanish is `es-MX` rather than plain `es`: the app is used in Mexico, and the
 * gym vocabulary is regional enough to matter — "pesas" over "mancuernas" in
 * some phrasings, and the plate loader talks about a rack the way a Mexican gym
 * does. Adding another Spanish would be a separate locale, not a fallback.
 */
export const LOCALES = [
  { value: "en", label: "English" },
  // Written in its own language, as language pickers always are: someone
  // looking for Spanish is not reading the English word for it.
  { value: "es-MX", label: "Español (México)" },
] as const;

export type Locale = (typeof LOCALES)[number]["value"];

export const DEFAULT_LOCALE: Locale = "en";

function isLocale(value: unknown): value is Locale {
  return LOCALES.some((locale) => locale.value === value);
}

/**
 * The browser's preference, read once to seed a first-time visitor.
 *
 * Matched on the language subtag, so `es`, `es-ES` and `es-419` all land on
 * `es-MX` — a Spanish speaker is better served by Mexican Spanish than by
 * English. There is deliberately no "follow the system" mode, the same choice
 * `theme-store.ts` makes: the browser decides where you start, and after that
 * the choice is yours and stays put.
 */
function browserPreference(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  for (const tag of navigator.languages ?? [navigator.language]) {
    const language = tag.toLowerCase().split("-")[0];
    if (language === "es") return "es-MX";
    if (language === "en") return "en";
  }
  return DEFAULT_LOCALE;
}

function loadPersisted(): Locale {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isLocale(raw)) return raw;
  }
  return browserPreference();
}

export const localeStore = new Store<Locale>(loadPersisted());

/**
 * `lang` on the document, because the browser reads it: it picks hyphenation
 * and quote marks, and it's what a screen reader switches voice on. Applied at
 * import time so the first paint is already right.
 */
function apply(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
}

apply(localeStore.state);

localeStore.subscribe(() => {
  apply(localeStore.state);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, localeStore.state);
  }
});

export function setLocale(locale: Locale): void {
  localeStore.setState(() => locale);
}
