import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangleIcon, PhoneIcon, RefreshIcon } from "@/components/shared/Icons";

export const metadata: Metadata = { title: "Sedang Offline - ElderVital" };

export default function Offline() {
  return (
    <main id="isi" className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 text-warn-ink border-b border-line pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warn-bg text-warn-mark border border-warn-mark/30 shrink-0">
            <AlertTriangleIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink leading-tight font-serif">
              Tidak Ada Koneksi Internet
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft">
              Perangkat Anda saat ini sedang dalam mode offline.
            </p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
          Beberapa data terbaru belum dapat diperbarui tanpa jaringan. Silakan periksa kembali sambungan Wi-Fi atau paket data seluler Anda, lalu coba muat ulang halaman.
        </p>

        {/* Kotak Darurat Berwarna Tegas */}
        <div className="rounded-xl border-2 border-alert-mark bg-alert-bg/40 p-4 space-y-2">
          <div className="flex items-center gap-2 text-alert-ink font-bold text-sm">
            <PhoneIcon className="h-4 w-4 shrink-0" />
            <span>Penting Jika Lansia Butuh Pertolongan Segera:</span>
          </div>
          <p className="text-xs sm:text-sm text-alert-ink leading-normal">
            Bila Anda atau anggota keluarga merasa sangat lemas, sesak napas, atau nyeri dada hebat, jangan menunggu aplikasi tersambung. Segera hubungi ambulans <strong>112</strong> atau <strong>119</strong>, atau minta bantuan tetangga terdekat.
          </p>
        </div>

        {/* Tombol Aksi Coba Lagi */}
        <div className="pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full min-h-[60px] rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-strong transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus shadow-sm"
          >
            <RefreshIcon className="h-5 w-5" />
            <span>Coba Sambungkan Lagi</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
