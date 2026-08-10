import { useStore } from "@tanstack/react-store";
import { LanguagesIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALES, localeStore, setLocale, type Locale } from "./locale-store";
import { useT } from "./use-t";

/**
 * The language picker, for the sidebar footer beside the theme toggle.
 *
 * A `Select` rather than the `Switch` the theme uses: a theme is binary and a
 * language list isn't, and the house rule is Select when the list doesn't need
 * searching. Each option is written in its own language, as language pickers
 * always are — someone looking for Spanish is not reading the English word for
 * it.
 */
export function LocaleSelect() {
  const locale = useStore(localeStore, (s) => s);
  const t = useT();

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <LanguagesIcon className="text-muted-foreground" data-icon="inline-start" />
      <Select
        items={LOCALES}
        value={locale}
        onValueChange={(value) => setLocale(value as Locale)}
      >
        <SelectTrigger aria-label={t("nav.language")} className="h-8 flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
