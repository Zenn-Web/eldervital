# Cara kerja Git tim ElderVital

Panduan singkat supaya tidak ragu saat menggabung (merge) pekerjaan. Repo:
https://github.com/Zenn-Web/eldervital

## Kamus singkat

Bayangkan proyek ini buku yang ditulis bersama.

| Istilah | Artinya |
|---|---|
| commit | Menyimpan satu revisi beserta catatan apa yang diubah |
| branch | Salinan kerja. `main` = buku resmi; branch lain = draf masing-masing |
| push | Mengirim revisi dari laptop ke GitHub |
| pull | Mengambil revisi terbaru dari GitHub ke laptop |
| merge | Menyatukan isi satu branch ke branch lain |
| PR (pull request) | Halaman di GitHub untuk meninjau lalu menggabung satu branch ke `main` |
| ahead / behind | Laptop punya revisi yang belum dikirim / ketinggalan dari GitHub |

## Branch yang dipakai

| Branch | Isi | Pemilik |
|---|---|---|
| `main` | Versi resmi. Setiap push ke `main` otomatis di-deploy Vercel | Tech lead yang menggabung |
| `ZenBE` | Backend: `src/lib/**`, `supabase/**` | Tech lead |
| `h8naf1` | Frontend: `src/components/**`, `src/app/**`, `src/modules/**`, `globals.css` | Frontend |

Bila mengubah berkas di wilayah orang lain, kabari dulu.

## Tiga aturan

1. **Tidak ada yang bekerja langsung di `main`.** `main` hanya bertambah lewat merge.
2. **Arah merge selalu ke `main`.** Branch kerja masuk ke `main`, lalu semua orang menarik
   `main` ke branch-nya. Jangan menggabung branch kerja satu sama lain (mis. `h8naf1` ke `ZenBE`).
3. **Pakai satu jalan: PR di GitHub.** Perubahan terlihat jelas, tanpa editor di terminal,
   dan ada catatan untuk tim.

## Resep merge ke `main`

### Sebelum merge

1. Pemilik branch memastikan branch-nya sudah di-push dan lulus di laptopnya:
   ```bash
   npm run check && npm run build
   ```
2. Uji hasil gabungan tanpa mengubah apa pun (satu hash di keluaran = tanpa konflik):
   ```bash
   git fetch origin
   git merge-tree --write-tree --name-only origin/main origin/<branch>
   ```
   Konflik makna (kode yang tergabung bersih tapi tidak cocok, mis. nama fungsi berubah)
   tidak terdeteksi perintah ini. Untuk itu, minta Claude "cek branch X sebelum merge ke main":
   gabungan diuji di folder sementara dengan tes dan build.

### Merge di GitHub

1. Tab **Pull requests** > **New pull request**.
2. Pastikan **base: `main`** (tujuan) dan **compare: branch kerja** (asal).
3. Buka **Files changed**: pastikan isinya masuk akal, tidak ada `.env.local`, kunci, atau
   folder catatan alat (mis. `.superpowers/`).
4. Pastikan **Able to merge**. Klik **Create pull request** > **Merge pull request** > **Confirm merge**.
5. Jangan klik **Delete branch** bila branch itu masih dipakai.

### Setelah merge (setiap orang, di laptopnya)

```bash
git switch main && git pull
git switch <branch-sendiri> && git merge main && git push
```

## Yang aman diabaikan

- Tombol kuning **Compare & pull request** di GitHub hanya saran otomatis setiap ada branch
  yang baru menerima commit. Tidak terjadi apa-apa sampai **Create pull request** ditekan.
- PR yang isinya sudah ada di `main`: tutup saja (**Close pull request**), atau merge. Keduanya aman.

## Kalau ragu: lihat dulu

Perintah berikut hanya melihat, tidak mengubah apa pun.

```bash
git status                        # sedang di branch mana? ada yang belum disimpan?
git branch -vv                    # branch mana yang ahead/behind dari GitHub?
git log --oneline --graph -10     # riwayat revisi dalam bentuk cabang
```

## Kalau keliru

| Situasi | Perbaikan |
|---|---|
| Merge di laptop berhenti karena konflik dan belum selesai | `git merge --abort` |
| Muncul editor nano saat merge | Simpan pesan bawaan: Ctrl+O, Enter, Ctrl+X. Membatalkan: kosongkan pesan lalu simpan, lalu `git merge --abort` |
| Merge di laptop sudah jadi tetapi belum di-push | `git reset --hard origin/main` (kembali ke versi GitHub) |
| Lockfile berubah sendiri setelah `npm install` di `main` | `git restore package-lock.json`. Untuk sekadar memasang dependensi, pakai `npm ci` |
| Sudah di-push ke `main` dan ternyata salah | Jangan pakai `--force`. Buat revisi pembatalan: `git revert <hash-commit>` lalu push |

## Kebiasaan baik

- Commit kecil dan sering, dengan pesan yang menjelaskan apa dan kenapa.
- Sebelum mulai bekerja: tarik `main` ke branch sendiri.
- Kabari tim sebelum menambah paket npm (`package.json` dan `package-lock.json` paling sering konflik).
- Jangan pernah commit `.env.local` atau kunci apa pun (sudah diabaikan `.gitignore`).
