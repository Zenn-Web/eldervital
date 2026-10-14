import React from "react";
import { Button } from "@/components/ui/button";

interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <div className="flex flex-col min-h-screen justify-between p-6 max-w-md mx-auto text-ink">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 my-auto">
        {/* Brand Logo Symbol */}
        <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-sm">
          <svg
            width="56"
            height="56"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
            className="text-white"
          >
            {/* Elegant pulse & heart blossom */}
            <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="2.5" />
            <path
              d="M11 20h4l3-6 5 12 3-6h4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-ink">
            ElderVital
          </h1>
          <p className="font-serif text-xl font-bold text-sogan leading-snug">
            Perhatikan perubahan kecil.<br />Tetap terhubung.
          </p>
          <p className="text-base text-ink-soft leading-relaxed max-w-xs mx-auto">
            Pemeriksaan gejala harian untuk usia 50–65 tahun. Mandiri dengan suara atau didampingi keluarga.
          </p>
        </div>
      </div>

      <div className="space-y-4 pt-6 pb-2">
        <Button
          onClick={onStart}
          size="senior"
          className="w-full text-xl font-bold rounded-2xl"
        >
          Mulai Sekarang
        </Button>
        <p className="text-xs text-center text-ink-soft">
          ElderVital memberi skrining gejala, bukan diagnosis medis.
        </p>
      </div>
    </div>
  );
}
