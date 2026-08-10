import { useStore } from "@tanstack/react-store";
import { MoonIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/i18n/use-t";
import { setTheme, themeStore } from "./theme-store";

export function ThemeToggle() {
  const theme = useStore(themeStore, (s) => s);
  const t = useT();

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <MoonIcon className="text-muted-foreground" data-icon="inline-start" />
      <Label htmlFor="theme-toggle" className="flex-1 text-sm font-normal">
        {t("nav.darkMode")}
      </Label>
      <Switch
        id="theme-toggle"
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  );
}
