"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CaregiverPairing } from "@/modules/onboarding/components/CaregiverPairing";
import { extractToken } from "@/lib/pairing";

/**
 * /caregiver/hubungkan. URL di QR lansia mengarah ke sini (#t=<token>), jadi kamera bawaan
 * ponsel bisa langsung membuka halaman ini. Halaman berada di dalam CaregiverSession,
 * sehingga caregiver yang belum masuk diminta masuk dulu.
 */
export default function ConnectElder() {
  const router = useRouter();
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const t = extractToken(window.location.hash);
    // Hapus token dari bilah alamat dan riwayat browser.
    if (t) history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- membaca URL sekali saat dibuka
    setToken(t);
  }, []);

  if (token === undefined) return null;
  return (
    <div className="max-w-md mx-auto">
      <CaregiverPairing initialToken={token} onPaired={() => router.push("/caregiver")} onBack={() => router.push("/caregiver")} />
    </div>
  );
}
