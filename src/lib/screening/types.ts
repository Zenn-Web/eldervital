/**
 * Tipe data untuk pemeriksaan gejala (decision tree).
 *
 * Semua keputusan di sini berbasis aturan eksplisit di data pohon (tree.v1.ts),
 * tanpa AI generatif. ElderVital adalah skrining gejala, bukan diagnosis.
 */

/** Siapa yang memberi jawaban: lansia sendiri atau caregiver yang mencatat. */
export type Source = "lansia" | "caregiver";

/** Mode pemeriksaan sesuai spesifikasi: cek mandiri atau dibantu caregiver. */
export type Mode = "mandiri" | "caregiver";

export type Level = "green" | "yellow" | "red";

/** "insufficient" = data tidak cukup atau pemeriksaan belum selesai. */
export type ResultStatus = Level | "insufficient";

export interface Option {
  id: string;
  /** Teks pada tombol dan yang dibacakan. Bahasa sederhana. */
  label: string;
  /**
   * Kata atau frasa yang dikenali dari jawaban suara. Jawaban suara selalu
   * dikonfirmasi pengguna sebelum dipakai, jadi daftar ini boleh sederhana.
   */
  say?: readonly string[];
  /** Pilihan "tidak tahu" atau "tidak yakin". Dicatat sebagai belum diketahui. */
  unknown?: boolean;
}

export interface ChoiceNode {
  kind: "choice";
  id: string;
  /** Kelompok topik, dipakai untuk judul kecil di layar. */
  topic: string;
  prompt: string;
  /** Penjelasan singkat tambahan, opsional. */
  hint?: string;
  options: readonly Option[];
  /**
   * Jika true, jawaban "tidak tahu" membuat hasil menjadi "data tidak cukup"
   * (kecuali sudah ada pemicu kuning atau merah). Hijau tidak boleh diberikan
   * ketika pertanyaan penting belum terjawab.
   */
  critical?: boolean;
  /** id node berikutnya per id pilihan. null berarti pemeriksaan selesai. */
  next: Readonly<Record<string, string | null>>;
}

export interface TextNode {
  kind: "text";
  id: string;
  topic: string;
  prompt: string;
  hint?: string;
  maxLength: number;
  /** Label tombol untuk "tidak tahu". Jawaban disimpan sebagai belum diketahui. */
  unknownLabel: string;
  next: string | null;
}

export type TreeNode = ChoiceNode | TextNode;

export interface Rule {
  id: string;
  level: "yellow" | "red";
  /** Aturan menyala bila jawaban pada node ini ada di dalam anyOf. */
  when: { node: string; anyOf: readonly string[] };
  /** Alasan yang ditampilkan kepada pengguna dan caregiver. */
  reason: string;
}

export interface Guidance {
  headline: string;
  summary: string;
  actions: readonly string[];
}

export interface EmergencyContact {
  label: string;
  number: string;
}

export interface ScreeningTree {
  id: string;
  /** Versi pohon. Disimpan bersama setiap pemeriksaan. */
  version: string;
  title: string;
  /** Aturan klinis harus ditinjau tenaga kesehatan sebelum dipakai nyata. */
  reviewStatus: "belum_ditinjau" | "ditinjau";
  start: string;
  /** Node yang wajib dilalui setiap pemeriksaan yang selesai (mis. pertanyaan obat). */
  requiredNodes: readonly string[];
  nodes: Readonly<Record<string, TreeNode>>;
  rules: readonly Rule[];
  guidance: {
    green: Guidance;
    yellow: Guidance;
    red: Guidance;
    incomplete: Guidance;
    unknown: Guidance;
  };
  emergencyContacts: readonly EmergencyContact[];
  disclaimer: string;
}

export interface Answer {
  nodeId: string;
  /** id pilihan, atau teks bebas untuk node teks. "belum_diketahui" bila tidak tahu. */
  value: string;
  /** Teks yang ditampilkan di ringkasan. */
  label: string;
  source: Source;
  unknown: boolean;
  answeredAt: string;
}

export interface Session {
  treeId: string;
  treeVersion: string;
  mode: Mode;
  startedAt: string;
  /** Jawaban sesuai urutan. */
  answers: readonly Answer[];
  /** Node yang sedang ditanyakan. null bila selesai atau terhenti. */
  currentId: string | null;
  status: "in_progress" | "completed" | "stopped_red";
  /** id aturan merah yang menghentikan pemeriksaan. */
  stoppedBy?: string;
  finishedAt?: string;
}

export interface Reason {
  ruleId: string;
  level: "yellow" | "red";
  nodeId: string;
  question: string;
  answerLabel: string;
  text: string;
}

export interface AnswerSummary {
  nodeId: string;
  question: string;
  answerLabel: string;
  source: Source;
  unknown: boolean;
}

export interface ScreeningResult {
  status: ResultStatus;
  headline: string;
  summary: string;
  reasons: readonly Reason[];
  actions: readonly string[];
  /** Pertanyaan penting yang dijawab "tidak tahu". */
  unknownItems: readonly { nodeId: string; question: string }[];
  answers: readonly AnswerSummary[];
  /** true bila seluruh pertanyaan pada jalur ini sudah terjawab. */
  complete: boolean;
  /** Ada tanda bahaya yang menghentikan pemeriksaan lebih awal. */
  interrupted: boolean;
  emergencyContacts: readonly EmergencyContact[];
  treeId: string;
  treeVersion: string;
  reviewStatus: ScreeningTree["reviewStatus"];
  disclaimer: string;
}
