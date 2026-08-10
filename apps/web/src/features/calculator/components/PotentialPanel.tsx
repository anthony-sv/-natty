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
            Wrist and ankle at their narrowest point. Height, wrist and ankle
            are saved to your profile; body fat starts from your last weigh-in
            and you can move it to see what changes.
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
                ? "No weigh-in to draw from yet."
                : `Last weigh-in: ${currentBodyFat}%.`}
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("calc.potential.max")}</CardTitle>
          <CardDescription>
            Dr Casey Butt's model, fitted to the measurements of drug-free
            bodybuilders. The second, smaller figure against each is 95% of the
            maximum — the one usually described as realistically achievable.
          </CardDescription>
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
          <p>
            The model predicts peak lean body mass — everything that isn't fat,
            so muscle plus bone, organs and water — from four numbers:{" "}
            <span className="font-mono text-xs">
              M = H^1.5 × (√W ÷ 322.4 + √A ÷ 241.9) × (F ÷ 224 + 1)
            </span>
            , with H, W and A in centimetres and M in kilograms. Wrist and ankle
            stand in for skeletal frame, since they're mostly bone and tendon
            and barely move with training.
          </p>
          <p>
            It's a curve fitted to a population of drug-free bodybuilders, not a
            law. Genetics, muscle insertions, training history and endocrine
            variation all move the real answer, and none of them are inputs
            here. Read it as roughly where the distribution sits for a frame
            like yours, not as a limit on you in particular.
          </p>
          <p>
            The girth predictions are the same model's estimates for the size
            each measurement reaches at that lean mass — chest and biceps from
            wrist and height, thigh and calf from ankle and height.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
