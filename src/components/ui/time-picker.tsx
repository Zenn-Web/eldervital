"use client";

import React, { useState } from "react";
import { ClockIcon, CloseIcon, CheckIcon } from "@/components/shared/Icons";
import { Button } from "./button";

export interface TimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timeFormatted: string) => void;
  initialTime?: string; // "07:00" or "07.00"
  title?: string;
  subtitle?: string;
  presets?: string[]; // e.g. ["06:30", "07:00", "07:30", "08:00"]
}

function parseTimeToParts(timeStr: string): { hour: number; minute: number } {
  if (!timeStr) return { hour: 7, minute: 0 };
  const normalized = timeStr.replace(".", ":");
  const [hStr, mStr] = normalized.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  return {
    hour: isNaN(h) ? 7 : Math.min(23, Math.max(0, h)),
    minute: isNaN(m) ? 0 : Math.min(59, Math.max(0, m)),
  };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function getTimePeriodLabel(hour: number): { label: string; icon: string } {
  if (hour >= 4 && hour < 11) return { label: "Pagi", icon: "🌅" };
  if (hour >= 11 && hour < 15) return { label: "Siang", icon: "☀️" };
  if (hour >= 15 && hour < 18) return { label: "Sore", icon: "🌇" };
  return { label: "Malam", icon: "🌙" };
}

export function TimePicker(props: TimePickerProps) {
  if (!props.isOpen) return null;
  return <TimePickerModal {...props} />;
}

function TimePickerModal({
  onClose,
  onSave,
  initialTime = "07.00",
  title = "Pilih Waktu",
  subtitle = "Atur jam pengingat harian",
  presets = ["06.30", "07.00", "07.30", "08.00"],
}: TimePickerProps) {
  const [hour, setHour] = useState(() => parseTimeToParts(initialTime).hour);
  const [minute, setMinute] = useState(() => parseTimeToParts(initialTime).minute);

  const incrementHour = () => setHour((h) => (h + 1) % 24);
  const decrementHour = () => setHour((h) => (h - 1 + 24) % 24);
  const incrementMinute = () => setMinute((m) => (m + 5) % 60);
  const decrementMinute = () => setMinute((m) => (m - 5 + 60) % 60);

  const applyPreset = (preset: string) => {
    const { hour: h, minute: m } = parseTimeToParts(preset);
    setHour(h);
    setMinute(m);
  };

  const handleSave = () => {
    // Format standar aplikasi adalah "HH.MM"
    const formatted = `${pad2(hour)}.${pad2(minute)}`;
    onSave(formatted);
    onClose();
  };

  const period = getTimePeriodLabel(hour);
  const formattedDisplay = `${pad2(hour)}.${pad2(minute)}`;

  // Tentukan jumlah kolom grid preset yang simetris (4 kolom untuk 4 item, 3 kolom untuk 3/6 item)
  const gridColsClass =
    presets.length === 3 || presets.length === 6
      ? "grid-cols-3"
      : "grid-cols-4";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="time-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm rounded-3xl border border-line/60 bg-surface p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClockIcon size={20} />
            </div>
            <div>
              <h2 id="time-picker-title" className="text-lg sm:text-xl font-bold text-ink font-serif leading-tight">
                {title}
              </h2>
              {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label="Tutup pemilih waktu"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Stepper Waktu yang Besar, Jelas & Ramah Sentuhan */}
        <div className="rounded-2xl border border-line/60 bg-paper/60 p-4 sm:p-5 flex flex-col items-center gap-3.5">
          {/* Badge Penanda Periode Hari (Pagi, Siang, Sore, Malam) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-ink text-xs font-bold border border-line/70 shadow-2xs">
            <span>{period.icon}</span>
            <span>Waktu {period.label}</span>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 my-0.5">
            {/* Blok Jam */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementHour}
                className="flex h-11 w-16 items-center justify-center rounded-xl bg-surface hover:bg-paper border-2 border-line/70 text-ink font-bold text-xl focus-visible:outline-none transition-colors active:scale-95 shadow-2xs"
                aria-label="Tambah 1 jam"
              >
                +
              </button>
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center font-mono text-4xl sm:text-5xl font-bold text-primary select-none">
                {pad2(hour)}
              </div>
              <button
                type="button"
                onClick={decrementHour}
                className="flex h-11 w-16 items-center justify-center rounded-xl bg-surface hover:bg-paper border-2 border-line/70 text-ink font-bold text-xl focus-visible:outline-none transition-colors active:scale-95 shadow-2xs"
                aria-label="Kurangi 1 jam"
              >
                &minus;
              </button>
              <span className="text-xs font-bold text-ink-soft mt-1.5 uppercase tracking-wide">
                Jam
              </span>
            </div>

            {/* Pemisah Titik Dua */}
            <div className="text-4xl sm:text-5xl font-bold text-primary pb-6 font-mono select-none">
              :
            </div>

            {/* Blok Menit */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementMinute}
                className="flex h-11 w-16 items-center justify-center rounded-xl bg-surface hover:bg-paper border-2 border-line/70 text-ink font-bold text-xl focus-visible:outline-none transition-colors active:scale-95 shadow-2xs"
                aria-label="Tambah 5 menit"
              >
                +
              </button>
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center font-mono text-4xl sm:text-5xl font-bold text-primary select-none">
                {pad2(minute)}
              </div>
              <button
                type="button"
                onClick={decrementMinute}
                className="flex h-11 w-16 items-center justify-center rounded-xl bg-surface hover:bg-paper border-2 border-line/70 text-ink font-bold text-xl focus-visible:outline-none transition-colors active:scale-95 shadow-2xs"
                aria-label="Kurangi 5 menit"
              >
                &minus;
              </button>
              <span className="text-xs font-bold text-ink-soft mt-1.5 uppercase tracking-wide">
                Menit
              </span>
            </div>
          </div>
        </div>

        {/* Pilihan Cepat Waktu yang Simetris & Rapi */}
        {presets.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-ink-soft block">
              Pilihan Cepat Waktu:
            </span>
            <div className={`grid ${gridColsClass} gap-2`}>
              {presets.map((p) => {
                const normP = p.replace(":", ".");
                const isCurrent = `${pad2(hour)}.${pad2(minute)}` === normP;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`h-11 rounded-xl text-xs sm:text-sm font-mono font-bold transition-colors border-2 flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-surface hover:bg-paper border-line/70 text-ink"
                    }`}
                  >
                    {normP}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tombol Aksi Bawah yang Proporsional */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full rounded-full border-2 border-line/80 text-ink min-h-[48px] font-bold text-sm hover:bg-paper transition-colors"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            className="w-full rounded-full bg-primary hover:bg-primary-strong text-white font-bold min-h-[48px] text-sm gap-1.5 shadow-sm transition-colors flex items-center justify-center"
          >
            <CheckIcon size={16} />
            <span>Simpan ({formattedDisplay})</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
