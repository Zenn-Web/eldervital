import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pengaturan" };

const SECTIONS = [
  "Profil caregiver",
  "Pengaturan notifikasi",
  "Profil dan relasi lansia",
  "Izin berbagi data",
  "Keluar",
] as const;

export default function Settings() {
  return (
    <div className="stack">
      <h1>Pengaturan</h1>
      <p>Bagian berikut belum tersedia di prototipe dan akan tersambung setelah login dan database aktif.</p>
      <ul className="stack" style={{ listStyle: "none", padding: 0 }}>
        {SECTIONS.map((s) => (
          <li key={s}>
            <button type="button" className="btn btn-choice" disabled>
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
