import { DEFAULT_REMINDERS } from "@/lib/schedule";
import { getSupabase, type Role } from "@/lib/supabase/client";

/**
 * Jadwal pengingat pemeriksaan (spesifikasi bagian 6). Disimpan di reminder_schedules.
 *
 * Ini hanya JADWAL. Mengirim notifikasi sungguhan (Web Push) belum ada; selama itu, layar
 * pengingat wajib berlabel simulasi, dan aplikasi tidak boleh menyiratkan notifikasi
 * pasti terkirim atau dibuka. Jadwal pagi/siang/malam adalah ajakan memeriksa, bukan
 * anjuran medis tiga kali sehari.
 *
 * Hak akses dari RLS: lansia membaca dan mengubah jadwalnya; caregiver terhubung hanya
 * membaca.
 */

export interface Reminder {
  id: string;
  elderId: string;
  /** Nama jadwal, unik per lansia, 1 sampai 30 karakter. Mis. "Pagi". */
  label: string;
  /** "HH:MM" 24 jam, waktu setempat perangkat. */
  time: string;
  enabled: boolean;
}

export interface ReminderInput {
  label: string;
  /** "07:00" atau "07.00". */
  time: string;
  enabled: boolean;
}

export const LOCAL_STORAGE_REMINDERS_KEY = "eldervital_reminder_schedules";

export interface StoredReminder {
  id: string;
  label: string;
  time: string; // "07.00"
  enabled: boolean;
}

export const INITIAL_STORED_REMINDERS: StoredReminder[] = [
  { id: "pagi", label: "Pagi", time: "07.00", enabled: true },
  { id: "siang", label: "Siang", time: "12.30", enabled: true },
  { id: "malam", label: "Malam", time: "19.00", enabled: true },
];

export function getStoredReminders(): StoredReminder[] {
  if (typeof window === "undefined") return INITIAL_STORED_REMINDERS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REMINDERS_KEY);
    if (!raw) return INITIAL_STORED_REMINDERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_STORED_REMINDERS;
}

export function saveStoredReminders(items: StoredReminder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_REMINDERS_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("eldervital:reminders-updated"));
  } catch {
    // ignore
  }
}


// ---------- Fungsi murni (jam) ----------

/** "7.00", "07:00", "07.00", "07:00:00" -> "07:00". null bila bukan jam yang sah. */
export function normalizeTime(input: string): string | null {
  const m = /^(\d{1,2})[.:](\d{2})(?::\d{2})?$/.exec(input.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

/** "07:00" -> "07.00" (penulisan jam yang lazim di Indonesia, untuk teks layar). */
export function formatTime(time: string): string {
  return time.replace(":", ".");
}

/**
 * Pengingat aktif berikutnya setelah `now` (waktu setempat). Bila semua jam hari ini sudah
 * lewat, yang pertama besok. null bila tidak ada jadwal aktif.
 */
export function nextReminder(
  reminders: readonly Reminder[],
  now: Date,
): { reminder: Reminder; at: Date } | null {
  let best: { reminder: Reminder; at: Date } | null = null;
  for (const r of reminders) {
    if (!r.enabled) continue;
    const t = normalizeTime(r.time);
    if (!t) continue;
    const [h, m] = t.split(":").map(Number);
    const at = new Date(now);
    at.setHours(h, m, 0, 0);
    if (at <= now) at.setDate(at.getDate() + 1);
    if (!best || at < best.at) best = { reminder: r, at };
  }
  return best;
}

// ---------- Baca (kedua peran) ----------

/** Jadwal satu lansia, urut jam. Untuk caregiver, kosong bila hubungan belum aktif. */
export async function listReminders(role: Role, elderId: string): Promise<Reminder[]> {
  const { data, error } = await getSupabase(role)
    .from("reminder_schedules")
    .select("id, elder_id, label, time_of_day, enabled")
    .eq("elder_id", elderId)
    .order("time_of_day", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToReminder);
}

// ---------- Ubah (perangkat lansia) ----------

const elderDb = () => getSupabase("lansia");

/**
 * Mengisi jadwal bawaan (pagi, siang, malam) bila lansia belum punya jadwal sama sekali.
 * Aman dipanggil berulang. Mengembalikan jadwal yang berlaku.
 */
export async function ensureDefaultReminders(elderId: string): Promise<Reminder[]> {
  const current = await listReminders("lansia", elderId);
  if (current.length > 0) return current;
  return saveReminders(
    elderId,
    DEFAULT_REMINDERS.map((d) => ({ label: d.label, time: d.time, enabled: true })),
  );
}

/**
 * Menyimpan seluruh jadwal sekaligus (mis. dari layar atur jadwal): yang ada di daftar
 * dibuat atau diperbarui berdasarkan label, yang tidak ada di daftar dihapus.
 * Melempar galat bila ada jam yang tidak sah atau label ganda, sebelum menyentuh database.
 */
export async function saveReminders(
  elderId: string,
  items: readonly ReminderInput[],
): Promise<Reminder[]> {
  const rows = items.map((it) => {
    const time = normalizeTime(it.time);
    const label = it.label.trim();
    if (!time) throw new Error(`jam "${it.time}" tidak sah, gunakan format 07.00`);
    if (label.length < 1 || label.length > 30) throw new Error("nama jadwal harus 1 sampai 30 karakter");
    return { elder_id: elderId, label, time_of_day: time, enabled: it.enabled };
  });
  if (new Set(rows.map((r) => r.label.toLowerCase())).size !== rows.length) {
    throw new Error("nama jadwal tidak boleh sama");
  }

  const db = elderDb();
  if (rows.length > 0) {
    const { error } = await db.from("reminder_schedules").upsert(rows, { onConflict: "elder_id,label" });
    if (error) throw error;
  }
  // Hapus jadwal yang tidak lagi ada di daftar.
  const keep = new Set(rows.map((r) => r.label));
  const stale = (await listReminders("lansia", elderId)).filter((r) => !keep.has(r.label));
  if (stale.length > 0) {
    const { error } = await db
      .from("reminder_schedules")
      .delete()
      .in(
        "id",
        stale.map((r) => r.id),
      );
    if (error) throw error;
  }
  return listReminders("lansia", elderId);
}

/** Menyalakan atau mematikan satu jadwal tanpa mengubah jamnya. */
export async function setReminderEnabled(id: string, enabled: boolean): Promise<void> {
  const { error } = await elderDb().from("reminder_schedules").update({ enabled }).eq("id", id);
  if (error) throw error;
}

// ---------- Bantuan internal ----------

/* eslint-disable @typescript-eslint/no-explicit-any -- baris PostgREST tanpa tipe hasil generate */
export function rowToReminder(r: any): Reminder {
  return {
    id: r.id,
    elderId: r.elder_id,
    label: r.label,
    // Postgres mengembalikan "07:00:00"; aplikasi memakai "07:00".
    time: normalizeTime(String(r.time_of_day)) ?? String(r.time_of_day),
    enabled: Boolean(r.enabled),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
