import type { Formatting } from "@/features/routines/lib/format";
import { DEFAULT_LOCALE, type Locale } from "./locale-store";
import { namesFor } from "./names";
import { translatorFor } from "./use-t";

/**
 * A `Formatting` for tests and any other non-React caller.
 *
 * `useFormatting` is a hook, so a data-layer test can't reach it. Defaults to
 * English, since a test asserting on wording is asserting on the source
 * strings.
 */
export function formattingFor(locale: Locale = DEFAULT_LOCALE): Formatting {
  return { names: namesFor(locale), t: translatorFor(locale) };
}
