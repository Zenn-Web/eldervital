import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sedang offline" };

export default function Offline() {
  return (
    <main id="isi" className="page stack">
      <h1>Tidak ada koneksi internet</h1>
      <p>
        Halaman ini belum bisa dibuka tanpa internet. Sambungkan kembali, lalu coba lagi.
      </p>
      <p>
        Jika Anda merasa sangat tidak sehat, jangan menunggu. Hubungi 112 atau 119, atau minta
        orang di dekat Anda membantu.
      </p>
      <Link className="btn btn-primary" href="/">
        Coba lagi
      </Link>
    </main>
  );
}
