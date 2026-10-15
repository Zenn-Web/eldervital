/**
 * Mengubah galat Supabase menjadi kalimat Bahasa Indonesia untuk layar.
 * Kontrak untuk UI: tangkap galat dengan try/catch, tampilkan errorMessage(e).
 * Jangan menampilkan e.message mentah.
 */

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email atau password salah.",
  user_already_exists: "Email ini sudah terdaftar. Silakan masuk.",
  email_exists: "Email ini sudah terdaftar. Silakan masuk.",
  weak_password: "Password terlalu lemah. Gunakan minimal 8 karakter.",
  email_not_confirmed: "Email belum dikonfirmasi. Buka tautan konfirmasi di email Anda.",
  over_request_rate_limit: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  over_email_send_rate_limit: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  anonymous_provider_disabled:
    "Masuk tanpa akun belum diaktifkan di Supabase (Allow anonymous sign-ins).",
  signup_disabled: "Pendaftaran sedang ditutup.",
  validation_failed: "Periksa kembali email dan password.",
};

const OFFLINE = "Tidak ada koneksi internet. Coba lagi setelah tersambung.";
const GENERIC = "Terjadi kesalahan. Coba lagi.";

export function isNetworkError(err: unknown): boolean {
  // "=== false", bukan "!navigator.onLine": di Node (tes) nilainya undefined.
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = err instanceof Error ? err.message : String((err as { message?: unknown })?.message ?? "");
  return /failed to fetch|networkerror|load failed|network request failed/i.test(msg);
}

/** Pesan dari fungsi database kita (raise exception di migrasi): hura. */
function isOurDbMessage(msg: string): boolean {
  return /^[a-z]/.test(msg) && /\b(tidak|belum|hanya|harus|sudah|terlalu)\b/.test(msg);
}

export function errorMessage(err: unknown): string {
  if (isNetworkError(err)) return OFFLINE;
  const e = err as { code?: string; message?: string } | null;
  if (e?.code && AUTH_MESSAGES[e.code]) return AUTH_MESSAGES[e.code];
  const msg = e?.message?.trim();
  if (msg && isOurDbMessage(msg)) return msg.charAt(0).toUpperCase() + msg.slice(1) + ".";
  return GENERIC;
}