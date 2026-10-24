# Revisi Pitch Deck ElderVital

Dokumen ini menjadi panduan revisi pitch deck ElderVital berdasarkan keputusan diskusi terakhir. Struktur deck terdiri dari **14 slide**. Placeholder teknis tetap dipertahankan untuk diisi manual oleh Lead Tech/tim. Jangan mengubah status fitur simulasi atau rencana menjadi klaim bahwa fitur sudah berfungsi.

## Prinsip umum
- Alur pitch: **Problem → Solution → Execution & Differentiation → Trust & Delivery**.
- Jangan membuat klaim diagnosis medis. ElderVital adalah alat skrining gejala dan pendampingan, bukan pengganti tenaga kesehatan.
- Bedakan fakta bersumber, interpretasi tim, fitur yang sudah berjalan, simulasi, dan rencana.
- Novelty yang ditonjolkan: **generate draf laporan skrining gejala untuk membantu caregiver berkomunikasi dengan fasilitas kesehatan**. Ini bukan laporan medis resmi.
- Klaim eksklusivitas novelty harus divalidasi lebih lanjut. Fitur yang tidak ditemukan pada halaman publik kompetitor bukan bukti mutlak bahwa fitur tersebut tidak ada.

---

## P1 — Cover

**Tujuan:** Memperkenalkan ElderVital dengan cepat.

**Konten**
- Logo ElderVital.
- Judul utama: `[JUDUL FINAL DARI TIM]`.
- Tagline: *Adaptive Symptom Screening & Caregiver Assistance*.

**Arahan visual**
- Ganti mockup ponsel lama dengan mockup UI ElderVital yang sebenarnya.
- Tampilkan contoh pertanyaan skrining, misalnya: “Apakah Anda merasa pusing hari ini?”
- Hindari deskripsi produk panjang yang mengulang judul.

**Placeholder/aset**
- `[JUDUL FINAL]`
- `[LOGO]`
- `[UI ASLI UNTUK MOCKUP]`

## P2 — Problem Landscape

**Tujuan:** Menunjukkan relevansi masalah dengan data.

**Judul:** `Problem Landscape`

**Subtitle:** `Akses digital pada lansia belum merata.`

**Konten**
- **49,27%** — penggunaan telepon seluler pada penduduk lansia.
- **26,42%** — akses internet pada penduduk lansia.
- Sumber yang dicantumkan: BPS, *Statistik Penduduk Lanjut Usia 2024*, berdasarkan Susenas Maret 2024.

**Arahan visual**
- Dua angka statistik besar.
- Ikon telepon seluler dan konektivitas internet.
- Ilustrasi lansia menggunakan smartphone.

**Catatan validasi**
- Pastikan definisi indikator dan kelompok umur sesuai tabel asli BPS.
- Jangan menyimpulkan bahwa semua lansia kesulitan menggunakan teknologi hanya dari dua angka ini.
- Hapus kalimat lama yang terlalu mengarah ke solusi.

## P3 — Problem Statement

**Tujuan:** Menjelaskan masalah spesifik yang hendak diselesaikan.

**Konten yang disarankan**
- Lansia dapat mengalami perubahan gejala yang tidak selalu segera diketahui keluarga.
- Informasi kondisi yang disampaikan secara tidak terstruktur dapat menyulitkan caregiver memahami hal yang perlu ditindaklanjuti.
- Pemeriksaan digital perlu mempertimbangkan kemampuan pengguna lansia dan keterlibatan caregiver.

**Narasi singkat**
> Ketika kondisi lansia berubah, tantangannya bukan hanya mengetahui bahwa sesuatu terjadi, tetapi juga membantu keluarga memahami informasi tersebut dan menentukan langkah berikutnya.

**Arahan visual**
- Ilustrasi lansia yang tampak tidak nyaman dan caregiver yang mendampingi.
- Jangan gunakan user journey di slide ini.
- Batasi teks menjadi beberapa poin singkat.

**Catatan validasi**
- Framing masalah perlu didukung referensi atau hasil wawancara jika tersedia.

## P4 — Solution

**Tujuan:** Memperkenalkan ElderVital sebagai jawaban atas masalah.

**Konten utama**
> ElderVital adalah solusi skrining gejala yang dirancang untuk membantu lansia melaporkan kondisinya secara sederhana, memahami hasil skrining, dan menghubungkan informasi tersebut dengan tindak lanjut caregiver.

**Arahan visual**
- Gunakan foto/ilustrasi nenek sakit di rumah.
- Referensi foto: [Pexels — nenek sakit didampingi keluarga](https://www.pexels.com/photo/adorable-asian-kid-touching-forehead-of-sick-grandmother-5692697/).
- Alternatif ilustrasi vektor: [FreeSVG — ilustrasi perempuan demam](https://freesvg.org/vector-illustration-of-a-feverish-woman).
- Letakkan nenek di satu sisi dan mockup UI ElderVital di sisi lain.
- Jangan memberi kesan bahwa aplikasi mendiagnosis penyakit.

**Catatan aset**
- Periksa lisensi dan ketentuan atribusi pada halaman sumber sebelum memakai visual dalam deck final.

## P5 — Target User

**Tujuan:** Menjelaskan siapa yang menggunakan ElderVital dan siapa yang menerima informasi.

**Pengguna 1 — Lansia**
- Pra-lansia: 45–59 tahun.
- Lansia pra-lanjut usia: 60–69 tahun.
- Menjawab pertanyaan skrining melalui antarmuka yang mudah dipahami.

**Pengguna 2 — Caregiver**
- Anggota keluarga atau orang dekat yang mendampingi lansia.
- Menghubungkan profil melalui QR code sesuai rancangan.
- Menerima informasi hasil skrining dan arahan tindak lanjut.

**Arahan visual**
- Dua kartu persona: Lansia dan Caregiver.
- Hubungkan dengan ikon smartphone atau simbol koneksi.

**Catatan**
- Rentang usia di atas mengikuti skema tim; cantumkan sumber klasifikasi jika diperlukan.

## P6 — MVP Features

**Tujuan:** Menunjukkan fitur inti dan manfaatnya.

| Fitur | Penjelasan singkat | Manfaat |
|---|---|---|
| Accessible Screening | Pertanyaan gejala yang sederhana dan mudah dijawab | Mudah digunakan |
| Adaptive Guidance | Alur pertanyaan/arahan mengikuti jawaban sesuai logika sistem | Lebih terarah |
| Caregiver Connection | Menghubungkan lansia dengan caregiver melalui alur pairing | Tetap terhubung |
| Follow-up | Menyajikan hasil skrining dan arahan langkah berikutnya | Tahu langkah lanjut |
| Report Generation | Menyusun draf laporan skrining untuk membantu komunikasi dengan fasilitas kesehatan | Laporan terstruktur |

**Arahan visual**
- Lima ikon sederhana.
- Satu kalimat per fitur.
- Tandai setiap fitur dengan status implementasi yang benar: Berfungsi, Simulasi, atau Rencana.

**Catatan**
- Jangan mengklaim fitur sudah berjalan jika masih simulasi atau rencana.

## P7 — Workflow

**Tujuan:** Memperlihatkan alur penggunaan dan aktor yang terlibat.

**Alur**
1. **Setup & Pairing** — caregiver mengatur profil dan menghubungkan lansia.
2. **Reminder & Screening** — lansia menerima pengingat dan menjawab pertanyaan.
3. **Decision Engine** — jawaban diproses menggunakan logika skrining yang ditentukan.
4. **Result & Follow-up** — hasil ditampilkan dan caregiver menerima informasi sesuai kondisi.
5. **Report Generation** — draf laporan disiapkan untuk membantu komunikasi dengan fasilitas kesehatan.

**Arahan visual**
- Diagram alur horizontal atau vertikal.
- Tampilkan tiga aktor: Lansia, Caregiver, dan Decision Engine.
- Pertahankan label status: `Berfungsi`, `Simulasi`, `Rencana`.

**Catatan**
- Status tiap proses harus sesuai keadaan prototipe saat ini.

## P8 — System Architecture

**Tujuan:** Menunjukkan kelayakan teknis dan hubungan antarkomponen.

**Blok arsitektur**
1. **User Interface** — antarmuka lansia dan caregiver.
2. **Application Logic** — alur skrining dan pengelolaan sesi.
3. **Decision Engine** — aturan pengolahan jawaban dan penentuan keluaran.
4. **Data Layer** — penyimpanan data sesuai rancangan.
5. **Reporting Module** — penyusunan draf laporan skrining.

**Placeholder untuk Lead Tech**
- `[FRAMEWORK]`
- `[DATABASE]`
- `[API/LAYANAN]`
- `[PILIHAN TEKNOLOGI]`
- `[JUMLAH SKENARIO PENGUJIAN]`

**Arahan visual**
- Diagram blok dengan aliran data dari pengguna ke decision engine, lalu ke hasil, caregiver, dan modul laporan.

**Catatan**
- Jangan mengisi placeholder menggunakan asumsi. Lead Tech menggantinya setelah arsitektur dikonfirmasi.

## P9 — Novelty

**Tujuan:** Membandingkan fitur secara ringkas dan menonjolkan pembeda ElderVital.

**Judul yang disarankan:** `Novelty — Symptom Screening to Healthcare Report`

| Fitur | ANSR Health AI | Daily OK | ElderVital |
|---|:---:|:---:|:---:|
| Check-in dan notifikasi caregiver | ✓ | ✓ | ✓ |
| Pengingat rutin dan pemantauan respons | ✓ | ✓ | ✓ |
| Skrining gejala adaptif | ✓ | ✕ | ✓ |
| Integrasi wearable dan pemantauan tanda vital | ✓ | ✕ | ✕ |
| Generate draf laporan skrining untuk fasilitas kesehatan | ✕* | ✕* | ✓ |

**Narasi novelty**
> ElderVital dirancang untuk menghubungkan skrining gejala dengan draf laporan terstruktur yang membantu caregiver menyampaikan informasi kepada fasilitas kesehatan.

**Arahan visual**
- Matriks fitur dengan centang dan silang.
- Sorot baris `Generate draf laporan skrining untuk fasilitas kesehatan`.
- Tambahkan alur kecil: `Skrining → Hasil → Draf Laporan`.

**Catatan validasi wajib**
- `✕*` berarti fitur spesifik tersebut belum ditemukan pada sumber publik yang diperiksa, bukan bukti mutlak bahwa fitur tidak tersedia.
- Daily OK diketahui memiliki ekspor PDF riwayat check-in pada paket tertentu. Jangan menyamakan ekspor riwayat PDF dengan generator naskah laporan skrining; verifikasi cakupan fitur secara spesifik.
- Pastikan Report Generation sesuai dengan implementasi aktual atau tandai sebagai rencana.
- Jangan mengklaim kebaruan eksklusif sebelum memverifikasi sumber terbaru dan prototipe.

## P10 — Setting & Privacy

**Tujuan:** Menunjukkan bahwa privasi, akses, dan batasan skrining dipertimbangkan.

**Konten**
- Persetujuan pengguna dan/atau mekanisme pendampingan yang sesuai.
- Kontrol akses caregiver terhadap informasi lansia.
- Penanganan jawaban yang tidak lengkap atau tidak pasti.
- Hasil skrining bukan diagnosis medis.
- Eskalasi mengikuti aturan skrining dan arahan keselamatan yang telah ditentukan.

**Placeholder**
- `[MEKANISME PERSETUJUAN]`
- `[KONTROL AKSES]`
- `[KEBIJAKAN PENYIMPANAN DATA]`

**Arahan visual**
- Ikon privasi, keamanan, dan kontrol akses.
- Diagram sederhana tentang siapa yang dapat melihat data apa.

**Catatan**
- Pisahkan implementasi yang sudah ada dari rencana pengembangan.

## P11 — Transparansi Penggunaan AI

**Tujuan:** Menjelaskan penggunaan AI dan tanggung jawab tim.

**Konten**
- Tool AI yang digunakan.
- Tugas yang dibantu AI, misalnya eksplorasi ide, desain UI, atau penyusunan materi.
- Bagian yang dirancang, diuji, dan diputuskan oleh tim.
- Mekanisme pemeriksaan akurasi dan pencegahan klaim medis yang tidak didukung.

**Placeholder**
- `[TOOL AI]`
- `[TUGAS AI]`
- `[KONTRIBUSI TIM]`
- `[MEKANISME REVIEW]`

**Arahan visual**
- Diagram: `AI Assistance → Human Review → Final Decision`.

**Catatan**
- Jangan mengklaim bahwa data pasien tidak pernah dimasukkan ke AI kecuali tim dapat mengonfirmasinya.

## P12 — Implementation Roadmap

**Tujuan:** Menunjukkan rencana implementasi yang realistis.

| Tahap | Fokus | Output |
|---|---|---|
| 1. MVP | Skrining, hasil, koneksi caregiver | Prototipe inti |
| 2. Stabilization | Perbaikan alur dan penanganan kesalahan | Prototipe lebih stabil |
| 3. Validation | Pengujian usability dan review tenaga kesehatan | Temuan evaluasi |
| 4. Reporting | Penyempurnaan draf laporan skrining | Modul laporan |
| 5. Pilot | Uji terbatas dengan prosedur dan persetujuan sesuai | Evaluasi penggunaan |

**Placeholder**
- `[TARGET WAKTU]`
- `[MILESTONE]`
- `[INDIKATOR KEBERHASILAN]`

**Arahan visual**
- Roadmap horizontal dengan lima tahap.
- Tampilkan status tiap tahap sesuai progres sebenarnya.

## P13 — Team & Responsibilities

**Tujuan:** Menunjukkan kapasitas dan pembagian tanggung jawab tim.

**Konten**
- `[NAMA ANGGOTA 1]` — `[ROLE]` — `[KONTRIBUSI]`
- `[NAMA ANGGOTA 2]` — `[ROLE]` — `[KONTRIBUSI]`
- `[NAMA ANGGOTA 3]` — `[ROLE]` — `[KONTRIBUSI]`
- `[NAMA ANGGOTA 4]` — `[ROLE]` — `[KONTRIBUSI]`

Institusi: Informatika, Universitas Islam Indonesia.

**Arahan visual**
- Empat foto atau avatar dengan gaya konsisten.
- Nama, role, dan satu kontribusi utama per anggota.

## P14 — Closing

**Tujuan:** Menutup presentasi secara bersih dan mudah diingat.

**Konten**
- Logo ElderVital.
- `Thank You`.
- Tagline: *Adaptive Symptom Screening & Caregiver Assistance*.

**Arahan visual**
- Logo sebagai elemen utama.
- Gunakan elemen UI ElderVital secara minimal.
- Jangan mengulang daftar fitur atau penjelasan produk.

---

## Checklist sebelum deck difinalisasi

- [ ] Logo, UI asli untuk cover, dan ilustrasi P4 tersedia.
- [ ] Angka BPS dan sumber masalah sudah diverifikasi.
- [ ] Lead Tech mengisi placeholder arsitektur dan tech stack.
- [ ] Status fitur Berfungsi/Simulasi/Rencana sudah sesuai.
- [ ] Matriks novelty ANSR vs Daily OK sudah diverifikasi.
- [ ] Status implementasi Report Generation sudah jelas.
- [ ] Nama, role, dan kontribusi empat anggota sudah diisi.
- [ ] Konsistensi desain, keterbacaan, dan kesiapan tanya jawab juri sudah diperiksa.
