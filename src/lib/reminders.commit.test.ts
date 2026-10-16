import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LOCAL_STORAGE_REMINDERS_KEY,
  clearStoredReminders,
  commitStoredReminders,
  getStoredReminders,
  type StoredReminder,
} from "./reminders";

// localStorage dan window tiruan: tes berjalan di Node, bukan browser.
function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const before: StoredReminder[] = [{ id: "pagi", label: "Pagi", time: "07.00", enabled: true }];
const after: StoredReminder[] = [{ id: "pagi", label: "Pagi", time: "07.30", enabled: true }];

describe("commitStoredReminders", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
    vi.stubGlobal("localStorage", fakeStorage());
    localStorage.setItem(LOCAL_STORAGE_REMINDERS_KEY, JSON.stringify(before));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("tersambung dan berhasil: perubahan dikirim ke database dan tetap di perangkat", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const res = await commitStoredReminders("elder-1", before, after, save);
    expect(res).toEqual({ ok: true });
    expect(save).toHaveBeenCalledWith("elder-1", [{ label: "Pagi", time: "07.30", enabled: true }]);
    expect(getStoredReminders()[0].time).toBe("07.30");
  });

  it("tersambung tapi gagal: perubahan di perangkat dikembalikan dan pesan galat diteruskan", async () => {
    const save = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const res = await commitStoredReminders("elder-1", before, after, save);
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.message).toMatch(/koneksi internet/);
    expect(getStoredReminders()[0].time).toBe("07.00"); // tidak pura-pura tersimpan
  });

  it("simulasi (tanpa profil): hanya disimpan di perangkat, database tidak dipanggil", async () => {
    const save = vi.fn();
    const res = await commitStoredReminders(null, before, after, save);
    expect(res).toEqual({ ok: true });
    expect(save).not.toHaveBeenCalled();
    expect(getStoredReminders()[0].time).toBe("07.30");
  });

  it("clearStoredReminders membuang salinan jadwal di perangkat", () => {
    clearStoredReminders();
    expect(localStorage.getItem(LOCAL_STORAGE_REMINDERS_KEY)).toBeNull();
  });
});
