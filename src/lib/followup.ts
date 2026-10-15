import type { ScreeningResult } from "@/lib/screening";
import { AGE_RANGES, type AgeRange } from "@/lib/auth/elder";

/**
 * Naskah bantuan untuk hasil merah/kuning (pitch Slide 05): teks yang bisa dibacakan saat
 * menelepon 112/119 atau ditunjukkan ke petugas fasilitas kesehatan.
 *
 * Aturan isi (keselamatan klinis):
 * - Hanya menyusun ulang apa yang DILAPORKAN: alasan dari aturan skrining dan jawaban
 *   per pertanyaan. Tidak menebak, tidak menyebut nama penyakit, tidak memberi saran
 *   obat atau dosis.
 * - Jawaban "tidak yakin" disebut apa adanya sebagai belum diketahui.
 * - Selalu ditutup dengan pernyataan bahwa ini bukan diagnosis.
 */
export function buildHelpScript(
  result: ScreeningResult,
  opts: { elderName?: string | null; ageRange?: AgeRange | null } = {},
): string {
  const who = opts.elderName?.trim() || "seseorang";
  const age = AGE_RANGES.find((a) => a.value === opts.ageRange)?.label.toLowerCase();
  const lines: string[] = [
    `Halo, saya membutuhkan arahan pertolongan untuk ${who}${age ? `, usia ${age}` : ""}.`,
  ];

  if (result.reasons.length > 0) {
    lines.push("", "Yang dilaporkan:");
    for (const r of result.reasons) lines.push(`- ${r.text}`);
  }

  const known = result.answers.filter((a) => !a.unknown);
  if (known.length > 0) {
    lines.push("", "Jawaban pemeriksaan:");
    for (const a of known) lines.push(`- ${a.question} Jawaban: ${a.answerLabel}.`);
  }

  if (result.unknownItems.length > 0) {
    lines.push("", "Belum diketahui:");
    for (const u of result.unknownItems) lines.push(`- ${u.question}`);
  }

  if (result.interrupted) {
    lines.push("", "Pemeriksaan dihentikan lebih awal karena ada tanda bahaya, jadi pertanyaan lain belum ditanyakan.");
  }

  lines.push(
    "",
    "Mohon arahan untuk mendapatkan pertolongan yang sesuai.",
    "",
    "Ringkasan ini disusun dari jawaban di aplikasi skrining ElderVital, bukan diagnosis.",
  );
  return lines.join("\n");
}
