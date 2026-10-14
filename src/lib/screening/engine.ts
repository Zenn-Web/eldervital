import type {
  Answer,
  ChoiceNode,
  Mode,
  Reason,
  ResultStatus,
  ScreeningResult,
  ScreeningTree,
  Session,
  Source,
  TextNode,
  TreeNode,
} from "./types";

/** Nilai yang disimpan bila pengguna tidak tahu. Tidak pernah diisi dengan tebakan. */
export const UNKNOWN_VALUE = "belum_diketahui";
export const UNKNOWN_LABEL = "Belum diketahui";

export class ScreeningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScreeningError";
  }
}

interface Options {
  /** Waktu ISO. Diisi agar fungsi tetap murni dan mudah diuji. */
  at?: string;
}

const nowIso = (o?: Options) => o?.at ?? new Date().toISOString();

export function getNode(tree: ScreeningTree, id: string): TreeNode {
  const node = tree.nodes[id];
  if (!node) throw new ScreeningError(`Node tidak ditemukan: ${id}`);
  return node;
}

export function startSession(
  tree: ScreeningTree,
  opts: { mode: Mode } & Options,
): Session {
  return {
    treeId: tree.id,
    treeVersion: tree.version,
    mode: opts.mode,
    startedAt: nowIso(opts),
    answers: [],
    currentId: tree.start,
    status: "in_progress",
  };
}

/** Pertanyaan yang sedang ditampilkan, atau null bila pemeriksaan sudah berhenti. */
export function currentNode(tree: ScreeningTree, session: Session): TreeNode | null {
  return session.currentId ? getNode(tree, session.currentId) : null;
}

function assertActive(session: Session): asserts session is Session & { currentId: string } {
  if (session.status !== "in_progress" || session.currentId === null) {
    throw new ScreeningError("Pemeriksaan sudah tidak aktif.");
  }
}

/** Aturan merah yang menyala untuk satu jawaban, bila ada. */
function redRuleFor(tree: ScreeningTree, answer: Answer): string | undefined {
  return tree.rules.find(
    (r) =>
      r.level === "red" &&
      r.when.node === answer.nodeId &&
      r.when.anyOf.includes(answer.value),
  )?.id;
}

function advance(
  tree: ScreeningTree,
  session: Session,
  answer: Answer,
  next: string | null,
  at: string,
): Session {
  const answers = [...session.answers, answer];
  const redRule = redRuleFor(tree, answer);
  if (redRule) {
    // Tanda bahaya: hentikan alur biasa, jangan menunggu pertanyaan lain.
    return { ...session, answers, currentId: null, status: "stopped_red", stoppedBy: redRule, finishedAt: at };
  }
  if (next === null) {
    return { ...session, answers, currentId: null, status: "completed", finishedAt: at };
  }
  return { ...session, answers, currentId: next };
}

export function answerChoice(
  tree: ScreeningTree,
  session: Session,
  optionId: string,
  source: Source,
  opts: Options = {},
): Session {
  assertActive(session);
  const node = getNode(tree, session.currentId);
  if (node.kind !== "choice") throw new ScreeningError(`Pertanyaan ${node.id} bukan pilihan.`);
  const option = (node as ChoiceNode).options.find((o) => o.id === optionId);
  if (!option) throw new ScreeningError(`Pilihan tidak valid untuk ${node.id}: ${optionId}`);
  const at = nowIso(opts);
  const answer: Answer = {
    nodeId: node.id,
    value: option.id,
    label: option.label,
    source,
    unknown: option.unknown === true,
    answeredAt: at,
  };
  const next = (node as ChoiceNode).next[option.id];
  if (next === undefined) {
    throw new ScreeningError(`Pohon tidak memiliki langkah berikutnya untuk ${node.id}/${option.id}`);
  }
  return advance(tree, session, answer, next, at);
}

export function answerText(
  tree: ScreeningTree,
  session: Session,
  text: string | null,
  source: Source,
  opts: Options = {},
): Session {
  assertActive(session);
  const node = getNode(tree, session.currentId);
  if (node.kind !== "text") throw new ScreeningError(`Pertanyaan ${node.id} bukan isian teks.`);
  const clean = (text ?? "").replace(/\s+/g, " ").trim().slice(0, (node as TextNode).maxLength);
  const unknown = clean.length === 0;
  const at = nowIso(opts);
  const answer: Answer = {
    nodeId: node.id,
    value: unknown ? UNKNOWN_VALUE : clean,
    label: unknown ? UNKNOWN_LABEL : clean,
    source,
    unknown,
    answeredAt: at,
  };
  return advance(tree, session, answer, (node as TextNode).next, at);
}

/**
 * Perbaiki jawaban: kembali ke pertanyaan tertentu dan hapus jawaban setelahnya,
 * karena jalur berikutnya bisa berbeda. Dipakai untuk "Ubah jawaban" dan koreksi suara.
 */
export function reviseAnswer(tree: ScreeningTree, session: Session, nodeId: string): Session {
  const index = session.answers.findIndex((a) => a.nodeId === nodeId);
  if (index === -1) throw new ScreeningError(`Belum ada jawaban untuk ${nodeId}`);
  getNode(tree, nodeId);
  return {
    treeId: session.treeId,
    treeVersion: session.treeVersion,
    mode: session.mode,
    startedAt: session.startedAt,
    answers: session.answers.slice(0, index),
    currentId: nodeId,
    status: "in_progress",
  };
}

/** Kembali satu pertanyaan. Mengembalikan sesi yang sama bila belum ada jawaban. */
export function undoLast(tree: ScreeningTree, session: Session): Session {
  const last = session.answers[session.answers.length - 1];
  return last ? reviseAnswer(tree, session, last.nodeId) : session;
}

/** Jumlah pertanyaan terpanjang yang masih mungkin dari satu node (untuk indikator kemajuan). */
export function maxStepsFrom(tree: ScreeningTree, nodeId: string): number {
  const memo = new Map<string, number>();
  const walk = (id: string, seen: Set<string>): number => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    if (seen.has(id)) return 0; // pengaman; pohon yang valid tidak punya putaran
    const node = getNode(tree, id);
    const nexts =
      node.kind === "text"
        ? [node.next]
        : Object.values((node as ChoiceNode).next);
    const nextSeen = new Set(seen).add(id);
    let best = 0;
    for (const n of nexts) {
      if (n !== null) best = Math.max(best, walk(n, nextSeen));
    }
    memo.set(id, 1 + best);
    return 1 + best;
  };
  return walk(nodeId, new Set());
}

export interface Progress {
  /** Nomor pertanyaan yang sedang ditampilkan (mulai 1). */
  position: number;
  /** Jumlah pertanyaan paling banyak pada jalur ini. */
  atMost: number;
}

export function progress(tree: ScreeningTree, session: Session): Progress {
  const answered = session.answers.length;
  const remaining = session.currentId ? maxStepsFrom(tree, session.currentId) : 0;
  return { position: Math.min(answered + 1, answered + Math.max(remaining, 1)), atMost: answered + remaining };
}

function summarize(tree: ScreeningTree, session: Session) {
  return session.answers.map((a) => {
    const node = getNode(tree, a.nodeId);
    return {
      nodeId: a.nodeId,
      question: node.prompt,
      answerLabel: a.label,
      source: a.source,
      unknown: a.unknown,
    };
  });
}

function matchedReasons(tree: ScreeningTree, session: Session): Reason[] {
  const out: Reason[] = [];
  for (const rule of tree.rules) {
    const answer = session.answers.find((a) => a.nodeId === rule.when.node);
    if (answer && rule.when.anyOf.includes(answer.value)) {
      out.push({
        ruleId: rule.id,
        level: rule.level,
        nodeId: answer.nodeId,
        question: getNode(tree, answer.nodeId).prompt,
        answerLabel: answer.label,
        text: rule.reason,
      });
    }
  }
  // Merah ditampilkan lebih dulu.
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === "red" ? -1 : 1));
}

/**
 * Menghitung hasil skrining dari jawaban yang ada. Urutan prioritas:
 * 1. Ada aturan merah        -> merah (berlaku sejak jawaban itu masuk).
 * 2. Belum selesai           -> data tidak cukup ("Pemeriksaan belum selesai").
 * 3. Ada aturan kuning       -> kuning.
 * 4. Pertanyaan penting "tidak tahu" -> data tidak cukup.
 * 5. Selain itu              -> hijau (tidak ada pemicu perhatian yang teridentifikasi).
 */
export function evaluate(tree: ScreeningTree, session: Session): ScreeningResult {
  const reasons = matchedReasons(tree, session);
  const hasRed = reasons.some((r) => r.level === "red");
  const hasYellow = reasons.some((r) => r.level === "yellow");
  const complete = session.status === "completed" || session.status === "stopped_red";

  const unknownItems = session.answers
    .filter((a) => {
      const node = getNode(tree, a.nodeId);
      return a.unknown && node.kind === "choice" && (node as ChoiceNode).critical === true;
    })
    .map((a) => ({ nodeId: a.nodeId, question: getNode(tree, a.nodeId).prompt }));

  let status: ResultStatus;
  let guidance;
  if (hasRed) {
    status = "red";
    guidance = tree.guidance.red;
  } else if (session.status !== "completed") {
    status = "insufficient";
    guidance = tree.guidance.incomplete;
  } else if (hasYellow) {
    status = "yellow";
    guidance = tree.guidance.yellow;
  } else if (unknownItems.length > 0) {
    status = "insufficient";
    guidance = tree.guidance.unknown;
  } else {
    status = "green";
    guidance = tree.guidance.green;
  }

  return {
    status,
    headline: guidance.headline,
    summary: guidance.summary,
    reasons,
    actions: guidance.actions,
    unknownItems,
    answers: summarize(tree, session),
    complete,
    interrupted: session.status === "stopped_red",
    emergencyContacts: status === "red" ? tree.emergencyContacts : [],
    treeId: tree.id,
    treeVersion: tree.version,
    reviewStatus: tree.reviewStatus,
    disclaimer: tree.disclaimer,
  };
}
