"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ScreeningResult } from "@/lib/screening";
import type { AgeRange } from "@/lib/auth/elder";
import { buildHelpScript } from "@/lib/followup";
import { speak, stopSpeaking, ttsSupported } from "@/lib/voice/speech";

const noopSubscribe = () => () => {};

const BTN =
  "flex-1 min-h-[56px] px-4 rounded-full border-2 border-ink/70 bg-surface text-ink text-base font-bold hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus";

/**
 * Naskah bantuan pada hasil merah (pitch Slide 05): teks untuk dibacakan saat menelepon
 * 112/119 atau ditunjukkan ke petugas. Isinya hanya alasan dan jawaban yang dilaporkan
 * (buildHelpScript), tanpa nama penyakit dan tanpa saran obat.
 */
export default function HelpScriptPanel({
  result,
  elderName,
  ageRange,
}: {
  result: ScreeningResult;
  elderName?: string | null;
  ageRange?: AgeRange | null;
}) {
  const script = useMemo(() => buildHelpScript(result, { elderName, ageRange }), [result, elderName, ageRange]);
  const tts = useSyncExternalStore(noopSubscribe, ttsSupported, () => false);
  const [copy, setCopy] = useState<"idle" | "done" | "failed">("idle");

  // Hentikan suara bila layar hasil ditinggalkan.
  useEffect(() => () => stopSpeaking(), []);

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(script);
      setCopy("done");
    } catch {
      setCopy("failed");
    }
  }

  return (
    <section className="p-5 border border-line/60 bg-surface rounded-2xl space-y-3" aria-labelledby="naskah-bantuan">
      <h2 id="naskah-bantuan" className="font-serif text-lg sm:text-xl font-bold text-ink">
        Naskah saat menelepon
      </h2>
      <p className="text-sm text-ink-soft">
        Bacakan saat menelepon 112 atau 119, atau tunjukkan layar ini ke petugas. Isinya hanya jawaban yang
        dilaporkan, bukan diagnosis.
      </p>
      <pre className="whitespace-pre-wrap break-words font-sans text-base leading-relaxed text-ink bg-paper rounded-xl border border-line/60 p-4">
        {script}
      </pre>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button type="button" onClick={copyScript} className={BTN}>
          Salin naskah
        </button>
        {tts && (
          <button type="button" onClick={() => speak(script)} className={BTN}>
            Bacakan naskah
          </button>
        )}
      </div>
      {copy !== "idle" && (
        <p role="status" className="text-sm font-bold text-ink">
          {copy === "done" ? "Naskah tersalin." : "Tidak bisa menyalin otomatis. Tekan lama pada teks untuk memilih dan menyalin."}
        </p>
      )}
    </section>
  );
}
