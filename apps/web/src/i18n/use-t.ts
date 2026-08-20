import { useMemo } from "react";
import { useStore } from "@tanstack/react-store";
import { localeStore, type Locale } from "./locale-store";
import { en } from "./messages/en";
import { esMX } from "./messages/es-MX";

/**
 * The app's own strings, in the reader's language.
 *
 * Hand-rolled rather than i18next, which would be ~40KB and a declaration-merge
 * dance to get typed keys. Here the English dictionary *is* the type: `es-MX` is
 * declared as `Record<keyof typeof en, string>`, so a missing or misspelled key
 * fails the build instead of rendering a raw key at runtime, and a key deleted
 * from English fails every translation that still carries it.
 *
 * Separate from `names.ts`, which handles authored data — see the note there
 * for why the two have different failure modes.
 */

export type MessageKey = keyof typeof en;

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  en,
  "es-MX": esMX,
};

/** `{name}` placeholders, filled from a plain object. */
export type Vars = Record<string, string | number>;

function interpolate(template: string, vars: Vars | undefined): string {
  if (vars === undefined) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

export interface Translate {
  (key: MessageKey, vars?: Vars): string;
  /**
   * Picks a plural form by `Intl.PluralRules`, not by `n === 1`.
   *
   * English and Spanish happen to agree on one/other, so this looks like
   * overkill for two locales — but hard-coding `=== 1` is the thing that has to
   * be undone later rather than extended, and the count is interpolated as
   * `{count}` either way.
   *
   * Keys are the base plus a suffix: `records.count.one`, `records.count.other`.
   */
  plural: (baseKey: string, count: number, vars?: Vars) => string;
  /** The active locale, for `Intl` formatters that need a tag. */
  locale: Locale;
}

/**
 * The translator, built plainly.
 *
 * Not a hook, so tests and other non-React callers can have one — `useT` is
 * this memoised on the store's locale.
 */
export function translatorFor(locale: Locale): Translate {
  const messages = MESSAGES[locale];
  const rules = new Intl.PluralRules(locale);

  const t = ((key: MessageKey, vars?: Vars) =>
    interpolate(messages[key], vars)) as Translate;

  t.plural = (baseKey, count, vars) => {
    const category = rules.select(count);
    // `other` is guaranteed present for every plural key by the i18n test;
    // the category-specific one may not be, in a locale that doesn't use it.
    const key = (`${baseKey}.${category}` in messages
      ? `${baseKey}.${category}`
      : `${baseKey}.other`) as MessageKey;
    return interpolate(messages[key], { count, ...vars });
  };

  t.locale = locale;
  return t;
}

export function useT(): Translate {
  const locale = useStore(localeStore, (s) => s);
  return useMemo(() => translatorFor(locale), [locale]);
}

/**
 * A memoised `Intl.DateTimeFormat` for the active locale.
 *
 * Every date in the app was built with `undefined` as the locale, which follows
 * the *browser*, not the app — so switching to Spanish would have left the
 * dates in English. Options are keyed by their JSON so a stable object literal
 * isn't required at the call site.
 */
export function useDateFormat(
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const locale = useStore(localeStore, (s) => s);
  const key = JSON.stringify(options);
  return useMemo(
    () =>
      new Intl.DateTimeFormat(
        locale,
        JSON.parse(key) as Intl.DateTimeFormatOptions,
      ),
    [locale, key],
  );
}

/**
 * A memoised `Intl.RelativeTimeFormat` for the active locale — the same rule
 * `useDateFormat` follows, for the same reason: built with `undefined` it
 * would follow the browser's language rather than the app's.
 */
export function useRelativeTimeFormat(
  options?: Intl.RelativeTimeFormatOptions,
): Intl.RelativeTimeFormat {
  const locale = useStore(localeStore, (s) => s);
  const key = JSON.stringify(options ?? {});
  return useMemo(
    () =>
      new Intl.RelativeTimeFormat(
        locale,
        JSON.parse(key) as Intl.RelativeTimeFormatOptions,
      ),
    [locale, key],
  );
}
