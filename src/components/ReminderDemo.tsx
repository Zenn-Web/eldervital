"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Contoh tampilan pengingat. Pengingat sungguhan (Web Push) belum tersambung;
 * bagian ini diberi label simulasi agar tidak disangka notifikasi asli.
 */
export default function ReminderDemo() {
  const [shown, setShown] = useState(false);

  if (!shown) {
    return (
      <button type="button" className="btn btn-quiet" onClick={() => setShown(true)}>
        Tampilkan contoh pengingat (simulasi)
      </button>
    );
  }

  return (
    <div className="panel stack" role="status">
      <p className="small">
        <strong>Simulasi pengingat</strong>
      </p>
      <p>Waktunya pemeriksaan kondisi hari ini. Mari mulai pemeriksaan singkat.</p>
      <Link className="btn btn-primary" href="/lansia/periksa">
        Mulai pemeriksaan
      </Link>
    </div>
  );
}
