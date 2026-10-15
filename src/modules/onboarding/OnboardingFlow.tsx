"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-[#EDE7DD] py-2 sm:py-6 sm:px-4 flex flex-col items-center justify-center font-sans antialiased gap-2">
      {/* Simulation Banner - placed neatly above the phone mockup so it does not distort the device screen */}
      <div className="w-full max-w-[390px] text-center px-2 shrink-0">
        <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-ink/10 text-ink-soft text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-sogan shrink-0" />
          Prototipe Demo &bull; Data bersifat simulasi
        </span>
      </div>

      {/* Phone Mockup Frame */}
      <div className="w-full max-w-[390px] h-[780px] max-h-[92vh] bg-paper sm:rounded-[36px] shadow-2xl sm:border sm:border-line/40 flex flex-col relative overflow-hidden">
        <main id="isi" className="w-full flex-1 flex flex-col overflow-y-auto">
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
              displayName={elderProfile.displayName}
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
      </div>
    </div>
  );
}
