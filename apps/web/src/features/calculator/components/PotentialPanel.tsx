import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useBodyEntries } from "@/features/body/collection";
import { leanMassKg } from "@/features/body/ffmi";
import { profileStore } from "@/features/profile/profile-store";
import { potentialFor } from "../casey-butt";
import { PotentialResults } from "./PotentialResults";
import { parseMeasurement } from "../parse";
import { useT } from "@/i18n/use-t";

/** Casey Butt's model: how much muscle a given frame can carry drug-free. */
export function PotentialPanel() {
  const t = useT();
  const profile = useStore(profileStore, (s) => s);
  const { latest } = useBodyEntries();

  // Height, wrist and ankle are read from the profile rather than typed here
  // — they used to be a second copy of the same three fields the body tab
  // asked for, and a typo fixed on one page left the other one wrong. Body
  // fat stays local: it's the one input that moves, and the weigh-in log
  // already owns the real history of it, so this is a what-if dial rather
  // than a record.
  const currentBodyFat = latest?.bodyFatPercent;
  const [bodyFat, setBodyFat] = useState(
    currentBodyFat === undefined ? "" : String(currentBodyFat),
  );

  const potential = potentialFor({
    heightCm: profile.heightCm,
    wristCm: profile.wristCm,
    ankleCm: profile.ankleCm,
    bodyFatPercent: parseMeasurement(bodyFat),
  });

  const currentLean = latest ? leanMassKg(latest) : undefined;
  const framePresent =
    profile.heightCm !== undefined &&
    profile.wristCm !== undefined &&
    profile.ankleCm !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("calc.potential.measurements")}</CardTitle>
          <CardDescription>
            {t("calc.potential.measurementsBody")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-start gap-4">
          {/* Height, wrist and ankle are read-only here — one edit surface on
              /profile, not two forms that can quietly disagree. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="text-muted-foreground">{t("common.heightCm")}: </span>
              <span className="font-medium tabular-nums">
                {profile.heightCm ?? t("common.none")}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">{t("profile.wristCm")}: </span>
              <span className="font-medium tabular-nums">
                {profile.wristCm ?? t("common.none")}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">{t("profile.ankleCm")}: </span>
              <span className="font-medium tabular-nums">
                {profile.ankleCm ?? t("common.none")}
              </span>
            </span>
            <Link
              to="/profile"
              className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {framePresent ? t("calc.potential.editFrame") : t("calc.potential.setFrame")}
            </Link>
          </div>

          <Field className="w-40">
            <FieldLabel htmlFor="calc-bodyfat">
              {t("common.bodyFatPercent")}
            </FieldLabel>
            <Input
              id="calc-bodyfat"
              type="number"
              inputMode="decimal"
              min="0"
              max="99"
              step="0.1"
              placeholder={t("calc.potential.exampleBodyFat")}
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
            <FieldDescription>
              {currentBodyFat === undefined
                ? t("calc.potential.noWeighIn")
                : t("calc.potential.lastWeighIn", { percent: currentBodyFat })}
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("calc.potential.max")}</CardTitle>
          <CardDescription>{t("calc.potential.maxBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          {potential === undefined ? (
            <Empty>
              <EmptyTitle>{t("calc.potential.fillAll")}</EmptyTitle>
              <EmptyDescription>
                {framePresent
                  ? t("calc.potential.fillAllBody")
                  : t("calc.potential.needFrame")}
              </EmptyDescription>
              {!framePresent ? (
                <Link
                  to="/profile"
                  className="text-sm underline underline-offset-2 hover:text-foreground"
                >
                  {t("calc.potential.setFrame")}
                </Link>
              ) : null}
            </Empty>
          ) : (
            <PotentialResults
              potential={potential}
              currentLeanMassKg={currentLean}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("calc.potential.whatThisIs")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>{t("calc.potential.explain1")}</p>
          {/* The formula itself is notation, not prose — it reads the same in
              every language, so it sits outside the translated paragraph. */}
          <p className="font-mono text-xs">
            M = H^1.5 × (√W ÷ 322.4 + √A ÷ 241.9) × (F ÷ 224 + 1)
          </p>
          <p>{t("calc.potential.explain2")}</p>
          <p>{t("calc.potential.explain3")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
