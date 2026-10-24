import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SaveExaminationArgs } from "./payload";

// RPC tiruan: urutan hasil diatur per tes.
const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ rpc }) }));

const { clearOutbox, flushOutbox, pruneOutbox, submitExamination } = await import("./outbox");

const args = (id: string) => ({ p_id: id }) as SaveExaminationArgs;
const OK = { error: null, status: 200 };
const OFFLINE = { error: { message: "TypeError: Failed to fetch" }, status: 0 };
const DENIED = {
  error: { code: "42501", message: 'new row violates row-level security policy for table "examinations"' },
  status: 403,
};
const settle = () => new Promise((r) => setTimeout(r, 0));

describe("antrean penyimpanan", () => {
  beforeEach(async () => {
    rpc.mockReset();
    // Kosongkan antrean dari tes sebelumnya.
    rpc.mockResolvedValue(OK);
    await flushOutbox("lansia", "u1");
    await settle();
    rpc.mockReset();
  });

  it("gagal jaringan: tetap di antrean lalu terkirim saat dicoba lagi dengan id yang sama", async () => {
    rpc.mockResolvedValueOnce(OFFLINE);
    submitExamination("lansia", "u1", args("e1"));
    await settle();
    expect(rpc).toHaveBeenCalledTimes(1);

    rpc.mockResolvedValueOnce(OK);
    await flushOutbox("lansia", "u1");
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc.mock.calls[1]).toEqual(["save_examination", { p_id: "e1" }]);

    await flushOutbox("lansia", "u1");
    expect(rpc).toHaveBeenCalledTimes(2); // antrean sudah kosong
  });

  it("ditolak server: tidak dikirim ulang terus-menerus", async () => {
    rpc.mockResolvedValueOnce(DENIED);
    submitExamination("lansia", "u1", args("e2"));
    await settle();
    await flushOutbox("lansia", "u1");
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("entri milik akun lain tidak dikirim dengan sesi akun ini", async () => {
    rpc.mockResolvedValue(OFFLINE);
    submitExamination("lansia", "u1", args("e3"));
    await settle();
    rpc.mockReset();
    rpc.mockResolvedValue(OK);
    await flushOutbox("lansia", "u2");
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("antrean dan pergantian akun", () => {
  // localStorage tiruan: memastikan data benar-benar hilang dari penyimpanan perangkat,
  // bukan hanya dari salinan di memori.
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    rpc.mockReset();
  });

  it("akun baru membuang antrean akun sebelumnya tanpa mengirimnya", async () => {
    rpc.mockResolvedValue(OFFLINE);
    submitExamination("caregiver", "careA", args("a1"));
    await settle();
    expect(store.get("eldervital-outbox-caregiver")).toContain("a1");

    rpc.mockReset();
    rpc.mockResolvedValue(OK);
    await flushOutbox("caregiver", "careB");
    expect(rpc).not.toHaveBeenCalled();
    expect(store.has("eldervital-outbox-caregiver")).toBe(false);

    // Akun A masuk lagi: entri lamanya sudah tidak ada, jadi tidak ada yang terkirim.
    await flushOutbox("caregiver", "careA");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("pruneOutbox hanya menyisakan entri akun yang sedang masuk", async () => {
    rpc.mockResolvedValue(OFFLINE);
    submitExamination("caregiver", "careA", args("a2"));
    await settle();
    submitExamination("caregiver", "careB", args("b1"));
    await settle();
    pruneOutbox("caregiver", "careB");
    const left = JSON.parse(store.get("eldervital-outbox-caregiver") ?? "[]") as { userId: string }[];
    expect(left.map((e) => e.userId)).toEqual(["careB"]);
  });

  it("clearOutbox caregiver tidak menyentuh antrean perangkat lansia", async () => {
    rpc.mockResolvedValue(OFFLINE);
    submitExamination("caregiver", "careA", args("a3"));
    submitExamination("lansia", "elder1", args("l1"));
    await settle();
    clearOutbox("caregiver");
    expect(store.has("eldervital-outbox-caregiver")).toBe(false);
    expect(store.get("eldervital-outbox-lansia")).toContain("l1");
    clearOutbox("lansia");
  });
});
