import { describe, expect, it } from "vitest";
import { answerChoice, evaluate, startSession, treeV1 as tree } from "@/lib/screening";
import { newExamId, toSaveArgs } from "./payload";

const AT = "2026-10-14T08:00:00.000Z";
const ELDER = "00000000-0000-0000-0000-0000000000e1";

function finish(steps: string[]) {
  let s = startSession(tree, { mode: "mandiri", at: AT });
  for (const step of steps) s = answerChoice(tree, s, step, "lansia", { at: AT });
  return { session: s, result: evaluate(tree, s) };
}

describe("toSaveArgs", () => {
  it("pemeriksaan selesai: status, urutan jawaban, dan versi pohon ikut tersimpan", () => {
    const { session, result } = finish(["tidak", "c_no", "m_none"]);
    const args = toSaveArgs("id-1", ELDER, session, result);
    expect(args).toMatchObject({
      p_id: "id-1",
      p_elder_id: ELDER,
      p_mode: "mandiri",
      p_tree_version: tree.version,
      p_status: "selesai",
      p_result_status: "green",
      p_interrupted: false,
      p_is_simulated: false,
    });
    expect(args.p_answers.map((a) => [a.position, a.question_id])).toEqual([
      [0, "cough_today"],
      [1, "chest_check"],
      [2, "med_taken"],
    ]);
  });

  it("tanda bahaya: status terhenti dan alasan bisa ditelusuri ke pertanyaan", () => {
    const { session, result } = finish(["ya", "d_lt3", "f_rare", "ya"]);
    const args = toSaveArgs("id-2", ELDER, session, result);
    expect(args.p_status).toBe("terhenti");
    expect(args.p_result_status).toBe("red");
    expect(args.p_interrupted).toBe(true);
    expect(args.p_reasons[0]).toMatchObject({ nodeId: "cough_blood", level: "red" });
  });
});

describe("newExamId", () => {
  it("menghasilkan UUID v4 yang berbeda setiap kali", () => {
    const a = newExamId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newExamId()).not.toBe(a);
  });
});