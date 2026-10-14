# Task 1: Instalasi & Konfigurasi Tailwind CSS serta PostCSS

## Files:
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Modify: `package.json`
- Modify: `src/app/globals.css`

## Global Constraints:
- Semua warna, jarak, dan radius harus menggunakan token semantik terpusat (tidak boleh ada hex hardcoded acak di komponen).
- Tombol aksi untuk lansia wajib memiliki tinggi minimal `3.75rem` (60px) dan area sentuh tidak kurang dari 48px untuk mode umum.
- Status hasil tidak boleh hanya mengandalkan warna; wajib memadukan warna dengan bentuk geometris (`StatusMark`: lingkaran = hijau, belah ketupat = kuning, segi delapan = merah, kotak = netral).
- Kontras teks dengan latar belakang wajib memenuhi standar minimal WCAG AAA (7:1 untuk teks normal).
- Seluruh 81 tes vitest yang sudah ada wajib tetap hijau (passing).
- Ingat bahwa di PowerShell Windows, gunakan `npm.cmd` dan bukan `npm`.

## Step 1: Install dependensi
Jalankan di shell:
```bash
npm.cmd install -D tailwindcss@^3.4.17 postcss autoprefixer
npm.cmd install clsx tailwind-merge
```

## Step 2: Buat `postcss.config.mjs`
```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

## Step 3: Buat `tailwind.config.ts`
Pastikan menyertakan warna ElderVital P0:
- `paper`: "var(--paper)" (#F5EEE1)
- `surface`: "var(--surface)" (#FFFBF4)
- `ink`: "var(--ink)" (#1D2433)
- `ink-soft`: "var(--ink-soft)" (#5E6472)
- `line`: "var(--line)" (#DDD2BF)
- `primary`: "var(--primary)" (#2B3A6B)
- `primary-strong`: "var(--primary-strong)" (#1C284E)
- `sogan`: "var(--sogan)" (#9A5B2E)
- status ok, warn, alert, none
- Spacing: s1 sampai s7, tap (3.75rem / 60px), tap-standard (3rem / 48px)
- Font: sans ("var(--font-sans)"), serif ("var(--font-serif)")

## Step 4: Update `src/app/globals.css`
Tambahkan di paling atas file:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
Pastikan token `:root` diperbarui selaras dengan warna ElderVital P0 (kertas `#F5EEE1`, permukaan `#FFFBF4`, tinta `#1D2433`, primary `#2B3A6B`, sogan `#9A5B2E`, garis `#DDD2BF`). Pertahankan kelas-kelas CSS yang sudah ada seperti `.btn`, `.btn-primary`, `.status`, dll agar tidak merusak halaman dan tes eksisting.

## Step 5: Verifikasi
Jalankan pengujian:
```bash
npm.cmd test
```
Pastikan seluruh 81 tes tetap PASS.

## Commit
Commit perubahan dengan pesan:
```bash
git add postcss.config.mjs tailwind.config.ts src/app/globals.css package.json package-lock.json
git commit -m "feat(modul-0): install and configure tailwind css and elder design tokens"
```
