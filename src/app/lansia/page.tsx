import type { Metadata } from "next";
import Link from "next/link";
import ReminderDemo from "@/components/ReminderDemo";
import RequestHelp from "@/components/RequestHelp";
import { DEFAULT_REMINDERS } from "@/lib/schedule";

export const metadata: Metadata = { title: "Beranda" };

export default function ElderHome() {
  return (
    <div className="stack-lg">
      <section>
        <h1>Pemeriksaan kondisi hari ini</h1>
        <p>Pilih cara yang paling nyaman untuk Anda.</p>
      </section>

      <ReminderDemo />

      <section className="stack" aria-label="Mulai pemeriksaan">
        <Link className="btn btn-primary" href="/lansia/periksa">
          Cek Mandiri
        </Link>
        <RequestHelp />
      </section>

      <section className="panel" aria-labelledby="pengingat">
        <h2 id="pengingat">Pengingat pemeriksaan</h2>
        <dl className="qa">
          {DEFAULT_REMINDERS.map((r) => (
            <div key={r.id}>
              <dt>{r.label}</dt>
              <dd>Pukul {r.time}</dd>
            </div>
          ))}
        </dl>
        <p className="small">
          Pengingat hanya mengajak Anda melakukan pemeriksaan di aplikasi. Jumlah pengingat tidak
          berarti Anda perlu ke tenaga kesehatan tiga kali sehari. Mengubah jadwal belum
          tersedia di prototipe.
        </p>
      </section>
    </div>
  );
}
