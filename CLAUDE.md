@AGENTS.md

# ElderVital: konteks proyek untuk Claude Code

PWA skrining gejala harian untuk usia 50 sampai 65 tahun, dengan dua peran
(lansia dan caregiver). Dibuat tim 4 orang untuk **JOINTS UGM 2026 Hackathon, tema
Healthcare**. Spesifikasi produk lengkap: `docs/ElderVital_Product_Flow_MVP_Specification.md`
(baca bagian 4, 5, 8, 10, 11, 13, 14 sebelum membangun fitur).

## Jadwal (WIB)
- Feature freeze: **Jumat 16 Okt 2026, 12:00**. Submit target Jumat 20:00. Batas akhir **23:50**.
- Mode speedrun. Utamakan alur demo yang jalan ujung ke ujung daripada fitur lengkap.
- Prioritas MVP ada di spesifikasi bagian 13. Bila waktu mepet, bagian "dapat disederhanakan
  untuk demo" boleh dipakai, asalkan **diberi label simulasi** di layar dan tidak disebut aman
  atau siap produksi.

## Pengguna dan cara bekerja
- Pengguna: tech lead tim, web developer berpengalaman, ingin memahami konsep yang dipakai,
  bukan hanya hasil. Jelaskan singkat apa dan kenapa pada perubahan yang tidak sepele.
- Bahasa percakapan dan seluruh teks antarmuka: **Bahasa Indonesia**. Kode dan nama berkas: Inggris.
- Lingkungan: WSL2 Ubuntu, repo di `~/projects/eldervital`, Node 22 (`nvm use`). Satu anggota tim memakai Mac.
- Jangan jalankan `git push` atau perintah merusak tanpa diminta. Commit kecil dan sering.

## Stack
Next.js 16 (App Router, TypeScript, Cache Components) + Supabase (Postgres, Auth, Realtime, RLS).
Deploy awal: Vercel. Hostinger masih dipertimbangkan nanti (perlu paket yang mendukung Node,
dan tidak ada PostgreSQL di paket bersama; Supabase tetap eksternal).
Next.js versi ini punya perubahan besar. Baca `node_modules/next/dist/docs/` sebelum memakai
API yang tidak yakin (lihat AGENTS.md).

## Perintah
```bash
npm run dev        # http://localhost:3000
npm run check      # lint + typecheck + 81 tes (wajib hijau sebelum commit)
npm run build      # build produksi
```
Service worker (`public/sw.js`) hanya didaftarkan pada build produksi. Uji PWA/offline dengan
`npm run build && npm run start`.

## Peta kode
- `src/lib/screening/`: mesin pohon keputusan murni TypeScript tanpa AI. `tree.v1.ts` (data),
  `engine.ts`, `validate.ts`, `voice-match.ts`. Bagian terpenting dan paling banyak diuji.
- `src/lib/voice/speech.ts`: pembungkus Web Speech API (TTS dan STT bahasa Indonesia).
- `src/components/ScreeningFlow.tsx`: layar pemeriksaan. Prop `onFinish(session, result)` adalah
  **titik sambung penyimpanan ke Supabase** (belum dipakai).
- `src/components/ResultView.tsx`, `StatusMark.tsx`: hasil beserta alasan.
- `src/app/lansia/*`, `src/app/caregiver/*`: dua antarmuka dengan navigasi sendiri.
- `src/lib/supabase/client.ts`: klien browser. Hanya kunci publishable. Jangan pernah service_role di klien.
- `supabase/migrations/0001_init.sql`: tabel, RLS, dan RPC (`create_elder_profile`,
  `create_pairing_token`, `preview_pairing`, `request_pairing`, `decide_link`, `set_share_results`,
  `revoke_link`, `save_examination`).
- `supabase/tests/policies.test.ts`: uji RLS memakai PGlite (PostgreSQL asli di WASM) tanpa proyek Supabase.
  Setiap perubahan migrasi harus lolos tes ini. Tambahkan tes untuk kebijakan baru.

## Status
**Sudah jalan dan teruji:** pilihan peran; Cek Mandiri (tombol, suara keluar, suara masuk dengan
konfirmasi); Minta Caregiver; pohon pertanyaan batuk, nyeri dada, dan obat; hasil hijau/kuning/merah/
data tidak cukup dengan alasan; navigasi kedua peran; halaman offline dan PWA; migrasi database dan tes RLS.

**Belum dikerjakan (urut prioritas):**
1. Proyek Supabase dibuat pengguna sesuai `docs/SETUP.md`, env di `.env.local` dan Vercel. Tanpa ini, 2 sampai 6 tidak bisa diuji.
2. Auth: caregiver daftar/masuk (email dan password); perangkat lansia masuk anonim lalu `create_elder_profile`.
3. Pairing QR: lansia menampilkan QR dari `create_pairing_token` (token hanya di QR, 10 menit, sekali pakai);
   caregiver memindai (kamera, perlu HTTPS), `preview_pairing` lalu `request_pairing`; lansia menyetujui lewat `decide_link`
   dengan pilihan berbagi hasil. Sediakan input token manual sebagai cadangan bila kamera gagal.
4. Simpan hasil pemeriksaan lewat `onFinish` memanggil `save_examination` (id dibuat klien, aman dikirim ulang).
   Mode caregiver juga disimpan. Tangani gagal jaringan dengan antrean sederhana atau pesan jelas.
5. Dashboard dan riwayat caregiver membaca data nyata: hasil terakhir, daftar pemeriksaan, jawaban, alasan, mode.
   Hormati `share_results`; bila belum diizinkan, tampilkan itu apa adanya.
6. Permintaan bantuan nyata (`help_requests` dengan Realtime) menggantikan simulasi di `RequestHelp.tsx`.
7. Pengingat: tetap simulasi berlabel bila Web Push tidak sempat. Jangan menjanjikan notifikasi terkirim.
8. Pengaturan jadwal pengingat (tabel `reminder_schedules` sudah ada).
9. Uji di ponsel nyata lewat URL HTTPS Vercel (suara, mikrofon, kamera, offline). Perbaiki apa yang gagal.

## Aturan yang tidak boleh dilanggar
**Keselamatan klinis**
- Ini skrining gejala, **bukan diagnosis**. Jangan pernah menulis "pasti sehat", "bebas penyakit", atau saran dosis/obat.
- Tanda bahaya (merah) menghentikan pemeriksaan seketika. Jawaban penting "tidak yakin" atau pemeriksaan belum lengkap
  menghasilkan "data tidak cukup", **tidak pernah hijau**.
- Setiap alasan kuning/merah harus bisa ditelusuri ke pertanyaan dan jawaban. Tidak ada model AI generatif di jalur keputusan.
- Pertanyaan dan aturan di `tree.v1.ts` adalah contoh dan belum ditinjau tenaga kesehatan (`reviewStatus: "belum_ditinjau"`).
  Pertahankan label itu di layar dan di demo. Setiap perubahan pohon harus lolos `validateTree` dan tes.
- Aplikasi tidak bisa memastikan notifikasi diterima atau caregiver merespons. Jangan menulis seolah bisa.

**Privasi dan keamanan**
- Data simulasi harus berlabel simulasi. QR tidak berisi data kesehatan.
- Caregiver hanya melihat hasil bila hubungan aktif dan lansia mengizinkan berbagi hasil. Semua lewat RLS, bukan filter di klien.
- Jangan commit `.env.local` atau kunci apa pun. Hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Hasil dihitung di klien lalu disimpan (keterbatasan yang diakui di docs/SETUP.md). Jangan klaim sudah divalidasi server.

**Aksesibilitas dan desain** (hasil ukur dan alasan ada di komentar atas `src/app/globals.css`)
- Antarmuka lansia: huruf besar, tombol minimal 60px, satu tindakan utama per layar, tombol selalu jadi jalur utama; suara hanya tambahan.
- Status selalu bentuk **dan** kata, tidak hanya warna. Kontras teks minimal 7:1, tanda grafis minimal 3:1.
- Pakai token dan kelas yang sudah ada (`--s1`..`--s7`, `.btn`, `.panel`, dll). Jangan menambah nilai jarak atau warna acak.
- Hindari tampilan generik buatan AI: gradien, glassmorphism, bayangan berlebih, animasi hiasan, ikon hiasan di semua judul,
  kartu fitur tiga serangkai, emoji di judul, em dash di teks antarmuka, kalimat pola "ini bukan X, ini Y".
  Beri alasan desain untuk pilihan font, warna, dan komponen baru.

## Hal yang sering menjebak
- Cache Components menjaga halaman sebelumnya tetap ter-mount tersembunyi. Di tes browser pakai `h1:visible`.
- `favicon.ico` dan ikon harus PNG berformat RGBA, kalau tidak build Turbopack gagal.
- Jangan `pkill -f "next start"` (bisa mematikan shell sendiri); matikan lewat PID.
- Pengenalan suara di browser mengirim audio ke layanan pengenalan milik browser. Jangan klaim "diproses di perangkat".
- Tes browser (Playwright + axe) sebelumnya dijalankan di luar repo dan tidak ikut template. Bila perlu, buat ulang
  untuk alur baru (QR, login, riwayat) dan jalankan terhadap build produksi.

## Penggunaan AI (wajib diungkap saat submit)
Kode, tes, dan dokumen disusun dengan bantuan Claude (Anthropic), ditinjau dan dijalankan oleh tim.
Aplikasi tidak memakai AI generatif untuk menentukan pertanyaan atau hasil. Jaga pernyataan ini tetap benar.
