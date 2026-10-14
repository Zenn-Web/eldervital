"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
        className="w-full text-xl font-bold rounded-2xl flex items-center justify-center gap-3 border-2 border-line hover:border-primary active:border-primary"
      >
        <span>🤝</span>
        <span>Minta Didampingi Caregiver</span>
      </Button>
    );
  }

  // Frame 07b: Layar Tunggu Minta Caregiver
  return (
    <Card className="p-6 border-2 border-sogan bg-[#FFFBF4] rounded-2xl space-y-4" role="status">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-sogan/15 text-sogan flex items-center justify-center text-2xl shrink-0">
          ⏳
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-2xl font-bold text-ink">
            Permintaan Terkirim ke Rina
          </h3>
          <p className="text-base text-ink-soft leading-normal">
            Silakan tunggu sebentar, keluarga akan membuka aplikasi dan mendampingi Anda mengisi jawaban.
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-paper rounded-xl border border-line text-sm text-ink-soft">
        <strong>Pemberitahuan:</strong> Aplikasi tidak bisa menjamin caregiver langsung membaca pesan. Dalam keadaan darurat, segera hubungi <strong>112</strong> atau <strong>119</strong>.
      </div>

      <div className="flex flex-col gap-2.5 pt-2">
        <Link
          className="w-full min-h-[3rem] px-5 py-3 rounded-xl bg-primary text-white font-bold text-center flex items-center justify-center text-lg hover:bg-primary-strong transition-colors"
          href="/caregiver/periksa"
        >
          Buka Tampilan Caregiver (Demo)
        </Link>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSent(false)}
          className="w-full text-base font-bold text-ink-soft hover:text-ink"
        >
          Batalkan & Cek Mandiri Saja
        </Button>
      </div>
    </Card>
  );
}
