import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SaveExaminationArgs } from "./payload";

// RPC tiruan: urutan hasil diatur per tes.
const rpc = vi.fn();
vi.mock("@/lib/supabase/client", () => ({ getSupabase: () => ({ rpc }) }));

const { flushOutbox, submitExamination } = await import("./outbox");

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
