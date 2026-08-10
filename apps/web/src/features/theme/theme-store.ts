import { Store } from "@tanstack/store";

const STORAGE_KEY = "natty.theme.v1";

export type Theme = "light" | "dark";

/**
 * The OS preference, read once to seed a first-time visitor.
 *
 * There is deliberately no "system" mode to pick: the query decides the
 * starting point, and after that the choice is yours and stays put.
 */
function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function loadPersisted(): Theme {
  if (typeof localStorage !== "undefined") {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  }
  return systemPrefersDark() ? "dark" : "light";
}

export const themeStore = new Store<Theme>(loadPersisted());

/**
 * Theming is class-based (`.dark` on an ancestor), so the choice has to be
 * written onto the document rather than passed through React.
 */
function apply(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  // Lets form controls, scrollbars and the like follow along.
  document.documentElement.style.colorScheme = theme;
}

// Applied at import time so the first paint is already correct, rather than
// flashing the wrong theme and correcting in an effect.
apply(themeStore.state);

themeStore.subscribe(() => {
  apply(themeStore.state);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, themeStore.state);
  }
});

export function setTheme(theme: Theme): void {
  themeStore.setState(() => theme);
}

export function toggleTheme(): void {
  themeStore.setState((theme) => (theme === "dark" ? "light" : "dark"));
}
