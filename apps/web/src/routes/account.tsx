import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/page";
import { useT } from "@/i18n/use-t";
import { AccountPanel } from "@/features/auth/components/AccountPanel";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const t = useT();
  return (
    <Page className="max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold">{t("account.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("account.localNote")}</p>
      </div>
      <AccountPanel />
    </Page>
  );
}
