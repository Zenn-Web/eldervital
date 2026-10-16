import type { Metadata } from "next";
import ElderConnect from "@/components/checks/ElderConnect";

// Penjaga sesi di layout belum menampilkan isi halaman selama sesi dimuat, sehingga validasi
// Instant Navigation Next.js 16 (khusus development) tidak bisa memeriksa halaman ini. Ini hanya
// mematikan validasinya; prerender dan perilaku halaman tidak berubah. Perbaikan lengkap
// (memindahkan penjaga ke dalam halaman) dijadwalkan setelah hackathon.
export const instant = false;

export const metadata: Metadata = { title: "Hubungkan caregiver" };

export default function ElderConnectPage() {
  return <ElderConnect />;
}
