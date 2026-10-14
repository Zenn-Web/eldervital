# ElderVital

Prototipe PWA skrining gejala harian untuk usia 50 sampai 65 tahun, dengan peran
**lansia** dan **caregiver**. Dibuat untuk JOINTS UGM 2026 Hackathon (tema Healthcare).
Rujukan produk: `ElderVital_Product_Flow_MVP_Specification.md`.

> Hasilnya skrining gejala, bukan diagnosis. Pertanyaan dan aturan tanda bahaya di
> repo ini adalah **contoh** dan belum ditinjau tenaga kesehatan.

## Menjalankan

```bash
nvm use            # Node 22
npm install
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + 81 tes
```

Bagian yang berjalan tanpa Supabase: pilihan peran, Cek Mandiri, Minta Caregiver,
hasil hijau/kuning/merah/data tidak cukup beserta alasannya, suara (TTS/STT),
PWA dan halaman offline. Untuk menyimpan data, hubungkan Supabase lewat
[`docs/SETUP.md`](docs/SETUP.md).

## Struktur

| Lokasi | Isi |
| --- | --- |
| `src/lib/screening/` | Mesin pohon keputusan murni TypeScript: `tree.v1.ts` (data), `engine.ts`, `validate.ts`, `voice-match.ts` |
| `src/lib/voice/` | Pembungkus Web Speech API (suara keluar dan masuk) |
| `src/components/` | `ScreeningFlow`, `ResultView`, `StatusMark`, dll. |
| `src/app/lansia`, `src/app/caregiver` | Dua antarmuka, tiap peran punya navigasi sendiri |
| `src/lib/supabase/client.ts` | Klien Supabase untuk browser (kunci publik saja) |
| `supabase/migrations/0001_init.sql` | Tabel, RLS, dan fungsi (pairing QR, persetujuan, simpan pemeriksaan) |
| `supabase/tests/` | Uji keamanan RLS memakai PostgreSQL asli (PGlite), tanpa proyek Supabase |
| `public/sw.js` | Service worker tulisan tangan (cache shell, halaman offline) |

## Cara kerja hasil

Pertanyaan berpindah lewat aturan di `tree.v1.ts`, bukan model AI.
Urutan keputusan: tanda bahaya (merah) menghentikan pemeriksaan seketika;
pemeriksaan belum lengkap atau jawaban penting "tidak yakin" menghasilkan
"data tidak cukup" (tidak pernah hijau); lalu kuning; lalu hijau. Setiap alasan
kuning/merah menunjuk ke pertanyaan dan jawaban yang memicunya.

## Status verifikasi

Sudah dijalankan: 81 tes otomatis (mesin, validasi pohon, pencocokan suara, RLS database),
lint, typecheck, `next build`, dan 57 pemeriksaan browser dengan axe (aksesibilitas).

**Belum** diuji: di Supabase sungguhan, di ponsel nyata (suara, kamera, notifikasi),
dan oleh tenaga kesehatan. Batasan yang diketahui:

- Hasil dihitung di perangkat lalu disimpan; database belum menghitung ulang.
- Pemindai QR, UI pairing, dan penyimpanan hasil ke Supabase belum disambungkan ke
  layar (fungsi database dan tesnya sudah ada; titik sambung: `onFinish` di `ScreeningFlow`).
- Pengingat masih simulasi (berlabel). Push notification belum ada.
- Pengenalan suara di browser mengirim audio ke layanan pengenalan milik browser.

## Penggunaan AI

Kode, tes, dan dokumen di repo ini disusun dengan bantuan Claude (Anthropic) dan
ditinjau serta dijalankan oleh tim. Aplikasi sendiri tidak memakai AI generatif untuk
menentukan pertanyaan atau hasil.

## Lisensi pihak ketiga

Huruf Atkinson Hyperlegible Next: SIL Open Font License
(`src/app/fonts/OFL-LICENSE.txt`).
