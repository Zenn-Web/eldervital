"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured, type Role } from "@/lib/supabase/client";

export type AuthState =
  | { status: "unconfigured" } // env Supabase kosong: aplikasi berjalan sebagai simulasi
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; session: Session };

/**
 * Status sesi Supabase untuk satu peran.
 *
 * onAuthStateChange memancarkan INITIAL_SESSION sekali (dibaca dari localStorage, jadi
 * tetap bekerja saat offline), lalu setiap perubahan: masuk, keluar, token diperbarui.
 * Komponen cukup bereaksi pada status; tidak perlu memanggil getSession sendiri.
 *
 * Catatan untuk pemakai: objek session berganti setiap token diperbarui (sekitar tiap
 * jam). Efek yang bergantung pada pengguna sebaiknya memakai session.user.id, bukan session.
 */
export function useAuthSession(role: Role): AuthState {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<AuthState>(
    configured ? { status: "loading" } : { status: "unconfigured" },
  );

  useEffect(() => {
    if (!configured) return;
    const { data } = getSupabase(role).auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: "signed-in", session } : { status: "signed-out" });
    });
    return () => data.subscription.unsubscribe();
  }, [configured, role]);

  return state;
}
