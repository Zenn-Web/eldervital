import type { Metadata } from "next";
import { AlertTriangleIcon, CheckIcon } from "@/components/shared/Icons";

export const metadata: Metadata = { title: "Tentang ElderVital" };

export default function About() {
  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto px-1 sm:px-4">
      {/* Header Utama */}
      <header className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">
          Tentang ElderVital
        </h1>
        <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-2xl">
          Sistem skrining kesehatan mandiri adaptif dan pemantauan sinyal vital harian untuk lansia (50–65 tahun) dengan pelaporan terhubung langsung ke keluarga pendamping (caregiver).
        </p>
      </header>

      {/* Kartu Prinsip & Cara Kerja */}
      <section
        aria-labelledby="cara-kerja"
        className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-3"
      >
        <h2 id="cara-kerja" className="text-lg font-bold text-ink">
          Prinsip Skrining Adaptif
        </h2>
        <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
          ElderVital menggunakan pohon keputusan klinis deterministik (*decision tree*). Setiap pertanyaan menyesuaikan jawaban sebelumnya untuk mempersingkat durasi skrining lansia (rata-rata 3–5 pertanyaan). Setiap hasil status (Stabil, Perlu Pemantauan, atau Tanda Bahaya) dapat ditelusuri alasan klinis dan riwayat jawabannya secara transparan.
        </p>
      </section>

      {/* Kartu Batasan Klinis & Tanggung Jawab */}
      <section
        aria-labelledby="batasan-klinis"
        className="rounded-xl border border-warn-mark/30 bg-warn-bg/20 p-5 sm:p-6 space-y-3"
      >
        <div className="flex items-center gap-2 text-warn-ink">
          <AlertTriangleIcon className="h-5 w-5 shrink-0" />
          <h2 id="batasan-klinis" className="text-lg font-bold">
            Batasan Klinis & Ruang Lingkup
          </h2>
        </div>
        <ul className="text-xs sm:text-sm text-ink-soft space-y-2 list-none pl-0">
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-warn-mark mt-2 shrink-0" />
            <span>
              <strong>Skrining, Bukan Diagnosis:</strong> Hasil aplikasi adalah penapisan gejala awal, bukan diagnosis dokter spesialis atau rekam medis resmi.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-warn-mark mt-2 shrink-0" />
            <span>
              <strong>Status Hijau Bukan Jaminan Mutlak:</strong> Kondisi stabil mengindikasikan tidak adanya gejala risiko tinggi saat skrining dilakukan, namun tidak menjamin bebas seluruh penyakit tersembunyi.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-warn-mark mt-2 shrink-0" />
            <span>
              <strong>Tanpa Rekomendasi Obat:</strong> Aplikasi tidak pernah menyarankan perubahan dosis, penghentian, atau pergantian obat resep dokter.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-warn-mark mt-2 shrink-0" />
            <span>
              <strong>Keadaan Darurat:</strong> Dalam kondisi sesak napas berat, nyeri dada menjalar, atau pingsan, jangan menunggu respons aplikasi. Segera hubungi ambulans (118/119) atau bawa ke IGD terdekat.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-warn-mark mt-2 shrink-0" />
            <span>
              <strong>Status Prototipe:</strong> Pertanyaan dan aturan pohon keputusan pada versi kompetisi ini merupakan model demonstrasi untuk Hackathon JOINTS UGM 2026.
            </span>
          </li>
        </ul>
      </section>

      {/* Kartu Transparansi AI & Tata Kelola Kode */}
      <section
        aria-labelledby="transparansi-ai"
        className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-3"
      >
        <h2 id="transparansi-ai" className="text-lg font-bold text-ink">
          Transparansi & Penggunaan AI
        </h2>
        <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
          Kode sumber, struktur modul, dan dokumen prototipe disusun dengan bantuan Claude (Anthropic), lalu ditinjau, diuji dengan Vitest (100% lulus), dan diverifikasi oleh tim pengembang. Logika penentuan alur skrining dan evaluasi status berjalan di atas aturan tertulis yang deterministik dan dapat diaudit penuh tanpa ketergantungan pada model generatif gelap (*black-box*).
        </p>
      </section>

      {/* Kartu Komitmen Aksesibilitas Lansia */}
      <section
        aria-labelledby="aksesibilitas"
        className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-3"
      >
        <div className="flex items-center gap-2 text-primary">
          <CheckIcon className="h-5 w-5 shrink-0" />
          <h2 id="aksesibilitas" className="text-lg font-bold text-ink">
            Aksesibilitas & Standar Inklusif (WCAG AAA)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
          ElderVital didesain mengikuti pedoman aksesibilitas ramah lansia: rasio kontras teks minimal 7:1 (WCAG AAA) di atas kertas hangat (*Warm Paper*), huruf legibel Atkinson Hyperlegible Next, target sentuh tombol lansia minimal 60px, serta pengkodean bentuk geometris ganda agar informasi tetap terbaca jelas oleh lansia dengan buta warna atau penurunan daya penglihatan.
        </p>
      </section>
    </div>
  );
}
