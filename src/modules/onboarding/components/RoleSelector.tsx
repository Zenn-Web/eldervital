import React from "react";
import { ChevronRightIcon, ChevronLeftIcon } from "@/components/shared/Icons";

interface RoleSelectorProps {
  onSelectRole: (role: "lansia" | "caregiver") => void;
  onBack?: () => void;
}

export function RoleSelector({ onSelectRole, onBack }: RoleSelectorProps) {
  return (
    <div className="flex flex-col min-h-screen justify-between p-6 max-w-md mx-auto text-ink">
      <div className="space-y-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-12 h-12 rounded-full border border-line bg-surface flex items-center justify-center hover:bg-paper focus-visible:ring-4 focus-visible:ring-focus text-ink transition-colors"
            aria-label="Kembali ke layar awal"
          >
            <ChevronLeftIcon size={24} />
          </button>
        )}

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink leading-tight">
            Pilih Peran Anda
          </h1>
          <p className="text-lg text-ink-soft">
            Pilih cara penggunaan yang paling sesuai untuk Anda hari ini.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* Opsi Lansia */}
          <button
            type="button"
            onClick={() => onSelectRole("lansia")}
            className="w-full text-left rounded-2xl border-2 border-line bg-surface p-5 hover:border-primary active:border-primary hover:bg-paper active:bg-paper transition-colors flex flex-col gap-2 group focus-visible:ring-4 focus-visible:ring-focus focus-visible:outline-none cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-serif text-2xl font-bold text-ink group-hover:text-primary">
                Saya yang diperiksa
              </span>
              <span className="w-8 h-8 rounded-full bg-paper flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                <ChevronRightIcon size={18} />
              </span>
            </div>
            <p className="text-base text-ink-soft leading-normal">
              Mulai pemeriksaan mandiri dengan suara atau tombol besar, atau minta keluarga mendampingi.
            </p>
          </button>

          {/* Opsi Caregiver */}
          <button
            type="button"
            onClick={() => onSelectRole("caregiver")}
            className="w-full text-left rounded-2xl border-2 border-line bg-surface p-5 hover:border-primary active:border-primary hover:bg-paper active:bg-paper transition-colors flex flex-col gap-2 group focus-visible:ring-4 focus-visible:ring-focus focus-visible:outline-none cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-serif text-2xl font-bold text-ink group-hover:text-primary">
                Saya keluarga / caregiver
              </span>
              <span className="w-8 h-8 rounded-full bg-paper flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                <ChevronRightIcon size={18} />
              </span>
            </div>
            <p className="text-base text-ink-soft leading-normal">
              Lihat perubahan kondisi orang tua, terima alert tren gejala, dan bantu mencatat jawaban pemeriksaan.
            </p>
          </button>
        </div>
      </div>

      <p className="text-xs text-center text-ink-soft pt-6 pb-2">
        ElderVital membantu pemantauan dan skrining gejala, bukan diagnosis medis.
      </p>
    </div>
  );
}
