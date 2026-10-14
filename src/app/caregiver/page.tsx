import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Beranda caregiver" };

export default function CaregiverHome() {
  return (
    <div className="stack-lg">
      <h1>Beranda</h1>

      <section className="panel stack" aria-labelledby="bantuan">
        <h2 id="bantuan">Permintaan bantuan</h2>
        <p>
          Belum ada permintaan. Pada aplikasi lengkap, permintaan dari lansia yang terhubung
          muncul di sini.
        </p>
        <Link className="btn" href="/caregiver/periksa">
          Coba pemeriksaan bersama lansia (demo)
        </Link>
      </section>

      <section className="panel" aria-labelledby="terakhir">
        <h2 id="terakhir">Pemeriksaan terakhir</h2>
        <p>Belum ada pemeriksaan tercatat.</p>
      </section>

      <section className="panel stack" aria-labelledby="terhubung">
        <h2 id="terhubung">Lansia terhubung</h2>
        <p>
          Belum ada lansia terhubung. Menghubungkan dilakukan dengan memindai QR dari perangkat
          lansia, lalu keduanya mengonfirmasi.
        </p>
        <button type="button" className="btn" disabled>
          Hubungkan lansia (belum tersedia)
        </button>
      </section>
    </div>
  );
}
