# Setup: yang perlu Anda lakukan sendiri

Ada tiga hal yang tidak bisa dikerjakan dari luar: membuat proyek Supabase, mengisi
kunci di Vercel, dan mencoba di ponsel. Semuanya gratis dan sekitar 20 menit.

## 1. Jalankan di laptop (tanpa Supabase)

```bash
cd ~/projects/eldervital
nvm use
npm install
npm run dev
```

Buka http://localhost:3000. Kalau halaman muncul, template sudah benar.

## 2. Buat proyek Supabase

1. Masuk ke https://supabase.com, **New project**. Pilih region terdekat (Singapore).
   Simpan password database di tempat aman.
2. **Authentication > Sign In / Providers**: nyalakan **Allow anonymous sign-ins**
   (dipakai perangkat lansia agar tidak perlu email). Provider **Email** tetap aktif
   untuk caregiver. Untuk demo, matikan "Confirm email" agar pendaftaran caregiver
   tidak menunggu surel.
3. **SQL Editor > New query**: jalankan setiap berkas di `supabase/migrations/` **berurutan**
   (`0001_init.sql`, `0002_help_request_transitions.sql`, `0003_security_hardening.sql`):
   tempel isinya, klik **Run**, harus muncul "Success". 0002 dan 0003 aman dijalankan ulang.
   Merge ke `main` hanya mengubah kode; database tidak ikut berubah kecuali migrasi dijalankan.
   Cara memastikan 0003 sudah berlaku ada di `docs/SECURITY.md`.
4. **Project Settings > API Keys**: salin **Project URL** dan **Publishable key**.
   Jangan pernah memakai `service_role` / secret key di aplikasi.

## 3. Isi variabel lingkungan

Lokal:

```bash
cp .env.example .env.local
# edit .env.local, isi dua nilai dari langkah 2.4
```

Vercel: **Project > Settings > Environment Variables**, tambah
`NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, lalu redeploy
(nilai `NEXT_PUBLIC_*` dibaca saat build).

## 4. Deploy ke Vercel

1. https://vercel.com > **Add New > Project** > impor repo `Zenn-Web/eldervital`.
2. Framework terdeteksi Next.js. Klik **Deploy**.
3. Setiap `git push` ke `main` otomatis deploy; branch lain mendapat URL pratinjau.

## 5. Uji di ponsel (wajib sebelum demo)

Buka URL Vercel (HTTPS) di ponsel nyata, bukan emulator:

- [ ] Suara pertanyaan terdengar (TTS bahasa Indonesia ada di ponsel Anda?)
- [ ] "Jawab dengan suara" meminta izin mikrofon dan mengenali "ya" / "tidak" / "tidak yakin"
- [ ] Tombol tetap bisa dipakai bila suara gagal
- [ ] Tambah ke layar utama (Add to Home Screen), buka, lalu matikan internet: halaman offline muncul
- [ ] Teks terbaca nyaman di luar ruangan dan dengan ukuran huruf sistem diperbesar

## Batasan yang perlu Anda tahu

- Hasil skrining dihitung di perangkat lalu disimpan. Sejak migrasi 0003, database menolak
  payload yang bentuknya tidak sah atau tidak konsisten (lihat `docs/SECURITY.md`), tetapi
  klien yang dimodifikasi masih bisa menyimpan hasil yang konsisten namun tidak sesuai
  jawaban. Untuk produksi, hitung ulang di server.
- Bila lansia menghapus data browser, sesi anonimnya hilang dan profil tidak bisa
  dipulihkan tanpa penghubungan ulang (spesifikasi bagian 5.3).
- Konten klinis di `tree.v1.ts` harus ditinjau tenaga kesehatan sebelum dipakai nyata.
  Di demo, sebut jelas bahwa itu contoh.

## Menguji keamanan database tanpa Supabase

```bash
npm test
```

Tes di `supabase/tests/` menjalankan migrasi yang sama di PostgreSQL (PGlite) dan memeriksa,
antara lain: peran tanpa login tidak bisa membaca apa pun, token QR hanya sekali pakai dan
kedaluwarsa 10 menit, caregiver tidak melihat hasil tanpa izin lansia, dan memutus
hubungan langsung menutup akses.
