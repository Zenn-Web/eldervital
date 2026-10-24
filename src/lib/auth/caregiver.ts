import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import { clearOutbox } from "@/lib/exam/outbox";

export interface CaregiverProfile {
  id: string;
  displayName: string;
}

const db = () => getSupabase("caregiver");

/** needsConfirmation: true bila Supabase meminta konfirmasi email sebelum ada sesi. */
export async function signUpCaregiver(
  name: string,
  email: string,
  password: string,
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await db().auth.signUp({
    email,
    password,
    // Nama disimpan di metadata akun, supaya profil tetap bisa dibuat oleh
    // ensureCaregiverProfile walau sesi baru ada setelah konfirmasi email.
    options: { data: { display_name: name } },
  });
  if (error) throw error;
  return { needsConfirmation: data.session === null };
}

/** Setelah berhasil, useAuthSession("caregiver") berubah menjadi "signed-in". */
export async function signInCaregiver(email: string, password: string): Promise<void> {
  const { error } = await db().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Memulai OAuth Google dan kembali ke layar pairing caregiver setelah berhasil. */
export async function signInCaregiverWithGoogle(): Promise<void> {
  const { error } = await db().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/caregiver/hubungkan` },
  });
  if (error) throw error;
}

/**
 * Hanya perangkat ini yang keluar (scope "local"), sesi di perangkat lain tetap.
 * Antrean pemeriksaan caregiver yang belum terkirim ikut dibuang lebih dulu, supaya jawaban
 * pemeriksaan tidak tertinggal di localStorage untuk pengguna perangkat berikutnya.
 */
export async function signOutCaregiver(): Promise<void> {
  clearOutbox("caregiver");
  const { error } = await db().auth.signOut({ scope: "local" });
  if (error) throw error;
}

/**
 * Membuat baris caregivers bila belum ada. Aman dipanggil berulang. Dipanggil setiap kali
 * sesi caregiver ditemukan. RLS (caregivers_insert) menolak sesi anonim menjadi caregiver,
 * jadi sesi lansia yang tersesat ke sini akan gagal di database, bukan hanya di klien.
 */
export async function ensureCaregiverProfile(user: User): Promise<CaregiverProfile> {
  const { data, error } = await db()
    .from("caregivers")
    .select("id, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return { id: data.id, displayName: data.display_name };

  const fromMeta = String(user.user_metadata?.display_name ?? "").trim();
  // Kolom display_name dibatasi 1 sampai 60 karakter (CHECK di migrasi).
  const displayName = (fromMeta || user.email?.split("@")[0] || "Caregiver").slice(0, 60);
  const { error: insertError } = await db()
    .from("caregivers")
    .insert({ id: user.id, display_name: displayName });
  // 23505 = unique_violation: tab lain sudah membuatnya lebih dulu. Hasil akhirnya sama.
  if (insertError && insertError.code !== "23505") throw insertError;
  return { id: user.id, displayName };
}

/** Mengubah nama caregiver (yang tampil di perangkat lansia). RLS: hanya akun sendiri. */
export async function updateCaregiverName(displayName: string): Promise<CaregiverProfile> {
  const name = displayName.trim();
  if (name.length < 1 || name.length > 60) throw new Error("nama harus 1 sampai 60 karakter");
  const supabase = db();
  const { data: session } = await supabase.auth.getSession();
  const id = session.session?.user.id;
  if (!id) throw new Error("harus masuk terlebih dahulu");
  const { data, error } = await supabase
    .from("caregivers")
    .update({ display_name: name })
    .eq("id", id)
    .select("id, display_name")
    .single();
  if (error) throw error;
  return { id: data.id, displayName: data.display_name };
}
