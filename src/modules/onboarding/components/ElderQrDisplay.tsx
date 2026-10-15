import React, { useEffect, useState } from "react";
import { QrCodeSvg } from "@/components/shared/QrCodeSvg";

interface ElderQrDisplayProps {
  displayName: string;
  onNext: () => void;
  onBack: () => void;
}

export function ElderQrDisplay({
  displayName,
  onNext,
  // onBack kept in interface for API compatibility; not used in this screen
}: ElderQrDisplayProps) {
  const INITIAL_SECONDS = 900; // 15 menit
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [token, setToken] = useState("AXYKBX");

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleRefreshToken() {
    setSecondsLeft(INITIAL_SECONDS);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const randomCode = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    setToken(randomCode);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} lagi`;
  const progressPct = Math.max(0, (secondsLeft / INITIAL_SECONDS) * 100);
  const isAlmostExpired = progressPct < 20;

  return (
    <div className="flex flex-col min-h-full flex-1 bg-paper text-ink p-6 select-none overflow-y-auto">
      {/* Judul & Pengantar */}
      <div className="space-y-1.5 mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
          Tunjukkan kode ini kepada keluarga
        </h1>
      </div>

      {/* Kartu QR Code Utama */}
      <div className="rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 flex flex-col items-center gap-4 shadow-xs">
        {/* Nama Lansia */}
        <span className="font-serif text-lg sm:text-xl font-bold text-ink">
          {displayName || "Bu Sari"}
        </span>

        {/* QR Code */}
        <div className="p-3 bg-white rounded-xl border border-line/40 shadow-sm">
          <QrCodeSvg token={token} size={185} />
        </div>

        {/* Kode Manual */}
        <p className="text-xs sm:text-sm text-ink-soft text-center">
          Kode manual&nbsp;
          <span className="font-mono font-bold text-ink tracking-wider text-sm sm:text-base">
            {token}
          </span>
        </p>

        {/* Progress Waktu Berlaku */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
            <span className="text-ink-soft">Berlaku</span>
            <span
              className={`font-mono font-bold tabular-nums ${
                isAlmostExpired ? "text-alert-mark" : "text-ink"
              }`}
            >
              {formattedTime}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Masa berlaku kode QR"
            className="w-full h-1.5 rounded-full bg-line/40 overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isAlmostExpired ? "bg-alert-mark" : "bg-sogan"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Teks Penjelasan Token */}
      <p className="text-xs sm:text-sm text-ink-soft leading-relaxed mt-5">
        Kode ini token sementara. Hanya bisa dipakai satu kali untuk menghubungkan caregiver ke profil{" "}
        <span className="text-primary font-medium">{displayName || "Ibu"}</span>.
        Bila waktu habis, buat kode baru.
      </p>

      {/* Tombol Aksi */}
      <div className="flex-1 flex flex-col justify-end gap-3 pt-6 pb-2">
        <button
          type="button"
          onClick={onNext}
          className="w-full min-h-[56px] rounded-full bg-primary text-white text-base sm:text-lg font-bold hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all shadow-sm"
        >
          Sudah terhubung
        </button>

        <button
          type="button"
          onClick={handleRefreshToken}
          className="w-full min-h-[44px] text-sm sm:text-base font-bold text-ink hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-full transition-colors"
        >
          Buat kode baru
        </button>
      </div>
    </div>
  );
}
