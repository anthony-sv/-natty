import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileCard } from "@/features/profile/components/ProfileCard";
import { useT } from "@/i18n/use-t";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

/**
 * Standing facts about your body, in the one place that owns them.
 *
 * Reachable with no account — height, sex, wrist and ankle drive FFMI and the
 * natural-potential estimate, and both work fully signed out. `/account` gets
 * away with living only behind the avatar menu because it's genuinely
 * unusable without signing in; this page isn't, so it gets its own header
 * button (`ProfileButton` in `app-header.tsx`) rather than hiding behind a
 * menu that a signed-out visitor never sees open.
 */
function ProfilePage() {
  const t = useT();
  return (
    <Page className="max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold">{t("profile.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.cardTitle")}</CardTitle>
          <CardDescription>{t("profile.cardBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileCard />
        </CardContent>
      </Card>
    </Page>
  );
}
