import React from "react";
import { Card } from "@/components/ui/card";

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
          <Card
            onClick={() => onSelectRole("lansia")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectRole("lansia");
              }
            }}
            className="cursor-pointer border-2 border-line hover:border-primary active:border-primary hover:bg-[#F9F5EC] transition-colors p-5 rounded-2xl flex flex-col gap-2 group focus-visible:ring-4 focus-visible:ring-focus focus-visible:outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-2xl font-bold text-ink group-hover:text-primary">
                Saya yang diperiksa
              </span>
              <span className="w-8 h-8 rounded-full bg-paper flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                ➔
              </span>
            </div>
            <p className="text-base text-ink-soft leading-normal">
              Mulai pemeriksaan mandiri dengan suara atau tombol besar, atau minta keluarga mendampingi.
            </p>
          </Card>

          {/* Opsi Caregiver */}
          <Card
            onClick={() => onSelectRole("caregiver")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectRole("caregiver");
              }
            }}
            className="cursor-pointer border-2 border-line hover:border-primary active:border-primary hover:bg-[#F9F5EC] transition-colors p-5 rounded-2xl flex flex-col gap-2 group focus-visible:ring-4 focus-visible:ring-focus focus-visible:outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-2xl font-bold text-ink group-hover:text-primary">
                Saya keluarga / caregiver
              </span>
              <span className="w-8 h-8 rounded-full bg-paper flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                ➔
              </span>
            </div>
            <p className="text-base text-ink-soft leading-normal">
              Lihat perubahan kondisi orang tua, terima alert tren gejala, dan bantu mencatat jawaban pemeriksaan.
            </p>
          </Card>
        </div>
      </div>

      <p className="text-xs text-center text-ink-soft pt-6 pb-2">
        ElderVital membantu pemantauan dan skrining gejala, bukan diagnosis medis.
      </p>
    </div>
  );
}
