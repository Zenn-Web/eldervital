import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCodeSvg } from "@/components/shared/QrCodeSvg";

interface ElderQrDisplayProps {
  displayName: string;
  onNext: () => void;
  onBack: () => void;
}

export function ElderQrDisplay({
  displayName,
  onNext,
  onBack,
}: ElderQrDisplayProps) {
  const INITIAL_SECONDS = 900; // 15 menit
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [token, setToken] = useState("EV-8924");

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleRefreshToken() {
    setSecondsLeft(INITIAL_SECONDS);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setToken(`EV-${randomSuffix}`);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progressPct = Math.max(0, (secondsLeft / INITIAL_SECONDS) * 100);

  return (
    <div className="flex flex-col min-h-screen justify-between p-6 max-w-md mx-auto text-ink">
      <div className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="w-12 h-12 rounded-full border border-line bg-surface flex items-center justify-center hover:bg-paper focus-visible:ring-4 focus-visible:ring-focus text-ink"
          aria-label="Kembali"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink leading-tight">
            Tunjukkan kode ini kepada keluarga
          </h1>
          <p className="text-lg text-ink-soft">
            Minta anak atau caregiver membuka menu &ldquo;Hubungkan Lansia&rdquo; di ponsel mereka.
          </p>
        </div>

        {/* Kartu QR Code Utama */}
        <Card className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-surface border-2 border-line">
          <span className="font-serif text-2xl font-bold text-ink">
            {displayName || "Bu Sari"}
          </span>

          <div className="p-3 bg-white rounded-2xl border border-line/60 shadow-sm">
            <QrCodeSvg token={token} size={210} />
          </div>

          <div className="w-full space-y-2 pt-2">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-ink-soft">Masa berlaku</span>
              <span className="text-primary font-mono text-xl tabular-nums">
                {formattedTime} lagi
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-[#ECE4D4] overflow-hidden">
              <div
                className="h-full rounded-full bg-sogan transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="text-center pt-1">
              <span className="text-sm text-ink-soft">Kode manual: </span>
              <span className="font-mono font-bold text-base bg-paper px-2 py-0.5 rounded border border-line">
                {token}
              </span>
            </div>
          </div>
        </Card>

        <p className="text-base text-ink-soft leading-relaxed">
          Kode ini adalah token aman sekali pakai. Tidak berisi data riwayat kesehatan Anda.
        </p>

        {secondsLeft === 0 && (
          <Button
            onClick={handleRefreshToken}
            variant="outline"
            className="w-full text-base font-bold"
          >
            🔄 Buat Kode QR Baru
          </Button>
        )}
      </div>

      <div className="space-y-3 pt-6 pb-2">
        <Button
          onClick={onNext}
          size="senior"
          className="w-full text-xl font-bold rounded-2xl"
        >
          Lanjut ke Pengingat
        </Button>
      </div>
    </div>
  );
}
