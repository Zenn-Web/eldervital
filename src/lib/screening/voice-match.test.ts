import { describe, expect, it } from "vitest";
import { matchSpokenAnswer, normalize, treeV1, type ChoiceNode } from "./index";

const opts = (id: string) => (treeV1.nodes[id] as ChoiceNode).options;

const pick = (nodeId: string, said: string) => {
  const m = matchSpokenAnswer(said, opts(nodeId));
  return m.status === "match" ? m.optionId : m.status;
};

describe("normalize", () => {
  it("huruf kecil, tanpa tanda baca, dan menyamakan ejaan lisan", () => {
    expect(normalize("  Nggak, TAU!  ")).toEqual(["tidak", "tahu"]);
    expect(normalize("Iya.")).toEqual(["ya"]);
    expect(normalize("")).toEqual([]);
  });
});

describe("matchSpokenAnswer", () => {
  it("ya dan variasinya", () => {
    expect(pick("cough_today", "ya")).toBe("ya");
    expect(pick("cough_today", "Iya, betul")).toBe("ya");
    expect(pick("cough_today", "ya ya ya")).toBe("ya");
    expect(pick("cough_today", "ada")).toBe("ya");
  });

  it("tidak dan variasinya", () => {
    expect(pick("cough_today", "tidak")).toBe("tidak");
    expect(pick("cough_today", "Nggak")).toBe("tidak");
    expect(pick("cough_today", "gak batuk")).toBe("tidak");
    expect(pick("cough_today", "tidak ada")).toBe("tidak");
  });

  it("'tidak tahu' dikenali sebagai tidak yakin, bukan 'tidak'", () => {
    expect(pick("cough_today", "tidak tahu")).toBe("tidak_yakin");
    expect(pick("cough_today", "nggak tau")).toBe("tidak_yakin");
    expect(pick("cough_today", "saya lupa")).toBe("tidak_yakin");
  });

  it("jawaban bertentangan dianggap ambigu, bukan ditebak", () => {
    const m = matchSpokenAnswer("ya tidak", opts("cough_today"));
    expect(m.status).toBe("ambiguous");
  });

  it("tidak dikenali menghasilkan none", () => {
    expect(pick("cough_today", "hmm")).toBe("none");
    expect(pick("cough_today", "")).toBe("none");
  });

  it("pertanyaan dengan pilihan non ya/tidak", () => {
    expect(pick("chest_check", "sedikit sesak")).toBe("c_mild");
    expect(pick("chest_check", "sesak sekali")).toBe("c_severe");
    expect(pick("chest_check", "tidak sesak")).toBe("c_no");
    expect(pick("cough_duration", "sudah dua minggu lebih")).toBe("d_gte14");
    expect(pick("med_taken", "sudah minum")).toBe("m_yes");
    expect(pick("med_taken", "belum")).toBe("m_no");
    expect(pick("med_taken", "lupa minum")).toBe("m_no");
    expect(pick("med_taken", "lupa")).toBe("m_unknown");
  });

  it("menyertakan teks yang terdengar agar bisa dikonfirmasi pengguna", () => {
    const m = matchSpokenAnswer("Iya, kemarin sore", opts("cough_today"));
    expect(m.heard).toBe("ya kemarin sore");
  });
});
