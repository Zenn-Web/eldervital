import type { Metadata } from "next";
import Link from "next/link";
import ReminderDemo from "@/components/ReminderDemo";
import RequestHelp from "@/components/RequestHelp";
import { Card } from "@/components/ui/card";
import { DEFAULT_REMINDERS } from "@/lib/schedule";
import { UserIcon, ClockIcon, ChevronRightIcon } from "@/components/shared/Icons";

export const metadata: Metadata = { title: "Beranda Lansia" };

export default function ElderHome() {
  const today = "Kamis, 15 Oktober 2026";

  return (
    <div className="space-y-6 max-w-md mx-auto pb-12">
      {/* Header Sapaan & Tanggal */}
      <header className="space-y-1.5 pt-2">
        <span className="text-xs sm:text-sm font-bold text-sogan uppercase tracking-wider">
          {today}
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
          Selamat pagi, Bu Sari
        </h1>
        <p className="text-base sm:text-lg text-ink-soft leading-relaxed">
          Bagaimana kondisi Anda hari ini? Mari luangkan 1 menit untuk pemeriksaan singkat.
        </p>
      </header>

      {/* Kartu Status Terhubung */}
      <div className="p-4 rounded-2xl bg-surface border-2 border-line flex items-center justify-between gap-3 shadow-none">
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0"
            aria-hidden="true"
          >
            <UserIcon size={22} />
          </div>
          <div>
            <span className="text-xs text-ink-soft block font-bold">Keluarga Terhubung</span>
            <span className="text-base font-bold text-ink">Rina Lestari (Caregiver)</span>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm font-bold text-primary hover:text-primary-strong underline underline-offset-4 focus-visible:ring-4 focus-visible:ring-focus rounded"
        >
          Lihat QR
        </Link>
      </div>

      <ReminderDemo />

      {/* Aksi Utama Pemeriksaan (Tombol Besar) */}
      <section className="space-y-3.5" aria-label="Mulai pemeriksaan">
        <Link
          className="w-full min-h-[4.25rem] px-6 py-4 rounded-2xl bg-primary text-white font-bold flex flex-col justify-center items-center gap-1 text-center hover:bg-primary-strong active:bg-primary-strong transition-all shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
          href="/lansia/periksa"
        >
          <span className="text-2xl font-serif tracking-normal flex items-center gap-2">
            <span>Mulai Cek Mandiri</span>
            <ChevronRightIcon size={22} className="text-white/80" />
          </span>
          <span className="text-sm font-normal text-white/90">
            Jawab dengan suara atau tombol besar
          </span>
        </Link>

        <RequestHelp />
      </section>

      {/* Jadwal Pengingat */}
      <Card className="p-5 border-2 border-line bg-surface rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <ClockIcon size={20} className="text-sogan" />
          <h2 className="font-serif text-xl font-bold text-ink">
            Jadwal Pengingat Hari Ini
          </h2>
        </div>
        <div className="divide-y divide-line/60">
          {DEFAULT_REMINDERS.map((r) => (
            <div key={r.id} className="py-2.5 flex justify-between items-center text-base sm:text-lg">
              <span className="font-bold text-ink">{r.label}</span>
              <span className="font-mono text-ink-soft text-sm sm:text-base">Pukul {r.time}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-soft leading-normal pt-1">
          Pengingat hanya mengajak Anda melakukan pemeriksaan di aplikasi. Tidak berarti Anda perlu periksa ke fasilitas medis tiga kali sehari.
        </p>
      </Card>
    </div>
  );
}
