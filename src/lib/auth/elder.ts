import { getSupabase } from "@/lib/supabase/client";
import { isNetworkError } from "@/lib/supabase/errors";

/** Harus sama dengan CHECK age_range di supabase/migrations/0001_init.sql. */
export type AgeRange = "50-54" | "55-59" | "60-65" | "lebih-65";

export const AGE_RANGES: readonly { value: AgeRange; label: string }[] = [
  { value: "50-54", label: "50 sampai 54 tahun" },
  { value: "55-59", label: "55 sampai 59 tahun" },
  { value: "60-65", label: "60 sampai 65 tahun" },
  { value: "lebih-65", label: "Lebih dari 65 tahun" },
];

export interface ElderProfile {
  /** elders.id: dikirim sebagai elder_id saat menyimpan pemeriksaan. */
  id: string;
  /** auth.uid() sesi anonim di perangkat ini: pengikat antrean penyimpanan. */
  deviceUserId: string;
  displayName: string;
}

const db = () => getSupabase("lansia");

// Salinan profil di perangkat agar beranda dan Cek Mandiri tetap terbuka saat offline.
// Isinya hanya id dan nama panggilan, tanpa data kesehatan.
const CACHE_KEY = "eldervital-elder-profile";

function readCache(deviceUserId: string): ElderProfile | null {
  try {
    const p = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as ElderProfile | null;
    return p?.deviceUserId === deviceUserId ? p : null;
  } catch {
    return null;
  }
}

function writeCache(p: ElderProfile | null) {
  try {
    if (p) localStorage.setItem(CACHE_KEY, JSON.stringify(p));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // Penyimpanan diblokir (mis. mode privat): profil tetap dimuat dari jaringan.
  }
}

/**
 * Masuk anonim bila belum ada sesi, lalu create_elder_profile. RPC itu idempoten
 * (mengembalikan profil yang sudah ada), jadi aman dipanggil ulang bila jaringan putus
 * di tengah jalan. Login anonim sengaja baru terjadi di sini, saat pengguna menekan
 * tombol, agar tidak menumpuk pengguna anonim kosong setiap halaman dibuka.
 */
export async function createElderProfile(
  name: string,
  ageRange: AgeRange | null,
): Promise<ElderProfile> {
  const supabase = db();
  const { data: current } = await supabase.auth.getSession();
  let userId = current.session?.user.id;
  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    userId = data.user!.id;
  }
  const { data: id, error } = await supabase.rpc("create_elder_profile", {
    p_name: name,
    p_age_range: ageRange,
  });
  if (error) throw error;
  const profile: ElderProfile = { id: id as string, deviceUserId: userId, displayName: name };
  writeCache(profile);
  return profile;
}

/**
 * Profil lansia untuk sesi ini; null bila sesi ada tetapi profil belum dibuat.
 * Saat offline, salinan di perangkat dipakai bila milik sesi yang sama.
 */
export async function loadElderProfile(deviceUserId: string): Promise<ElderProfile | null> {
  const { data, error } = await db()
    .from("elders")
    .select("id, display_name")
    .eq("device_user_id", deviceUserId)
    .maybeSingle();
  if (error) {
    const cached = isNetworkError(error) ? readCache(deviceUserId) : null;
    if (cached) return cached;
    throw error;
  }
  const profile = data ? { id: data.id, deviceUserId, displayName: data.display_name } : null;
  writeCache(profile);
  return profile;
}
