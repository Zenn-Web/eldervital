import type { Metadata } from "next";
import Link from "next/link";
import ReminderDemo from "@/components/ReminderDemo";
import RequestHelp from "@/components/RequestHelp";
import ElderName from "@/components/session/ElderName";
import ElderLinksCard from "@/components/session/ElderLinksCard";
import ElderReminderRows from "@/components/session/ElderReminderRows";
import {
  ClockIcon,
  ChevronRightIcon,
} from "@/components/shared/Icons";

export const metadata: Metadata = { title: "Beranda Lansia" };

export default function ElderHome() {
  const today = "Kamis, 15 Oktober 2026";

  return (
    <div className="space-y-5 max-w-md mx-auto pb-12">
      {/* Header Sapaan */}
      <header className="space-y-1 pt-1">
        <span className="text-xs font-bold text-sogan uppercase tracking-widest">
          {today}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-tight">
          Selamat pagi,{" "}
          <span className="text-primary">
            <ElderName fallback="Bu Sari" />
          </span>
        </h1>
        <p className="text-base text-ink-soft leading-relaxed">
          Bagaimana kondisi Ibu hari ini? Mari luangkan sebentar untuk
          pemeriksaan singkat.
        </p>
      </header>

      {/* Aksi Utama Pemeriksaan */}
      <section className="space-y-3" aria-label="Mulai pemeriksaan">
        <Link
          href="/lansia/periksa"
          className="w-full min-h-[68px] px-6 py-4 rounded-2xl bg-primary text-white font-bold flex items-center justify-between gap-4 hover:bg-primary-strong active:bg-primary-strong transition-all shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
        >
          <div>
            <span className="text-xl font-serif tracking-normal block leading-tight">
              Mulai Cek Mandiri
            </span>
            <span className="text-sm font-normal text-white/80 block mt-0.5">
              Jawab dengan suara atau tombol besar
            </span>
          </div>
          <ChevronRightIcon size={24} className="text-white/80 shrink-0" />
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
        {/* Header kartu */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-line/40">
          <ClockIcon size={18} className="text-sogan shrink-0" />
          <h2 className="font-serif text-lg font-bold text-ink">
            Jadwal Pengingat Hari Ini
          </h2>
        </div>

        {/* Daftar waktu */}
        <div className="divide-y divide-line/40">
          <ElderReminderRows />
        </div>

        {/* Catatan kecil */}
        <p className="px-5 pb-4 pt-2 text-xs text-ink-soft leading-relaxed">
          Pengingat hanya mengajak Ibu melakukan pemeriksaan di aplikasi, bukan
          kunjungan ke fasilitas medis.
        </p>
      </section>
    </div>
  );
}
