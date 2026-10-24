# Keamanan ElderVital

Ringkasan langkah keamanan, keterbatasan yang diakui, dan cara memeriksanya. Dipetakan ke
[OWASP Top 10:2021](https://owasp.org/Top10/). ElderVital adalah prototipe hackathon untuk
skrining gejala, **bukan** sistem yang sudah diaudit atau siap produksi.

## Prinsip

- Batas keamanan ada di **database** (Row Level Security dan fungsi RPC), bukan di tampilan.
  Klien hanya memakai kunci publishable; kunci itu memang boleh publik.
- Tidak ada `service_role` atau kunci rahasia di kode, di repo, maupun di Vercel.
- Setiap perubahan migrasi wajib lolos tes RLS di `supabase/tests/policies.test.ts`
  (PostgreSQL asli lewat PGlite).

## Langkah yang sudah diterapkan

| OWASP | Risiko | Penanganan | Bukti |
|---|---|---|---|
| A01 Broken Access Control | Caregiver membaca data lansia tanpa izin | RLS di semua tabel. Hasil hanya terlihat bila hubungan **aktif** dan lansia mengizinkan berbagi. Catatan mode caregiver hanya terlihat oleh pencatatnya selama hubungan masih aktif (migrasi 0003). | Tes "pengetatan keamanan (migrasi 0003)" dan "uji keamanan dan validasi" |
| A01 | Pairing QR disalahgunakan | Token acak, server hanya menyimpan hash SHA-256, berlaku 10 menit, sekali pakai, tetap butuh persetujuan lansia | Tes "pairing QR" |
| A02 Cryptographic Failures | Jawaban pemeriksaan tertinggal di perangkat | Antrean offline dibuang saat caregiver keluar, dan entri milik akun lain dibuang sebelum mengirim. **localStorage tidak terenkripsi.** | `src/lib/exam/outbox.test.ts`, `src/lib/auth/caregiver.test.ts` |
| A03 Injection | SQL injection | Semua akses lewat query builder Supabase dan RPC berparameter; tidak ada SQL yang dirakit dari teks pengguna. Tidak ada `dangerouslySetInnerHTML`, `eval`, atau `innerHTML`. | Tinjauan kode |
| A04/A08 Integritas data | Klien yang dimodifikasi mengirim payload palsu | `save_examination` menolak payload yang bentuk, ukuran, atau konsistensinya tidak sah, sebelum menyentuh tabel, dalam satu transaksi (lihat bagian berikut). | Tes "ditolak dan tidak meninggalkan data" |
| A05 Security Misconfiguration | Clickjacking, sumber skrip liar | CSP (`frame-ancestors 'none'`, `object-src 'none'`, `connect-src` hanya situs sendiri dan proyek Supabase), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. HSTS dipasang Vercel. | `src/lib/security/headers.test.ts` |
| A06 Vulnerable Components | Celah di dependensi | Next.js dinaikkan ke 16.4.3 (patch untuk advisori kritis di 16.0.0 sampai 16.4.0). Dependensi produksi: 0 celah. | Bagian "Audit dependensi" |
| A07 Identification and Authentication | Pengambilalihan akun | Supabase Auth. Caregiver: email dan password atau Google. Perangkat lansia: sesi anonim; database menolak sesi anonim menjadi caregiver. | Tes "sesi anonim tidak bisa mendaftar sebagai caregiver" |

## Validasi `save_examination` (migrasi 0003)

Database menolak, dengan pesan berbahasa Indonesia dan tanpa menyimpan apa pun, bila:

- mode, status, atau status hasil di luar nilai yang sah;
- pasangan `tree_id`/`tree_version` tidak dikenal (daftar di migrasi; setiap versi baru
  `tree.v1.ts` wajib ditambahkan lewat migrasi baru);
- jawaban, alasan, atau tindakan bukan daftar, atau melebihi 30, 20, dan 10 butir;
- isi jawaban kosong atau lebih dari 200 huruf, teks alasan atau tindakan lebih dari 500 huruf,
  atau `question_id` mengandung karakter selain huruf kecil, angka, dan garis bawah;
- sumber jawaban tidak sesuai mode (Cek Mandiri dijawab lansia, mode caregiver dijawab caregiver);
- waktu tidak masuk akal (selesai sebelum mulai, mulai lebih dari sehari di masa depan);
- hasil tidak konsisten dengan aturan mesin keputusan: hijau padahal belum selesai atau ada
  alasan, merah tanpa alasan merah, kuning tanpa alasan kuning, terhenti tetapi bukan merah,
  atau alasan menunjuk ke pertanyaan yang tidak dijawab.

**Batasan yang diakui.** Hasil skrining tetap **dihitung di perangkat**. Validasi di atas
menjamin bentuk dan konsistensi, bukan kebenaran hasil terhadap pohon keputusan. Klien yang
dimodifikasi masih bisa mengirim hasil yang konsisten tetapi tidak sesuai jawabannya. Label
`is_simulated` juga berasal dari klien. Hasil yang tersimpan **belum tervalidasi server**.

## Memastikan migrasi 0003 sudah berlaku di Supabase

Merge ke `main` hanya mengubah kode. Database berubah setelah migrasi dijalankan di SQL Editor
(lihat `docs/SETUP.md`). Untuk memeriksa:

```sql
select pg_get_expr(polqual, polrelid) as aturan
from pg_policy where polname = 'examinations_select';
```

Hasil yang benar mengandung `is_linked_caregiver`. Bila tidak, jalankan isi
`supabase/migrations/0003_security_hardening.sql` (aman dijalankan ulang).

## Audit dependensi (24 Oktober 2026)

| Perintah | Hasil |
|---|---|
| `npm audit --omit=dev` | 0 celah |
| `npm audit` | 3 celah moderat: `postcss-selector-parser` di rantai `tailwindcss` 3 / `postcss-nested` |

Ketiga celah moderat hanya ada di alat build (CSS dibuat saat build, tidak berjalan di
server atau browser pengguna). Perbaikannya menuntut Tailwind 4, perubahan besar yang
menyentuh seluruh gaya antarmuka. **Rekomendasi:** migrasi ke Tailwind 4 di branch terpisah
setelah hackathon, bersama tim frontend. Jangan memakai `npm audit fix --force`.

## Risiko yang masih tersisa

- **CSP masih memakai `'unsafe-inline'` untuk skrip.** CSP berbasis nonce mewajibkan setiap
  halaman dirender dinamis, padahal halaman kita statis dan disimpan service worker untuk mode
  offline. Risiko XSS tetap ditekan oleh React (teks selalu di-escape) dan tidak adanya HTML
  mentah di kode.
- **Data di perangkat tidak terenkripsi.** Antrean pemeriksaan yang belum terkirim, salinan
  profil (id dan nama panggilan), dan jadwal pengingat ada di localStorage. Antrean caregiver
  yang belum terkirim ikut terbuang saat caregiver keluar.
- **Hasil dihitung di klien** (lihat bagian validasi).
- **Akun anonim tidak terhapus otomatis.** Menghapus profil lansia menghapus seluruh datanya,
  tetapi akun anonim kosong tetap ada di Supabase Auth sampai dibersihkan lewat dashboard.
- **Pengenalan suara** dikirim ke layanan milik browser, bukan diproses di perangkat.
- **Log dan pemantauan terbatas** (OWASP A09): hanya log bawaan Vercel dan Supabase dengan
  masa simpan pendek di paket gratis; belum ada peringatan otomatis.
- Pertanyaan dan aturan skrining belum ditinjau tenaga kesehatan.

## Melaporkan celah

Repo ini publik. Jangan menulis detail celah di issue terbuka. Hubungi tim lewat
**Security > Report a vulnerability** di GitHub (bila diaktifkan pemilik repo) atau lewat
kontak tim di halaman submit hackathon.
