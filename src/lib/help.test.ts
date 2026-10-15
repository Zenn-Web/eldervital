import { describe, expect, it } from "vitest";
import { rowToHelpRequest } from "./help";

describe("rowToHelpRequest", () => {
  it("memetakan baris dan nama dari embed lansia dan caregiver", () => {
    expect(
      rowToHelpRequest({
        id: "h1",
        elder_id: "e1",
        status: "taken",
        taken_by: "c1",
        created_at: "2026-10-15T02:00:00Z",
        handled_at: "2026-10-15T02:01:00Z",
        elders: { display_name: "Ibu Ani" },
        caregivers: [{ display_name: "Sinta" }],
      }),
    ).toEqual({
      id: "h1",
      elderId: "e1",
      elderName: "Ibu Ani",
      status: "taken",
      takenBy: "c1",
      takenByName: "Sinta",
      createdAt: "2026-10-15T02:00:00Z",
      handledAt: "2026-10-15T02:01:00Z",
    });
  });

  it("permintaan yang belum ditanggapi: tanpa nama caregiver", () => {
    const r = rowToHelpRequest({ id: "h2", elder_id: "e1", status: "open", taken_by: null, created_at: "t", handled_at: null, elders: null, caregivers: null });
    expect(r).toMatchObject({ status: "open", takenBy: null, takenByName: null, elderName: null, handledAt: null });
  });
});
