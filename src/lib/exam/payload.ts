import type { ScreeningResult, Session } from "@/lib/screening";

/**
 * Argumen RPC save_examination (supabase/migrations/0001_init.sql). Satu-satunya tipe
 * yang memakai nama SQL, karena dikirim apa adanya ke supabase.rpc(). UI tidak perlu
 * membaca isinya; cukup meneruskan hasil toSaveArgs ke submitExamination.
 */
export interface SaveExaminationArgs {
  p_id: string;
  p_elder_id: string;
  p_mode: "mandiri" | "caregiver";
  p_tree_id: string;
  p_tree_version: string;
  p_started_at: string;
  p_finished_at: string | null;
  p_status: "selesai" | "belum_selesai" | "terhenti";
  p_result_status: ScreeningResult["status"];
  p_reasons: ScreeningResult["reasons"];
  p_actions: ScreeningResult["actions"];
  p_interrupted: boolean;
  p_is_simulated: boolean;
  p_answers: {
    position: number;
    question_id: string;
    value: string;
    label: string;
    source: "lansia" | "caregiver";
    is_unknown: boolean;
    answered_at: string;
  }[];
}

const STATUS: Record<Session["status"], SaveExaminationArgs["p_status"]> = {
  completed: "selesai",
  stopped_red: "terhenti",
  in_progress: "belum_selesai",
};

/**
 * Sesi dan hasil (dihitung di klien oleh mesin pohon keputusan) menjadi argumen
 * penyimpanan. Alasan disimpan lengkap dengan pertanyaan dan jawaban pemicunya agar
 * riwayat tetap bisa ditelusuri.
 */
export function toSaveArgs(
  id: string,
  elderId: string,
  session: Session,
  result: ScreeningResult,
  opts: { isSimulated?: boolean } = {},
): SaveExaminationArgs {
  return {
    p_id: id,
    p_elder_id: elderId,
    p_mode: session.mode,
    p_tree_id: session.treeId,
    p_tree_version: session.treeVersion,
    p_started_at: session.startedAt,
    p_finished_at: session.finishedAt ?? null,
    p_status: STATUS[session.status],
    p_result_status: result.status,
    p_reasons: result.reasons,
    p_actions: result.actions,
    p_interrupted: result.interrupted,
    p_is_simulated: opts.isSimulated ?? false,
    p_answers: session.answers.map((a, position) => ({
      position,
      question_id: a.nodeId,
      value: a.value,
      label: a.label,
      source: a.source,
      is_unknown: a.unknown,
      answered_at: a.answeredAt,
    })),
  };
}

/**
 * UUID v4 untuk id pemeriksaan. Dibuat di klien agar pengiriman ulang aman (RPC idempoten).
 * crypto.randomUUID hanya ada di konteks aman (HTTPS/localhost); uji lewat IP LAN butuh cadangan.
 */
export function newExamId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // versi 4
  b[8] = (b[8] & 0x3f) | 0x80; // varian RFC 4122
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}