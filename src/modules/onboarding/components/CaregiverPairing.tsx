import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <div className="flex flex-col min-h-screen justify-between p-6 max-w-md mx-auto text-ink">
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setStep("scan")}
            className="w-12 h-12 rounded-full border border-line bg-surface flex items-center justify-center hover:bg-paper focus-visible:ring-4 focus-visible:ring-focus text-ink transition-colors"
            aria-label="Kembali ke pemindai"
          >
            <ChevronLeftIcon size={24} />
          </button>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-ink leading-tight">
              Konfirmasi Hubungan
            </h1>
            <p className="text-base text-ink-soft">
              Kode QR berhasil dipindai. Pastikan nama lansia sudah sesuai sebelum melanjutkan.
            </p>
          </div>

          {/* Kartu Profil Lansia */}
          <Card className="p-5 border-2 border-line bg-surface rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-serif text-2xl font-bold shrink-0">
              {elderData.name[0]}
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-ink">
                {elderData.name}
              </h2>
              <p className="text-sm text-ink-soft">
                {elderData.ageRange} • {elderData.location}
              </p>
            </div>
          </Card>

          {/* Izin Berbagi Data */}
          <div className="p-4 rounded-xl border border-line bg-surface space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shareResults}
                onChange={(e) => setShareResults(e.target.checked)}
                className="w-6 h-6 mt-0.5 rounded border-2 border-line accent-primary"
              />
              <span className="text-base font-bold text-ink leading-snug">
                Izinkan caregiver melihat hasil skrining harian dan menerima alert peringatan
              </span>
            </label>
            <p className="text-xs text-ink-soft pl-9">
              Sesuai aturan privasi, data kesehatan lansia hanya dibagikan dengan izin kedua belah pihak.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-6 pb-2">
          <Button
            onClick={handleConfirm}
            size="lg"
            className="w-full text-lg font-bold rounded-2xl"
          >
            Hubungkan & Buka Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Tampilan Scan Kamera (Frame 05a)
  return (
    <div className="flex flex-col min-h-screen justify-between p-6 max-w-md mx-auto text-ink">
      <div className="space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="w-12 h-12 rounded-full border border-line bg-surface flex items-center justify-center hover:bg-paper focus-visible:ring-4 focus-visible:ring-focus text-ink transition-colors"
          aria-label="Kembali ke formulir akun"
        >
          <ChevronLeftIcon size={24} />
        </button>

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink leading-tight">
            Hubungkan Lansia
          </h1>
          <p className="text-base text-ink-soft">
            Arahkan kamera ke kode QR yang ditampilkan di ponsel orang tua Anda.
          </p>
        </div>

        {/* Viewfinder Kamera Scanner Simulasi */}
        <div className="w-full aspect-square max-w-[280px] mx-auto bg-ink rounded-3xl p-6 relative flex flex-col items-center justify-center gap-4 shadow-md">
          {/* 4 Sudut Viewfinder */}
          <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-paper rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-paper rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-paper rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-paper rounded-br-xl" />

          {/* Dummy QR target */}
          <div className="p-2.5 bg-white rounded-xl shadow opacity-90">
            <QrCodeSvg token="EV-8924" size={130} />
          </div>

          <Button
            type="button"
            onClick={handleSimulateScan}
            size="sm"
            className="text-xs bg-paper text-ink hover:bg-white border-0 font-bold gap-1.5"
          >
            <CameraIcon size={16} />
            <span>Simulasikan Pindai</span>
          </Button>
        </div>

        {/* Opsi Input Manual */}
        <form onSubmit={handleManualSubmit} className="space-y-3 pt-2">
          <label htmlFor="manual-token" className="block text-sm font-bold text-ink">
            Atau masukkan kode token manual:
          </label>
          <div className="flex gap-2">
            <input
              id="manual-token"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="contoh: EV-8924"
              className="flex-1 min-h-[3rem] px-4 font-mono font-bold rounded-xl border-2 border-line bg-surface text-ink focus:border-primary focus:outline-none"
            />
            <Button type="submit" variant="outline" className="px-5 font-bold">
              Hubungkan
            </Button>
          </div>
        </form>
      </div>

      <div className="pt-6 pb-2">
        <Button
          type="button"
          onClick={handleSimulateScan}
          size="lg"
          className="w-full text-lg font-bold rounded-2xl"
        >
          Pindai Sekarang
        </Button>
      </div>
    </div>
  );
}
