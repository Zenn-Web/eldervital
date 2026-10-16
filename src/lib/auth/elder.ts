import { getSupabase } from "@/lib/supabase/client";
import { isNetworkError } from "@/lib/supabase/errors";
import { clearOutbox } from "@/lib/exam/outbox";
import { clearStoredReminders } from "@/lib/reminders";

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
  /** null bila tidak diisi. */
  ageRange: AgeRange | null;
}

const db = () => getSupabase("lansia");

// Salinan profil di perangkat agar beranda dan Cek Mandiri tetap terbuka saat offline.
// Isinya hanya id dan nama panggilan, tanpa data kesehatan.
const CACHE_KEY = "eldervital-elder-profile";

function readCache(deviceUserId: string): ElderProfile | null {
  try {
    const p = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as ElderProfile | null;
    // Salinan dari versi lama belum punya ageRange.
    return p?.deviceUserId === deviceUserId ? { ...p, ageRange: p.ageRange ?? null } : null;
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
  const profile: ElderProfile = { id: id as string, deviceUserId: userId, displayName: name, ageRange };
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
    .select("id, display_name, age_range")
    .eq("device_user_id", deviceUserId)
    .maybeSingle();
  if (error) {
    const cached = isNetworkError(error) ? readCache(deviceUserId) : null;
    if (cached) return cached;
    throw error;
  }
  const profile: ElderProfile | null = data
    ? { id: data.id, deviceUserId, displayName: data.display_name, ageRange: data.age_range ?? null }
    : null;
  writeCache(profile);
  return profile;
}

/**
 * Mengubah nama panggilan dan/atau rentang usia (menu Pengaturan lansia). Hanya kolom yang
 * diisi yang diubah; ageRange: null menghapus isian usia. RLS elders_update memastikan
 * hanya pemilik perangkat yang bisa mengubah profilnya.
 */
export async function updateElderProfile(
  profile: ElderProfile,
  changes: { displayName?: string; ageRange?: AgeRange | null },
): Promise<ElderProfile> {
  const patch: Record<string, unknown> = {};
  if (changes.displayName !== undefined) {
    const name = changes.displayName.trim();
    // Kolom display_name dibatasi 1 sampai 60 karakter (CHECK di migrasi).
    if (name.length < 1 || name.length > 60) throw new Error("nama harus 1 sampai 60 karakter");
    patch.display_name = name;
  }
  if (changes.ageRange !== undefined) patch.age_range = changes.ageRange;
  if (Object.keys(patch).length === 0) return profile;

  const { data, error } = await db()
    .from("elders")
    .update(patch)
    .eq("id", profile.id)
    .select("id, display_name, age_range")
    .single();
  if (error) throw error;
  const updated: ElderProfile = {
    ...profile,
    displayName: data.display_name,
    ageRange: data.age_range ?? null,
  };
  writeCache(updated);
  return updated;
}

/**
 * "Keluar dari profil" di perangkat lansia. Karena lansia tidak punya akun, keluar berarti
 * MENGHAPUS profil beserta seluruh pemeriksaan, jawaban, hubungan caregiver, permintaan
 * bantuan, dan jadwalnya (on delete cascade di migrasi), lalu menghapus sesi di perangkat.
 * Tidak bisa dibatalkan: UI wajib meminta konfirmasi yang jelas sebelum memanggil ini.
 *
 * Catatan: pengguna anonim di Supabase Auth tetap ada tanpa data (klien tidak berhak
 * menghapus akun Auth). Bersihkan lewat dashboard bila perlu.
 */
export async function deleteElderProfile(profile: ElderProfile): Promise<void> {
  const supabase = db();
  const { error } = await supabase.from("elders").delete().eq("id", profile.id);
  if (error) throw error;
  writeCache(null);
  // Antrean penyimpanan milik profil ini tidak akan pernah bisa terkirim lagi.
  clearOutbox("lansia");
  // Salinan jadwal di perangkat milik profil ini; profil baru akan mengambil jadwalnya sendiri.
  clearStoredReminders();
  await supabase.auth.signOut({ scope: "local" });
}
