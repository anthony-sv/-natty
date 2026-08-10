import { Link } from "@tanstack/react-router";
import {
  CalculatorIcon,
  CircleDotIcon,
  DumbbellIcon,
  HomeIcon,
  ListIcon,
  TrendingUpIcon,
  UtensilsIcon,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

/**
 * The palette binds Mod+K, which is Cmd on Apple hardware and Ctrl everywhere
 * else — so the cue has to match rather than always showing the Mac glyph.
 * Read once at module scope: touching `navigator` during render would trip the
 * `react-hooks/purity` rule.
 */
const MOD_KEY =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
    ? "⌘"
    : "Ctrl";

const NAV = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/routines", label: "Routines", icon: ListIcon },
  { to: "/progress", label: "Progress", icon: TrendingUpIcon },
  { to: "/nutrition", label: "Nutrition", icon: UtensilsIcon },
  { to: "/calculator", label: "Calculators", icon: CalculatorIcon },
  { to: "/plates", label: "Plate loader", icon: CircleDotIcon },
] as const;

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <DumbbellIcon />
              <span className="text-base font-semibold">!natty</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    render={
                      <Link
                        to={item.to}
                        // Exact on "/" so it isn't active for every route.
                        activeOptions={{ exact: item.to === "/" }}
                      />
                    }
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        <ThemeToggle />
        <p className="px-1 text-xs text-muted-foreground">
          Press <Kbd>{MOD_KEY}K</Kbd> to search
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
