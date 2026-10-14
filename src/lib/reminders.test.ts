import { describe, expect, it } from "vitest";
import { formatTime, nextReminder, normalizeTime, rowToReminder, type Reminder } from "./reminders";

describe("normalizeTime", () => {
  it("menerima penulisan jam yang lazim", () => {
    expect(normalizeTime("07.00")).toBe("07:00");
    expect(normalizeTime("7:05")).toBe("07:05");
    expect(normalizeTime(" 19:30 ")).toBe("19:30");
    expect(normalizeTime("07:00:00")).toBe("07:00");
  });

  it("menolak jam yang tidak sah", () => {
    for (const bad of ["", "24.00", "12.60", "7", "07-00", "pagi", "123:00"]) {
      expect(normalizeTime(bad)).toBeNull();
    }
  });

  it("formatTime untuk layar memakai titik", () => {
    expect(formatTime("07:00")).toBe("07.00");
  });
});

describe("nextReminder", () => {
  const r = (label: string, time: string, enabled = true): Reminder => ({ id: label, elderId: "e", label, time, enabled });
  const list = [r("Pagi", "07:00"), r("Siang", "12:00"), r("Malam", "19:00")];
  // Waktu setempat, agar hasil tes tidak bergantung pada zona waktu mesin.
  const at = (h: number, m = 0) => new Date(2026, 9, 15, h, m);

  it("memilih jadwal berikutnya hari ini", () => {
    expect(nextReminder(list, at(9))?.reminder.label).toBe("Siang");
  });

  it("tepat pada jamnya dianggap sudah lewat", () => {
    expect(nextReminder(list, at(12))?.reminder.label).toBe("Malam");
  });

  it("setelah jadwal terakhir: yang pertama besok", () => {
    const n = nextReminder(list, at(21))!;
    expect(n.reminder.label).toBe("Pagi");
    expect(n.at.getDate()).toBe(16);
    expect(n.at.getHours()).toBe(7);
  });

  it("jadwal yang dimatikan dilewati; tanpa jadwal aktif hasilnya null", () => {
    expect(nextReminder([r("Pagi", "07:00", false), r("Malam", "19:00")], at(6))?.reminder.label).toBe("Malam");
    expect(nextReminder([r("Pagi", "07:00", false)], at(6))).toBeNull();
  });
});

describe("rowToReminder", () => {
  it("jam dari Postgres (07:00:00) menjadi 07:00", () => {
    expect(rowToReminder({ id: "1", elder_id: "e", label: "Pagi", time_of_day: "07:00:00", enabled: true }).time).toBe("07:00");
  });
});
