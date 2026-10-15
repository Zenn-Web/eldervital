import { describe, expect, it } from "vitest";
import { treeV1 } from "@/lib/screening";
import { rowToDetail, rowToSummary } from "./history";

const base = {
  id: "x1",
  elder_id: "e1",
  caregiver_id: null,
  mode: "mandiri",
  started_at: "2026-10-15T01:00:00Z",
  finished_at: "2026-10-15T01:03:00Z",
  status: "terhenti",
  result_status: "red",
  interrupted: true,
  is_simulated: false,
};

describe("rowToSummary", () => {
  it("memetakan kolom SQL ke camelCase dan nama lansia dari embed", () => {
    expect(rowToSummary({ ...base, elders: { display_name: "Ibu Ani" } })).toEqual({
      id: "x1",
      elderId: "e1",
      elderName: "Ibu Ani",
      mode: "mandiri",
      caregiverId: null,
      startedAt: "2026-10-15T01:00:00Z",
      finishedAt: "2026-10-15T01:03:00Z",
      status: "terhenti",
      resultStatus: "red",
      interrupted: true,
      isSimulated: false,
    });
  });

  it("nama lansia null bila embed kosong (RLS tidak mengizinkan)", () => {
    expect(rowToSummary({ ...base, elders: null }).elderName).toBeNull();
    expect(rowToSummary({ ...base, elders: [] }).elderName).toBeNull();
  });
});

describe("rowToDetail", () => {
  const answers = [
    { position: 1, question_id: "cough_blood", value: "ya", label: "Ya", source: "lansia", is_unknown: false, answered_at: "t1" },
    { position: 0, question_id: "cough_today", value: "ya", label: "Ya", source: "lansia", is_unknown: false, answered_at: "t0" },
  ];

  it("jawaban diurutkan dan diberi teks pertanyaan dari pohon versi yang sama", () => {
    const d = rowToDetail({
      ...base,
      tree_id: treeV1.id,
      tree_version: treeV1.version,
      reasons: [{ ruleId: "R-COUGH-BLOOD", level: "red" }],
      actions: ["Hubungi 119"],
      exam_answers: answers,
    });
    expect(d.answers.map((a) => a.questionId)).toEqual(["cough_today", "cough_blood"]);
    expect(d.answers[0].question).toBe(treeV1.nodes.cough_today.prompt);
    expect(d.reasons).toHaveLength(1);
    expect(d.actions).toEqual(["Hubungi 119"]);
  });

  it("versi pohon lain: teks pertanyaan tidak ditebak", () => {
    const d = rowToDetail({ ...base, tree_id: treeV1.id, tree_version: "0.0.1-lama", reasons: null, actions: null, exam_answers: answers });
    expect(d.answers.every((a) => a.question === null)).toBe(true);
    expect(d.reasons).toEqual([]);
    expect(d.actions).toEqual([]);
  });
});
