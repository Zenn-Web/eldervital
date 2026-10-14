"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellIcon, CloseIcon, ChevronRightIcon } from "@/components/shared/Icons";

/**
 * Contoh tampilan pengingat berlabel simulasi jelas (spesifikasi: data simulasi diberi label jelas).
 */
export default function ReminderDemo() {
  const [shown, setShown] = useState(false);

  if (!shown) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShown(true)}
        className="w-full text-xs font-semibold text-ink-soft border-line bg-surface hover:bg-paper gap-2"
      >
        <BellIcon size={16} className="text-sogan" />
        <span>Tampilkan contoh notifikasi pengingat harian (simulasi)</span>
      </Button>
    );
  }

  return (
    <Card className="p-4 border-2 border-primary/30 bg-surface rounded-2xl space-y-3" role="status">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <BellIcon size={14} />
          <span>Contoh Notifikasi Jadwal (Simulasi)</span>
        </span>
        <button
          type="button"
          onClick={() => setShown(false)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-paper transition-colors"
          aria-label="Tutup simulasi"
        >
          <CloseIcon size={16} />
        </button>
      </div>
      <p className="text-sm text-ink leading-relaxed font-medium">
        Waktunya pemeriksaan kondisi hari ini. Mari luangkan 1 menit untuk pemeriksaan singkat.
      </p>
      <Link
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-base font-bold text-white hover:bg-primary-strong transition-colors"
        href="/lansia/periksa"
      >
        <span>Mulai Pemeriksaan Sekarang</span>
        <ChevronRightIcon size={18} />
      </Link>
    </Card>
  );
}
