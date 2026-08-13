import { Page } from "@/components/page";
import { useDateFormat, useT, type MessageKey } from "@/i18n/use-t";

/**
 * The frame both `/privacy` and `/terms` render in.
 *
 * Long-form prose rather than the guide's cards: these are read start to
 * finish or not at all, and a card per paragraph would imply they're
 * skimmable in the order you like. Every string is still a message key, so
 * `i18n.test.ts` catches a section that only got written in one language —
 * which is the failure mode for pages nobody reads until they need them.
 */
export interface LegalSection {
  id: string;
  titleKey: MessageKey;
  bodyKeys: MessageKey[];
}

/** When the text last changed. Shown, because a policy with no date is a claim
 *  with no shelf life. */
const UPDATED_AT = Date.parse("2026-08-13T00:00:00Z");

const UPDATED_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export function LegalPage({
  titleKey,
  subtitleKey,
  sections,
}: {
  titleKey: MessageKey;
  subtitleKey: MessageKey;
  sections: LegalSection[];
}) {
  const t = useT();
  // Built from the app's locale rather than the browser's, like every other
  // date in the app.
  const dateFormat = useDateFormat(UPDATED_OPTIONS);

  return (
    <Page className="max-w-3xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t(titleKey)}</h1>
        <p className="text-sm text-muted-foreground">{t(subtitleKey)}</p>
        <p className="text-xs text-muted-foreground">
          {t("legal.updated", { date: dateFormat.format(UPDATED_AT) })}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{t(section.titleKey)}</h2>
            {section.bodyKeys.map((key) => (
              <p key={key} className="text-sm leading-relaxed text-muted-foreground">
                {t(key)}
              </p>
            ))}
          </section>
        ))}
      </div>
    </Page>
  );
}
