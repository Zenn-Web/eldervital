"use client";

import React from "react";

export interface ElderVitalLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  animated?: boolean | "intro" | "loop";
}

/**
 * Logomark resmi ElderVital:
 * Siluet gerbang/lengkungan indigo pelindung (rumah/gapura) dengan dua figur
 * lansia (terakota hangat) dan pendamping/keluarga (sienna/sogan hangat) di dalamnya.
 * Sesuai desain referensi visual resmi.
 */
export function ElderVitalLogo({
  size = 56,
  className = "",
  animated = false,
  ...props
}: ElderVitalLogoProps) {
  const isIntro = animated === true || animated === "intro";
  const isLoop = animated === "loop";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo ElderVital"
      className={`shrink-0 overflow-visible ${
        isLoop ? "animate-logo-loop-1500" : ""
      } ${className}`}
      {...props}
    >
      <defs>
        {/* Efek pendaran hangat di dalam pintu gerbang saat animasi */}
        <radialGradient
          id="doorway-glow"
          cx="50%"
          cy="80%"
          r="60%"
          fx="50%"
          fy="80%"
        >
          <stop offset="0%" stopColor="#C7643B" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#293A68" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#293A68" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cahaya hangat di latar gerbang */}
      <circle
        cx="512"
        cy="650"
        r="280"
        fill="url(#doorway-glow)"
        className={
          isLoop
            ? "animate-doorway-glow-loop-1500"
            : isIntro
            ? "animate-doorway-pulse"
            : ""
        }
      />

      {/* Lengkungan Gerbang Luar & Bukaan Pintu (Arch Outer & Doorway Opening) */}
      <path
        fill="#293A68"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 192 880 L 192 480 A 320 320 0 0 1 832 480 L 832 880 H 632 L 632 540 A 120 120 0 0 0 392 540 L 392 880 Z"
        className={
          isLoop
            ? "animate-arch-breath-loop-1500 origin-bottom"
            : isIntro
            ? "animate-arch-scale origin-bottom"
            : ""
        }
      />

      {/* Figur Lansia (Kiri - Terakota Hangat) */}
      <g
        className={
          isLoop
            ? "animate-figures-breath-loop-1500 origin-bottom"
            : isIntro
            ? "animate-figure-elder origin-bottom"
            : ""
        }
      >
        {/* Kepala Lansia */}
        <circle cx="479" cy="704" r="44" fill="#C7643B" />
        {/* Bahu & Badan Lansia */}
        <path
          fill="#C7643B"
          d="M 420 880 L 420 824 A 59 59 0 0 1 539 824 L 539 880 Z"
        />
      </g>

      {/* Figur Pendamping / Caregiver (Kanan - Sienna/Sogan Hangat) */}
      <g
        className={
          isLoop
            ? "animate-caregiver-breath-loop-1500 origin-bottom"
            : isIntro
            ? "animate-figure-caregiver origin-bottom"
            : ""
        }
      >
        {/* Kepala Pendamping */}
        <circle cx="586" cy="769" r="29" fill="#923E1C" />
        {/* Bahu & Badan Pendamping */}
        <path
          fill="#923E1C"
          d="M 548 880 L 548 845 A 38 38 0 0 1 624 845 L 624 880 Z"
        />
      </g>
    </svg>
  );
}

/**
 * Brand Logo Lengkap (Logomark + Wordmark "ElderVital"):
 * Digunakan untuk header, splash screen, kartu profil, dsb.
 */
export function ElderVitalBrand({
  size = "md",
  animated = false,
  className = "",
  showTagline = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
  showTagline?: boolean;
}) {
  const iconSizes = {
    sm: 32,
    md: 46,
    lg: 64,
    xl: 88,
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl",
    xl: "text-4xl sm:text-5xl",
  };

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="inline-flex items-center gap-3 sm:gap-3.5">
        <ElderVitalLogo size={iconSizes[size]} animated={animated} />
        <div className="flex items-baseline font-bold tracking-tight select-none">
          <span
            className={`${textSizes[size]} text-[#293A68] ${
              animated ? "animate-wordmark-elder" : ""
            }`}
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
          >
            Elder
          </span>
          <span
            className={`${textSizes[size]} text-[#C7643B] ${
              animated ? "animate-wordmark-vital" : ""
            }`}
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
          >
            Vital
          </span>
        </div>
      </div>
      {showTagline && (
        <p
          className={`text-xs sm:text-sm text-ink-soft mt-1.5 font-medium tracking-wide text-center ${
            animated ? "animate-tagline-fade" : ""
          }`}
        >
          Pendamping Kesehatan Lansia & Keluarga
        </p>
      )}
    </div>
  );
}
