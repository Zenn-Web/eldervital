"use client";

import ScreeningFlow from "@/components/ScreeningFlow";
import { useElderSession } from "@/components/session/ElderSession";

/** Cek Mandiri: hasil disimpan atas nama profil lansia di perangkat ini. */
export default function ElderCheck() {
  const { profile } = useElderSession();
  return (
    <ScreeningFlow
      mode="mandiri"
      homeHref="/lansia"
      homeLabel="Kembali ke beranda"
      saveTarget={profile ? { role: "lansia", userId: profile.deviceUserId, elderId: profile.id } : null}
      helpScriptFor={profile ? { elderName: profile.displayName, ageRange: profile.ageRange } : undefined}
    />
  );
}
