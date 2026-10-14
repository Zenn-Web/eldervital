"use client";

import { useState } from "react";
import { UserIcon, BellIcon, HandshakeIcon, ChevronRightIcon } from "@/components/shared/Icons";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const [notifyRed] = useState(true);
  const [dailyReminder] = useState(true);
  const [dataSharing] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showDemoNotice = (feature: string) => {
    setFeedback(`Pengaturan "${feature}" disimulasikan aktif di penyimpanan lokal prototipe.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto px-1 sm:px-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          className="rounded-lg bg-primary text-white text-sm px-4 py-3 font-medium shadow-md flex items-center justify-between animate-in fade-in duration-200"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-white/80 hover:text-white font-bold ml-2 text-base"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <header className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">
          Pengaturan Akun & Layanan
        </h1>
        <p className="text-sm sm:text-base text-ink-soft">
          Kelola preferensi pendampingan, notifikasi peringatan dini, dan sambungan profil lansia.
        </p>
      </header>

      {/* Bagian 1: Profil Caregiver */}
      <section
        aria-labelledby="profil-caregiver-heading"
        className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-4 shadow-none"
      >
        <div className="flex items-center gap-3 border-b border-line/60 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 id="profil-caregiver-heading" className="text-base font-bold text-ink">
              Profil Caregiver
            </h2>
            <p className="text-xs text-ink-soft">Informasi akun pendamping keluarga utama</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg bg-paper/50 border border-line">
            <span className="text-xs text-ink-soft block">Nama Lengkap</span>
            <strong className="text-ink font-semibold">Hanafi (Caregiver)</strong>
          </div>
          <div className="p-3 rounded-lg bg-paper/50 border border-line">
            <span className="text-xs text-ink-soft block">Peran dalam Keluarga</span>
            <strong className="text-ink font-semibold">Anak Kandung</strong>
          </div>
          <div className="p-3 rounded-lg bg-paper/50 border border-line">
            <span className="text-xs text-ink-soft block">Nomor Telepon Darurat</span>
            <strong className="text-ink font-semibold">+62 812-3456-7890</strong>
          </div>
          <div className="p-3 rounded-lg bg-paper/50 border border-line">
            <span className="text-xs text-ink-soft block">Status Akun</span>
            <span className="inline-flex items-center gap-1.5 text-ok-ink font-bold text-xs mt-0.5">
              <span className="h-2 w-2 rounded-full bg-ok-mark" />
              Aktif Terhubung
            </span>
          </div>
        </div>
      </section>

      {/* Bagian 2: Preferensi Notifikasi */}
      <section
        aria-labelledby="notifikasi-heading"
        className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-4 shadow-none"
      >
        <div className="flex items-center gap-3 border-b border-line/60 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 id="notifikasi-heading" className="text-base font-bold text-ink">
              Pengaturan Notifikasi & Sinyal Bahaya
            </h2>
            <p className="text-xs text-ink-soft">Pemberitahuan instan saat kondisi darurat atau butuh bantuan</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-line bg-paper/40">
            <div>
              <div className="text-sm font-bold text-ink">Peringatan Tanda Bahaya (Merah)</div>
              <div className="text-xs text-ink-soft">Peringatan suara & pop-up saat lansia melaporkan gejala gawat darurat</div>
            </div>
            <Badge variant="ok" className="text-xs">
              {notifyRed ? "Aktif (Prioritas Tinggi)" : "Nonaktif"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-line bg-paper/40">
            <div>
              <div className="text-sm font-bold text-ink">Pengingat Jadwal Skrining Pagi</div>
              <div className="text-xs text-ink-soft">Notifikasi otomatis bila lansia belum check-in sebelum 08:00 WIB</div>
            </div>
            <Badge variant="ok" className="text-xs">
              {dailyReminder ? "Aktif (07:30 WIB)" : "Nonaktif"}
            </Badge>
          </div>
        </div>
      </section>

      {/* Bagian 3: Hubungan Lansia & Privasi */}
      <section
        aria-labelledby="relasi-heading"
        className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-4 shadow-none"
      >
        <div className="flex items-center gap-3 border-b border-line/60 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HandshakeIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 id="relasi-heading" className="text-base font-bold text-ink">
              Profil & Izin Berbagi Data Lansia
            </h2>
            <p className="text-xs text-ink-soft">Lansia yang terhubung dan batas privasi rekam skrining</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-line bg-paper/40">
            <div>
              <div className="text-sm font-bold text-ink">Ibu Sari Rahayu (62 tahun)</div>
              <div className="text-xs text-ink-soft">ID Sambungan: ELDER-SARI-01 &bull; Terhubung via Pindai QR</div>
            </div>
            <Badge variant="ok" className="text-xs">
              {dataSharing ? "Izin Berbagi Penuh" : "Ditunda"}
            </Badge>
          </div>

          <button
            type="button"
            onClick={() => showDemoNotice("Sinkronisasi Cloud")}
            className="w-full flex items-center justify-between p-3.5 rounded-lg border border-line bg-surface hover:bg-paper transition-colors text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <div>
              <span className="text-sm font-semibold text-ink block">Sinkronisasi Database Cloud (Supabase)</span>
              <span className="text-xs text-ink-soft">Status: Menggunakan penyimpanan lokal prototipe demo</span>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-ink-soft shrink-0" />
          </button>
        </div>
      </section>

      {/* Bagian 4: Keluar / Beralih Akun */}
      <section className="pt-2">
        <button
          type="button"
          onClick={() => showDemoNotice("Keluar Akun")}
          className="w-full sm:w-auto px-6 py-3 rounded-lg border border-line bg-paper hover:bg-paper/80 transition-colors text-alert-ink font-semibold text-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Keluar dari Sesi Caregiver
        </button>
      </section>
    </div>
  );
}
