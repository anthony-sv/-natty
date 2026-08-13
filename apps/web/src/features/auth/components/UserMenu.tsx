import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import {
  ChevronsUpDownIcon,
  LogInIcon,
  LogOutIcon,
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
import { useT } from "@/i18n/use-t";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../client";
import { useSession } from "../session-store";

/**
 * Who you're signed in as.
 *
 * Two shapes, one menu. `wide` is the sidebar footer's row with a name and an
 * email; `compact` is the header's avatar button, which is the one that
 * survives the sidebar collapsing on a phone. They share everything below the
 * trigger, so the account can't offer different things in different corners.
 */
export function UserMenu({
  variant = "wide",
}: {
  variant?: "wide" | "compact";
}) {
  const t = useT();
  const session = useSession();
  const profile = useStore(profileStore);

  // A build with no Supabase project has no account to show, and the row
  // would be a button that can't do anything.
  if (!isSupabaseConfigured) return null;

  // `loading` renders the signed-out affordance rather than nothing: the
  // session settles in milliseconds, and chrome that appears late makes the
  // whole layout jump.
  if (session.status !== "signed-in") {
    if (variant === "compact") {
      return (
        // `nativeButton={false}` because this renders as an anchor: Base UI
        // warns loudly otherwise, and it's right to — a non-`<button>` still
        // claiming button semantics is the accessibility bug, not the noise.
        // Every other `Button render={<Link/>}` in the app already says it.
        <Button
          variant="ghost"
          size="icon"
          nativeButton={false}
          aria-label={t("account.signIn")}
          render={<Link to="/account" />}
        >
          <LogInIcon />
        </Button>
      );
    }
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link to="/account" />}>
            <LogInIcon />
            <span>{t("account.signIn")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
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
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
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
