"use client";

import Link from "next/link";
import { useState } from "react";
import { BellIcon, CloseIcon, ChevronRightIcon } from "@/components/shared/Icons";

/**
 * Contoh tampilan pengingat berlabel simulasi jelas (spesifikasi: data simulasi diberi label jelas).
 */
export default function ReminderDemo() {
  const [shown, setShown] = useState(false);

  if (!shown) {
    return (
      <button
        type="button"
        onClick={() => setShown(true)}
        className="w-full py-2.5 px-4 text-xs font-semibold text-ink-soft rounded-full border border-line/60 bg-surface hover:bg-paper flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <BellIcon size={16} className="text-sogan" />
        <span>Tampilkan contoh notifikasi pengingat harian (simulasi)</span>
      </button>
    );
  }

  return (
    <div className="p-4 border border-primary/30 bg-surface rounded-2xl space-y-3 shadow-none" role="status">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <BellIcon size={14} />
          <span>Contoh Notifikasi Jadwal (Simulasi)</span>
        </span>
        <button
          type="button"
          onClick={() => setShown(false)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-paper transition-colors"
          aria-label="Tutup simulasi"
        >
          <CloseIcon size={16} />
        </button>
      </div>
      <p className="text-sm text-ink leading-relaxed font-medium">
        Waktunya pemeriksaan kondisi hari ini. Mari luangkan 1 menit untuk pemeriksaan singkat.
      </p>
      <Link
        className="inline-flex w-full min-h-[48px] items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-3 text-base font-bold text-white hover:bg-primary-strong transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
        href="/lansia/periksa"
      >
        <span>Mulai Pemeriksaan Sekarang</span>
        <ChevronRightIcon size={18} />
      </Link>
    </div>
  );
}
