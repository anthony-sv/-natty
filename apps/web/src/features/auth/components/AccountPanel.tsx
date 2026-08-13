import { useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useLiveQuery } from "@tanstack/react-db";
import { LogInIcon, LogOutIcon, UploadIcon, UserPlusIcon } from "lucide-react";
import { z } from "zod";
import {
  localBodyEntries,
  syncedBodyEntries,
} from "@/features/body/collection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useT, type Translate } from "@/i18n/use-t";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../client";
import { useSession } from "../session-store";

/** Built per locale — Zod bakes messages into the schema. */
const buildSchema = (t: Translate) =>
  z.object({
    email: z.string().email(t("account.emailError")),
    // Supabase's default minimum; its own error would arrive in English.
    password: z.string().min(6, t("account.passwordError")),
  });

export function AccountPanel() {
  const t = useT();
  const session = useSession();

  // A build with no Supabase project still runs — it just has no accounts to
  // offer, and says so rather than showing a form that can't work.
  if (!isSupabaseConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("account.title")}</CardTitle>
          <CardDescription>{t("account.unavailable")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (session.status === "loading") return null;

  if (session.status === "signed-in") {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>{t("account.title")}</CardTitle>
            <CardDescription>
              {t("account.signedInAs", { email: session.email ?? "" })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                void getSupabaseBrowserClient()
                  .auth.signOut()
                  .then(({ error }) => {
                    if (error) {
                      toast.add({
                        title: t("account.signOutError"),
                        description: error.message,
                        type: "error",
                      });
                    } else {
                      toast.add({
                        title: t("account.signedOut"),
                        type: "success",
                      });
                    }
                  });
              }}
            >
              <LogOutIcon data-icon="inline-start" />
              {t("account.signOut")}
            </Button>
          </CardContent>
        </Card>
        <UploadWeighInsCard />
      </>
    );
  }

  return <SignInCard />;
}

/**
 * The migration path for this device's data, one collection at a time —
 * weigh-ins are the pilot. Local rows are never cleared: signed out, this
 * device still shows its own data, and the upload is idempotent (upsert on
 * `(user_id, id)`), so pressing it twice is harmless.
 */
function UploadWeighInsCard() {
  const t = useT();
  const synced = syncedBodyEntries();
  const { data: localRows } = useLiveQuery((q) =>
    q.from({ entry: localBodyEntries }),
  );
  const { data: syncedRows, isLoading } = useLiveQuery(
    (q) => q.from({ entry: synced }),
    [synced],
  );

  const pending = useMemo(() => {
    const uploaded = new Set((syncedRows ?? []).map((row) => row.id));
    return (localRows ?? []).filter((row) => !uploaded.has(row.id));
  }, [localRows, syncedRows]);

  // Until the synced side has loaded there's no honest count to show, and a
  // device with nothing new has nothing to say.
  if (isLoading || pending.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          {t.plural("account.upload.pending", pending.length, {
            count: pending.length,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => {
            const transaction = synced.insert(pending);
            void toast.promise(transaction.isPersisted.promise, {
              loading: t("account.upload.uploading"),
              success: { title: t("account.upload.done"), type: "success" },
              error: { title: t("account.upload.error"), type: "error" },
            });
          }}
        >
          <UploadIcon data-icon="inline-start" />
          {t("account.upload.action")}
        </Button>
      </CardContent>
    </Card>
  );
}

function SignInCard() {
  const t = useT();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: buildSchema(t) },
    // Submitting the form is signing in; creating an account is the explicit
    // secondary action below, so it can't happen by pressing Enter.
    onSubmit: async ({ value }) => {
      const { error } = await getSupabaseBrowserClient().auth.signInWithPassword(
        { email: value.email, password: value.password },
      );
      if (error) {
        toast.add({
          title: t("account.signInError"),
          description: error.message,
          type: "error",
        });
      }
      // Success needs no toast — the session store flips and the page
      // re-renders as signed in, which is the feedback.
    },
  });

  const signUp = async () => {
    const value = form.state.values;
    const parsed = buildSchema(t).safeParse(value);
    if (!parsed.success) {
      // Surface the schema errors in place rather than silently ignoring the
      // click — submitting the form is what marks fields touched.
      void form.handleSubmit();
      return;
    }
    const { data, error } = await getSupabaseBrowserClient().auth.signUp({
      email: value.email,
      password: value.password,
    });
    if (error) {
      toast.add({
        title: t("account.signUpError"),
        description: error.message,
        type: "error",
      });
    } else if (!data.session) {
      // Email confirmation is on: the account exists but there's no session
      // until the link in the mail is clicked.
      toast.add({ title: t("account.checkEmail"), type: "info" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.title")}</CardTitle>
        <CardDescription>{t("account.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="email">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="account-email">
                    {t("account.email")}
                  </FieldLabel>
                  <Input
                    id="account-email"
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="account-password">
                    {t("account.password")}
                  </FieldLabel>
                  <Input
                    id="account-password"
                    type="password"
                    autoComplete="current-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    <LogInIcon data-icon="inline-start" />
                    {t("account.signIn")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => void signUp()}
                  >
                    <UserPlusIcon data-icon="inline-start" />
                    {t("account.createAccount")}
                  </Button>
                </div>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
