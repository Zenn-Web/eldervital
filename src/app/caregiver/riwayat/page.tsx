import type { Metadata } from "next";

export const metadata: Metadata = { title: "Riwayat" };

export default function History() {
  return (
    <div className="stack">
      <h1>Riwayat pemeriksaan</h1>
      <p>
        Belum ada riwayat. Setelah database tersambung, daftar pemeriksaan akan tampil di sini
        beserta waktu, mode (mandiri atau caregiver), jawaban, status hasil, dan alasannya.
      </p>
    </div>
  );
}
