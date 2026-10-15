import type { ScreeningResult, Session } from "@/lib/screening";

/**
 * Riwayat DEMO lokal (SIMULASI), menggantikan bagian riwayat dari persistence.ts lama.
 *
 * Dipakai hanya saat pemeriksaan tidak bisa disimpan ke database (belum ada sesi/profil
 * yang tersambung), agar halaman riwayat dan panel demo tetap menampilkan sesuatu. Setiap
 * catatan bertanda p_is_simulated = true dan TIDAK dikirim ke Supabase. Penyimpanan
 * sungguhan lewat @/lib/exam (submitExamination).
 *
 * Bentuk catatan mengikuti yang dibaca src/app/caregiver/riwayat dan DemoPanel
 * (kunci localStorage dan event yang sama), supaya UI tidak perlu diubah.
 */

export const DEMO_HISTORY_KEY = "eldervital_saved_examinations";
export const DEMO_HISTORY_EVENT = "eldervital:examination_saved";
const MAX_RECORDS = 50;

export interface DemoHistoryRecord {
  p_id: string;
  p_mode: "mandiri" | "caregiver";
  p_tree_version: string;
  p_started_at: string;
  p_finished_at: string;
  p_status: "selesai" | "terhenti" | "belum_selesai";
  p_result_status: ScreeningResult["status"];
  /** Teks alasan, untuk tampilan ringkas riwayat. */
  p_reasons: string[];
  p_actions: string[];
  p_interrupted: boolean;
  p_is_simulated: true;
  p_answers: {
    position: number;
    question_id: string;
    question: string;
    value: string;
    label: string;
    source: "lansia" | "caregiver";
    is_unknown: boolean;
    answered_at: string;
  }[];
}

export function toDemoHistoryRecord(id: string, session: Session, result: ScreeningResult): DemoHistoryRecord {
  const finishedAt = session.finishedAt ?? new Date().toISOString();
  return {
    p_id: id,
    p_mode: session.mode,
    p_tree_version: session.treeVersion,
    p_started_at: session.startedAt,
    p_finished_at: finishedAt,
    p_status: session.status === "stopped_red" ? "terhenti" : session.status === "completed" ? "selesai" : "belum_selesai",
    p_result_status: result.status,
    p_reasons: result.reasons.map((r) => r.text),
    p_actions: [...result.actions],
    p_interrupted: result.interrupted,
    p_is_simulated: true,
    p_answers: session.answers.map((a, position) => ({
      position,
      question_id: a.nodeId,
      question: result.answers.find((x) => x.nodeId === a.nodeId)?.question ?? a.nodeId,
      value: a.value,
      label: a.label,
      source: a.source,
      is_unknown: a.unknown,
      answered_at: a.answeredAt,
    })),
  };
}

/** Menambah satu catatan simulasi ke riwayat demo lokal dan memberi tahu UI. */
export function recordDemoHistory(id: string, session: Session, result: ScreeningResult): void {
  if (typeof window === "undefined") return;
  const record = toDemoHistoryRecord(id, session, result);
  try {
    const list = JSON.parse(localStorage.getItem(DEMO_HISTORY_KEY) ?? "[]");
    const next = [record, ...(Array.isArray(list) ? list : [])].slice(0, MAX_RECORDS);
    localStorage.setItem(DEMO_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Penyimpanan diblokir atau penuh: riwayat demo dilewati.
  }
  try {
    window.dispatchEvent(new CustomEvent(DEMO_HISTORY_EVENT, { detail: record }));
  } catch {
    // CustomEvent tidak tersedia.
  }
}
