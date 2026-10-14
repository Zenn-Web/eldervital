import type {Role} from "@/lib/supabase/client";
import { notImplemented } from "./not-implemented";

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

// ---------- Perangkat lansia (STUB) ----------

export async function createPairingToken(): Promise<string> {
    throw notImplemented("createPairingToken");
} 

export async function listElderLinks (): Promise<ElderLink[]> {
    throw notImplemented("listElderLinks");
}

/** Hubungan berstatus pending dan active, terlama lebih dulu. */
export async function decideLink (
    linkId: string,
    approve: boolean,
    shareResults: boolean,
): Promise<void> {
    void [linkId,approve, shareResults ];
    throw notImplemented("decideLink");
}

export async function setShareResults(linkId: string, share: boolean): Promise<void> {
  void [linkId, share];
  throw notImplemented("setShareResults");
}


// ---------- Caregiver (STUB) ----------

/** Nama lansia pemilik token, tanpa memakai tokennya. */
export async function previewPairing(token: string): Promise<string> {
  void token;
  throw notImplemented("previewPairing");
}

/** Memakai token. Mengembalikan id hubungan berstatus pending sampai lansia menyetujui. */
export async function requestPairing(token: string): Promise<string> {
  void token;
  throw notImplemented("requestPairing");
}

export async function listCaregiverLinks(): Promise<CaregiverLink[]> {
  throw notImplemented("listCaregiverLinks");
}

/** Untuk polling saat menunggu persetujuan lansia. null bila hubungan tidak ditemukan. */
export async function getCaregiverLinkStatus(linkId: string): Promise<LinkStatus | null> {
  void linkId;
  throw notImplemented("getCaregiverLinkStatus");
}

export async function revokeLink (role: Role, linkId: string): Promise<void> {
    void[role, linkId];
    throw notImplemented("revokeLink");
}

