import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import {
  ChevronsUpDownIcon,
  LogInIcon,
  LogOutIcon,
  UserCircleIcon,
  UserIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { displayName, initialsOf } from "@/features/profile/identity";
import { profileStore } from "@/features/profile/profile-store";
import { useOwnHandle } from "@/features/profile/use-handle";
import { useT } from "@/i18n/use-t";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../client";
import { useSession } from "../session-store";

/**
 * Who you're signed in as — and, either way, the door to `/profile`.
 *
 * Two shapes, one menu. `wide` is the sidebar footer's row with a name and an
 * email; `compact` is the header's avatar button, which is the one that
 * survives the sidebar collapsing on a phone. They share everything below the
 * trigger, so the account can't offer different things in different corners.
 *
 * **Signed out, this is still a menu, not a bare "Sign in" link.** Height,
 * sex, wrist and ankle on `/profile` work with no account — FFMI and the
 * potential estimate both do — and the avatar corner is where every app this
 * one is judged against puts "settings about you". Hiding `/profile` behind
 * signing in first would make it unreachable for most people, since accounts
 * are optional by design. The trigger is `UserAvatar` with no name, which is
 * already the app's placeholder-person icon — no second icon to invent.
 */
export function UserMenu({
  variant = "wide",
}: {
  variant?: "wide" | "compact";
}) {
  const t = useT();
  const session = useSession();
  const profile = useStore(profileStore);
  // Called unconditionally — the branches below return before this point for
  // the signed-out/no-Supabase cases, and hooks can't follow them there.
  const handle = useOwnHandle(session.userId);

  // No Supabase project: there's no session to offer, ever — so this is a
  // single link rather than a menu with one dead-end item in it. `/profile`
  // still works fully offline, which is what keeps this from being `null`.
  if (!isSupabaseConfigured) {
    return variant === "compact" ? (
      <Button
        variant="ghost"
        size="icon"
        nativeButton={false}
        aria-label={t("profile.title")}
        render={<Link to="/profile" />}
      >
        <UserCircleIcon />
      </Button>
    ) : (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link to="/profile" />}>
            <UserCircleIcon />
            <span>{t("profile.title")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // `loading` renders the signed-out affordance rather than nothing: the
  // session settles in milliseconds, and chrome that appears late makes the
  // whole layout jump.
  if (session.status !== "signed-in") {
    const avatar = <UserAvatar name="" className="size-8 rounded-lg" />;
    const menu = (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            variant === "compact" ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("account.title")}
                className="rounded-lg"
              >
                {avatar}
              </Button>
            ) : (
              <SidebarMenuButton size="lg">
                {avatar}
                <span className="flex-1 text-left text-sm font-medium">
                  {t("account.title")}
                </span>
                <ChevronsUpDownIcon className="ml-auto" />
              </SidebarMenuButton>
            )
          }
        />
        <DropdownMenuContent
          side={variant === "compact" ? "bottom" : "top"}
          align="end"
          className="min-w-56"
        >
          <DropdownMenuItem render={<Link to="/profile" />}>
            <UserCircleIcon />
            {t("profile.title")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link to="/account" />}>
            <LogInIcon />
            {t("account.signIn")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    return variant === "compact" ? (
      menu
    ) : (
      <SidebarMenu>
        <SidebarMenuItem>{menu}</SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const name = displayName(profile.displayName, session.email) ?? "";
  const avatar = (
    <UserAvatar
      name={name}
      avatarUrl={profile.avatarUrl}
      className="size-8 rounded-lg"
    />
  );

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          variant === "compact" ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("account.title")}
              className="rounded-lg"
            >
              {avatar}
            </Button>
          ) : (
            <SidebarMenuButton size="lg">
              {avatar}
              {/* min-w-0 so a long email truncates instead of printing over
                  the chevron — the flex rule this codebase keeps
                  relearning. */}
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {session.email}
                </span>
                {/* Omitted rather than a placeholder row — most accounts
                    haven't claimed one, and "no handle" isn't worth a line. */}
                {handle ? (
                  <span className="truncate text-xs text-muted-foreground">
                    @{handle}
                  </span>
                ) : null}
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          )
        }
      />
          <DropdownMenuContent
            side={variant === "compact" ? "bottom" : "top"}
            align="end"
            className="min-w-56"
          >
            {/* The Group is required, not decoration: `DropdownMenuLabel` is
                Base UI's `GroupLabel`, and one outside a Group throws — the
                same trap `SessionPlayer` documents. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 font-normal">
                <UserAvatar
                  name={name}
                  avatarUrl={profile.avatarUrl}
                  className="size-8 rounded-lg"
                />
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {session.email}
                  </span>
                  {handle ? (
                    <span className="truncate text-xs text-muted-foreground">
                      @{handle}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/profile" />}>
              <UserCircleIcon />
              {t("profile.title")}
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/account" />}>
              <UserIcon />
              {t("account.title")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void getSupabaseBrowserClient()
                  .auth.signOut()
                  .then(({ error }) => {
                    toast.add(
                      error
                        ? {
                            title: t("account.signOutError"),
                            description: error.message,
                            type: "error",
                          }
                        : { title: t("account.signedOut"), type: "success" },
                    );
                  });
              }}
            >
              <LogOutIcon />
              {t("account.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
    </DropdownMenu>
  );

  // The header drops it straight in; the sidebar needs its menu scaffolding
  // for the row to size and indent like every other one.
  return variant === "compact" ? (
    menu
  ) : (
    <SidebarMenu>
      <SidebarMenuItem>{menu}</SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * The provider's picture when there is one, initials when there isn't.
 *
 * `AvatarImage` falls back on its own if the URL 404s, which providers' CDNs
 * do once a linked account goes away — so the fallback isn't only for people
 * who signed up with an email.
 */
export function UserAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl?: string;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
      <AvatarFallback className="rounded-lg">
        {name ? initialsOf(name) : <UserIcon className="size-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
