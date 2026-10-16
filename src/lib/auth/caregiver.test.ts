import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInCaregiverWithGoogle } from "./caregiver";

const mocks = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabase: () => ({ auth: { signInWithOAuth: mocks.signInWithOAuth } }),
}));

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
