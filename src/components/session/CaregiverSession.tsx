"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuthSession } from "@/lib/auth/session";
import { ensureCaregiverProfile, signOutCaregiver, type CaregiverProfile } from "@/lib/auth/caregiver";
import { useOutboxFlush } from "@/lib/exam/outbox";
import { errorMessage } from "@/lib/supabase/errors";
import { Notice, PRIMARY } from "./ElderSession";

interface CaregiverSessionValue {
  /** false: Supabase belum dikonfigurasi, halaman berjalan sebagai simulasi. */
  configured: boolean;
  profile: CaregiverProfile | null;
  setProfile: (p: CaregiverProfile) => void;
}

const Ctx = createContext<CaregiverSessionValue>({ configured: false, profile: null, setProfile: () => {} });

/** Akun caregiver yang sedang masuk. null selama simulasi. */
export const useCaregiverSession = () => useContext(Ctx);

/** Dipasang di layout /caregiver. Tanpa sesi, pengguna diarahkan ke onboarding (/) untuk masuk. */
export default function CaregiverSession({ children }: { children: React.ReactNode }) {
  const auth = useAuthSession("caregiver");
  const user = auth.status === "signed-in" ? auth.session.user : null;
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<CaregiverProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    // Sesi anonim (milik perangkat lansia) tidak boleh dipakai sebagai caregiver.
    if (user.is_anonymous) {
      signOutCaregiver().catch(() => {});
      return;
    }
    ensureCaregiverProfile(user)
      .then((p) => {
        if (!alive) return;
        setProfile(p);
        setError(null);
      })
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
    // Objek user berganti setiap token diperbarui; cukup bergantung pada id-nya.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, attempt]);

  const active = profile && profile.id === userId ? profile : null;
  useOutboxFlush("caregiver", active?.id ?? null);

  if (auth.status === "unconfigured") {
    return <Ctx.Provider value={{ configured: false, profile: null, setProfile }}>{children}</Ctx.Provider>;
  }
  if (active) {
    return <Ctx.Provider value={{ configured: true, profile: active, setProfile }}>{children}</Ctx.Provider>;
  }
  if (auth.status === "signed-out") {
    return (
      <Notice title="Masuk sebagai caregiver" text="Masuk atau daftar akun caregiver terlebih dahulu.">
        <Link href="/?peran=caregiver" className={PRIMARY}>
          Masuk atau daftar
        </Link>
      </Notice>
    );
  }
  if (error) {
    return (
      <Notice title="Akun belum bisa dimuat" text={error}>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className={PRIMARY}>
          Coba lagi
        </button>
      </Notice>
    );
  }
  return <p role="status" className="text-base text-ink-soft py-6">Memuat akun...</p>;
}
