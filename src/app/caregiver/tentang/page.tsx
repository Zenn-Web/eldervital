import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tentang" };

export default function About() {
  return (
    <div className="stack-lg">
      <section>
        <h1>Tentang ElderVital</h1>
        <p>
          ElderVital membantu pemeriksaan gejala harian untuk usia 50 sampai 65 tahun. Pertanyaan
          menyesuaikan jawaban sebelumnya, dan hasilnya ditampilkan dengan alasan yang bisa
          ditelusuri.
        </p>
      </section>

      <section className="panel" aria-labelledby="batasan">
        <h2 id="batasan">Batasan</h2>
        <ul>
          <li>Hasilnya skrining gejala, bukan diagnosis.</li>
          <li>Status hijau tidak berarti pasti sehat atau bebas penyakit.</li>
          <li>Aplikasi tidak menyarankan perubahan dosis atau pergantian obat.</li>
          <li>
            Aplikasi tidak bisa memastikan notifikasi diterima atau caregiver merespons. Dalam
            keadaan darurat, hubungi 112 atau 119.
          </li>
          <li>
            Pertanyaan dan aturan tanda bahaya pada versi ini adalah contoh dan belum ditinjau
            tenaga kesehatan.
          </li>
        </ul>
      </section>

      <section className="panel" aria-labelledby="ai">
        <h2 id="ai">Penggunaan AI</h2>
        <p>
          Kode dan dokumen prototipe ini disusun dengan bantuan Claude (Anthropic), lalu
          ditinjau dan dijalankan oleh tim. Penentuan pertanyaan dan status hasil memakai aturan
          tertulis yang bisa diuji, tanpa model AI.
        </p>
      </section>
    </div>
  );
}
