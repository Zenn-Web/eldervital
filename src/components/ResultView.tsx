"use client";

import Link from "next/link";
import type { ScreeningResult } from "@/lib/screening";
import StatusMark from "./StatusMark";
import HelpScriptPanel from "./HelpScriptPanel";
import type { AgeRange } from "@/lib/auth/elder";
import {
  PhoneIcon,
  AlertTriangleIcon,
  CheckIcon,
  RefreshIcon,
  ChevronRightIcon,
} from "@/components/shared/Icons";

const LABEL: Record<ScreeningResult["status"], string> = {
  // Bukan "aman": hasil hijau tidak berarti pasti sehat (aturan keselamatan klinis).
  green: "Hijau (Tidak Ada Pemicu Perhatian)",
  yellow: "Perlu Perhatian (Kuning)",
  red: "Tanda Bahaya (Merah)",
  insufficient: "Belum Ditentukan",
};

const STATUS_THEME: Record<
  ScreeningResult["status"],
  { border: string; bg: string; text: string }
> = {
  green: {
    border: "border-status-ok-mark",
    bg: "bg-status-ok-bg",
    text: "text-status-ok-ink",
  },
  yellow: {
    border: "border-status-warn-mark",
    bg: "bg-status-warn-bg",
    text: "text-status-warn-ink",
  },
  red: {
    border: "border-status-alert-mark",
    bg: "bg-status-alert-bg",
    text: "text-status-alert-ink",
  },
  insufficient: {
    border: "border-line",
    bg: "bg-status-none-bg",
    text: "text-status-none-ink",
  },
};

const WHO = { lansia: "dijawab lansia", caregiver: "dicatat caregiver" } as const;

interface Props {
  result: ScreeningResult;
  onRevise: (nodeId: string) => void;
  onRestart: () => void;
  homeHref: string;
  homeLabel: string;
  /** Mis. status penyimpanan hasil. */
  notice?: React.ReactNode;
  /** Nama dan usia lansia untuk naskah bantuan pada hasil merah. */
  helpScriptFor?: { elderName?: string | null; ageRange?: AgeRange | null };
}

export default function ResultView({
  result,
  onRevise,
  onRestart,
  homeHref,
  homeLabel,
  notice,
  helpScriptFor,
}: Props) {
  const theme = STATUS_THEME[result.status];

  return (
    <div className="space-y-5 max-w-md mx-auto py-2 text-ink">
      {/* Kartu Status Hasil Utama (Frame 09 & 09e) */}
      <section
        className={`p-5 sm:p-6 rounded-2xl border-2 ${theme.border} ${theme.bg} space-y-4 shadow-none`}
        aria-labelledby="hasil-judul"
      >
        <div className="flex items-center gap-3.5">
          <StatusMark status={result.status} size="lg" />
          <div>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider block opacity-90">
              Hasil Skrining Gejala
            </span>
            <span className="text-xl sm:text-2xl font-bold font-serif">{LABEL[result.status]}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <h1
            id="hasil-judul"
            tabIndex={-1}
            className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight"
          >
            {result.headline}
          </h1>
          <p className="text-base text-ink leading-relaxed">{result.summary}</p>
        </div>

        {/* Banner Interupsi Tanda Bahaya (Frame 09e) */}
        {result.interrupted && (
          <div className="p-3.5 bg-surface/90 border border-status-alert-mark rounded-xl text-sm font-bold text-status-alert-ink leading-snug flex items-start gap-2.5">
            <AlertTriangleIcon size={20} className="text-status-alert-mark shrink-0 mt-0.5" />
            <span>
              <strong>Pemeriksaan dihentikan seketika</strong> karena terdeteksi tanda bahaya. Pertanyaan yang tersisa tidak ditanyakan demi keselamatan.
            </span>
          </div>
        )}
      </section>

      {/* Tombol Kontak Darurat (Frame 09e) */}
      {result.emergencyContacts.length > 0 && (
        <div className="p-5 border border-status-alert-mark bg-surface rounded-2xl space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-status-alert-ink">
            Hubungi Sekarang (Darurat)
          </h2>
          <div className="grid grid-cols-1 gap-2.5">
            {result.emergencyContacts.map((c) => (
              <a
                key={c.number}
                className="w-full min-h-[56px] px-5 py-3 rounded-full bg-status-alert-mark text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-status-alert-mark/90 active:bg-status-alert-mark/90 transition-colors focus-visible:ring-4 focus-visible:ring-focus shadow-sm"
                href={`tel:${c.number}`}
              >
                <PhoneIcon size={22} />
                <span>
                  {c.label}: {c.number}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Naskah bantuan saat menelepon (hanya hasil merah) */}
      {result.status === "red" && (
        <HelpScriptPanel result={result} elderName={helpScriptFor?.elderName} ageRange={helpScriptFor?.ageRange} />
      )}

      {/* Alasan Hasil Terdeteksi */}
      {result.reasons.length > 0 && (
        <div className="p-5 border border-line/60 bg-surface rounded-2xl space-y-3">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-ink">
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
        </div>
      )}

      {/* Pertanyaan yang Belum Diketahui / Tidak Yakin */}
      {result.unknownItems.length > 0 && (
        <div className="p-5 border border-line/60 bg-surface rounded-2xl space-y-2">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-ink">
            Belum Diketahui Pasti
          </h2>
          <p className="text-xs sm:text-sm text-ink-soft">
            Pertanyaan berikut dijawab &ldquo;tidak yakin&rdquo;, sehingga status tidak dianggap hijau aman:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base text-ink font-bold">
            {result.unknownItems.map((u) => (
              <li key={u.nodeId}>{u.question}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tindakan yang Bisa Dilakukan */}
      <div className="p-5 border border-line/60 bg-surface rounded-2xl space-y-2.5">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-ink">
          Langkah Tindak Lanjut
        </h2>
        <ul className="space-y-2.5">
          {result.actions.map((a, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-ink leading-normal">
              <CheckIcon size={18} className="text-primary font-bold shrink-0 mt-0.5" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Ringkasan Seluruh Jawaban */}
      <div className="p-5 border border-line/60 bg-surface rounded-2xl space-y-3">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-ink">
          Ringkasan Jawaban Anda
        </h2>
        <div className="divide-y divide-line/40 space-y-2.5">
          {result.answers.map((a) => (
            <div key={a.nodeId} className="pt-2.5 first:pt-0 space-y-1">
              <span className="text-xs text-ink-soft uppercase block font-bold">
                {a.question}
              </span>
              <div className="flex justify-between items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-ink">
                  {a.answerLabel}{" "}
                  <span className="text-xs text-ink-soft font-normal">
                    ({WHO[a.source]})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onRevise(a.nodeId)}
                  className="min-h-[44px] min-w-[44px] px-2 text-xs font-bold text-primary underline hover:text-primary-strong flex items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Ubah
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {notice}

      {/* Tombol Aksi Akhir */}
      <div className="space-y-3 pt-2">
        <Link
          className="w-full min-h-[56px] px-6 py-4 rounded-full bg-primary text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2 hover:bg-primary-strong active:bg-primary-strong transition-all focus-visible:ring-4 focus-visible:ring-focus shadow-sm"
          href={homeHref}
        >
          <span>{homeLabel}</span>
          <ChevronRightIcon size={20} />
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="w-full min-h-[48px] rounded-full border border-line/60 bg-surface text-ink text-sm sm:text-base font-bold flex items-center justify-center gap-2 hover:bg-paper transition-colors focus-visible:ring-2 focus-visible:ring-focus"
        >
          <RefreshIcon size={18} />
          <span>Ulangi Pemeriksaan dari Awal</span>
        </button>
      </div>

      <p className="text-xs text-center text-ink-soft leading-relaxed pt-2">
        {result.disclaimer} Pohon pertanyaan versi {result.treeVersion}
        {result.reviewStatus === "belum_ditinjau" ? " (contoh prototipe)." : "."}
      </p>
    </div>
  );
}
