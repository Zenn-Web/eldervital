"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SimBanner from "@/components/SimBanner";
import { SplashScreen } from "./components/SplashScreen";
import { RoleSelector } from "./components/RoleSelector";
import { ElderProfileForm } from "./components/ElderProfileForm";
import { ElderQrDisplay } from "./components/ElderQrDisplay";
import { CaregiverAuthForm } from "./components/CaregiverAuthForm";
import { CaregiverPairing } from "./components/CaregiverPairing";
import { ScheduleSetup } from "./components/ScheduleSetup";

type Step =
  | "splash"
  | "role-select"
  | "elder-profile"
  | "elder-qr"
  | "elder-schedule"
  | "caregiver-auth"
  | "caregiver-pairing";

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [elderProfile, setElderProfile] = useState<{ displayName: string; ageRange: string }>({
    displayName: "Bu Sari",
    ageRange: "60-65",
  });

  return (
    <>
      <SimBanner>Prototipe Demo. Data dan pengingat bersifat simulasi.</SimBanner>
      <main id="isi" className="w-full">
        {step === "splash" && (
          <SplashScreen onStart={() => setStep("role-select")} />
        )}

        {step === "role-select" && (
          <RoleSelector
            onSelectRole={(role) => {
              if (role === "lansia") setStep("elder-profile");
              else setStep("caregiver-auth");
            }}
            onBack={() => setStep("splash")}
          />
        )}

        {/* Alur Lansia */}
        {step === "elder-profile" && (
          <ElderProfileForm
            onSaved={(data) => {
              setElderProfile(data);
              setStep("elder-qr");
            }}
            onBack={() => setStep("role-select")}
          />
        )}

        {step === "elder-qr" && (
          <ElderQrDisplay
            displayName={elderProfile.displayName}
            onNext={() => setStep("elder-schedule")}
            onBack={() => setStep("elder-profile")}
          />
        )}

        {step === "elder-schedule" && (
          <ScheduleSetup
            onFinish={() => {
              router.push("/lansia");
            }}
            onBack={() => setStep("elder-qr")}
          />
        )}

        {/* Alur Caregiver */}
        {step === "caregiver-auth" && (
          <CaregiverAuthForm
            onSuccess={() => {
              setStep("caregiver-pairing");
            }}
            onBack={() => setStep("role-select")}
          />
        )}

        {step === "caregiver-pairing" && (
          <CaregiverPairing
            onPaired={() => {
              router.push("/caregiver");
            }}
            onBack={() => setStep("caregiver-auth")}
          />
        )}
      </main>
    </>
  );
}
