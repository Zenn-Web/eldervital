"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getSupabase, type Role } from "@/lib/supabase/client";
import { errorMessage, isNetworkError } from "@/lib/supabase/errors";
import type { SaveExaminationArgs } from "./payload";

/**
 * Antrean sederhana untuk menyimpan pemeriksaan.
 *
 * Setiap pemeriksaan dicatat dulu di localStorage, lalu dikirim lewat RPC
 * save_examination. Bila jaringan gagal, entri tetap di antrean dan dikirim ulang
 * saat aplikasi dibuka lagi atau saat browser kembali online. Pengiriman ulang aman
 * karena id dibuat klien dan RPC-nya idempoten (on conflict do nothing).
 *
 * Konsekuensi privasi: selama belum terkirim, jawaban pemeriksaan tersimpan di
 * localStorage perangkat ini. Entri dihapus segera setelah berhasil terkirim, atau
 * bila server menolaknya (mis. hubungan caregiver sudah diputus).
 */

export type SaveState =
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "queued" }
  | { kind: "failed"; message: string };

interface Entry {
  /** Akun yang membuat pemeriksaan; hanya dikirim oleh akun yang sama. */
  userId: string;
  args: SaveExaminationArgs;
}

const keyFor = (role: Role) => `eldervital-outbox-${role}`;
const memory: Partial<Record<Role, Entry[]>> = {}; // cadangan bila localStorage diblokir

function read(role: Role): Entry[] {
  try {
    const raw = localStorage.getItem(keyFor(role));
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return memory[role] ?? [];
  }
}

function write(role: Role, entries: Entry[]) {
  memory[role] = entries;
  try {
    if (entries.length) localStorage.setItem(keyFor(role), JSON.stringify(entries));
    else localStorage.removeItem(keyFor(role));
  } catch {
    // Penyimpanan diblokir: antrean hanya bertahan selama tab terbuka.
  }
}

// ---------- Status per pemeriksaan (di memori, untuk tampilan) ----------

const states = new Map<string, SaveState>();
const listeners = new Set<() => void>();

function setState(id: string, s: SaveState) {
  states.set(id, s);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Status penyimpanan satu pemeriksaan; null bila tidak sedang disimpan di sesi ini. */
export function useSaveState(id: string | null): SaveState | null {
  return useSyncExternalStore(
    subscribe,
    () => (id ? (states.get(id) ?? null) : null),
    () => null,
  );
}

// ---------- Pengiriman ----------

const flushing: Partial<Record<Role, Promise<void>>> = {};

function retryable(error: unknown, status: number): boolean {
  return isNetworkError(error) || status === 0 || status === 401 || status === 408 || status === 429 || status >= 500;
}

async function flushOnce(role: Role, userId: string) {
  const db = getSupabase(role);
  for (const entry of read(role)) {
    if (entry.userId !== userId) continue;
    const id = entry.args.p_id;
    setState(id, { kind: "saving" });
    let error: unknown = null;
    let status = 0;
    try {
      const res = await db.rpc("save_examination", entry.args);
      error = res.error;
      status = res.status;
    } catch (e) {
      error = e;
    }
    if (!error) {
      write(role, read(role).filter((e) => e.args.p_id !== id));
      setState(id, { kind: "saved" });
    } else if (retryable(error, status)) {
      // Jaringan atau server sedang bermasalah: hentikan putaran ini, coba lagi nanti.
      for (const e of read(role)) if (e.userId === userId) setState(e.args.p_id, { kind: "queued" });
      return;
    } else {
      // Ditolak server (RLS atau aturan data): mengirim ulang tidak akan berhasil.
      write(role, read(role).filter((e) => e.args.p_id !== id));
      setState(id, { kind: "failed", message: errorMessage(error) });
    }
  }
}

/** Mengirim semua entri antrean milik akun ini. Pemanggilan bersamaan digabung. */
export function flushOutbox(role: Role, userId: string): Promise<void> {
  flushing[role] ??= flushOnce(role, userId).finally(() => {
    delete flushing[role];
  });
  return flushing[role];
}

/** Catat pemeriksaan di antrean lalu langsung coba kirim. */
export function submitExamination(role: Role, userId: string, args: SaveExaminationArgs): void {
  const entries = read(role).filter((e) => e.args.p_id !== args.p_id);
  write(role, [...entries, { userId, args }]);
  setState(args.p_id, { kind: "saving" });
  // Bila putaran lain sedang berjalan, entri baru ikut terkirim pada putaran berikutnya.
  const running = flushing[role];
  (running ? running.then(() => flushOutbox(role, userId)) : flushOutbox(role, userId)).catch(() => {
    setState(args.p_id, { kind: "queued" });
  });
}

/** Kirim antrean saat akun siap dan setiap kali browser kembali online. */
export function useOutboxFlush(role: Role, userId: string | null): void {
  useEffect(() => {
    if (!userId) return;
    const run = () => {
      flushOutbox(role, userId).catch(() => {});
    };
    run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, [role, userId]);
}
