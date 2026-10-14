import type { Metadata } from "next";
import Link from "next/link";
import ReminderDemo from "@/components/ReminderDemo";
import RequestHelp from "@/components/RequestHelp";
import { Card } from "@/components/ui/card";
import { DEFAULT_REMINDERS } from "@/lib/schedule";

export const metadata: Metadata = { title: "Beranda Lansia" };

export default function ElderHome() {
  const today = "Rabu, 14 Oktober 2026";

  return (
    <div className="space-y-6 max-w-md mx-auto pb-16">
      {/* Header Sapaan & Tanggal */}
      <section className="space-y-1.5 pt-2">
        <span className="text-sm font-bold text-sogan uppercase tracking-wider">
          {today}
        </span>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink">
          Selamat pagi, Bu Sari
        </h1>
        <p className="text-lg text-ink-soft">
          Bagaimana kondisi Anda hari ini? Mari luangkan 1 menit untuk pemeriksaan singkat.
        </p>
      </section>

      {/* Kartu Status Terhubung */}
      <div className="p-4 rounded-2xl bg-surface border-2 border-line flex items-center justify-between gap-3 shadow-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            👤
          </div>
          <div>
            <span className="text-xs text-ink-soft block font-bold">Keluarga Terhubung</span>
            <span className="text-base font-bold text-ink">Rina Lestari (Caregiver)</span>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm font-bold text-primary underline hover:text-primary-strong"
        >
          Lihat QR
        </Link>
      </div>

      <ReminderDemo />

      {/* Aksi Utama Pemeriksaan (Tombol Besar) */}
      <section className="space-y-3.5" aria-label="Mulai pemeriksaan">
        <Link
          className="w-full min-h-[4rem] px-6 py-4 rounded-2xl bg-primary text-white font-bold flex flex-col justify-center items-center gap-1 text-center hover:bg-primary-strong active:bg-primary-strong transition-colors shadow-none"
          href="/lansia/periksa"
        >
          <span className="text-2xl font-serif">Mulai Cek Mandiri</span>
          <span className="text-sm font-normal text-white/90">
            Jawab dengan suara atau tombol besar
          </span>
        </Link>

        <RequestHelp />
      </section>

      {/* Jadwal Pengingat */}
      <Card className="p-5 border-2 border-line bg-surface rounded-2xl space-y-3">
        <h2 className="font-serif text-xl font-bold text-ink">
          Jadwal Pengingat Hari Ini
        </h2>
        <div className="divide-y divide-line/60">
          {DEFAULT_REMINDERS.map((r) => (
            <div key={r.id} className="py-2.5 flex justify-between items-center text-lg">
              <span className="font-bold text-ink">{r.label}</span>
              <span className="font-mono text-ink-soft">Pukul {r.time}</span>
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
