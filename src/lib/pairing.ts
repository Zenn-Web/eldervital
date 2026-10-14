import { getSupabase, type Role } from "@/lib/supabase/client";

/**
 * Pairing QR. QR hanya berisi URL dengan token sementara di fragmen (#t=...), tanpa
 * data kesehatan. Fragmen tidak pernah dikirim browser ke server, jadi token tidak
 * tercatat di log server. Di database hanya hash token yang disimpan (lihat migrasi).
 */

export const PAIRING_PATH = "/caregiver/hubungkan";
export const TOKEN_TTL_MINUTES = 10;

/** Token dari create_pairing_token: dua uuid tanpa tanda hubung = 64 karakter heksadesimal. */
const TOKEN_RE = /^[0-9a-f]{64}$/;

/** Isi QR. Kamera bawaan ponsel bisa langsung membuka URL ini. */
export function pairingUrl(origin: string, token: string): string {
  return `${origin}${PAIRING_PATH}#t=${token}`;
}

/**
 * Mengambil token dari isi QR, URL yang ditempel, atau ketikan manual. Spasi, tanda
 * hubung, dan huruf besar diabaikan. null bila bentuknya tidak cocok (bukan galat:
 * salah ketik itu hal biasa).
 */
export function extractToken(input: string): string | null {
  const text = input.trim();
  const fromUrl = /[#?&]t=([0-9a-fA-F\s-]+)/.exec(text);
  const raw = (fromUrl ? fromUrl[1] : text).replace(/[\s-]/g, "").toLowerCase();
  return TOKEN_RE.test(raw) ? raw : null;
}

/** Kelompok 4 karakter agar mudah dibaca dan dicocokkan. */
export function groupToken(token: string): string {
  return token.match(/.{1,4}/g)?.join(" ") ?? token;
}

// ---------- Tipe ----------

export type LinkStatus = "pending" | "active" | "rejected" | "revoked";

export interface ElderLink {
  id: string;
  status: LinkStatus;
  shareResults: boolean;
  caregiverName: string;
}

export interface CaregiverLink {
  id: string;
  status: LinkStatus;
  shareResults: boolean;
  elderId: string;
  /** null selama hubungan belum aktif: RLS belum mengizinkan caregiver membaca profil lansia. */
  elderName: string | null;
}

// ---------- Perangkat lansia ----------

const elderDb = () => getSupabase("lansia");

/**
 * Token asli hanya dikembalikan sekali. Berlaku 10 menit, sekali pakai. Database hanya
 * menyimpan hash SHA-256-nya, dan membatasi maksimal 3 token aktif per lansia.
 */
export async function createPairingToken(): Promise<string> {
  const { data, error } = await elderDb().rpc("create_pairing_token");
  if (error) throw error;
  return data as string;
}

/** Hubungan berstatus pending dan active, terlama lebih dulu. */
export async function listElderLinks(): Promise<ElderLink[]> {
  // caregivers(display_name) = embed PostgREST: join lewat foreign key caregiver_id.
  // RLS caregivers_select mengizinkan lansia membaca nama caregiver yang punya hubungan
  // dengannya, termasuk yang masih pending (agar nama tampil di layar persetujuan).
  const { data, error } = await elderDb()
    .from("care_links")
    .select("id, status, share_results, created_at, caregivers(display_name)")
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id,
    status: l.status,
    shareResults: l.share_results,
    caregiverName: one(l.caregivers)?.display_name ?? "Caregiver",
  }));
}

/** Menyetujui atau menolak. Izin berbagi hasil hanya berlaku bila disetujui. */
export async function decideLink(
  linkId: string,
  approve: boolean,
  shareResults: boolean,
): Promise<void> {
  const { error } = await elderDb().rpc("decide_link", {
    p_link_id: linkId,
    p_approve: approve,
    p_share_results: shareResults,
  });
  if (error) throw error;
}

/** Mengubah izin berbagi hasil pada hubungan yang sudah aktif. */
export async function setShareResults(linkId: string, share: boolean): Promise<void> {
  const { error } = await elderDb().rpc("set_share_results", {
    p_link_id: linkId,
    p_share: share,
  });
  if (error) throw error;
}

// ---------- Caregiver ----------

const caregiverDb = () => getSupabase("caregiver");

/** Nama lansia pemilik token, tanpa memakai tokennya. */
export async function previewPairing(token: string): Promise<string> {
  const { data, error } = await caregiverDb().rpc("preview_pairing", { p_token: token });
  if (error) throw error;
  return data as string;
}

/** Memakai token. Mengembalikan id hubungan berstatus pending sampai lansia menyetujui. */
export async function requestPairing(token: string): Promise<string> {
  const { data, error } = await caregiverDb().rpc("request_pairing", { p_token: token });
  if (error) throw error;
  return data as string;
}

export async function listCaregiverLinks(): Promise<CaregiverLink[]> {
  // Embed elders(display_name) bernilai null selama pending: RLS elders_select baru
  // mengizinkan caregiver membaca profil lansia setelah hubungan aktif.
  const { data, error } = await caregiverDb()
    .from("care_links")
    .select("id, status, share_results, elder_id, created_at, elders(display_name)")
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id,
    status: l.status,
    shareResults: l.share_results,
    elderId: l.elder_id,
    elderName: one(l.elders)?.display_name ?? null,
  }));
}

/** Untuk polling saat menunggu persetujuan lansia. null bila hubungan tidak ditemukan. */
export async function getCaregiverLinkStatus(linkId: string): Promise<LinkStatus | null> {
  const { data, error } = await caregiverDb()
    .from("care_links")
    .select("status")
    .eq("id", linkId)
    .maybeSingle();
  if (error) throw error;
  return (data?.status as LinkStatus | undefined) ?? null;
}

// ---------- Kedua pihak ----------

/** Memutus hubungan. Izin berbagi hasil ikut dicabut. RPC memeriksa bahwa pemanggil salah satu pihak. */
export async function revokeLink(role: Role, linkId: string): Promise<void> {
  const { error } = await getSupabase(role).rpc("revoke_link", { p_link_id: linkId });
  if (error) throw error;
}

// Tanpa tipe hasil generate, relasi embed bisa diketik sebagai objek atau larik.
function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}
