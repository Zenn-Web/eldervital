import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInCaregiverWithGoogle, signOutCaregiver } from "./caregiver";

const mocks = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
  signOut: vi.fn(),
  clearOutbox: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabase: () => ({ auth: { signInWithOAuth: mocks.signInWithOAuth, signOut: mocks.signOut } }),
}));

vi.mock("@/lib/exam/outbox", () => ({ clearOutbox: mocks.clearOutbox }));

describe("signInCaregiverWithGoogle", () => {
  beforeEach(() => {
    mocks.signInWithOAuth.mockReset();
    vi.stubGlobal("window", { location: { origin: "https://app.example" } });
  });

  it("starts Google OAuth and returns to caregiver pairing", async () => {
    mocks.signInWithOAuth.mockResolvedValue({ error: null });

    await signInCaregiverWithGoogle();

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://app.example/caregiver/hubungkan" },
    });
  });

  it("throws when Supabase rejects OAuth initiation", async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      error: new Error("Google provider belum aktif"),
    });

    await expect(signInCaregiverWithGoogle()).rejects.toThrow("Google provider belum aktif");
  });
});

describe("signOutCaregiver", () => {
  beforeEach(() => {
    mocks.signOut.mockReset();
    mocks.clearOutbox.mockReset();
  });

  it("membuang antrean caregiver sebelum sesi dihapus", async () => {
    const order: string[] = [];
    mocks.clearOutbox.mockImplementation(() => order.push("clear"));
    mocks.signOut.mockImplementation(async () => {
      order.push("signOut");
      return { error: null };
    });

    await signOutCaregiver();

    expect(mocks.clearOutbox).toHaveBeenCalledWith("caregiver");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(order).toEqual(["clear", "signOut"]);
  });

  it("antrean tetap dibuang walau Supabase gagal mengeluarkan sesi", async () => {
    mocks.signOut.mockResolvedValue({ error: new Error("jaringan putus") });
    await expect(signOutCaregiver()).rejects.toThrow("jaringan putus");
    expect(mocks.clearOutbox).toHaveBeenCalledWith("caregiver");
  });
});
