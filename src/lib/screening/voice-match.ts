import type { Option } from "./types";

/**
 * Mencocokkan hasil pengenalan suara dengan pilihan jawaban.
 *
 * Murni (tanpa browser) agar bisa diuji. Hasilnya SELALU harus dikonfirmasi
 * pengguna sebelum dipakai, jadi lebih baik ragu daripada menebak:
 * bila lebih dari satu pilihan cocok, hasilnya "ambiguous".
 */

const ALIASES: Record<string, string> = {
  nggak: "tidak",
  gak: "tidak",
  enggak: "tidak",
  engga: "tidak",
  ngga: "tidak",
  ga: "tidak",
  ndak: "tidak",
  nda: "tidak",
  tak: "tidak",
  iya: "ya",
  iyah: "ya",
  yaa: "ya",
  tau: "tahu",
  gatau: "tidak tahu",
  gaktau: "tidak tahu",
};

export function normalize(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned === "") return [];
  return cleaned
    .split(" ")
    .flatMap((w) => (ALIASES[w] ?? w).split(" "));
}

export type VoiceMatch =
  | { status: "match"; optionId: string; heard: string }
  | { status: "ambiguous"; optionIds: string[]; heard: string }
  | { status: "none"; heard: string };

interface Hit {
  optionId: string;
  start: number;
  end: number; // eksklusif
}

export function matchSpokenAnswer(transcript: string, options: readonly Option[]): VoiceMatch {
  const tokens = normalize(transcript);
  const heard = tokens.join(" ");
  if (tokens.length === 0) return { status: "none", heard };

  const hits: Hit[] = [];
  for (const option of options) {
    const phrases = new Set<string[]>();
    for (const phrase of option.say ?? []) {
      const p = normalize(phrase);
      if (p.length > 0) phrases.add(p);
    }
    for (const p of phrases) {
      for (let i = 0; i + p.length <= tokens.length; i++) {
        if (p.every((w, k) => tokens[i + k] === w)) {
          hits.push({ optionId: option.id, start: i, end: i + p.length });
        }
      }
    }
  }
  if (hits.length === 0) return { status: "none", heard };

  // Frasa yang lebih panjang menang ("tidak tahu" mengalahkan "tidak").
  hits.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken = new Array<boolean>(tokens.length).fill(false);
  const chosen = new Set<string>();
  for (const h of hits) {
    let free = true;
    for (let i = h.start; i < h.end; i++) if (taken[i]) free = false;
    if (!free) continue;
    for (let i = h.start; i < h.end; i++) taken[i] = true;
    chosen.add(h.optionId);
  }

  if (chosen.size === 1) return { status: "match", optionId: [...chosen][0], heard };
  return { status: "ambiguous", optionIds: [...chosen], heard };
}
