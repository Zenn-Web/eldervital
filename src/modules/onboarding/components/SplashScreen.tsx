import React from "react";
import { Button } from "@/components/ui/button";
import { ElderVitalLogo } from "@/components/shared/Icons";

interface SplashScreenProps {
  onStart: () => void;
}

function KawungBatikPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full text-white pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="kawung-splash" width="44" height="44" patternUnits="userSpaceOnUse">
          {/* Kelopak 4 Lingkaran Berpotongan */}
          <circle cx="22" cy="22" r="15" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.14" />
          <circle cx="0" cy="0" r="15" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.14" />
          <circle cx="44" cy="0" r="15" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.14" />
          <circle cx="0" cy="44" r="15" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.14" />
          <circle cx="44" cy="44" r="15" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.14" />
          {/* Titik Aksesori Motif Tradisional */}
          <circle cx="22" cy="22" r="2.5" fill="currentColor" opacity="0.2" />
          <circle cx="0" cy="22" r="1.8" fill="currentColor" opacity="0.15" />
          <circle cx="44" cy="22" r="1.8" fill="currentColor" opacity="0.15" />
          <circle cx="22" cy="0" r="1.8" fill="currentColor" opacity="0.15" />
          <circle cx="22" cy="44" r="1.8" fill="currentColor" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#kawung-splash)" />
    </svg>
  );
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <div className="flex flex-col min-h-full flex-1 bg-paper text-ink select-none overflow-y-auto">
      {/* Bagian Atas: Batik Indigo dengan Pola Kawung & Cutout Gerbang */}
      <div className="relative w-full h-64 sm:h-72 bg-primary flex flex-col justify-end overflow-hidden shrink-0">
        <KawungBatikPattern />

        {/* Siluet Gerbang / Lengkungan Tradisional (Arch Cutout) */}
        <div className="relative w-full leading-none z-10">
          <svg
            viewBox="0 0 400 90"
            fill="none"
            preserveAspectRatio="none"
            className="w-full text-paper fill-current block -mb-[1px]"
            aria-hidden="true"
          >
            <path d="M 0 90 L 0 55 L 125 55 L 125 35 L 148 35 C 148 8, 172 2, 200 2 C 228 2, 252 8, 252 35 L 275 35 L 275 55 L 400 55 L 400 90 Z" />
          </svg>
        </div>
      </div>

      {/* Bagian Bawah: Logo Gerbang, Tipografi & Tombol Aksi */}
      <div className="flex-1 flex flex-col justify-between px-6 pt-0 pb-6 text-center">
        {/* Konten Utama */}
        <div className="flex flex-col items-center -mt-6 sm:-mt-8 z-20">
          {/* Logo Gapura ElderVital Nestled di Lengkungan */}
          <div className="w-16 h-16 flex items-center justify-center mb-2">
            <ElderVitalLogo size={46} className="text-primary" />
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            ElderVital
          </h1>

          <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-[270px] mt-2.5">
            Skrining gejala harian untuk Bapak/Ibu dan keluarga yang mendampingi.
          </p>
        </div>

        {/* Tombol Utama & Disclaimer */}
        <div className="space-y-3 pt-6 max-w-xs w-full mx-auto">
          <Button
            onClick={onStart}
            size="senior"
            className="w-full min-h-[56px] text-lg font-bold rounded-full bg-primary hover:bg-primary-strong text-white shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all"
          >
            Mulai
          </Button>

          <p className="text-xs text-center text-ink-soft">
            ElderVital bukan alat diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}
