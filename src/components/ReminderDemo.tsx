"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        className="w-full text-xs font-semibold text-ink-soft border-line bg-surface hover:bg-paper"
      >
        🔔 Tampilkan contoh notifikasi pengingat harian (simulasi)
      </Button>
    );
  }

  return (
    <Card className="p-4 border-2 border-primary/30 bg-surface rounded-2xl space-y-3" role="status">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          🔔 Contoh Notifikasi Jadwal (Simulasi)
        </span>
        <button
          type="button"
          onClick={() => setShown(false)}
          className="text-ink-soft hover:text-ink font-bold text-sm px-1"
          aria-label="Tutup simulasi"
        >
          &times;
        </button>
      </div>
      <p className="text-sm text-ink leading-relaxed font-medium">
        Waktunya pemeriksaan kondisi hari ini. Mari luangkan 1 menit untuk pemeriksaan singkat.
      </p>
      <Link
        className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-base font-bold text-white hover:bg-primary-strong transition-colors"
        href="/lansia/periksa"
      >
        Mulai Pemeriksaan Sekarang &rarr;
      </Link>
    </Card>
  );
}
