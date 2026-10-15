import type { Reason, ResultStatus } from "@/lib/screening";
import { treeV1 } from "@/lib/screening";
import { getSupabase, type Role } from "@/lib/supabase/client";

/**
 * Membaca riwayat pemeriksaan (dashboard dan halaman riwayat).
 *
 * Tidak ada filter hak akses di sini: RLS yang memutuskan baris mana yang kembali.
 * - Lansia: semua pemeriksaan miliknya.
 * - Caregiver: pemeriksaan lansia yang hubungannya aktif DAN mengizinkan berbagi hasil,
 *   ditambah pemeriksaan mode caregiver yang ia catat sendiri.
 * Jadi bila lansia belum mengizinkan, daftar caregiver bisa kosong walau lansia sering
 * memeriksa. UI sebaiknya memakai CaregiverLink.shareResults (dari listCaregiverLinks)
 * untuk menjelaskan hal itu apa adanya, bukan menampilkan "belum ada pemeriksaan".
 */

export type ExamStatus = "selesai" | "belum_selesai" | "terhenti";

export interface ExaminationSummary {
  id: string;
  elderId: string;
  /** null bila caregiver tidak lagi berhak membaca profil lansia (mis. hubungan diputus). */
  elderName: string | null;
  mode: "mandiri" | "caregiver";
  /** Caregiver yang mencatat; null untuk Cek Mandiri. */
  caregiverId: string | null;
  startedAt: string;
  finishedAt: string | null;
  status: ExamStatus;
  resultStatus: ResultStatus | null;
  /** Dihentikan lebih awal karena tanda bahaya. */
  interrupted: boolean;
  /** Data demo; wajib diberi label simulasi di layar. */
  isSimulated: boolean;
}

export interface ExaminationAnswer {
  position: number;
  questionId: string;
  /**
   * Teks pertanyaan dari pohon versi yang sama. null bila pemeriksaan memakai versi pohon
   * lain yang tidak lagi ada di aplikasi; tampilkan questionId sebagai cadangan.
   */
  question: string | null;
  value: string;
  /** Jawaban yang ditampilkan, mis. "Ya" atau nama obat. */
  label: string;
  source: "lansia" | "caregiver";
  isUnknown: boolean;
  answeredAt: string;
}

export interface ExaminationDetail extends ExaminationSummary {
  treeId: string;
  treeVersion: string;
  /** Alasan kuning/merah, masing-masing dengan pertanyaan dan jawaban pemicunya. */
  reasons: Reason[];
  /** Rekomendasi tindakan yang ditampilkan saat itu. */
  actions: string[];
  answers: ExaminationAnswer[];
}

const SUMMARY_COLUMNS =
  "id, elder_id, caregiver_id, mode, started_at, finished_at, status, result_status, interrupted, is_simulated, elders(display_name)";

/**
 * Pemeriksaan terbaru lebih dulu. elderId opsional: tanpa elderId, caregiver mendapat
 * pemeriksaan semua lansia yang boleh ia lihat (untuk dashboard).
 */
export async function listExaminations(
  role: Role,
  opts: { elderId?: string; limit?: number } = {},
): Promise<ExaminationSummary[]> {
  let q = getSupabase(role)
    .from("examinations")
    .select(SUMMARY_COLUMNS)
    .order("started_at", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.elderId) q = q.eq("elder_id", opts.elderId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToSummary);
}

/**
 * Hasil terakhir per lansia (dashboard caregiver). Lansia tanpa pemeriksaan yang boleh
 * dilihat tidak muncul di Map; cek dengan map.get(elderId) === undefined.
 */
export async function latestExaminationByElder(
  role: Role,
): Promise<Map<string, ExaminationSummary>> {
  // Cukup untuk demo. Untuk data besar, ganti dengan view "distinct on (elder_id)".
  const all = await listExaminations(role, { limit: 200 });
  const latest = new Map<string, ExaminationSummary>();
  for (const x of all) if (!latest.has(x.elderId)) latest.set(x.elderId, x);
  return latest;
}

/** Satu pemeriksaan lengkap dengan jawaban berurutan. null bila tidak ada atau tidak berhak. */
export async function getExamination(role: Role, id: string): Promise<ExaminationDetail | null> {
  const { data, error } = await getSupabase(role)
    .from("examinations")
    .select(
      `${SUMMARY_COLUMNS}, tree_id, tree_version, reasons, actions,
       exam_answers(position, question_id, value, label, source, is_unknown, answered_at)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToDetail(data) : null;
}

// ---------- Pemetaan baris database ke tipe aplikasi (murni, dites) ----------

/* eslint-disable @typescript-eslint/no-explicit-any -- baris PostgREST tanpa tipe hasil generate */

export function rowToSummary(r: any): ExaminationSummary {
  return {
    id: r.id,
    elderId: r.elder_id,
    elderName: one(r.elders)?.display_name ?? null,
    mode: r.mode,
    caregiverId: r.caregiver_id ?? null,
    startedAt: r.started_at,
    finishedAt: r.finished_at ?? null,
    status: r.status,
    resultStatus: r.result_status ?? null,
    interrupted: Boolean(r.interrupted),
    isSimulated: Boolean(r.is_simulated),
  };
}

export function rowToDetail(r: any): ExaminationDetail {
  // Teks pertanyaan hanya diambil dari pohon dengan id dan versi yang sama, agar riwayat
  // lama tidak menampilkan pertanyaan yang sudah berubah redaksinya.
  const sameTree = r.tree_id === treeV1.id && r.tree_version === treeV1.version;
  const answers: ExaminationAnswer[] = (r.exam_answers ?? [])
    .map((a: any) => ({
      position: a.position,
      questionId: a.question_id,
      question: sameTree ? (treeV1.nodes[a.question_id]?.prompt ?? null) : null,
      value: a.value,
      label: a.label,
      source: a.source,
      isUnknown: Boolean(a.is_unknown),
      answeredAt: a.answered_at,
    }))
    .sort((a: ExaminationAnswer, b: ExaminationAnswer) => a.position - b.position);
  return {
    ...rowToSummary(r),
    treeId: r.tree_id,
    treeVersion: r.tree_version,
    reasons: Array.isArray(r.reasons) ? r.reasons : [],
    actions: Array.isArray(r.actions) ? r.actions : [],
    answers,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// Tanpa tipe hasil generate, relasi embed bisa diketik sebagai objek atau larik.
function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}
