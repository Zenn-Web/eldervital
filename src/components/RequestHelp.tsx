"use client";

import Link from "next/link";
import { useState } from "react";

/** Mode "Minta caregiver". Untuk prototipe ini hanya simulasi; belum mengirim notifikasi sungguhan. */
export default function RequestHelp() {
  const [sent, setSent] = useState(false);

  if (!sent) {
    return (
      <button type="button" className="btn" onClick={() => setSent(true)}>
        Minta Caregiver
      </button>
    );
  }

  return (
    <div className="panel stack" role="status">
      <p>
        <strong>Permintaan dikirim (simulasi).</strong>
      </p>
      <p>
        Aplikasi tidak bisa memastikan caregiver langsung melihatnya. Jika Anda butuh bantuan
        segera, hubungi caregiver secara langsung, atau hubungi 112 atau 119.
      </p>
      <Link className="btn" href="/caregiver/periksa">
        Buka tampilan caregiver (demo)
      </Link>
      <button type="button" className="btn btn-quiet" onClick={() => setSent(false)}>
        Batalkan permintaan
      </button>
    </div>
  );
}
