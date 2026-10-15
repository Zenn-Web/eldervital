# ElderVital — Product Flow & MVP Specification

> **Status:** Draft spesifikasi MVP untuk prototipe hackathon  
> **Konsep:** Adaptive Symptom Screening & Caregiver Assistance  
> **Target pengguna:** Orang berusia 50–65 tahun, terutama pralansia dan lansia awal, beserta caregiver mereka  
> **Batasan penting:** ElderVital adalah aplikasi skrining gejala, bukan alat diagnosis medis.

---

## 1. Ringkasan Produk

ElderVital membantu pengguna berusia 50–65 tahun melakukan pemeriksaan gejala secara rutin melalui pertanyaan adaptif. Pemeriksaan dapat dilakukan secara mandiri melalui antarmuka suara atau dengan bantuan caregiver. Setelah pemeriksaan selesai, aplikasi menampilkan hasil skrining, ringkasan jawaban, dan rekomendasi tindakan umum sesuai aturan yang telah ditetapkan.

### Masalah yang ingin diselesaikan

Pemeriksaan kondisi harian dapat terasa sulit bagi pengguna yang tidak nyaman menggunakan aplikasi kesehatan. Pada saat yang sama, caregiver tidak selalu berada di dekat mereka untuk menanyakan kondisi secara rutin.

### Solusi

ElderVital menyediakan:
1. Dua mode penggunaan: **cek mandiri** dan **cek dengan bantuan caregiver**.
2. Pertanyaan adaptif yang menyesuaikan jawaban sebelumnya.
3. Antarmuka suara untuk membantu pengguna yang kesulitan membaca atau mengetik.
4. Status hasil skrining yang mudah dipahami: hijau, kuning, atau merah.
5. Ringkasan hasil dan rekomendasi tindakan yang mudah dipahami pengguna maupun caregiver.
6. Riwayat pemeriksaan untuk caregiver.

### Proposisi nilai

> **ElderVital membuat pemeriksaan gejala harian lebih mudah dilakukan, baik secara mandiri maupun dengan pendampingan caregiver, melalui pertanyaan adaptif dan hasil skrining yang mudah dipahami.**

Kebaruan produk ini masih merupakan hipotesis yang perlu diuji melalui perbandingan dengan symptom checker dan aplikasi caregiver lain. Jangan menyatakan bahwa tidak ada produk lain yang memiliki fitur serupa tanpa audit kompetitor yang memadai.

---

## 2. Batasan dan Prinsip Keselamatan

- ElderVital memberikan **hasil skrining gejala**, bukan diagnosis.
- Status hijau tidak berarti pengguna pasti sehat atau bebas penyakit.
- Rekomendasi harus berasal dari aturan yang transparan dan ditinjau secara memadai, bukan tebakan AI.
- Tanda bahaya yang telah ditentukan harus dapat memicu arahan pertolongan segera tanpa menunggu seluruh pertanyaan selesai.
- Jangan menyarankan perubahan dosis obat atau mengganti arahan tenaga kesehatan.
- Data yang tidak diketahui harus ditandai sebagai belum diketahui, bukan diisi dengan asumsi.
- Jawaban suara harus dapat dikonfirmasi dan diperbaiki pengguna jika pengenalan suara keliru.
- Informasi pemeriksaan hanya dibagikan kepada caregiver yang telah terhubung dan mendapat izin.
- Aplikasi tidak boleh menjanjikan bahwa notifikasi pasti diterima, caregiver pasti merespons, atau bantuan pasti datang.
- Pengguna yang mengalami keadaan darurat tidak boleh diarahkan untuk menunggu pemeriksaan rutin berikutnya.

---

## 3. Peran Pengguna

### 3.1 Lansia / pengguna yang diperiksa

Profil lansia tidak memerlukan email dan password pada konsep MVP ini. Lansia dapat memulai pemeriksaan mandiri, meminta bantuan caregiver, menjawab pertanyaan, dan melihat hasil pemeriksaan.

**Kebutuhan UX:**
- Teks besar dan mudah dibaca.
- Kontras warna yang jelas.
- Tombol besar dengan label yang mudah dimengerti.
- Instruksi singkat dan tidak membingungkan.
- Dukungan suara, dengan opsi jawaban melalui tombol.
- Kemampuan mengulang pertanyaan, memperlambat suara, dan memperbaiki jawaban.

### 3.2 Caregiver

Caregiver membuat akun menggunakan:
- Nama
- Email
- Password

Caregiver dapat menerima permintaan pemeriksaan, membantu mencatat jawaban, melihat hasil skrining, dan mengakses riwayat pemeriksaan lansia yang terhubung.

---

## 4. Alur Utama Aplikasi

1. Pengguna membuka ElderVital.
2. Pengguna memilih peran: **Caregiver** atau **Lansia**.
3. Caregiver membuat akun; profil lansia dibuat tanpa kredensial login pada MVP.
4. Profil lansia dihubungkan dengan caregiver melalui QR.
5. Pengguna mengatur izin notifikasi dan jadwal pengingat pemeriksaan.
6. Setelah pengaturan selesai, pengguna diarahkan ke beranda.
7. Pada waktu yang dijadwalkan, lansia menerima pengingat pemeriksaan.
8. Lansia memilih salah satu:
   - **Cek mandiri**
   - **Minta caregiver**
9. Pemeriksaan berjalan melalui pertanyaan adaptif.
10. Aplikasi merangkum jawaban dan menampilkan hasil skrining.
11. Hasil, ringkasan, serta rekomendasi tindakan disimpan ke riwayat sesuai izin akses.

**Catatan implementasi:** sistem operasi umumnya mengharuskan pengguna mengetuk notifikasi untuk membuka aplikasi. Jangan mengandalkan aplikasi akan otomatis terbuka dari notifikasi.

---

## 5. Alur Registrasi dan Pairing QR

### 5.1 Registrasi caregiver

1. Pilih peran **Caregiver**.
2. Isi nama, email, dan password.
3. Verifikasi atau konfirmasi akun sesuai kemampuan MVP.
4. Masuk ke dashboard caregiver.
5. Pilih opsi **Hubungkan Lansia**.
6. Pindai QR yang ditampilkan pada perangkat/profil lansia.
7. Konfirmasi hubungan dan izin berbagi data.
8. Setelah berhasil, profil lansia muncul di dashboard caregiver.

### 5.2 Pembuatan profil lansia

1. Pilih peran **Lansia**.
2. Buat atau pilih profil lansia.
3. Isi informasi dasar minimum yang diperlukan.
4. Aplikasi menampilkan QR untuk dihubungkan ke caregiver.
5. Lansia menyetujui hubungan dengan caregiver yang akan menerima informasi pemeriksaan.
6. Setelah pairing berhasil, lansia masuk ke beranda dan dapat mengatur pengingat.

### 5.3 Keamanan QR

- QR harus berisi token penghubung sementara, bukan data kesehatan mentah.
- Token sebaiknya kedaluwarsa setelah waktu singkat atau setelah digunakan.
- Tampilkan nama caregiver yang akan terhubung sebelum konfirmasi.
- Sediakan kemampuan untuk memutus hubungan caregiver.
- Batasi data yang dibagikan sesuai persetujuan pengguna.
- Karena profil lansia tidak memakai akun pada MVP, jelaskan bahwa profil tersebut belum bisa dipulihkan secara mandiri ke perangkat lain tanpa proses penghubungan ulang.

---

## 6. Pengaturan Notifikasi dan Jadwal

### 6.1 Pengaturan awal

Setelah pairing, aplikasi meminta izin notifikasi dan memungkinkan pengguna memilih jadwal pemeriksaan.

**Default yang diusulkan:**
- Pagi
- Siang
- Malam

Jadwal harus dapat diubah. Frekuensi ini merupakan pengingat pemeriksaan, bukan klaim bahwa pengguna perlu menjalani pemeriksaan medis tiga kali sehari.

### 6.2 Perilaku notifikasi

- Notifikasi berisi ajakan melakukan pemeriksaan, bukan kesimpulan medis.
- Contoh: “Waktunya pemeriksaan kondisi hari ini. Mari mulai pemeriksaan singkat.”
- Jika lansia memilih **Minta caregiver**, caregiver menerima notifikasi permintaan bantuan.
- Jika notifikasi tidak terkirim atau tidak dibuka, jangan menyimpulkan bahwa kondisi pengguna aman maupun darurat.
- Jika implementasi MVP tidak mendukung push notification sungguhan, gunakan simulasi yang diberi label jelas saat demo.

---

## 7. Mode Pemeriksaan A — Cek Mandiri

1. Lansia mengetuk notifikasi atau tombol **Mulai Pemeriksaan**.
2. Aplikasi menjelaskan bahwa pemeriksaan singkat akan dimulai.
3. Pertanyaan dibacakan menggunakan text-to-speech (TTS).
4. Lansia menjawab menggunakan suara atau tombol pilihan.
5. Speech-to-text (STT) mengubah jawaban lisan menjadi teks.
6. Aplikasi menampilkan jawaban yang dikenali agar pengguna dapat mengonfirmasi atau memperbaikinya.
7. Sistem memilih pertanyaan berikutnya berdasarkan jawaban sebelumnya.
8. Pertanyaan obat rutin diajukan dan jawabannya dicatat.
9. Jika sebuah jawaban memenuhi aturan tanda bahaya yang telah ditetapkan, aplikasi segera menampilkan arahan pertolongan yang sesuai.
10. Setelah pemeriksaan selesai, aplikasi menampilkan status skrining, ringkasan jawaban, dan rekomendasi tindakan.
11. Hasil disimpan ke riwayat sesuai kebijakan penyimpanan data.

### Kebutuhan aksesibilitas

- Tombol **Ulangi Pertanyaan**.
- Pengaturan kecepatan suara.
- Pilihan untuk menjawab melalui tombol jika suara gagal.
- Konfirmasi jawaban sebelum lanjut.
- Bahasa yang sederhana dan tidak mengintimidasi.

---

## 8. Mode Pemeriksaan B — Minta Bantuan Caregiver

1. Lansia memilih **Minta caregiver**.
2. Aplikasi mengirim notifikasi kepada caregiver yang terhubung.
3. Caregiver membuka notifikasi dan masuk ke pemeriksaan yang diminta.
4. Aplikasi menampilkan pertanyaan yang perlu disampaikan kepada lansia.
5. Caregiver membacakan pertanyaan atau menyampaikannya secara langsung.
6. Caregiver mencatat jawaban yang benar-benar diberikan lansia, bukan menebaknya.
7. Aplikasi menyajikan pertanyaan berikutnya secara adaptif.
8. Pertanyaan tentang obat rutin tetap diberikan.
9. Jika ada jawaban yang memenuhi aturan tanda bahaya, aplikasi menampilkan arahan pertolongan yang sesuai.
10. Setelah selesai, hasil skrining ditampilkan kepada caregiver dan dapat diakses oleh lansia sesuai izin berbagi data.
11. Hasil disimpan ke riwayat.

**Batasan:** jika caregiver tidak sedang bersama lansia dan tidak dapat memastikan jawaban langsung, pemeriksaan tidak boleh ditampilkan seolah-olah telah selesai berdasarkan perkiraan caregiver.

---

## 9. Pertanyaan Adaptif dan Decision Tree

Pertanyaan adaptif harus dirancang sebagai decision tree yang terstruktur. Untuk MVP, gunakan aturan yang eksplisit dan dapat diuji, bukan membiarkan AI generatif membuat pertanyaan medis dan keputusan urgensi tanpa batasan.

### Contoh alur batuk

**Pertanyaan awal:** “Apakah hari ini Anda mengalami batuk?”

- **Jika Ya:**
  1. Sejak kapan batuk berlangsung?
  2. Seberapa sering batuk terjadi?
  3. Apakah batuk disertai gejala lain yang relevan?
  4. Jika jawaban mengindikasikan tanda bahaya yang telah ditentukan, hentikan alur biasa dan tampilkan arahan pertolongan yang sesuai.
- **Jika Tidak:**
  - Lewati pertanyaan lanjutan tentang batuk dan lanjutkan ke topik berikutnya.

### Pertanyaan tentang obat

**Pertanyaan wajib:** “Apakah Anda sudah minum obat rutin sesuai jadwal hari ini?”

- **Jika Ya:** tanyakan nama obat jika pengguna mengetahuinya; input dapat berupa teks.
- **Jika Tidak:** catat jawaban tanpa menyarankan dosis tambahan atau perubahan jadwal obat.
- Jika nama obat tidak diketahui, simpan sebagai “belum diketahui”, jangan menebak.

### Ketentuan desain pertanyaan

- Pertanyaan harus singkat dan satu per satu.
- Jawaban harus memiliki pilihan yang mudah dimengerti.
- Untuk jawaban teks/suara, sediakan konfirmasi dan koreksi.
- Pertanyaan lanjutan hanya ditampilkan jika relevan.
- Pertanyaan dan aturan keselamatan klinis harus ditinjau oleh tenaga kesehatan sebelum dipakai untuk penggunaan nyata.
- Contoh di dokumen ini menggambarkan UX, bukan instrumen skrining medis yang tervalidasi.

---

## 10. Status Hasil Skrining

Status warna membantu pengguna memahami tingkat perhatian, tetapi tidak boleh dianggap sebagai diagnosis.

### Hijau — Tidak ada pemicu perhatian yang teridentifikasi

- Tampilkan ringkasan jawaban.
- Tampilkan jadwal pemeriksaan berikutnya.
- Jelaskan bahwa hasil ini hanya menggambarkan jawaban pada pemeriksaan saat ini.
- Jangan menyatakan “pasti sehat” atau “tidak ada penyakit”.

### Kuning — Perlu diperhatikan

- Jelaskan gejala atau jawaban yang memicu perhatian.
- Tampilkan pertanyaan atau informasi yang menjadi dasar hasil.
- Sarankan pengguna memantau keluhan atau berkonsultasi dengan tenaga kesehatan sesuai konteks gejala.
- Hindari membuat diagnosis dari satu jawaban.

### Merah — Perlu pertolongan segera

- Jelaskan tanda bahaya yang teridentifikasi dari jawaban pengguna.
- Tampilkan langkah pertolongan yang telah ditentukan dan divalidasi.
- Arahkan pengguna untuk menghubungi layanan medis atau layanan darurat yang sesuai bila aturan tanda bahaya terpenuhi.
- Jangan menunggu pemeriksaan selesai jika jawaban awal sudah menunjukkan tanda bahaya.
- Jangan menghasilkan status merah hanya karena model AI menilai jawaban “terdengar mengkhawatirkan”; aturan harus eksplisit dan tervalidasi.

### Data tidak cukup

Selain tiga status di atas, sistem perlu menangani keadaan ketika jawaban tidak lengkap atau tidak dipahami:
- Minta pengguna mengulang atau memperbaiki jawaban.
- Tampilkan “Pemeriksaan belum selesai” bila diperlukan.
- Jangan memaksa hasil hijau ketika data tidak cukup.

---

## 11. Struktur Halaman dan Navigasi

### 11.1 Lansia

Antarmuka lansia dibuat minimalis dengan teks besar, kontras tinggi, tombol besar, dan instruksi singkat.

**Navigasi utama yang disarankan:**
- **Home / Beranda** — satu-satunya tab navigasi bawah.
- **Hasil pemeriksaan** — dibuka sebagai halaman lanjutan dari beranda, bukan tab permanen.
- **Pemeriksaan aktif** — layar alur pertanyaan.
- **Pengaturan sederhana** — jadwal pengingat, aksesibilitas, dan informasi caregiver yang terhubung.

Jika tim menginginkan navigasi bawah yang hanya memiliki satu item, pertahankan satu tab **Home** saja.

### 11.2 Caregiver

Dashboard menjadi halaman default setelah login.

**Navigasi:**

1. **Beranda / Dashboard**
   - Status pemeriksaan terakhir.
   - Permintaan bantuan yang belum ditangani.
   - Ringkasan lansia yang terhubung.
   - Akses cepat untuk melihat hasil terakhir.
2. **Activity / Riwayat**
   - Daftar pemeriksaan terdahulu.
   - Waktu pemeriksaan.
   - Mode pemeriksaan: mandiri atau caregiver.
   - Jawaban, status hasil, dan rekomendasi yang diberikan.
3. **About**
   - Tujuan ElderVital.
   - Batasan skrining dan pernyataan bahwa aplikasi bukan alat diagnosis.
4. **Settings**
   - Profil caregiver.
   - Pengaturan notifikasi.
   - Profil dan relasi lansia.
   - Izin berbagi data.
   - Logout.

Logout ditempatkan di Settings, bukan sebagai tab navigasi terpisah.

---

## 12. Data Minimum yang Dibutuhkan

### Profil caregiver

- ID caregiver
- Nama
- Email
- Kredensial autentikasi (password tidak boleh disimpan sebagai teks biasa)
- Pengaturan notifikasi

### Profil lansia

- ID profil lansia
- Nama atau nama panggilan
- Rentang usia/tanggal lahir jika memang diperlukan
- Informasi dasar yang disetujui pengguna
- Caregiver yang terhubung
- Jadwal pemeriksaan

### Data pemeriksaan

- ID pemeriksaan
- ID profil lansia
- ID caregiver bila pemeriksaan dibantu
- Waktu mulai dan selesai
- Mode pemeriksaan
- Versi decision tree/kuesioner
- Jawaban dan sumber jawaban (lansia atau caregiver)
- Hasil skrining
- Alasan yang memicu hasil
- Rekomendasi yang ditampilkan
- Status pemeriksaan: selesai, belum selesai, atau terhenti

### Privasi

- Batasi akses caregiver pada profil lansia yang telah terhubung dan menyetujui berbagi data.
- Jangan menaruh data kesehatan pada QR.
- Hindari mengumpulkan informasi yang tidak diperlukan untuk MVP.
- Tentukan masa simpan data dan cara menghapus atau memutus akses.
- Sediakan penjelasan sederhana tentang data apa yang disimpan dan siapa yang dapat melihatnya.

---

## 13. Fitur yang Masuk MVP dan yang Ditunda

### Prioritas MVP

1. Pilihan peran caregiver dan lansia.
2. Registrasi caregiver dan pembuatan profil lansia.
3. Pairing QR.
4. Pengaturan jadwal pengingat dan izin notifikasi.
5. Pemeriksaan mandiri dengan TTS/STT atau simulasi terkontrol.
6. Pemeriksaan dengan caregiver.
7. Pertanyaan adaptif berbasis decision tree.
8. Pertanyaan tentang obat rutin.
9. Hasil skrining hijau/kuning/merah beserta alasan dan arahan.
10. Dashboard dan riwayat caregiver.
11. Penyimpanan hasil pemeriksaan.

### Dapat disederhanakan untuk demo

- Jika STT/TTS belum stabil, gunakan sampel pertanyaan yang dibacakan dan tombol jawaban, lalu demonstrasikan mode suara secara terpisah.
- Jika push notification belum selesai, tampilkan simulasi notifikasi yang diberi label jelas.
- Jika QR tidak sempat memakai backend penuh, buat alur prototipe dengan token dummy; jangan menyebutnya aman atau siap produksi.
- Batasi decision tree ke satu atau dua kelompok gejala agar alur dapat diselesaikan dan diuji.

### Di luar scope MVP

- Integrasi smartwatch.
- Diagnosis penyakit.
- Prediksi penyakit dengan machine learning.
- Peresepan, dosis, atau perubahan obat.
- Deteksi otomatis semua kondisi darurat.
- Pemantauan medis real-time.
- Integrasi rekam medis rumah sakit.
- Dukungan banyak bahasa sebelum satu bahasa berfungsi baik.
- Chatbot kesehatan bebas tanpa batasan.

---

## 14. Skenario Demo yang Direkomendasikan

### Skenario utama: lansia melakukan pemeriksaan mandiri

1. Lansia membuka beranda.
2. Pengingat pemeriksaan muncul.
3. Lansia memilih **Cek Mandiri**.
4. Aplikasi membacakan pertanyaan awal.
5. Lansia menjawab “Ya” untuk batuk.
6. Aplikasi menanyakan durasi dan gejala terkait.
7. Aplikasi menanyakan obat rutin.
8. Lansia mengonfirmasi jawaban.
9. Aplikasi menampilkan hasil skrining yang sesuai dengan aturan demo.
10. Aplikasi menjelaskan alasan hasil berdasarkan jawaban yang tercatat.
11. Hasil tersimpan di riwayat caregiver.

### Skenario kedua: lansia meminta bantuan caregiver

1. Lansia memilih **Minta Caregiver**.
2. Caregiver menerima notifikasi.
3. Caregiver membuka pertanyaan dan menyampaikannya kepada lansia.
4. Jawaban dicatat.
5. Pertanyaan lanjutan muncul sesuai cabang jawaban.
6. Hasil tampil dan tersimpan dalam riwayat.

Gunakan data skenario simulasi yang secara jelas diberi label untuk presentasi. Jangan mendemonstrasikan hasil sebagai keputusan klinis yang telah divalidasi jika belum melalui proses validasi.

---

## 15. Pembagian Kerja Tim

| Peran | Fokus |
|---|---|
| **Tech Lead** | Struktur aplikasi, autentikasi caregiver, pairing QR, penyimpanan hasil, dan implementasi decision tree. |
| **UI/UX Lead** | Dua alur peran, aksesibilitas lansia, layar pemeriksaan, hasil, dashboard caregiver, dan riwayat. |
| **Idea Lead** | Rumusan masalah, definisi scope, audit kompetitor, perumusan hipotesis novelty, dan batasan klaim. |
| **Pitch Lead** | Alur presentasi, narasi problem–solution, demo utama, batasan produk, dan dampak yang ingin diuji. |

---

## 16. Hipotesis Novelty yang Perlu Diuji

Rumusan sementara:

> **ElderVital menggabungkan pemeriksaan gejala adaptif dalam dua mode—mandiri berbasis suara dan dengan bantuan caregiver—dengan hasil skrining yang mudah dipahami oleh pengguna berusia 50–65 tahun.**

Pembeda yang layak dievaluasi:
- Pertanyaan lanjutan hanya muncul berdasarkan jawaban yang relevan.
- Alur mandiri dirancang untuk pengguna yang tidak nyaman membaca atau mengetik.
- Caregiver dapat memandu pemeriksaan memakai decision tree yang sama.
- Ringkasan hasil menjelaskan jawaban yang mendasari status dan rekomendasi.

Ini adalah hipotesis diferensiasi, bukan klaim novelty absolut. Audit kompetitor perlu mencakup symptom checker, aplikasi pemeriksaan berbasis suara, dan aplikasi caregiver.

---

## 17. Checklist Sebelum Demo

- [ ] Caregiver dapat mendaftar dan login.
- [ ] Profil lansia dapat dibuat.
- [ ] QR dapat menghubungkan caregiver dengan profil lansia.
- [ ] Izin dan pengaturan notifikasi dapat dijelaskan dengan jelas.
- [ ] Jadwal default pagi, siang, malam terlihat dan dapat diubah.
- [ ] Pemeriksaan mandiri berfungsi.
- [ ] Pemeriksaan caregiver berfungsi.
- [ ] Cabang pertanyaan adaptif menghasilkan alur yang benar.
- [ ] Pertanyaan obat rutin tersedia.
- [ ] Pengguna dapat memperbaiki jawaban yang salah.
- [ ] Status skrining mempunyai alasan yang dapat ditelusuri.
- [ ] Aturan tanda bahaya tidak membuat pengguna menunggu sampai semua pertanyaan selesai.
- [ ] Pemeriksaan tidak lengkap tidak otomatis menjadi hijau.
- [ ] Hasil tersimpan dan terlihat di riwayat caregiver.
- [ ] Akses data hanya tersedia untuk caregiver yang terhubung dan diizinkan.
- [ ] Data simulasi diberi label sebagai simulasi.
- [ ] Presentasi tidak menyebut hasil skrining sebagai diagnosis.

---

## Ringkasan Keputusan

**ElderVital MVP terdiri dari empat blok inti:**

1. **Dual-role setup & QR pairing** — menghubungkan profil lansia dengan caregiver.
2. **Scheduled reminders** — mengingatkan pemeriksaan sesuai jadwal pilihan pengguna.
3. **Adaptive symptom screening** — pemeriksaan mandiri berbasis suara atau pemeriksaan yang didampingi caregiver.
4. **Screening result & history** — menampilkan status, alasan, rekomendasi umum, dan riwayat pemeriksaan.

Fokus implementasi adalah satu alur yang benar-benar berfungsi: **pengingat → pemeriksaan adaptif → hasil dan rekomendasi → riwayat**. Utamakan aksesibilitas, transparansi alasan hasil, izin berbagi data, dan batasan keselamatan medis daripada memperbanyak fitur.
