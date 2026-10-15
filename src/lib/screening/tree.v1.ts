import type { Option, ScreeningTree } from "./types";

/**
 * Pohon pertanyaan versi 1 (demo).
 *
 * PENTING: isi pertanyaan, ambang, dan aturan tanda bahaya di sini adalah contoh
 * untuk prototipe. Semuanya wajib ditinjau tenaga kesehatan sebelum dipakai nyata
 * (reviewStatus tetap "belum_ditinjau" sampai ada peninjauan).
 *
 * Cara mengubah: edit data di file ini lalu jalankan `npm test`. Tes akan memeriksa
 * bahwa semua rujukan benar, tidak ada putaran, semua node terjangkau, dan
 * pertanyaan obat selalu dilalui.
 */

const UNKNOWN_SAY = [
  "tidak tahu",
  "tidak yakin",
  "kurang tahu",
  "kurang yakin",
  "tidak ingat",
  "lupa",
  "entah",
  "ragu",
] as const;

const yes = (extra: readonly string[] = []): Option => ({
  id: "ya",
  label: "Ya",
  say: ["ya", "betul", "benar", "ada", ...extra],
});

const no = (extra: readonly string[] = []): Option => ({
  id: "tidak",
  label: "Tidak",
  say: ["tidak", "bukan", "tidak ada", ...extra],
});

const unsure: Option = {
  id: "tidak_yakin",
  label: "Saya tidak yakin",
  unknown: true,
  say: UNKNOWN_SAY,
};

export const treeV1: ScreeningTree = {
  id: "gejala-dasar",
  version: "1.2.0-demo",
  title: "Pemeriksaan gejala harian",
  reviewStatus: "belum_ditinjau",
  start: "cough_today",
  requiredNodes: ["med_taken"],
  disclaimer:
    "ElderVital memberikan hasil skrining gejala, bukan diagnosis. Aturan pada versi ini adalah contoh untuk prototipe dan belum ditinjau tenaga kesehatan.",
  emergencyContacts: [
    { label: "Layanan darurat", number: "112" },
    { label: "Ambulans dan gawat darurat medis", number: "119" },
  ],
  nodes: {
    cough_today: {
      kind: "choice",
      id: "cough_today",
      topic: "Batuk",
      prompt: "Apakah hari ini Anda batuk?",
      critical: true,
      options: [yes(["batuk"]), no(["tidak batuk"]), unsure],
      next: {
        ya: "cough_duration",
        tidak: "chest_check",
        tidak_yakin: "chest_check",
      },
    },
    cough_duration: {
      kind: "choice",
      id: "cough_duration",
      topic: "Batuk",
      prompt: "Sudah berapa lama Anda batuk?",
      options: [
        {
          id: "d_lt3",
          label: "Kurang dari 3 hari",
          say: ["kurang dari tiga hari", "kurang dari 3 hari", "baru", "baru saja", "sehari", "dua hari", "2 hari"],
        },
        {
          id: "d_3to13",
          label: "3 hari sampai kurang dari 2 minggu",
          say: ["tiga hari", "3 hari", "seminggu", "satu minggu", "1 minggu", "beberapa hari", "empat hari", "lima hari"],
        },
        {
          id: "d_gte14",
          label: "2 minggu atau lebih",
          say: ["dua minggu", "2 minggu", "lebih dari dua minggu", "tiga minggu", "sebulan", "satu bulan", "lama", "lama sekali"],
        },
        {
          id: "d_unknown",
          label: "Saya tidak ingat",
          unknown: true,
          say: UNKNOWN_SAY,
        },
      ],
      next: {
        d_lt3: "cough_frequency",
        d_3to13: "cough_frequency",
        d_gte14: "cough_frequency",
        d_unknown: "cough_frequency",
      },
    },
    cough_frequency: {
      kind: "choice",
      id: "cough_frequency",
      topic: "Batuk",
      prompt: "Seberapa sering Anda batuk?",
      options: [
        { id: "f_rare", label: "Jarang, sesekali", say: ["jarang", "sesekali", "kadang", "kadang kadang"] },
        { id: "f_often", label: "Beberapa kali sehari", say: ["sering", "beberapa kali", "beberapa kali sehari", "cukup sering"] },
        {
          id: "f_constant",
          label: "Hampir terus-menerus",
          say: ["terus", "terus menerus", "hampir terus", "sepanjang hari", "setiap saat"],
        },
        { id: "f_unknown", label: "Saya tidak yakin", unknown: true, say: UNKNOWN_SAY },
      ],
      next: {
        f_rare: "cough_blood",
        f_often: "cough_blood",
        f_constant: "cough_blood",
        f_unknown: "cough_blood",
      },
    },
    cough_blood: {
      kind: "choice",
      id: "cough_blood",
      topic: "Batuk",
      prompt: "Apakah batuk Anda mengeluarkan darah?",
      hint: "Misalnya dahak berwarna merah atau ada bercak darah.",
      critical: true,
      options: [yes(["berdarah"]), no(), unsure],
      next: {
        ya: "cough_fever",
        tidak: "cough_fever",
        tidak_yakin: "cough_fever",
      },
    },
    cough_fever: {
      kind: "choice",
      id: "cough_fever",
      topic: "Batuk",
      prompt: "Apakah Anda merasa demam atau menggigil hari ini?",
      options: [yes(["demam", "menggigil"]), no(), unsure],
      next: {
        ya: "chest_check",
        tidak: "chest_check",
        tidak_yakin: "chest_check",
      },
    },
    chest_check: {
      kind: "choice",
      id: "chest_check",
      topic: "Napas dan dada",
      prompt: "Apakah Anda merasa sesak napas atau nyeri dada saat ini?",
      critical: true,
      options: [
        { id: "c_no", label: "Tidak", say: ["tidak", "bukan", "tidak ada", "tidak sesak"] },
        {
          id: "c_mild",
          label: "Ya, ringan. Saya masih bisa bicara dan bergerak.",
          say: ["ringan", "sedikit", "agak", "ya ringan", "sedikit sesak"],
        },
        {
          id: "c_severe",
          label: "Ya, berat. Saya sulit bicara atau sulit bergerak.",
          say: ["berat", "sangat", "parah", "sesak sekali", "sangat sesak", "ya berat", "sulit bernapas"],
        },
        { id: "c_unknown", label: "Saya tidak yakin", unknown: true, say: UNKNOWN_SAY },
      ],
      next: {
        c_no: "med_taken",
        c_mild: "med_taken",
        c_severe: "med_taken",
        c_unknown: "med_taken",
      },
    },
    med_taken: {
      kind: "choice",
      id: "med_taken",
      topic: "Obat rutin",
      prompt: "Apakah Anda sudah minum obat rutin sesuai jadwal hari ini?",
      critical: true,
      options: [
        { id: "m_yes", label: "Sudah", say: ["sudah", "ya", "betul", "sudah minum"] },
        { id: "m_no", label: "Belum", say: ["belum", "tidak", "lupa minum", "belum minum"] },
        {
          id: "m_none",
          label: "Saya tidak punya obat rutin",
          say: ["tidak punya", "tidak punya obat", "tidak ada obat", "tidak minum obat"],
        },
        { id: "m_unknown", label: "Saya tidak yakin", unknown: true, say: UNKNOWN_SAY },
      ],
      next: {
        m_yes: "med_name",
        // Belum minum hari ini tetap berarti punya obat rutin: tanyakan nama dan frekuensinya.
        m_no: "med_name",
        m_none: null,
        m_unknown: null,
      },
    },
    med_name: {
      kind: "text",
      id: "med_name",
      topic: "Obat rutin",
      prompt: "Apa nama obat yang Anda minum?",
      hint: "Boleh diketik atau diucapkan. Jika tidak tahu, pilih tombol di bawah.",
      inputLabel: "Nama obat",
      maxLength: 120,
      unknownLabel: "Saya tidak tahu namanya",
      next: "med_frequency",
    },
    // Hanya dicatat untuk riwayat dan naskah bantuan. Tidak ada aturan warna dan tidak ada
    // saran dosis yang dikaitkan dengan jawaban ini (aturan keselamatan klinis).
    med_frequency: {
      kind: "text",
      id: "med_frequency",
      topic: "Obat rutin",
      prompt: "Berapa kali sehari obat ini diminum?",
      hint: "Tulis sesuai yang biasa dijalani, misalnya 2 kali sehari. Jika tidak tahu, pilih tombol di bawah.",
      inputLabel: "Berapa kali sehari",
      maxLength: 60,
      unknownLabel: "Saya tidak tahu",
      next: null,
    },
  },
  rules: [
    {
      id: "R-COUGH-BLOOD",
      level: "red",
      when: { node: "cough_blood", anyOf: ["ya"] },
      reason: "Batuk disertai darah.",
    },
    {
      id: "R-CHEST-SEVERE",
      level: "red",
      when: { node: "chest_check", anyOf: ["c_severe"] },
      reason: "Sesak napas atau nyeri dada yang berat.",
    },
    {
      id: "Y-COUGH-DURATION",
      level: "yellow",
      when: { node: "cough_duration", anyOf: ["d_gte14"] },
      reason: "Batuk sudah berlangsung 2 minggu atau lebih.",
    },
    {
      id: "Y-COUGH-CONSTANT",
      level: "yellow",
      when: { node: "cough_frequency", anyOf: ["f_constant"] },
      reason: "Batuk hampir terus-menerus.",
    },
    {
      id: "Y-COUGH-FEVER",
      level: "yellow",
      when: { node: "cough_fever", anyOf: ["ya"] },
      reason: "Batuk disertai demam atau menggigil.",
    },
    {
      id: "Y-CHEST-MILD",
      level: "yellow",
      when: { node: "chest_check", anyOf: ["c_mild"] },
      reason: "Ada sesak napas atau nyeri dada yang ringan.",
    },
    {
      id: "Y-MED-MISSED",
      level: "yellow",
      when: { node: "med_taken", anyOf: ["m_no"] },
      reason: "Obat rutin belum diminum sesuai jadwal. Jawaban ini hanya dicatat, tanpa saran dosis.",
    },
  ],
  guidance: {
    green: {
      headline: "Tidak ada pemicu perhatian yang teridentifikasi",
      summary:
        "Dari jawaban pada pemeriksaan ini, tidak ada tanda yang perlu perhatian khusus. Hasil ini hanya menggambarkan jawaban Anda hari ini, dan bukan jaminan bahwa Anda sehat.",
      actions: [
        "Lanjutkan kegiatan seperti biasa.",
        "Jika Anda merasa tidak enak badan, beri tahu caregiver atau tenaga kesehatan.",
        "Pemeriksaan berikutnya mengikuti jadwal pengingat Anda.",
      ],
    },
    yellow: {
      headline: "Perlu diperhatikan",
      summary:
        "Ada jawaban yang perlu diperhatikan. Ini bukan diagnosis. Alasannya tertulis di bawah.",
      actions: [
        "Pantau keluhan Anda hari ini dan catat bila ada perubahan.",
        "Sampaikan hasil ini kepada caregiver Anda.",
        "Pertimbangkan berkonsultasi dengan tenaga kesehatan, terutama bila keluhan menetap atau bertambah berat.",
        "Untuk urusan obat, ikuti arahan dokter atau apoteker Anda.",
      ],
    },
    red: {
      headline: "Perlu pertolongan segera",
      summary:
        "Jawaban Anda menunjukkan tanda bahaya. Jangan menunggu pemeriksaan berikutnya.",
      actions: [
        "Segera hubungi layanan darurat, atau minta orang di dekat Anda untuk membantu.",
        "Jika ada caregiver atau keluarga di dekat Anda, beri tahu sekarang.",
        "Jangan pergi sendiri ke fasilitas kesehatan bila Anda sesak atau lemas.",
      ],
    },
    incomplete: {
      headline: "Pemeriksaan belum selesai",
      summary:
        "Hasil belum bisa ditentukan karena pertanyaan belum semuanya dijawab. Lanjutkan pemeriksaan, atau ulangi dari awal.",
      actions: ["Lanjutkan menjawab pertanyaan.", "Atau minta caregiver membantu."],
    },
    unknown: {
      headline: "Data belum cukup",
      summary:
        "Ada jawaban penting yang belum diketahui, sehingga hasil belum bisa ditentukan. Hasil ini tidak berarti Anda sehat atau sakit.",
      actions: [
        "Ulangi pemeriksaan dan jawab pertanyaan yang tadi belum yakin.",
        "Atau minta caregiver membantu menjawab bersama Anda.",
        "Jika Anda merasa tidak enak badan, hubungi tenaga kesehatan.",
      ],
    },
  },
};
