"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HandshakeIcon, ClockIcon, ChevronRightIcon } from "@/components/shared/Icons";

/**
 * Mode "Minta caregiver" (Frame 07 & 07b).
 * Mengirim permintaan bantuan simulasi ke caregiver yang terhubung.
 */
export default function RequestHelp() {
  const [sent, setSent] = useState(false);

  if (!sent) {
    return (
      <Button
        type="button"
        variant="outline"
        size="senior"
        onClick={() => setSent(true)}
        className="w-full text-lg sm:text-xl font-bold rounded-full min-h-[56px] flex items-center justify-center gap-3 border border-line/60 hover:border-primary active:border-primary bg-surface transition-all shadow-xs"
      >
        <HandshakeIcon size={22} className="text-sogan" />
        <span>Minta Didampingi Caregiver</span>
      </Button>
    );
  }

  // Frame 07b: Layar Tunggu Minta Caregiver
  return (
    <div className="p-5 sm:p-6 border border-sogan/40 bg-surface rounded-2xl space-y-4 shadow-none" role="status">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-sogan/15 text-sogan flex items-center justify-center shrink-0 border border-sogan/30">
          <ClockIcon size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink">
            Permintaan Terkirim ke Rina
          </h3>
          <p className="text-sm sm:text-base text-ink-soft leading-normal">
            Silakan tunggu sebentar, keluarga akan membuka aplikasi dan mendampingi Anda mengisi jawaban.
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-paper rounded-xl border border-line/60 text-xs sm:text-sm text-ink-soft">
        <strong>Pemberitahuan:</strong> Aplikasi tidak bisa menjamin caregiver langsung membaca pesan. Dalam keadaan darurat, segera hubungi <strong>112</strong> atau <strong>119</strong>.
      </div>

      <div className="flex flex-col gap-2.5 pt-2">
        <Link
          className="w-full min-h-[48px] px-5 py-3 rounded-full bg-primary text-white font-bold text-center flex items-center justify-center gap-1.5 text-base sm:text-lg hover:bg-primary-strong transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
          href="/caregiver/periksa"
        >
          <span>Buka Tampilan Caregiver (Demo)</span>
          <ChevronRightIcon size={18} />
        </Link>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="w-full min-h-[40px] text-sm font-bold text-ink-soft hover:text-ink rounded-full transition-colors"
        >
          Batalkan & Cek Mandiri Saja
        </button>
      </div>
    </div>
  );
}
