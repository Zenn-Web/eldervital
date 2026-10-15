import React from "react";
import { ChevronLeftIcon, SolidUserIcon, SolidUsersIcon } from "@/components/shared/Icons";

interface RoleSelectorProps {
  onSelectRole: (role: "lansia" | "caregiver") => void;
  onBack?: () => void;
}

export function RoleSelector({ onSelectRole, onBack }: RoleSelectorProps) {
  return (
    <div className="flex flex-col min-h-full flex-1 bg-paper text-ink select-none overflow-y-auto">
      {/* Header Indigo dengan Lengkungan Arsitektural */}
      <div className="relative w-full bg-primary pt-6 sm:pt-8 px-6 text-white shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Kembali ke layar awal"
          >
            <ChevronLeftIcon size={20} />
          </button>
        )}

        <div className="space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Selamat datang
          </h1>
          <p className="text-sm sm:text-base text-white/90">
            Siapa yang memakai ponsel ini?
          </p>
        </div>

        {/* Siluet Gerbang / Lengkungan Tradisional (Arch Cutout) */}
        <div className="relative w-full leading-none mt-5 sm:mt-6 -mx-6 px-6">
          <svg
            viewBox="0 0 400 60"
            fill="none"
            preserveAspectRatio="none"
            className="w-full text-paper fill-current block -mb-[1px]"
            aria-hidden="true"
          >
            <path d="M 0 60 L 0 35 L 125 35 L 125 20 L 148 20 C 148 2, 172 0, 200 0 C 228 0, 252 2, 252 20 L 275 20 L 275 35 L 400 35 L 400 60 Z" />
          </svg>
        </div>
      </div>

      {/* Bagian Pilihan Kartu Peran & Footer */}
      <div className="flex-1 flex flex-col justify-between px-6 pt-3 pb-6">
        <div className="space-y-4">
          {/* Opsi Kartu Lansia */}
          <button
            type="button"
            onClick={() => onSelectRole("lansia")}
            className="w-full text-left rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 shadow-xs hover:border-primary/60 hover:shadow-md active:bg-paper/80 transition-all flex flex-col items-start gap-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus cursor-pointer"
          >
            <div className="text-sogan mb-1">
              <SolidUserIcon size={30} />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Saya lansia
            </h2>
            <p className="text-sm sm:text-base text-ink-soft leading-normal">
              Tanpa login. Profil dihubungkan ke keluarga lewat kode QR.
            </p>
          </button>

          {/* Opsi Kartu Caregiver */}
          <button
            type="button"
            onClick={() => onSelectRole("caregiver")}
            className="w-full text-left rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 shadow-xs hover:border-primary/60 hover:shadow-md active:bg-paper/80 transition-all flex flex-col items-start gap-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus cursor-pointer"
          >
            <div className="text-primary mb-1">
              <SolidUsersIcon size={30} />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Saya caregiver
            </h2>
            <p className="text-sm sm:text-base text-ink-soft leading-normal">
              Keluarga atau pendamping. Masuk dengan email.
            </p>
          </button>
        </div>

        {/* Footer Disclaimer */}
        <p className="text-xs text-center text-ink-soft pt-6 pb-2">
          ElderVital membantu skrining gejala dan bukan alat diagnosis.
        </p>
      </div>
    </div>
  );
}
