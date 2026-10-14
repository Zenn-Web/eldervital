"use client";

import Link from "next/link";
import type { ScreeningResult } from "@/lib/screening";
import StatusMark from "./StatusMark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const LABEL: Record<ScreeningResult["status"], string> = {
  green: "Aman (Hijau)",
  yellow: "Perlu Perhatian (Kuning)",
  red: "Tanda Bahaya (Merah)",
  insufficient: "Belum Ditentukan",
};

const STATUS_THEME: Record<
  ScreeningResult["status"],
  { border: string; bg: string; text: string; markColor: string }
> = {
  green: {
    border: "border-status-ok-mark",
    bg: "bg-status-ok-bg",
    text: "text-status-ok-ink",
    markColor: "#2F7A4D",
  },
  yellow: {
    border: "border-status-warn-mark",
    bg: "bg-status-warn-bg",
    text: "text-status-warn-ink",
    markColor: "#E0A100",
  },
  red: {
    border: "border-status-alert-mark",
    bg: "bg-status-alert-bg",
    text: "text-status-alert-ink",
    markColor: "#B3261E",
  },
  insufficient: {
    border: "border-line",
    bg: "bg-status-none-bg",
    text: "text-status-none-ink",
    markColor: "#5A5E67",
  },
};

const WHO = { lansia: "dijawab lansia", caregiver: "dicatat caregiver" } as const;

interface Props {
  result: ScreeningResult;
  onRevise: (nodeId: string) => void;
  onRestart: () => void;
  homeHref: string;
  homeLabel: string;
}

export default function ResultView({
  result,
  onRevise,
  onRestart,
  homeHref,
  homeLabel,
}: Props) {
  const theme = STATUS_THEME[result.status];

  return (
    <div className="space-y-6 max-w-md mx-auto py-2 text-ink">
      {/* Kartu Status Hasil Utama (Frame 09 & 09e) */}
      <section
        className={`p-6 rounded-2xl border-2 ${theme.border} ${theme.bg} space-y-4 shadow-none`}
        aria-labelledby="hasil-judul"
      >
        <div className="flex items-center gap-3">
          <StatusMark status={result.status} size="lg" />
          <div>
            <span className="text-sm font-bold uppercase tracking-wider block opacity-90">
              Hasil Skrining Gejala
            </span>
            <span className="text-xl font-bold font-serif">{LABEL[result.status]}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1
            id="hasil-judul"
            tabIndex={-1}
            className="font-serif text-3xl font-bold tracking-tight text-ink leading-tight"
          >
            {result.headline}
          </h1>
          <p className="text-lg text-ink leading-relaxed">{result.summary}</p>
        </div>

        {/* Banner Interupsi Tanda Bahaya (Frame 09e) */}
        {result.interrupted && (
          <div className="p-3.5 bg-white/70 border border-status-alert-mark rounded-xl text-sm font-bold text-status-alert-ink leading-snug">
            ⚠️ <strong>Pemeriksaan dihentikan seketika</strong> karena terdeteksi tanda bahaya. Pertanyaan yang tersisa tidak ditanyakan demi keselamatan.
          </div>
        )}
      </section>

      {/* Tombol Kontak Darurat (Frame 09e) */}
      {result.emergencyContacts.length > 0 && (
        <Card className="p-5 border-2 border-status-alert-mark bg-surface rounded-2xl space-y-3">
          <h2 className="font-serif text-2xl font-bold text-status-alert-ink">
            Hubungi Sekarang (Darurat)
          </h2>
          <div className="grid grid-cols-1 gap-2.5">
            {result.emergencyContacts.map((c) => (
              <a
                key={c.number}
                className="w-full min-h-[3.75rem] px-5 py-3 rounded-xl bg-status-alert-mark text-white font-bold text-xl flex items-center justify-center gap-3 hover:bg-[#8F1A13] transition-colors"
                href={`tel:${c.number}`}
              >
                <span>📞</span>
                <span>
                  {c.label}: {c.number}
                </span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Alasan Hasil Terdeteksi */}
      {result.reasons.length > 0 && (
        <Card className="p-5 border-2 border-line bg-surface rounded-2xl space-y-3">
          <h2 className="font-serif text-xl font-bold text-ink">
            Alasan Hasil Ini
          </h2>
          <ul className="space-y-3 divide-y divide-line/40">
            {result.reasons.map((r) => (
              <li key={r.ruleId} className="pt-2.5 first:pt-0 space-y-1">
                <span className="font-bold text-base text-ink block">{r.text}</span>
                <span className="text-xs text-ink-soft block leading-normal">
                  Dari jawaban &ldquo;{r.answerLabel}&rdquo; pada pertanyaan &ldquo;{r.question}&rdquo;
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Pertanyaan yang Belum Diketahui / Tidak Yakin */}
      {result.unknownItems.length > 0 && (
        <Card className="p-5 border-2 border-line bg-surface rounded-2xl space-y-2">
          <h2 className="font-serif text-xl font-bold text-ink">
            Belum Diketahui Pasti
          </h2>
          <p className="text-sm text-ink-soft">
            Pertanyaan berikut dijawab &ldquo;tidak yakin&rdquo;, sehingga status tidak dianggap hijau aman:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-base text-ink font-bold">
            {result.unknownItems.map((u) => (
              <li key={u.nodeId}>{u.question}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Tindakan yang Bisa Dilakukan */}
      <Card className="p-5 border-2 border-line bg-surface rounded-2xl space-y-2.5">
        <h2 className="font-serif text-xl font-bold text-ink">
          Langkah Tindak Lanjut
        </h2>
        <ul className="space-y-2">
          {result.actions.map((a, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-base text-ink leading-normal">
              <span className="text-primary font-bold">✓</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Ringkasan Seluruh Jawaban */}
      <Card className="p-5 border-2 border-line bg-surface rounded-2xl space-y-3">
        <h2 className="font-serif text-xl font-bold text-ink">
          Ringkasan Jawaban Anda
        </h2>
        <div className="divide-y divide-line/50 space-y-2.5">
          {result.answers.map((a) => (
            <div key={a.nodeId} className="pt-2.5 first:pt-0 space-y-1">
              <span className="text-xs text-ink-soft uppercase block font-bold">
                {a.question}
              </span>
              <div className="flex justify-between items-center gap-2">
                <span className="text-lg font-bold text-ink">
                  {a.answerLabel}{" "}
                  <span className="text-xs text-ink-soft font-normal">
                    ({WHO[a.source]})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onRevise(a.nodeId)}
                  className="text-xs font-bold text-primary underline hover:text-primary-strong"
                >
                  Ubah
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tombol Aksi Akhir */}
      <div className="space-y-3 pt-2">
        <Link
          className="w-full min-h-[3.75rem] px-6 py-4 rounded-2xl bg-primary text-white font-bold text-xl flex items-center justify-center hover:bg-primary-strong transition-colors"
          href={homeHref}
        >
          {homeLabel}
        </Link>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={onRestart}
          className="w-full text-base font-bold text-ink"
        >
          Ulangi Pemeriksaan dari Awal
        </Button>
      </div>

      <p className="text-xs text-center text-ink-soft leading-relaxed pt-2">
        {result.disclaimer} Pohon pertanyaan versi {result.treeVersion}
        {result.reviewStatus === "belum_ditinjau" ? " (contoh prototipe)." : "."}
      </p>
    </div>
  );
}
