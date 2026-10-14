import type { Session, ScreeningResult } from "./types";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase/client";

const LOCAL_STORAGE_KEY = "eldervital_saved_examinations";
const OFFLINE_QUEUE_KEY = "eldervital_offline_sync_queue";

export interface SaveExaminationParams {
  elderId?: string;
  isSimulated?: boolean;
}

export interface SaveResult {
  success: boolean;
  id: string;
  offline: boolean;
  message: string;
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function saveExamination(
  session: Session,
  result: ScreeningResult,
  params: SaveExaminationParams = {},
): Promise<SaveResult> {
  const examId = generateUuid();
  const elderId = params.elderId || "00000000-0000-0000-0000-000000000001";
  const now = new Date().toISOString();

  const answersPayload = session.answers.map((a, idx) => ({
    position: idx + 1,
    question_id: a.nodeId,
    value: a.value,
    label: a.label,
    source: a.source,
    is_unknown: Boolean(a.unknown),
    answered_at: a.answeredAt || now,
  }));

  const payload = {
    p_id: examId,
    p_elder_id: elderId,
    p_mode: session.mode,
    p_tree_id: session.treeId,
    p_tree_version: session.treeVersion,
    p_started_at: session.startedAt,
    p_finished_at: session.finishedAt || now,
    p_status: session.status === "stopped_red" ? "interrupted" : "completed",
    p_result_status: result.status,
    p_reasons: result.reasons.map((r) => r.text),
    p_actions: result.actions,
    p_interrupted: result.interrupted,
    p_is_simulated: Boolean(params.isSimulated || !isSupabaseConfigured()),
    p_answers: answersPayload,
  };

  // Selalu simpan ke penyimpanan lokal sebagai fallback & histori instan
  saveToLocalStorage(payload);

  // Jika Supabase belum dikonfigurasi atau browser sedang offline
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  if (!isSupabaseConfigured() || !isOnline) {
    if (!isOnline) {
      queueForSync(payload);
    }
    notifySaveEvent(payload);
    return {
      success: true,
      id: examId,
      offline: true,
      message: !isOnline
        ? "Pemeriksaan tersimpan di perangkat (antrean offline). Akan disinkronkan saat terhubung internet."
        : "Pemeriksaan tersimpan di mode demo lokal (Supabase belum dihubungkan).",
    };
  }

  // Simpan ke Supabase RPC save_examination
  try {
    const supabase = getSupabase();
    const { error } = await supabase.rpc("save_examination", payload);

    if (error) {
      console.warn("Gagal simpan ke Supabase, dialihkan ke antrean offline:", error);
      queueForSync(payload);
      notifySaveEvent(payload);
      return {
        success: true,
        id: examId,
        offline: true,
        message: "Pemeriksaan tersimpan lokal. Supabase sedang tidak dapat dijangkau.",
      };
    }

    notifySaveEvent(payload);
    return {
      success: true,
      id: examId,
      offline: false,
      message: "Pemeriksaan berhasil disimpan ke database.",
    };
  } catch (err) {
    console.warn("Exception saat simpan ke Supabase:", err);
    queueForSync(payload);
    notifySaveEvent(payload);
    return {
      success: true,
      id: examId,
      offline: true,
      message: "Tersimpan secara lokal di perangkat.",
    };
  }
}

function saveToLocalStorage(record: unknown) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(record);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // Abaikan kegagalan kuota penyimpanan lokal
  }
}

function queueForSync(payload: unknown) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push(payload);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Abaikan kegagalan kuota
  }
}

function notifySaveEvent(payload: unknown) {
  if (typeof window === "undefined") return;
  try {
    const event = new CustomEvent("eldervital:examination_saved", { detail: payload });
    window.dispatchEvent(event);
  } catch {
    // Browser tidak mendukung CustomEvent
  }
}

export function getOfflineQueueCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    return Array.isArray(queue) ? queue.length : 0;
  } catch {
    return 0;
  }
}
