import React, { useState } from "react";
import { QrCodeSvg } from "@/components/shared/QrCodeSvg";
import { ChevronLeftIcon, CameraIcon } from "@/components/shared/Icons";

interface CaregiverPairingProps {
  onPaired: (elder: { name: string; ageRange: string; shareResults: boolean }) => void;
  onBack: () => void;
}

export function CaregiverPairing({ onPaired, onBack }: CaregiverPairingProps) {
  const [step, setStep] = useState<"scan" | "confirm">("scan");
  const [manualCode, setManualCode] = useState("");
  const [shareResults, setShareResults] = useState(true);

  // Simulasi data lansia terhubung
  const elderData = {
    name: "Bu Sari",
    ageRange: "60–65 tahun",
    location: "Yogyakarta",
  };

  function handleSimulateScan() {
    setStep("confirm");
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setStep("confirm");
  }

  function handleConfirm() {
    onPaired({
      name: elderData.name,
      ageRange: elderData.ageRange,
      shareResults,
    });
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col min-h-full flex-1 bg-paper text-ink p-6 select-none justify-between overflow-y-auto">
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setStep("scan")}
            className="w-11 h-11 rounded-full border border-line/60 bg-surface flex items-center justify-center hover:bg-paper focus-visible:ring-4 focus-visible:ring-focus text-ink transition-colors shadow-xs"
            aria-label="Kembali ke pemindai"
          >
            <ChevronLeftIcon size={22} />
          </button>

          <div className="space-y-1.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
              Konfirmasi Hubungan
            </h1>
            <p className="text-sm text-ink-soft">
              Kode QR berhasil dipindai. Pastikan nama lansia sudah sesuai sebelum melanjutkan.
            </p>
          </div>

          {/* Kartu Profil Lansia */}
          <div className="p-5 border border-line/60 bg-surface rounded-2xl flex items-center gap-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-serif text-2xl font-bold shrink-0">
              {elderData.name[0]}
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                {elderData.name}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft">
                {elderData.ageRange} • {elderData.location}
              </p>
            </div>
          </div>

          {/* Izin Berbagi Data */}
          <div className="p-4 rounded-2xl border border-line/60 bg-surface space-y-2.5 shadow-xs">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shareResults}
                onChange={(e) => setShareResults(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border border-line/60 accent-primary"
              />
              <span className="text-sm sm:text-base font-bold text-ink leading-snug">
                Izinkan caregiver melihat hasil skrining harian dan menerima alert peringatan
              </span>
            </label>
            <p className="text-xs text-ink-soft pl-8">
              Sesuai aturan privasi, data kesehatan lansia hanya dibagikan dengan izin kedua belah pihak.
            </p>
          </div>
        </div>

        <div className="pt-6 pb-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full min-h-[56px] rounded-full bg-primary text-white text-base sm:text-lg font-bold hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all shadow-sm"
          >
            Hubungkan & Buka Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Tampilan Scan Kamera (Frame 05a)
  return (
    <div className="flex flex-col min-h-full flex-1 bg-paper text-ink p-6 select-none justify-between overflow-y-auto">
      <div className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="w-11 h-11 rounded-full border border-line/60 bg-surface flex items-center justify-center hover:bg-paper focus-visible:ring-4 focus-visible:ring-focus text-ink transition-colors shadow-xs"
          aria-label="Kembali ke formulir akun"
        >
          <ChevronLeftIcon size={22} />
        </button>

        <div className="space-y-1.5">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
            Hubungkan Lansia
          </h1>
          <p className="text-sm text-ink-soft">
            Arahkan kamera ke kode QR yang ditampilkan di ponsel orang tua Anda.
          </p>
        </div>

        {/* Viewfinder Kamera Scanner Simulasi */}
        <div className="w-full aspect-square max-w-[260px] mx-auto bg-ink rounded-3xl p-5 relative flex flex-col items-center justify-center gap-4 shadow-md">
          {/* 4 Sudut Viewfinder */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-paper rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-paper rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-paper rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-paper rounded-br-xl" />

          {/* Dummy QR target */}
          <div className="p-2.5 bg-white rounded-xl shadow opacity-90">
            <QrCodeSvg token="EV-8924" size={120} />
          </div>

          <button
            type="button"
            onClick={handleSimulateScan}
            className="text-xs bg-paper text-ink hover:bg-white rounded-full px-3 py-1.5 font-bold flex items-center gap-1.5 transition-colors"
          >
            <CameraIcon size={14} />
            <span>Simulasikan Pindai</span>
          </button>
        </div>

        {/* Opsi Input Manual */}
        <form onSubmit={handleManualSubmit} className="space-y-2 pt-1">
          <label htmlFor="manual-token" className="block text-xs sm:text-sm font-bold text-ink">
            Atau masukkan kode token manual:
          </label>
          <div className="flex gap-2">
            <input
              id="manual-token"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="contoh: EV-8924"
              className="flex-1 min-h-[44px] px-4 font-mono font-bold rounded-full border border-line/60 bg-surface text-ink focus:border-primary focus:outline-none text-sm"
            />
            <button
              type="submit"
              className="px-5 font-bold rounded-full bg-surface border border-line/60 hover:bg-paper text-ink text-sm transition-colors"
            >
              Hubungkan
            </button>
          </div>
        </form>
      </div>

      <div className="pt-6 pb-2">
        <button
          type="button"
          onClick={handleSimulateScan}
          className="w-full min-h-[56px] rounded-full bg-primary text-white text-base sm:text-lg font-bold hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all shadow-sm"
        >
          Pindai Sekarang
        </button>
      </div>
    </div>
  );
}
