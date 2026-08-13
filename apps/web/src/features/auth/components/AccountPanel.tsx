import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { LogInIcon, LogOutIcon, UploadIcon, UserPlusIcon } from "lucide-react";
import { z } from "zod";
import { useStore } from "@tanstack/react-store";
import { Input as TextInput } from "@/components/ui/input";
import { displayName } from "@/features/profile/identity";
import { profileStore, setProfile } from "@/features/profile/profile-store";
import { handleProblem, suggestHandle } from "@/features/profile/handle";
import { claimHandle, fetchHandle } from "@/server/handles";
import { uploadLocalData } from "../upload";
import { UserAvatar } from "./UserMenu";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useT, type Translate } from "@/i18n/use-t";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../client";
import { useSession } from "../session-store";
import { ProviderButtons } from "./ProviderButtons";

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
        <ProfileCard email={session.email} />
        <UploadCard />
      </>
    );
  }

  return <SignInCard />;
}

/**
 * Who you are, and the way out.
 *
 * The username is written through on change like `ProfileFields` — no submit
 * button, because a single field behind one is a button you press to confirm
 * you meant the thing you just typed. It syncs with the rest of the profile.
 */
function ProfileCard({ email }: { email: string | null }) {
  const t = useT();
  const profile = useStore(profileStore);
  const name = displayName(profile.displayName, email) ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={name}
            avatarUrl={profile.avatarUrl}
            className="size-12"
          />
          <div className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate font-medium">{name}</span>
            <span className="truncate text-sm text-muted-foreground">
              {email}
            </span>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor="account-username">
            {t("account.username")}
          </FieldLabel>
          <TextInput
            id="account-username"
            value={profile.displayName ?? ""}
            maxLength={40}
            placeholder={t("account.usernamePlaceholder")}
            onChange={(e) => {
              const value = e.target.value;
              // Empty clears it rather than storing "", so the fallback chain
              // takes over again instead of showing a blank name.
              setProfile({ displayName: value.trim() === "" ? undefined : value });
            }}
          />
          <FieldDescription>{t("account.usernameHelp")}</FieldDescription>
        </Field>

        <HandleField name={name} />

        <div>
          <Button
            variant="outline"
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
            <LogOutIcon data-icon="inline-start" />
            {t("account.signOut")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Claiming `@you`.
 *
 * A separate field from the display name above, and separately saved: this
 * one is unique, so it has to ask the server, and it can be refused. It
 * validates with the same function the server does, so the field can't call
 * something fine that the server then rejects for shape — only for being
 * taken, which the field genuinely cannot know.
 */
function HandleField({ name }: { name: string }) {
  const t = useT();
  const [value, setValue] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "taken">("idle");

  // Read once on mount. `useState` initialiser rather than an effect, since
  // `react-hooks/set-state-in-effect` is enforced outside `ui/`.
  const [loaded] = useState(() =>
    fetchHandle()
      .then((existing) => {
        setSaved(existing);
        setValue(existing ?? "");
      })
      .catch(() => setValue("")),
  );
  void loaded;

  if (value === undefined) return null;

  const problem = value.trim() === "" ? undefined : handleProblem(value);
  const dirty = value !== (saved ?? "");
  const canSave = dirty && value.trim() !== "" && problem === undefined;

  return (
    <Field>
      <FieldLabel htmlFor="account-handle">{t("account.handle")}</FieldLabel>
      <div className="flex items-center gap-2">
        {/* The @ is chrome, not something you type — putting it in the value
            means every rule has to strip it first. */}
        <span className="text-muted-foreground">@</span>
        <TextInput
          id="account-handle"
          value={value}
          maxLength={20}
          placeholder={suggestHandle(name)}
          onChange={(e) => {
            setStatus("idle");
            setValue(e.target.value.toLowerCase());
          }}
          className="flex-1"
        />
        <Button
          variant="outline"
          disabled={!canSave || status === "saving"}
          onClick={() => {
            setStatus("saving");
            void claimHandle({ data: value })
              .then((result) => {
                if (result.ok) {
                  setSaved(result.handle);
                  setValue(result.handle);
                  setStatus("idle");
                  toast.add({ title: t("account.handleSaved"), type: "success" });
                } else {
                  setStatus(result.reason === "taken" ? "taken" : "idle");
                }
              })
              .catch(() => setStatus("idle"));
          }}
        >
          {t("account.handleSave")}
        </Button>
      </div>
      <FieldDescription>
        {status === "taken"
          ? t("account.handleTaken")
          : problem !== undefined
            ? t(`account.handleProblem.${problem}`)
            : t("account.handleHelp")}
      </FieldDescription>
    </Field>
  );
}

/**
 * Putting this device's data into the account.
 *
 * The diff runs when you press it rather than continuously: answering "what's
 * missing" for nine collections needs both sides of each awake, and doing
 * that on every render of the account page would fetch the whole account to
 * draw one number. Pressing it is already the moment you want the answer, and
 * the result says exactly what moved.
 */
function UploadCard() {
  const t = useT();
  const [busy, setBusy] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.upload.title")}</CardTitle>
        <CardDescription>{t("account.upload.body")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void uploadLocalData()
              .then((result) => {
                if (result.total === 0) {
                  toast.add({ title: t("account.upload.none"), type: "info" });
                  return;
                }
                toast.add({
                  title: t.plural("account.upload.done", result.total, {
                    count: result.total,
                  }),
                  description: result.uploaded
                    .map((row) => `${t(row.labelKey)}: ${row.count}`)
                    .join(" · "),
                  type: "success",
                });
              })
              .catch(() => {
                toast.add({ title: t("account.upload.error"), type: "error" });
              })
              .finally(() => setBusy(false));
          }}
        >
          <UploadIcon data-icon="inline-start" />
          {busy ? t("account.upload.uploading") : t("account.upload.action")}
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
        <ProviderButtons />
        <FieldSeparator className="my-6">{t("account.or")}</FieldSeparator>
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
