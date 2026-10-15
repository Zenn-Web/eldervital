"use client";

import { useState } from "react";
import { UserIcon, BellIcon, HandshakeIcon, ChevronRightIcon, ClockIcon } from "@/components/shared/Icons";
import { Badge } from "@/components/ui/badge";
import { TimePicker } from "@/components/ui/time-picker";

export default function Settings() {
  const [notifyRed, setNotifyRed] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState("07.30");
  const [reminderPeriod, setReminderPeriod] = useState<"daily" | "weekdays" | "weekend">("daily");
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [dataSharing] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showDemoNotice = (feature: string) => {
    setFeedback(`Pengaturan "${feature}" disimulasikan aktif di penyimpanan lokal prototipe.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-5 pb-12 max-w-2xl mx-auto px-1 sm:px-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          className="rounded-2xl bg-primary text-white text-sm px-4 py-3 font-medium shadow-md flex items-center justify-between animate-in fade-in duration-200"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-white/80 hover:text-white font-bold ml-2 text-base rounded-full p-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">
          Pengaturan Akun & Layanan
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          Kelola preferensi pendampingan, notifikasi peringatan dini, dan sambungan profil lansia.
        </p>
      </header>

      {/* Bagian 1: Profil Caregiver */}
      <section
        aria-labelledby="profil-caregiver-heading"
        className="rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 space-y-4 shadow-none"
      >
        <div className="flex items-center gap-3 border-b border-line/60 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 id="profil-caregiver-heading" className="text-base font-bold text-ink">
              Profil Caregiver
            </h2>
            <p className="text-xs text-ink-soft">Informasi akun pendamping keluarga utama</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
          <div className="p-3.5 rounded-xl bg-paper/50 border border-line/60">
            <span className="text-xs text-ink-soft block font-medium">Nama Lengkap</span>
            <strong className="text-ink font-semibold mt-0.5 block">Hanafi (Caregiver)</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-paper/50 border border-line/60">
            <span className="text-xs text-ink-soft block font-medium">Peran dalam Keluarga</span>
            <strong className="text-ink font-semibold mt-0.5 block">Anak Kandung</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-paper/50 border border-line/60">
            <span className="text-xs text-ink-soft block font-medium">Nomor Telepon Darurat</span>
            <strong className="text-ink font-semibold mt-0.5 block">+62 812-3456-7890</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-paper/50 border border-line/60">
            <span className="text-xs text-ink-soft block font-medium">Status Akun</span>
            <span className="inline-flex items-center gap-1.5 text-ok-ink font-bold text-xs mt-1">
              <span className="h-2 w-2 rounded-full bg-ok-mark" />
              Aktif Terhubung
            </span>
          </div>
        </div>
      </section>

      {/* Bagian 2: Preferensi Notifikasi */}
      <section
        aria-labelledby="notifikasi-heading"
        className="rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 space-y-4 shadow-none"
      >
        <div className="flex items-center gap-3 border-b border-line/60 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 id="notifikasi-heading" className="text-base font-bold text-ink">
              Pengaturan Notifikasi & Sinyal Bahaya
            </h2>
            <p className="text-xs text-ink-soft">Pemberitahuan instan saat kondisi darurat atau butuh bantuan</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-line/60 bg-paper/40">
            <div>
              <div className="text-sm font-bold text-ink">Peringatan Tanda Bahaya (Merah)</div>
              <div className="text-xs text-ink-soft">Peringatan suara & pop-up saat lansia melaporkan gejala gawat darurat</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notifyRed}
              onClick={() => {
                setNotifyRed(!notifyRed);
                showDemoNotice(`Peringatan Tanda Bahaya ${!notifyRed ? "Diaktifkan" : "Dinonaktifkan"}`);
              }}
              style={{
                backgroundColor: notifyRed ? "#2B3A6B" : "#DDD2BF",
              }}
              className="relative inline-flex h-[30px] w-[52px] shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus shadow-xs"
            >
              <span
                aria-hidden="true"
                style={{
                  transform: notifyRed ? "translateX(22px)" : "translateX(0px)",
                }}
                className="pointer-events-none inline-block h-[24px] w-[24px] rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
              />
            </button>
          </div>

          {/* Pengingat Jadwal Skrining Interaktif */}
          <div className="p-4 rounded-xl border border-line/60 bg-paper/40 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-ink">Pengingat Jadwal Skrining</div>
                <div className="text-xs text-ink-soft">
                  Notifikasi otomatis bila lansia belum melakukan pemeriksaan harian
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={dailyReminder}
                onClick={() => {
                  setDailyReminder(!dailyReminder);
                  showDemoNotice(`Pengingat Jadwal ${!dailyReminder ? "Diaktifkan" : "Dinonaktifkan"}`);
                }}
                style={{
                  backgroundColor: dailyReminder ? "#2B3A6B" : "#DDD2BF",
                }}
                className="relative inline-flex h-[30px] w-[52px] shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus shadow-xs"
              >
                <span
                  aria-hidden="true"
                  style={{
                    transform: dailyReminder ? "translateX(22px)" : "translateX(0px)",
                  }}
                  className="pointer-events-none inline-block h-[24px] w-[24px] rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
                />
              </button>
            </div>

            {dailyReminder && (
              <div className="pt-2 border-t border-line/40 space-y-2.5 animate-in fade-in duration-150">
                {/* Time Picker Trigger */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-ink-soft">Waktu Pengingat:</span>
                  <button
                    type="button"
                    onClick={() => setIsTimePickerOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface hover:bg-paper border border-line text-xs font-mono font-bold text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus shadow-xs"
                  >
                    <ClockIcon size={14} />
                    <span>{reminderTime} WIB</span>
                    <span className="text-[11px] font-sans font-semibold text-ink-soft ml-1">Ubah</span>
                  </button>
                </div>

                {/* Period / Frequency Pills */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-ink-soft block">
                    Frekuensi Pengingat:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReminderPeriod("daily");
                        showDemoNotice("Frekuensi diatur: Setiap Hari");
                      }}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors border min-h-[32px] ${
                        reminderPeriod === "daily"
                          ? "bg-primary text-white border-primary font-bold shadow-xs"
                          : "bg-surface hover:bg-paper border-line text-ink"
                      }`}
                    >
                      Setiap Hari
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReminderPeriod("weekdays");
                        showDemoNotice("Frekuensi diatur: Hari Kerja (Senin - Jumat)");
                      }}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors border min-h-[32px] ${
                        reminderPeriod === "weekdays"
                          ? "bg-primary text-white border-primary font-bold shadow-xs"
                          : "bg-surface hover:bg-paper border-line text-ink"
                      }`}
                    >
                      Hari Kerja (Senin - Jumat)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReminderPeriod("weekend");
                        showDemoNotice("Frekuensi diatur: Akhir Pekan");
                      }}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors border min-h-[32px] ${
                        reminderPeriod === "weekend"
                          ? "bg-primary text-white border-primary font-bold shadow-xs"
                          : "bg-surface hover:bg-paper border-line text-ink"
                      }`}
                    >
                      Akhir Pekan Saja
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bagian 3: Hubungan Lansia & Privasi */}
      <section
        aria-labelledby="relasi-heading"
        className="rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 space-y-4 shadow-none"
      >
        <div className="flex items-center gap-3 border-b border-line/60 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HandshakeIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 id="relasi-heading" className="text-base font-bold text-ink">
              Profil & Izin Berbagi Data Lansia
            </h2>
            <p className="text-xs text-ink-soft">Lansia yang terhubung dan batas privasi rekam skrining</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-line/60 bg-paper/40">
            <div>
              <div className="text-sm font-bold text-ink">Ibu Sari Rahayu (62 tahun)</div>
              <div className="text-xs text-ink-soft">ID Sambungan: ELDER-SARI-01 &bull; Terhubung via Pindai QR</div>
            </div>
            <Badge variant="ok" className="text-xs rounded-full">
              {dataSharing ? "Izin Berbagi Penuh" : "Ditunda"}
            </Badge>
          </div>

          <button
            type="button"
            onClick={() => showDemoNotice("Sinkronisasi Cloud")}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-line/60 bg-surface hover:bg-paper transition-colors text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <div>
              <span className="text-sm font-semibold text-ink block">Sinkronisasi Database Cloud (Supabase)</span>
              <span className="text-xs text-ink-soft">Status: Menggunakan penyimpanan lokal prototipe demo</span>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-ink-soft shrink-0" />
          </button>
        </div>
      </section>

      {/* Bagian 4: Keluar / Beralih Akun */}
      <section className="pt-2">
        <button
          type="button"
          onClick={() => showDemoNotice("Keluar Akun")}
          className="w-full sm:w-auto px-6 py-3 rounded-full border border-line/60 bg-paper hover:bg-paper/80 transition-colors text-alert-ink font-semibold text-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Keluar dari Sesi Caregiver
        </button>
      </section>

      {/* Time Picker Modal */}
      <TimePicker
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        onSave={(time) => {
          setReminderTime(time);
          showDemoNotice(`Waktu pengingat diperbarui ke ${time} WIB`);
        }}
        initialTime={reminderTime}
        title="Pilih Waktu Pengingat Skrining"
        subtitle="Notifikasi otomatis akan dikirim ke caregiver jika lansia belum periksa"
        presets={["06.30", "07.00", "07.30", "08.00", "08.30"]}
      />
    </div>
  );
}
