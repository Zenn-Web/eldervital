import { describe, expect, it } from "vitest";
import {
  ScreeningError,
  UNKNOWN_VALUE,
  answerChoice,
  answerText,
  currentNode,
  evaluate,
  progress,
  reviseAnswer,
  startSession,
  treeV1 as tree,
  undoLast,
  type Session,
  type Source,
} from "./index";

const AT = "2026-10-14T08:00:00.000Z";

/** Menjawab berurutan. Elemen string = id pilihan; elemen {text} = isian teks. */
function run(steps: (string | { text: string | null })[], source: Source = "lansia", mode: "mandiri" | "caregiver" = "mandiri"): Session {
  let s = startSession(tree, { mode, at: AT });
  for (const step of steps) {
    s = typeof step === "string"
      ? answerChoice(tree, s, step, source, { at: AT })
      : answerText(tree, s, step.text, source, { at: AT });
  }
  return s;
}

const asked = (s: Session) => s.answers.map((a) => a.nodeId);

describe("alur adaptif", () => {
  it("tidak batuk: pertanyaan lanjutan batuk dilewati, obat tetap ditanyakan", () => {
    const s = run(["tidak", "c_no", "m_none"]);
    expect(asked(s)).toEqual(["cough_today", "chest_check", "med_taken"]);
    expect(s.status).toBe("completed");
    expect(evaluate(tree, s).status).toBe("green");
  });

  it("batuk: pertanyaan lanjutan hanya muncul bila relevan", () => {
    const s = run(["ya", "d_lt3", "f_rare", "tidak", "tidak", "c_no", "m_yes", { text: "Amlodipin" }, { text: "2 kali sehari" }]);
    expect(asked(s)).toEqual([
      "cough_today",
      "cough_duration",
      "cough_frequency",
      "cough_blood",
      "cough_fever",
      "chest_check",
      "med_taken",
      "med_name",
      "med_frequency",
    ]);
    expect(s.answers.at(-2)?.label).toBe("Amlodipin");
    expect(s.answers.at(-1)?.label).toBe("2 kali sehari");
    expect(evaluate(tree, s).status).toBe("green");
  });

  it("nama obat ditanyakan bila punya obat rutin, sudah maupun belum diminum", () => {
    expect(currentNode(tree, run(["tidak", "c_no", "m_yes"]))?.id).toBe("med_name");
    expect(currentNode(tree, run(["tidak", "c_no", "m_no"]))?.id).toBe("med_name");
    // Tidak punya obat rutin, atau tidak yakin: tidak ditanya nama maupun frekuensi.
    expect(run(["tidak", "c_no", "m_none"]).status).toBe("completed");
    expect(run(["tidak", "c_no", "m_unknown"]).status).toBe("completed");
  });

  it("nama obat tidak diketahui disimpan sebagai belum diketahui, tidak ditebak", () => {
    const s = run(["tidak", "c_no", "m_yes", { text: "   " }, { text: "1 kali sehari" }]);
    const name = s.answers.find((a) => a.nodeId === "med_name")!;
    expect(name.value).toBe(UNKNOWN_VALUE);
    expect(name.unknown).toBe(true);
    // nama obat bukan pertanyaan penting, jadi tidak menghalangi hijau
    expect(evaluate(tree, s).status).toBe("green");
  });

  it("frekuensi obat ditanyakan setelah nama obat, juga bila nama obat tidak diketahui", () => {
    expect(currentNode(tree, run(["tidak", "c_no", "m_yes", { text: "Amlodipin" }]))?.id).toBe("med_frequency");
    expect(currentNode(tree, run(["tidak", "c_no", "m_yes", { text: null }]))?.id).toBe("med_frequency");
    // Tanpa obat rutin atau belum minum: tidak ditanya nama maupun frekuensi.
    expect(asked(run(["tidak", "c_no", "m_none"]))).not.toContain("med_frequency");
  });

  it("frekuensi obat hanya dicatat: tidak tahu tidak menghalangi hijau dan tidak memicu aturan", () => {
    const s = run(["tidak", "c_no", "m_yes", { text: "Amlodipin" }, { text: null }]);
    const freq = s.answers.at(-1)!;
    expect(freq.nodeId).toBe("med_frequency");
    expect(freq.unknown).toBe(true);
    const r = evaluate(tree, s);
    expect(r.status).toBe("green");
    expect(r.reasons).toEqual([]);
    expect(tree.rules.some((rule) => rule.when.node === "med_frequency")).toBe(false);
  });

  it("pemeriksaan yang berhenti sebelum frekuensi obat belum lengkap, tidak hijau", () => {
    const s = run(["tidak", "c_no", "m_yes", { text: "Amlodipin" }]);
    expect(evaluate(tree, s).status).toBe("insufficient");
  });

  it("isian teks dirapikan dan dibatasi panjangnya", () => {
    const long = "a".repeat(500);
    const s = run(["tidak", "c_no", "m_yes", { text: `  Metformin    500 ${long}` }]);
    const label = s.answers.at(-1)!.label;
    expect(label.startsWith("Metformin 500 ")).toBe(true);
    expect(label.length).toBe(120);
  });
});

describe("tanda bahaya", () => {
  it("batuk darah menghentikan pemeriksaan segera dan hasilnya merah", () => {
    const s = run(["ya", "d_lt3", "f_rare", "ya"]);
    expect(s.status).toBe("stopped_red");
    expect(s.currentId).toBeNull();
    expect(s.stoppedBy).toBe("R-COUGH-BLOOD");
    expect(asked(s)).not.toContain("med_taken");

    const r = evaluate(tree, s);
    expect(r.status).toBe("red");
    expect(r.interrupted).toBe(true);
    expect(r.reasons[0].ruleId).toBe("R-COUGH-BLOOD");
    expect(r.emergencyContacts.length).toBeGreaterThan(0);
  });

  it("sesak berat pada jalur tanpa batuk juga merah dan tidak menunggu pertanyaan obat", () => {
    const s = run(["tidak", "c_severe"]);
    expect(s.status).toBe("stopped_red");
    expect(evaluate(tree, s).status).toBe("red");
  });

  it("setelah terhenti merah tidak bisa menjawab lagi", () => {
    const s = run(["ya", "d_lt3", "f_rare", "ya"]);
    expect(() => answerChoice(tree, s, "tidak", "lansia")).toThrow(ScreeningError);
  });

  it("merah mengalahkan kuning dan jawaban tidak tahu", () => {
    const s = run(["tidak_yakin", "c_severe"]);
    const r = evaluate(tree, s);
    expect(r.status).toBe("red");
    expect(r.unknownItems.map((u) => u.nodeId)).toContain("cough_today");
  });

  it("hanya merah yang mengeluarkan nomor darurat", () => {
    expect(evaluate(tree, run(["tidak", "c_no", "m_none"])).emergencyContacts).toHaveLength(0);
  });
});

describe("status kuning", () => {
  it("memberi alasan yang bisa ditelusuri ke pertanyaan dan jawaban", () => {
    const s = run(["ya", "d_gte14", "f_rare", "tidak", "ya", "c_no", "m_none"]);
    const r = evaluate(tree, s);
    expect(r.status).toBe("yellow");
    expect(r.reasons.map((x) => x.ruleId).sort()).toEqual(["Y-COUGH-DURATION", "Y-COUGH-FEVER"]);
    const fever = r.reasons.find((x) => x.ruleId === "Y-COUGH-FEVER")!;
    expect(fever.question).toMatch(/demam/);
    expect(fever.answerLabel).toBe("Ya");
  });

  it("obat belum diminum dicatat tanpa saran dosis", () => {
    const s = run(["tidak", "c_no", "m_no", { text: "Amlodipin" }, { text: "2 kali sehari" }]);
    expect(asked(s).slice(-3)).toEqual(["med_taken", "med_name", "med_frequency"]);
    const r = evaluate(tree, s);
    expect(r.status).toBe("yellow");
    expect(r.reasons.map((x) => x.ruleId)).toEqual(["Y-MED-MISSED"]);
    const text = [r.summary, ...r.actions, ...r.reasons.map((x) => x.text)].join(" ");
    expect(text).not.toMatch(/gandakan|tambah(kan)? dosis|ubah dosis|kurangi dosis|ganti obat/i);
  });
});

describe("data tidak cukup", () => {
  it("pemeriksaan yang belum selesai tidak pernah hijau", () => {
    const r = evaluate(tree, run(["tidak", "c_no"]));
    expect(r.status).toBe("insufficient");
    expect(r.complete).toBe(false);
    expect(r.headline).toBe("Pemeriksaan belum selesai");
  });

  it("belum selesai tetap menampilkan alasan kuning yang sudah ada", () => {
    const r = evaluate(tree, run(["ya", "d_gte14"]));
    expect(r.status).toBe("insufficient");
    expect(r.reasons.map((x) => x.ruleId)).toContain("Y-COUGH-DURATION");
  });

  it("pertanyaan penting dijawab tidak tahu: tidak boleh hijau", () => {
    const r = evaluate(tree, run(["tidak_yakin", "c_no", "m_none"]));
    expect(r.status).toBe("insufficient");
    expect(r.headline).toBe("Data belum cukup");
    expect(r.unknownItems.map((u) => u.nodeId)).toEqual(["cough_today"]);
  });

  it("pertanyaan tidak penting dijawab tidak tahu: tetap bisa hijau", () => {
    const s = run(["ya", "d_unknown", "f_unknown", "tidak", "tidak", "c_no", "m_none"]);
    expect(evaluate(tree, s).status).toBe("green");
  });

  it("kuning tetap kuning walau ada jawaban tidak tahu", () => {
    const s = run(["tidak_yakin", "c_mild", "m_none"]);
    const r = evaluate(tree, s);
    expect(r.status).toBe("yellow");
    expect(r.unknownItems).toHaveLength(1);
  });
});

describe("koreksi jawaban", () => {
  it("memperbaiki jawaban membuang jawaban setelahnya dan membuka jalur baru", () => {
    const stopped = run(["ya", "d_lt3", "f_rare", "ya"]);
    const back = reviseAnswer(tree, stopped, "cough_blood");
    expect(back.status).toBe("in_progress");
    expect(back.currentId).toBe("cough_blood");
    expect(back.answers).toHaveLength(3);
    expect(back.stoppedBy).toBeUndefined();

    const next = answerChoice(tree, back, "tidak", "lansia", { at: AT });
    expect(next.currentId).toBe("cough_fever");
  });

  it("mengubah jawaban awal mengubah jalur berikutnya", () => {
    const s = run(["ya", "d_lt3"]);
    const redo = answerChoice(tree, reviseAnswer(tree, s, "cough_today"), "tidak", "lansia", { at: AT });
    expect(redo.currentId).toBe("chest_check");
    expect(redo.answers).toHaveLength(1);
  });

  it("undoLast kembali satu pertanyaan; tanpa jawaban tidak berubah", () => {
    const s = run(["ya", "d_lt3"]);
    expect(undoLast(tree, s).currentId).toBe("cough_duration");
    const fresh = startSession(tree, { mode: "mandiri", at: AT });
    expect(undoLast(tree, fresh)).toBe(fresh);
  });

  it("revisi node yang belum dijawab ditolak", () => {
    expect(() => reviseAnswer(tree, run(["tidak"]), "med_taken")).toThrow(ScreeningError);
  });
});

describe("validasi masukan dan keadaan", () => {
  it("pilihan tidak valid ditolak", () => {
    const s = startSession(tree, { mode: "mandiri", at: AT });
    expect(() => answerChoice(tree, s, "mungkin", "lansia")).toThrow(ScreeningError);
  });

  it("jenis jawaban harus sesuai jenis pertanyaan", () => {
    const s = startSession(tree, { mode: "mandiri", at: AT });
    expect(() => answerText(tree, s, "halo", "lansia")).toThrow(ScreeningError);
    const atText = run(["tidak", "c_no", "m_yes"]);
    expect(() => answerChoice(tree, atText, "ya", "lansia")).toThrow(ScreeningError);
  });

  it("pemeriksaan selesai tidak bisa dijawab lagi", () => {
    const done = run(["tidak", "c_no", "m_none"]);
    expect(() => answerChoice(tree, done, "ya", "lansia")).toThrow(ScreeningError);
  });

  it("sesi lama tidak berubah (tidak ada mutasi)", () => {
    const s0 = startSession(tree, { mode: "mandiri", at: AT });
    const s1 = answerChoice(tree, s0, "ya", "lansia", { at: AT });
    expect(s0.answers).toHaveLength(0);
    expect(s0.currentId).toBe("cough_today");
    expect(s1.answers).toHaveLength(1);
  });
});

describe("sumber jawaban dan jejak", () => {
  it("mencatat siapa yang menjawab", () => {
    const s = run(["tidak", "c_no", "m_none"], "caregiver", "caregiver");
    expect(s.mode).toBe("caregiver");
    expect(s.answers.every((a) => a.source === "caregiver")).toBe(true);
    expect(evaluate(tree, s).answers.every((a) => a.source === "caregiver")).toBe(true);
  });

  it("menyimpan versi pohon dan status peninjauan pada hasil", () => {
    const r = evaluate(tree, run(["tidak", "c_no", "m_none"]));
    expect(r.treeVersion).toBe(tree.version);
    expect(r.reviewStatus).toBe("belum_ditinjau");
    expect(r.disclaimer).toMatch(/bukan diagnosis/);
  });

  it("hasil hijau tidak mengklaim pasti sehat", () => {
    const r = evaluate(tree, run(["tidak", "c_no", "m_none"]));
    expect(r.summary).toMatch(/bukan jaminan/);
    expect(`${r.headline} ${r.summary}`).not.toMatch(/pasti sehat|tidak ada penyakit/i);
  });
});

describe("indikator kemajuan", () => {
  it("memperkirakan jumlah pertanyaan paling banyak pada jalur", () => {
    const start = startSession(tree, { mode: "mandiri", at: AT });
    expect(progress(tree, start)).toEqual({ position: 1, atMost: 9 });
    const skipped = run(["tidak"]);
    expect(progress(tree, skipped)).toEqual({ position: 2, atMost: 5 });
  });
});

describe("semua kemungkinan jalur (menyeluruh)", () => {
  /** Menelusuri setiap kombinasi jawaban dan memeriksa aturan yang harus selalu berlaku. */
  it("invarian keselamatan berlaku di setiap jalur", () => {
    let paths = 0;
    const visit = (s: Session) => {
      const node = currentNode(tree, s);
      if (node === null) {
        paths++;
        const r = evaluate(tree, s);
        const redAnswered = r.reasons.some((x) => x.level === "red");

        // 1. Jawaban tanda bahaya selalu menghasilkan merah dan menghentikan alur.
        if (redAnswered) {
          expect(r.status).toBe("red");
          expect(s.status).toBe("stopped_red");
        }
        // 2. Pemeriksaan yang selesai tanpa tanda bahaya selalu melewati pertanyaan obat.
        if (!redAnswered) {
          expect(s.answers.map((a) => a.nodeId)).toContain("med_taken");
        }
        // 3. Hijau hanya bila selesai, tanpa pemicu, dan tanpa jawaban penting yang tidak diketahui.
        if (r.status === "green") {
          expect(r.complete).toBe(true);
          expect(r.reasons).toHaveLength(0);
          expect(r.unknownItems).toHaveLength(0);
        }
        // 4. Setiap alasan menunjuk jawaban yang benar-benar tercatat.
        for (const reason of r.reasons) {
          expect(s.answers.some((a) => a.nodeId === reason.nodeId && a.label === reason.answerLabel)).toBe(true);
        }
        // 5. Hasil tidak memuat saran dosis.
        expect([r.summary, ...r.actions].join(" ")).not.toMatch(/gandakan|tambah(kan)? dosis|ubah dosis/i);
        return;
      }
      if (node.kind === "choice") {
        for (const opt of node.options) visit(answerChoice(tree, s, opt.id, "lansia", { at: AT }));
      } else {
        visit(answerText(tree, s, "Obat uji", "lansia", { at: AT }));
        visit(answerText(tree, s, null, "lansia", { at: AT }));
      }
    };
    visit(startSession(tree, { mode: "mandiri", at: AT }));
    expect(paths).toBeGreaterThan(50);
  });
});
