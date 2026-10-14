"use client";

import type { Role } from "@/lib/supabase/client";
import type { SaveExaminationArgs } from "./payload";

/**
 * Antrean penyimpanan pemeriksaan: dicatat di perangkat, dikirim lewat save_examination,
 * dikirim ulang saat online. STUB: belum menyimpan apa pun.
 */

export type SaveState =
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "queued" } // belum terkirim (offline); dikirim ulang otomatis
  | { kind: "failed"; message: string }; // ditolak server; tidak dikirim ulang

/** Kirim lalu lupakan. Pantau hasilnya dengan useSaveState(args.p_id). */
export function submitExamination(role: Role, userId: string, args: SaveExaminationArgs): void {
  void [role, userId, args];
}

/** Status penyimpanan satu pemeriksaan; null bila tidak sedang disimpan. */
export function useSaveState(id: string | null): SaveState | null {
  void id;
  return null;
}

/** Pasang sekali per peran (di layout/gerbang): kirim antrean saat d
export function useOutboxFlush(role: Role, userId: string | null): void {
  void [role, userId];
} */