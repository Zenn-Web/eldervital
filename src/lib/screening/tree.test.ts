import { describe, expect, it } from "vitest";
import { treeV1, validateTree, type ScreeningTree } from "./index";

/** Salinan dalam yang bisa diubah untuk menguji pohon rusak. */
const clone = (): ScreeningTree => structuredClone(treeV1) as ScreeningTree;
type LooseNode = {
  next: Record<string, string | null>;
  options: { id: string; label?: string; unknown?: boolean }[];
  [key: string]: unknown;
};
type Loose = { nodes: Record<string, LooseNode>; rules: unknown[]; requiredNodes: string[] };
/** Pengujian sengaja mengubah data pohon agar bisa memeriksa pohon yang rusak. */
const mutable = (t: ScreeningTree) => t as unknown as Loose;

describe("validateTree", () => {
  it("pohon v1 valid", () => {
    expect(validateTree(treeV1)).toEqual([]);
  });

  it("menolak langkah berikutnya yang tidak ada", () => {
    const t = clone();
    mutable(t).nodes.cough_today.next.ya = "tidak_ada";
    expect(validateTree(t).join("\n")).toMatch(/langkah berikutnya tidak ada: tidak_ada/);
  });

  it("menolak pilihan tanpa langkah berikutnya", () => {
    const t = clone();
    delete mutable(t).nodes.cough_today.next.ya;
    expect(validateTree(t).join("\n")).toMatch(/pilihan ya tidak punya langkah berikutnya/);
  });

  it("menolak putaran", () => {
    const t = clone();
    mutable(t).nodes.chest_check.next.c_no = "cough_today";
    expect(validateTree(t).join("\n")).toMatch(/putaran/);
  });

  it("menolak node yang tidak terjangkau", () => {
    const t = clone();
    mutable(t).nodes.orphan = {
      kind: "choice",
      id: "orphan",
      topic: "x",
      prompt: "x",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      next: { a: null, b: null },
    };
    expect(validateTree(t).join("\n")).toMatch(/tidak terjangkau dari start: orphan/);
  });

  it("menolak aturan yang merujuk pilihan tidak ada", () => {
    const t = clone();
    mutable(t).rules.push({ id: "X", level: "yellow", when: { node: "cough_today", anyOf: ["mungkin"] }, reason: "x" });
    expect(validateTree(t).join("\n")).toMatch(/pilihan tidak ada di cough_today: mungkin/);
  });

  it("menolak jalur selesai yang melewatkan pertanyaan obat", () => {
    const t = clone();
    mutable(t).nodes.chest_check.next.c_no = null; // selesai tanpa menanyakan obat
    expect(validateTree(t).join("\n")).toMatch(/jalur selesai tanpa melewati med_taken/);
  });

  it("pertanyaan penting wajib punya pilihan tidak tahu", () => {
    const t = clone();
    mutable(t).nodes.cough_today.options = mutable(t).nodes.cough_today.options.filter((o) => !o.unknown);
    delete mutable(t).nodes.cough_today.next.tidak_yakin;
    expect(validateTree(t).join("\n")).toMatch(/harus punya pilihan "tidak tahu"/);
  });
});
