"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuthSession } from "@/lib/auth/session";
import { loadElderProfile, type ElderProfile } from "@/lib/auth/elder";
import { useOutboxFlush } from "@/lib/exam/outbox";
import { errorMessage } from "@/lib/supabase/errors";

interface ElderSessionValue {
  /** false: Supabase belum dikonfigurasi, halaman berjalan sebagai simulasi. */
  configured: boolean;
  profile: ElderProfile | null;
  setProfile: (p: ElderProfile) => void;
}

const Ctx = createContext<ElderSessionValue>({ configured: false, profile: null, setProfile: () => {} });

/** Profil lansia di perangkat ini. null selama simulasi. */
export const useElderSession = () => useContext(Ctx);

/**
 * Dipasang di layout /lansia. Memuat sesi anonim dan profil lansia sekali, lalu
 * membagikannya ke semua halaman. Tanpa profil, pengguna diarahkan ke onboarding (/).
 */
export default function ElderSession({ children }: { children: React.ReactNode }) {
  const auth = useAuthSession("lansia");
  const userId = auth.status === "signed-in" ? auth.session.user.id : null;
  const [profile, setProfile] = useState<ElderProfile | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    loadElderProfile(userId)
      .then((p) => {
        if (!alive) return;
        setProfile(p);
        setError(null);
        setLoadedFor(userId);
      })
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [userId, attempt]);

  const active = profile && profile.deviceUserId === userId ? profile : null;
  // Kirim pemeriksaan yang tertunda (mis. dibuat saat offline).
  useOutboxFlush("lansia", active?.deviceUserId ?? null);

  if (auth.status === "unconfigured") {
    return <Ctx.Provider value={{ configured: false, profile: null, setProfile }}>{children}</Ctx.Provider>;
  }
  if (active) {
    return <Ctx.Provider value={{ configured: true, profile: active, setProfile }}>{children}</Ctx.Provider>;
  }
  if (error) {
    return (
      <Notice title="Profil belum bisa dimuat" text={error}>
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className={PRIMARY}>
          Coba lagi
        </button>
      </Notice>
    );
  }
  if (auth.status === "loading" || (userId && loadedFor !== userId)) {
    return <p role="status" className="text-base text-ink-soft py-6">Memuat profil...</p>;
  }
  return (
    <Notice
      title="Profil belum dibuat"
      text="Buat profil di perangkat ini terlebih dahulu. Cukup nama panggilan, tanpa email atau password."
    >
      <Link href="/" className={PRIMARY}>
        Buat profil
      </Link>
    </Notice>
  );
}

export const PRIMARY =
  "w-full min-h-[60px] px-6 py-4 rounded-2xl bg-primary text-white font-bold text-lg flex items-center justify-center hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus";

export function Notice({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <section className="space-y-4 max-w-md mx-auto py-4" role="status">
      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">{title}</h1>
      <p className="text-base text-ink-soft">{text}</p>
      {children}
    </section>
  );
}
