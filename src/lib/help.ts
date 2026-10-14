"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured, type Role } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/supabase/errors";

/**
 * Permintaan bantuan (mode "Minta Caregiver", spesifikasi bagian 8).
 *
 * Alur: lansia membuat permintaan (open) -> caregiver terhubung menanggapi (taken) ->
 * selesai (done). Lansia bisa membatalkan (cancelled) kapan saja.
 *
 * Hak akses dari RLS: lansia hanya melihat permintaannya; caregiver hanya melihat
 * permintaan lansia yang hubungannya aktif (tidak perlu izin berbagi hasil, karena
 * permintaan bantuan bukan hasil pemeriksaan).
 *
 * PENTING untuk teks layar: aplikasi tidak bisa memastikan caregiver melihat atau
 * merespons. Realtime hanya mempercepat tampilan bila caregiver sedang membuka aplikasi.
 */

export type HelpStatus = "open" | "taken" | "done" | "cancelled";

export interface HelpRequest {
  id: string;
  elderId: string;
  /** Untuk layar caregiver. null bila RLS tidak mengizinkan membaca profil lansia. */
  elderName: string | null;
  status: HelpStatus;
  /** Caregiver yang menanggapi. */
  takenBy: string | null;
  /** Untuk layar lansia: "Sinta sedang menanggapi". */
  takenByName: string | null;
  createdAt: string;
  handledAt: string | null;
}

const COLUMNS =
  "id, elder_id, status, taken_by, created_at, handled_at, elders(display_name), caregivers(display_name)";

/**
 * Permintaan yang masih berjalan (open dan taken), terbaru lebih dulu. Fungsi yang sama
 * untuk kedua peran: RLS menentukan isinya.
 */
export async function listActiveHelpRequests(role: Role): Promise<HelpRequest[]> {
  const { data, error } = await getSupabase(role)
    .from("help_requests")
    .select(COLUMNS)
    .in("status", ["open", "taken"])
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(rowToHelpRequest);
}

// ---------- Lansia ----------

/**
 * Membuat permintaan. Bila masih ada permintaan yang berjalan, permintaan itu yang
 * dikembalikan, agar tombol yang ditekan berkali-kali tidak membuat permintaan ganda.
 */
export async function createHelpRequest(elderId: string): Promise<HelpRequest> {
  const db = getSupabase("lansia");
  const existing = (await listActiveHelpRequests("lansia")).find((r) => r.elderId === elderId);
  if (existing) return existing;
  const { data, error } = await db
    .from("help_requests")
    .insert({ elder_id: elderId })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return rowToHelpRequest(data);
}

/** Membatalkan permintaan yang masih berjalan. false bila sudah selesai atau dibatalkan. */
export async function cancelHelpRequest(id: string): Promise<boolean> {
  const { data, error } = await getSupabase("lansia")
    .from("help_requests")
    .update({ status: "cancelled", handled_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["open", "taken"])
    .select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

// ---------- Caregiver ----------

/**
 * Menanggapi permintaan. Update bersyarat (status masih open): bila dua caregiver menekan
 * bersamaan, hanya satu yang berhasil; yang lain mendapat false dan sebaiknya memuat ulang.
 */
export async function takeHelpRequest(id: string): Promise<boolean> {
  const db = getSupabase("caregiver");
  const me = await currentUserId(db);
  const { data, error } = await db
    .from("help_requests")
    .update({ status: "taken", taken_by: me, handled_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "open")
    .select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** Menandai selesai. Hanya caregiver yang menanggapi. false bila kondisi tidak terpenuhi. */
export async function completeHelpRequest(id: string): Promise<boolean> {
  const db = getSupabase("caregiver");
  const me = await currentUserId(db);
  const { data, error } = await db
    .from("help_requests")
    .update({ status: "done", handled_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "taken")
    .eq("taken_by", me)
    .select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

// ---------- Realtime ----------

/**
 * Berlangganan perubahan help_requests. onChange tidak membawa data: anggap sebagai tanda
 * "ada yang berubah, muat ulang". Payload Realtime tidak memuat nama (embed), dan memuat
 * ulang lewat listActiveHelpRequests menjamin hasil tetap melewati RLS yang sama.
 * Realtime juga menerapkan RLS: hanya perubahan pada baris yang boleh dibaca yang dikirim.
 * Mengembalikan fungsi untuk berhenti berlangganan.
 */
export function subscribeHelpRequests(role: Role, onChange: () => void): () => void {
  const db = getSupabase(role);
  const channel = db
    .channel(`help-requests-${role}-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "help_requests" }, () => onChange())
    .subscribe();
  return () => {
    db.removeChannel(channel);
  };
}

// Cadangan bila koneksi Realtime putus diam-diam (umum di ponsel saat layar mati).
const FALLBACK_POLL_MS = 15_000;

/**
 * Daftar permintaan yang berjalan dan otomatis diperbarui (Realtime, ditambah pemuatan
 * ulang berkala, saat kembali online, dan saat tab terlihat lagi). enabled=false saat
 * belum ada sesi atau profil. requests null selama pemuatan pertama.
 */
export function useHelpRequests(
  role: Role,
  enabled: boolean,
): { requests: HelpRequest[] | null; error: string | null; refresh: () => void } {
  const [requests, setRequests] = useState<HelpRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  const active = enabled && isSupabaseConfigured();

  useEffect(() => {
    if (!active) return;
    let alive = true;
    listActiveHelpRequests(role)
      .then((r) => {
        if (!alive) return;
        setRequests(r);
        setError(null);
      })
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [active, role, tick]);

  useEffect(() => {
    if (!active) return;
    const unsubscribe = subscribeHelpRequests(role, refresh);
    const timer = setInterval(refresh, FALLBACK_POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      clearInterval(timer);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, role, refresh]);

  return { requests, error, refresh };
}

// ---------- Bantuan internal ----------

async function currentUserId(db: ReturnType<typeof getSupabase>): Promise<string> {
  const { data } = await db.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("harus masuk terlebih dahulu");
  return id;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- baris PostgREST tanpa tipe hasil generate */
export function rowToHelpRequest(r: any): HelpRequest {
  return {
    id: r.id,
    elderId: r.elder_id,
    elderName: one(r.elders)?.display_name ?? null,
    status: r.status,
    takenBy: r.taken_by ?? null,
    takenByName: one(r.caregivers)?.display_name ?? null,
    createdAt: r.created_at,
    handledAt: r.handled_at ?? null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}
