import type { Metadata } from "next";
import Link from "next/link";
import ReminderDemo from "@/components/ReminderDemo";
import RequestHelp from "@/components/RequestHelp";
import { DEFAULT_REMINDERS } from "@/lib/schedule";
import {
  UserIcon,
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
          <span className="text-primary">Bu Sari</span>
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
      <div className="p-4 rounded-2xl bg-surface border border-line/60 flex items-center justify-between gap-3 shadow-none">
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <UserIcon size={20} />
          </div>
          <div>
            <span className="text-xs text-ink-soft block font-medium">
              Keluarga Terhubung
            </span>
            <span className="text-sm font-bold text-ink">
              Rina Lestari (Caregiver)
            </span>
          </div>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-primary hover:text-primary-strong underline underline-offset-4 focus-visible:ring-4 focus-visible:ring-focus rounded shrink-0"
        >
          Lihat QR
        </Link>
      </div>

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
          {DEFAULT_REMINDERS.map((r) => (
            <div
              key={r.id}
              className="px-5 py-3.5 flex justify-between items-center"
            >
              <span className="font-bold text-ink text-base">{r.label}</span>
              <span className="font-mono text-sm text-ink-soft">
                Pukul {r.time}
              </span>
            </div>
          ))}
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
