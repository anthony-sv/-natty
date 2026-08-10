import { useState } from "react";
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
import { profileStore, setProfile } from "@/features/profile/profile-store";
import { potentialFor } from "../casey-butt";
import { PotentialResults } from "./PotentialResults";
import { parseMeasurement } from "../parse";
import { useT } from "@/i18n/use-t";

/** Casey Butt's model: how much muscle a given frame can carry drug-free. */
export function PotentialPanel() {
  const t = useT();
  const profile = useStore(profileStore, (s) => s);
  const { latest } = useBodyEntries();

  // Height, wrist and ankle persist on the profile — they're standing facts,
  // and nobody wants to re-measure their wrist to reload a page. Body fat is
  // local: it's the one input that moves, and the weigh-in log already owns
  // the real history of it, so this is a what-if dial rather than a record.
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
          <Field className="w-40">
            <FieldLabel htmlFor="calc-height">{t("common.heightCm")}</FieldLabel>
            <Input
              id="calc-height"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.5"
              placeholder={t("calc.potential.exampleHeight")}
              value={profile.heightCm ?? ""}
              onChange={(e) =>
                setProfile({ heightCm: parseMeasurement(e.target.value) })
              }
            />
          </Field>

          <Field className="w-40">
            <FieldLabel htmlFor="calc-wrist">{t("calc.potential.wristCm")}</FieldLabel>
            <Input
              id="calc-wrist"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              placeholder={t("calc.potential.exampleWrist")}
              value={profile.wristCm ?? ""}
              onChange={(e) =>
                setProfile({ wristCm: parseMeasurement(e.target.value) })
              }
            />
            <FieldDescription>{t("calc.potential.wristHint")}</FieldDescription>
          </Field>

          <Field className="w-40">
            <FieldLabel htmlFor="calc-ankle">{t("calc.potential.ankleCm")}</FieldLabel>
            <Input
              id="calc-ankle"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              placeholder={t("calc.potential.exampleAnkle")}
              value={profile.ankleCm ?? ""}
              onChange={(e) =>
                setProfile({ ankleCm: parseMeasurement(e.target.value) })
              }
            />
            <FieldDescription>{t("calc.potential.ankleHint")}</FieldDescription>
          </Field>

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
                {t("calc.potential.fillAllBody")}
              </EmptyDescription>
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
