import { describe, expect, it } from "vitest";
import { answerChoice, answerText, evaluate, startSession, treeV1 as tree } from "@/lib/screening";
import { buildHelpScript } from "./followup";

function finish(steps: (string | { text: string | null })[]) {
  let s = startSession(tree, { mode: "mandiri" });
  for (const step of steps) {
    s = typeof step === "string" ? answerChoice(tree, s, step, "lansia") : answerText(tree, s, step.text, "lansia");
  }
  return evaluate(tree, s);
}

describe("buildHelpScript", () => {
  it("tanda bahaya: memuat alasan, jawaban, dan keterangan pemeriksaan dihentikan", () => {
    const result = finish(["ya", "d_lt3", "f_rare", "ya"]);
    const text = buildHelpScript(result, { elderName: "Ibu Ani", ageRange: "60-65" });
    expect(text).toMatch(/^Halo, saya membutuhkan arahan pertolongan untuk Ibu Ani, usia 60 sampai 65 tahun\./);
    expect(text).toContain("- Batuk disertai darah.");
    expect(text).toContain("Apakah batuk Anda mengeluarkan darah? Jawaban: Ya.");
    expect(text).toContain("dihentikan lebih awal");
    expect(text.trim().endsWith("bukan diagnosis.")).toBe(true);
  });

  it("jawaban tidak yakin disebut sebagai belum diketahui, tidak dianggap aman", () => {
    const result = finish(["tidak", "c_unknown", "m_none"]);
    const text = buildHelpScript(result);
    expect(text).toContain("untuk seseorang.");
    expect(text).toContain("Belum diketahui:");
    expect(text).toContain("- Apakah Anda merasa sesak napas atau nyeri dada saat ini?");
    expect(text).not.toContain("Jawaban: Saya tidak yakin");
  });

  it("nama obat yang dilaporkan ikut, tanpa saran obat atau dosis", () => {
    const result = finish(["tidak", "c_mild", "m_yes", { text: "Amlodipin" }]);
    const text = buildHelpScript(result);
    expect(text).toContain("Jawaban: Amlodipin.");
    expect(text).not.toMatch(/dosis|minumlah|sebaiknya minum|diagnosis:/i);
  });

  it("tidak menyebut nama penyakit", () => {
    const texts = [
      finish(["ya", "d_gte14", "f_constant", "tidak", "ya", "c_severe"]),
      finish(["ya", "d_lt3", "f_rare", "ya"]),
    ].map((r) => buildHelpScript(r));
    for (const t of texts) expect(t).not.toMatch(/tuberkulosis|\bTBC\b|pneumonia|jantung|covid|asma|kanker|infeksi/i);
  });
});
