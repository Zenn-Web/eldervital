import { describe, expect, it } from "vitest";
import { answerChoice, evaluate, startSession, treeV1 as tree } from "@/lib/screening";
import { saveReminders } from "./reminders";
import { updateElderProfile, type ElderProfile } from "./auth/elder";
import { updateCaregiverName } from "./auth/caregiver";
import { toDemoHistoryRecord } from "./demo-history";
import { newExamId, toSaveArgs } from "./exam/payload";
import { extractToken } from "./pairing";

// Validasi di aplikasi berjalan SEBELUM menyentuh database, jadi tes ini tidak butuh Supabase.
// Lapis kedua (CHECK dan RLS di database) dites terpisah di supabase/tests/policies.test.ts.

const profile: ElderProfile = { id: "e1", deviceUserId: "u1", displayName: "Bu Sari", ageRange: null };

describe("validasi input di aplikasi", () => {
  it("jadwal: jam tidak sah, nama kosong, nama terlalu panjang, dan nama ganda ditolak", async () => {
    await expect(saveReminders("e1", [{ label: "Pagi", time: "25.00", enabled: true }])).rejects.toThrow(/tidak sah/);
    await expect(saveReminders("e1", [{ label: "  ", time: "07.00", enabled: true }])).rejects.toThrow(/1 sampai 30/);
    await expect(saveReminders("e1", [{ label: "x".repeat(31), time: "07.00", enabled: true }])).rejects.toThrow(/1 sampai 30/);
    await expect(
      saveReminders("e1", [
        { label: "Pagi", time: "07.00", enabled: true },
        { label: "pagi", time: "08.00", enabled: true },
      ]),
    ).rejects.toThrow(/tidak boleh sama/);
  });

  it("profil lansia dan nama caregiver: kosong atau lebih dari 60 karakter ditolak", async () => {
    await expect(updateElderProfile(profile, { displayName: "   " })).rejects.toThrow(/1 sampai 60/);
    await expect(updateElderProfile(profile, { displayName: "x".repeat(61) })).rejects.toThrow(/1 sampai 60/);
    await expect(updateCaregiverName("")).rejects.toThrow(/1 sampai 60/);
    await expect(updateCaregiverName("x".repeat(61))).rejects.toThrow(/1 sampai 60/);
  });

  it("kode pairing: isi selain token ElderVital ditolak (termasuk upaya menyisipkan teks lain)", () => {
    expect(extractToken("'; drop table elders; --")).toBeNull();
    expect(extractToken("https://contoh.com/?t=bukan-token")).toBeNull();
    expect(extractToken("0".repeat(65))).toBeNull();
  });
});

describe("label data simulasi", () => {
  function finished() {
    let s = startSession(tree, { mode: "mandiri" });
    for (const step of ["tidak", "c_no", "m_none"]) s = answerChoice(tree, s, step, "lansia");
    return { session: s, result: evaluate(tree, s) };
  }

  it("riwayat demo lokal selalu berlabel simulasi", () => {
    const { session, result } = finished();
    expect(toDemoHistoryRecord("d1", session, result).p_is_simulated).toBe(true);
  });

  it("pemeriksaan sungguhan tidak berlabel simulasi, kecuali diminta", () => {
    const { session, result } = finished();
    expect(toSaveArgs(newExamId(), "e1", session, result).p_is_simulated).toBe(false);
    expect(toSaveArgs(newExamId(), "e1", session, result, { isSimulated: true }).p_is_simulated).toBe(true);
  });
});
