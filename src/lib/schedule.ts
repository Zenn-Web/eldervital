/**
 * Jadwal pengingat bawaan (spesifikasi: pagi, siang, malam; dapat diubah).
 * Ini hanya pengingat untuk melakukan pemeriksaan, bukan anjuran medis tiga kali sehari.
 */
export const DEFAULT_REMINDERS = [
  { id: "pagi", label: "Pagi", time: "07.00" },
  { id: "siang", label: "Siang", time: "12.00" },
  { id: "malam", label: "Malam", time: "19.00" },
] as const;
