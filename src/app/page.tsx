import type { Metadata } from "next";
import Link from "next/link";
import SimBanner from "@/components/SimBanner";

export const metadata: Metadata = { title: "Pilih peran" };

export default function Home() {
  return (
    <>
      <SimBanner>Prototipe. Data dan pengingat pada versi ini bersifat simulasi.</SimBanner>
      <main id="isi" className="page stack-lg">
        <section>
          <h1>ElderVital</h1>
          <p>
            Pemeriksaan gejala harian untuk usia 50 sampai 65 tahun. Bisa dilakukan sendiri
            dengan suara atau tombol, atau ditemani caregiver.
          </p>
        </section>

        <nav className="stack" aria-label="Pilih peran">
          <Link className="choice-link" href="/lansia">
            <strong>Saya yang diperiksa</strong>
            <span>Mulai pemeriksaan sendiri, atau minta caregiver membantu.</span>
          </Link>
          <Link className="choice-link" href="/caregiver">
            <strong>Saya caregiver</strong>
            <span>Lihat hasil pemeriksaan dan bantu mencatat jawaban.</span>
          </Link>
        </nav>

        <p className="small">
          ElderVital memberi hasil skrining gejala, bukan diagnosis. Hasil hijau tidak berarti
          Anda pasti sehat. Dalam keadaan darurat, hubungi 112 atau 119.
        </p>
      </main>
    </>
  );
}
