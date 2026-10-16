import CaregiverHistoryPage from "./view";

// Penjaga sesi di layout (CaregiverSession) belum menampilkan isi halaman selama sesi dimuat,
// sehingga validasi Instant Navigation Next.js 16 (khusus development) tidak bisa memeriksa
// halaman ini. Ini hanya mematikan validasinya; prerender dan perilaku halaman tidak berubah.
// Isi halaman ada di ./view.tsx (Client Component; `instant` tidak boleh di Client Component).
// Perbaikan lengkap (memindahkan penjaga ke dalam halaman) dijadwalkan setelah hackathon.
export const instant = false;

export default function Page() {
  return <CaregiverHistoryPage />;
}
