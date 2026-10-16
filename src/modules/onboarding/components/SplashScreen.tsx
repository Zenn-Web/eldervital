"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ElderVitalLogo } from "@/components/shared/ElderVitalLogo";

interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  // Looping otomatis animasi intro dengan ritme yang tenang, halus, dan nyaman dibaca
  const [animKey, setAnimKey] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Siklus tenang & profesional:
    // Animasi mekar (~1.4s), tampil stabil dan terbaca nyaman (~2.4s),
    // lalu dissolve halus (350ms) sebelum siklus berikutnya.
    const loopInterval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setAnimKey((prev) => prev + 1);
        setIsFading(false);
      }, 350);
    }, 3800);

    return () => clearInterval(loopInterval);
  }, []);

  return (
    <div
      className="flex flex-col min-h-full flex-1 bg-paper text-ink select-none overflow-y-auto relative"
      role="region"
      aria-label="Layar Pembuka ElderVital"
    >
      {/* Background Ambient Lighting & Pattern Gerbang */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glow lingkaran hangat di belakang logo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-b from-primary/10 via-sogan/10 to-transparent blur-3xl opacity-70 animate-pulse duration-1000" />

        {/* Lengkungan garis halus dekoratif di latar belakang */}
        <svg
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[340px] h-[340px] text-line/40 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M 20 190 L 20 100 A 80 80 0 0 1 180 100 L 180 190"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      {/* Spasi atas yang bersih dan profesional */}
      <div className="pt-6 shrink-0" />

      {/* Area Tengah: Logo Animasi & Identitas Brand ElderVital (Looping Halus) */}
      <div
        key={animKey}
        className={`relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-6 text-center my-auto transition-opacity duration-300 ${
          isFading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Logomark Resmi ElderVital dengan Animasi Komponen Asli */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="relative p-3 rounded-3xl bg-surface/80 border border-line/50 shadow-sm">
            <ElderVitalLogo
              size={112}
              animated={true}
              className="drop-shadow-xs"
            />
          </div>
        </div>

        {/* Wordmark "ElderVital" dengan Pewarnaan Resmi (Indigo + Sogan) */}
        <div className="flex items-baseline justify-center font-bold tracking-tight select-none">
          <span
            className="text-4xl sm:text-5xl text-[#293A68] animate-wordmark-elder"
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
          >
            Elder
          </span>
          <span
            className="text-4xl sm:text-5xl text-[#C7643B] animate-wordmark-vital ml-0.5"
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
          >
            Vital
          </span>
        </div>

        {/* Tagline Pendamping Kesehatan */}
        <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-[280px] mt-3 animate-tagline-fade font-medium">
          Skrining gejala harian untuk Bapak/Ibu dan keluarga yang mendampingi.
        </p>

        {/* Indikator Garis Progres Halus */}
        <div className="w-36 h-1 bg-line/60 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-sogan rounded-full animate-intro-progress" />
        </div>
      </div>

      {/* Area Bawah: Tombol Mulai & Footer (Tanpa Tombol Ulangi Animasi) */}
      <div className="relative z-20 px-6 pb-6 pt-2 shrink-0 space-y-3 max-w-sm w-full mx-auto">
        <Button
          onClick={onStart}
          size="senior"
          className="w-full min-h-[56px] text-lg font-bold rounded-full bg-primary hover:bg-primary-strong text-white shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all duration-200 active:scale-[0.99]"
        >
          Mulai Skrining
        </Button>

        <p className="text-xs text-center text-ink-soft font-medium pt-1">
          ElderVital &bull; Aman &amp; Ramah Lansia
        </p>

       
      </div>
    </div>
  );
}
