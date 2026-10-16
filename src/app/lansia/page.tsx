import type { Metadata } from "next";
import Link from "next/link";
import ReminderDemo from "@/components/ReminderDemo";
import RequestHelp from "@/components/RequestHelp";
import ElderGreetingHeader from "@/components/session/ElderGreetingHeader";
import ElderLinksCard from "@/components/session/ElderLinksCard";
import ElderReminderRows from "@/components/session/ElderReminderRows";
import {
  ClockIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
} from "@/components/shared/Icons";

// Penjaga sesi di layout belum menampilkan isi halaman selama sesi dimuat, sehingga validasi
// Instant Navigation Next.js 16 (khusus development) tidak bisa memeriksa halaman ini. Ini hanya
// mematikan validasinya; prerender dan perilaku halaman tidak berubah. Perbaikan lengkap
// (memindahkan penjaga ke dalam halaman) dijadwalkan setelah hackathon.
export const instant = false;

export const metadata: Metadata = { title: "Beranda Lansia" };

export default function ElderHome() {
  return (
    <div className="space-y-5 max-w-md mx-auto pb-12">
      {/* Header Sapaan Dinamis Waktu & Tanggal Nyata */}
      <ElderGreetingHeader />

      {/* Aksi Utama Pemeriksaan */}
      <section className="space-y-3" aria-label="Mulai pemeriksaan">
        <Link
          href="/lansia/periksa"
          className="w-full min-h-[76px] px-5 py-4 rounded-2xl bg-primary text-white font-bold flex items-center justify-between gap-4 hover:bg-primary-strong active:bg-primary-strong transition-all shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus group"
        >
          <div className="flex items-center gap-3.5">
            <span
              className="w-12 h-12 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 border border-white/20"
              aria-hidden="true"
            >
              <ClipboardCheckIcon size={24} />
            </span>
            <div>
              <span className="text-xl font-serif tracking-normal block leading-tight">
                Mulai Cek Mandiri
              </span>
              <span className="text-sm font-normal text-white/85 block mt-0.5">
                Jawab dengan suara atau tombol besar
              </span>
            </div>
          </div>
          <ChevronRightIcon
            size={24}
            className="text-white/80 shrink-0 group-hover:translate-x-0.5 transition-transform"
          />
        </Link>

        <RequestHelp />
      </section>

      {/* Kartu Status Keluarga Terhubung */}
      <ElderLinksCard />

      <ReminderDemo />

      {/* Jadwal Pengingat */}
      <section
        className="rounded-2xl border border-line/60 bg-surface overflow-hidden shadow-none"
        aria-label="Jadwal pengingat"
      >
        {/* Header kartu dengan tautan pintasan atur */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line/40">
          <div className="flex items-center gap-2.5">
            <ClockIcon size={18} className="text-sogan shrink-0" />
            <h2 className="font-serif text-lg font-bold text-ink">
              Jadwal Pengingat Hari Ini
            </h2>
          </div>
          <Link
            href="/lansia/pengaturan"
            className="text-xs font-bold text-primary hover:text-primary-strong hover:underline flex items-center gap-1 focus-visible:outline-none"
          >
            <span>Atur</span>
            <ChevronRightIcon size={14} />
          </Link>
        </div>

        {/* Daftar waktu */}
        <div className="divide-y divide-line/40">
          <ElderReminderRows />
        </div>

        {/* Catatan kecil */}
        <p className="px-5 pb-4 pt-2 text-xs text-ink-soft leading-relaxed">
          Pengingat hanya mengajak pemeriksaan kondisi di aplikasi ini, bukan
          kunjungan ke fasilitas medis.
        </p>
      </section>
    </div>
  );
}
