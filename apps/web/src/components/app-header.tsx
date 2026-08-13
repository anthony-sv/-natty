import { useStore } from "@tanstack/react-store";
import { CheckIcon, LanguagesIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { setTheme, themeStore } from "@/features/theme/theme-store";
import { LOCALES, localeStore, setLocale } from "@/i18n/locale-store";
import { useT } from "@/i18n/use-t";

/**
 * The bar across the top: the sidebar handle on the left, and the controls
 * that belong to the app rather than to the page on the right.
 *
 * **Theme, language and the account moved up here from the sidebar footer**,
 * because the sidebar collapses on a phone and took them with it — the one
 * place they were reachable was behind opening a panel. This bar is on every
 * screen at every width, and it was otherwise empty.
 */
export function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      {/* Pushes the controls right, and is what keeps the bar usable as the
          page title lands here later. */}
      <div className="ml-auto flex items-center gap-1">
        <LocaleMenu />
        <ThemeButton />
        <UserMenu variant="compact" />
      </div>
    </header>
  );
}

/**
 * Theme as a single button rather than the footer's labelled switch.
 *
 * A switch needs its label to say what it switches; an icon that shows the
 * *other* state is the convention everywhere and needs no room. The label
 * survives as the accessible name.
 */
function ThemeButton() {
  const theme = useStore(themeStore);
  const t = useT();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("nav.darkMode")}
      onClick={() => setTheme(next)}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

/**
 * Language as a menu rather than a Select.
 *
 * The house rule is Select when the list doesn't need searching — which is
 * why the sidebar's was one. In a header there's no room for a trigger wide
 * enough to show the current value, so this is an icon with the choice
 * marked inside, which is what every app does with two languages.
 */
function LocaleMenu() {
  const locale = useStore(localeStore);
  const t = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t("nav.language")}>
            <LanguagesIcon />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          {LOCALES.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setLocale(option.value)}
            >
              {/* A fixed slot for the tick, so the labels line up whether or
                  not a row is the current one. */}
              <span className="flex w-4 justify-center">
                {option.value === locale ? <CheckIcon /> : null}
              </span>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
