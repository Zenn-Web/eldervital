"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SplashScreen } from "./components/SplashScreen";
import { RoleSelector } from "./components/RoleSelector";
import { ElderProfileForm } from "./components/ElderProfileForm";
import { ElderQrDisplay } from "./components/ElderQrDisplay";
import { CaregiverAuthForm } from "./components/CaregiverAuthForm";
import { CaregiverPairing } from "./components/CaregiverPairing";
import { ScheduleSetup } from "./components/ScheduleSetup";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadElderProfile } from "@/lib/auth/elder";
import { saveReminders, saveStoredReminders } from "@/lib/reminders";
import { errorMessage } from "@/lib/supabase/errors";

/**
 * Pengguna yang sudah punya sesi tidak perlu mengulang onboarding: lansia dengan profil
 * langsung ke /lansia, caregiver yang sudah masuk langsung ke /caregiver.
 */
async function existingHome(role: "lansia" | "caregiver"): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data } = await getSupabase(role).auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    if (role === "caregiver") return user.is_anonymous ? null : "/caregiver";
    return (await loadElderProfile(user.id)) ? "/lansia" : null;
  } catch {
    return null; // offline atau galat: lanjutkan onboarding seperti biasa
  }
}

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
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  /** Simpan jadwal ke reminder_schedules (bila tersambung), lalu ke beranda lansia. */
  async function finishSchedule(items: { label: string; time: string; enabled: boolean }[]) {
    // Simpan ke local storage agar tersimpan di demo maupun produksi
    const stored = items.map((it) => ({
      id: it.label.toLowerCase(),
      label: it.label,
      time: it.time,
      enabled: it.enabled,
    }));
    saveStoredReminders(stored);

    if (!isSupabaseConfigured()) {
      router.push("/lansia");
      return;
    }

    setScheduleSaving(true);
    setScheduleError(null);
    try {
      const { data } = await getSupabase("lansia").auth.getSession();
      const profile = data.session ? await loadElderProfile(data.session.user.id) : null;
      if (!profile) throw new Error("profil lansia belum dibuat");
      await saveReminders(profile.id, items);
      router.push("/lansia");
    } catch (e) {
      setScheduleError(errorMessage(e));
    } finally {
      setScheduleSaving(false);
    }
  }

  // Tautan "/?peran=caregiver" (dari halaman caregiver yang belum masuk) langsung ke formulir akun.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("peran") === "caregiver") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- membaca URL sekali saat dibuka
      setStep("caregiver-auth");
    }
  }, []);

  async function chooseRole(role: "lansia" | "caregiver") {
    const home = await existingHome(role);
    if (home) router.push(home);
    else setStep(role === "lansia" ? "elder-profile" : "caregiver-auth");
  }
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
                chooseRole(role === "lansia" ? "lansia" : "caregiver");
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
              onFinish={finishSchedule}
              saving={scheduleSaving}
              error={scheduleError}
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
