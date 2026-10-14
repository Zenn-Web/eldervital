import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klien Supabase untuk browser.
 *
 * Hanya kunci publik (publishable/anon) yang boleh dipakai di sini. Keamanan data
 * dijaga oleh RLS di database (lihat supabase/migrations/0001_init.sql), bukan oleh
 * kerahasiaan kunci ini. JANGAN PERNAH memakai service_role key di kode klien.
 *
 * Variabel NEXT_PUBLIC_* dibaca saat build, jadi harus diisi di Vercel sebelum deploy.
 */

export type Role = "lansia" | "caregiver";

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (lihat docs/SETUP.md).",
    );
    this.name = "SupabaseNotConfiguredError";
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

const cached: Partial<Record<Role, SupabaseClient>> = {};

export function getSupabase(role: Role): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new SupabaseNotConfiguredError();
  cached [role] ??= createClient(url, key, {
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      storageKey: `eldervital-auth-${role}`, detectSessionInUrl: false, },
  });
  return cached[role];
}





