# ElderVital

Prototipe PWA skrining gejala harian untuk usia 50 sampai 65 tahun, dengan peran
**lansia** dan **caregiver**. Dibuat untuk JOINTS UGM 2026 Hackathon (tema Healthcare).

**Situs:** https://eldervital.vercel.app
**Rujukan produk:** [`docs/ElderVital_Product_Flow_MVP_Specification.md`](docs/ElderVital_Product_Flow_MVP_Specification.md)

> Hasilnya skrining gejala, bukan diagnosis. Pertanyaan dan aturan tanda bahaya di
> repo ini adalah **contoh** dan belum ditinjau tenaga kesehatan.

## Yang sudah berjalan

- **Lansia** tanpa email atau password: cukup nama panggilan (sesi anonim per perangkat).
  **Caregiver** masuk dengan email dan password atau Google.
- **Pairing QR**: lansia menampilkan QR (berlaku 10 menit, sekali pakai, tanpa data
  kesehatan), caregiver memindai atau mengetik kodenya, lansia menyetujui dan memilih
  apakah hasil boleh dibagikan.
- **Pemeriksaan**: Cek Mandiri (tombol besar, pertanyaan dibacakan, jawaban suara dengan
  konfirmasi) atau didampingi caregiver. Hasil hijau, kuning, merah, atau data tidak cukup,
  selalu dengan alasan yang menunjuk ke pertanyaan dan jawabannya. Hasil merah menghentikan
  pemeriksaan dan menampilkan naskah untuk meminta bantuan.
- **Penyimpanan tahan sinyal putus**: hasil masuk antrean di perangkat dan terkirim otomatis
  saat tersambung; pengiriman ulang tidak membuat data ganda.
- **Dashboard dan riwayat caregiver**: hasil terakhir, daftar pemeriksaan, jawaban, alasan,
  dan mode, hanya bila hubungan aktif dan lansia mengizinkan berbagi hasil.
- **Minta bantuan**: tombol di perangkat lansia muncul seketika di layar caregiver
  (Supabase Realtime), lalu ditanggapi dan ditandai selesai.
- **Jadwal pengingat**: jadwal tersimpan dan terlihat oleh caregiver. Notifikasinya masih
  **simulasi** (berlabel di layar).
- **PWA**: bisa dipasang di layar utama, ada halaman offline.

## Menjalankan

```bash
nvm use            # Node 22
npm install
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + 208 tes
npm run smoke:e2e  # uji ujung ke ujung ke Supabase asli (butuh .env.local, menulis data uji)
```

Tanpa Supabase, aplikasi berjalan sebagai simulasi berlabel (Cek Mandiri, hasil, suara,
PWA). Untuk menyimpan data, ikuti [`docs/SETUP.md`](docs/SETUP.md): buat proyek Supabase,
jalankan semua migrasi berurutan, isi dua variabel `NEXT_PUBLIC_*`.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `src/lib/screening/` | Mesin pohon keputusan murni TypeScript: `tree.v1.ts` (data), `engine.ts`, `validate.ts`, `voice-match.ts` |
| `src/lib/voice/` | Pembungkus Web Speech API (suara keluar dan masuk) |
| `src/lib/auth/`, `pairing.ts`, `exam/`, `help.ts`, `reminders.ts` | Akses Supabase: akun, pairing, simpan dan riwayat pemeriksaan, bantuan, jadwal |
| `src/lib/security/headers.ts` | Header keamanan HTTP (CSP, anti-clickjacking) |
| `src/components/`, `src/modules/` | Antarmuka: `ScreeningFlow`, `ResultView`, pairing, dashboard |
| `src/app/lansia`, `src/app/caregiver` | Dua antarmuka, tiap peran punya navigasi sendiri |
| `supabase/migrations/` | `0001` tabel, RLS, RPC; `0002` aturan status bantuan; `0003` pengetatan akses dan validasi data |
| `supabase/tests/` | Uji keamanan RLS memakai PostgreSQL asli (PGlite), tanpa proyek Supabase |
| `scripts/smoke-e2e.mjs` | Uji ujung ke ujung ke Supabase asli |
| `public/sw.js` | Service worker tulisan tangan (cache shell, halaman offline) |

## Cara kerja hasil

Pertanyaan berpindah lewat aturan di `tree.v1.ts`, bukan model AI.
Urutan keputusan: tanda bahaya (merah) menghentikan pemeriksaan seketika;
pemeriksaan belum lengkap atau jawaban penting "tidak yakin" menghasilkan
"data tidak cukup" (tidak pernah hijau); lalu kuning; lalu hijau. Setiap alasan
kuning/merah menunjuk ke pertanyaan dan jawaban yang memicunya.

## Keamanan dan privasi

- Batas keamanan ada di database (Row Level Security), bukan di tampilan. Caregiver hanya
  melihat hasil bila hubungan aktif dan lansia mengizinkan; begitu hubungan diputus, seluruh
  akses tertutup.
- Klien hanya memakai kunci publishable Supabase. Tidak ada kunci rahasia di repo.
- Vercel Web Analytics menghitung kunjungan tanpa cookie.
- Rincian, pemetaan OWASP Top 10, dan risiko yang tersisa: [`docs/SECURITY.md`](docs/SECURITY.md).

## Status verifikasi (24 Oktober 2026)

- 208 tes otomatis: mesin keputusan, validasi pohon, pencocokan suara, antrean, header
  keamanan, dan kebijakan RLS database. Ditambah lint, typecheck, dan `next build`.
- `npm run smoke:e2e`: 39 dari 39 pemeriksaan lulus ke Supabase sungguhan (login, pairing,
  izin berbagi, penyimpanan, Realtime, pemutusan hubungan).
- `npm audit --omit=dev`: 0 celah.
- Pemeriksaan aksesibilitas otomatis (axe) dijalankan pada versi awal antarmuka.

**Belum** dilakukan: uji formal di berbagai ponsel dan browser (suara, kamera, offline),
dan tinjauan konten oleh tenaga kesehatan. Batasan yang diketahui:

- Hasil dihitung di perangkat lalu disimpan. Database menolak data yang bentuknya tidak sah
  atau tidak konsisten, tetapi belum menghitung ulang hasilnya.
- Notifikasi pengingat masih simulasi. Aplikasi tidak menjamin pesan diterima atau
  caregiver merespons.
- Pengenalan suara di browser mengirim audio ke layanan pengenalan milik browser.
- Antrean pemeriksaan yang belum terkirim tersimpan di perangkat tanpa enkripsi.

## Penggunaan AI

Kode, tes, dan dokumen di repo ini disusun dengan bantuan Claude (Anthropic) dan
ditinjau serta dijalankan oleh tim. Aplikasi sendiri tidak memakai AI generatif untuk
menentukan pertanyaan atau hasil.

## Lisensi pihak ketiga

Huruf Atkinson Hyperlegible Next: SIL Open Font License
(`src/app/fonts/OFL-LICENSE.txt`).
