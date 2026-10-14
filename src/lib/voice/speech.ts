/**
 * Pembungkus tipis Web Speech API (suara keluar dan suara masuk).
 *
 * Catatan dukungan browser (periksa di perangkat demo, jangan hanya di laptop):
 * - Suara keluar (speechSynthesis) didukung luas, tetapi tersedianya suara
 *   bahasa Indonesia bergantung pada suara yang terpasang di perangkat.
 * - Suara masuk (SpeechRecognition) terutama tersedia di Chrome/Edge/Android.
 *   Di Chrome, rekaman dikirim ke layanan pengenal suara milik browser, jadi
 *   pengguna perlu diberi tahu. Di Safari/iOS dukungannya terbatas.
 * Karena itu tombol jawaban selalu menjadi jalur utama dan suara hanya tambahan.
 *
 * Semua fungsi aman dipanggil saat render di server (hasilnya false atau tidak ada efek).
 */

interface RecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type RecognitionCtor = new () => RecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function ttsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

export function sttSupported(): boolean {
  return recognitionCtor() !== null;
}

export function speak(text: string, opts: { slow?: boolean } = {}): void {
  if (!ttsSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("id"));
  if (voice) utterance.voice = voice;
  utterance.rate = opts.slow ? 0.7 : 0.95;
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

export type ListenError = "izin" | "tidak-ada-suara" | "jaringan" | "tidak-didukung" | "lainnya";

function mapError(code: string): ListenError {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "izin";
    case "no-speech":
    case "aborted":
      return "tidak-ada-suara";
    case "network":
      return "jaringan";
    default:
      return "lainnya";
  }
}

let active: RecognitionLike | null = null;

export function stopListening(): void {
  active?.abort();
  active = null;
}

/** Mendengarkan satu ucapan. Hasilnya harus dikonfirmasi pengguna sebelum dipakai. */
export function listenOnce(handlers: {
  onResult: (transcript: string) => void;
  onError: (error: ListenError) => void;
  onEnd: () => void;
}): boolean {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    handlers.onError("tidak-didukung");
    handlers.onEnd();
    return false;
  }
  stopListening();
  const rec = new Ctor();
  rec.lang = "id-ID";
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const transcript = e.results[0]?.[0]?.transcript;
    if (transcript) handlers.onResult(transcript);
  };
  rec.onerror = (e) => handlers.onError(mapError(e.error));
  rec.onend = () => {
    if (active === rec) active = null;
    handlers.onEnd();
  };
  active = rec;
  try {
    rec.start();
  } catch {
    active = null;
    handlers.onError("lainnya");
    handlers.onEnd();
    return false;
  }
  return true;
}

export const LISTEN_ERROR_MESSAGE: Record<ListenError, string> = {
  izin: "Izin mikrofon belum diberikan. Silakan jawab dengan tombol.",
  "tidak-ada-suara": "Suara tidak terdengar. Coba lagi atau jawab dengan tombol.",
  jaringan: "Pengenalan suara butuh internet dan sedang gagal. Silakan jawab dengan tombol.",
  "tidak-didukung": "Browser ini belum mendukung jawaban suara. Silakan jawab dengan tombol.",
  lainnya: "Jawaban suara belum berhasil. Silakan jawab dengan tombol.",
};
