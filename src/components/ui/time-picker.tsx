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
  subtitle = "Atur jam pengingat pemeriksaan harian",
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
    // Standard format for app is "HH.MM"
    const formatted = `${pad2(hour)}.${pad2(minute)}`;
    onSave(formatted);
    onClose();
  };

  const period = getTimePeriodLabel(hour);
  const formattedDisplay = `${pad2(hour)}:${pad2(minute)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="time-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClockIcon size={18} />
            </div>
            <div>
              <h2 id="time-picker-title" className="text-lg font-bold text-ink font-serif leading-tight">
                {title}
              </h2>
              {subtitle && <p className="text-xs text-ink-soft">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label="Tutup pemilih waktu"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Big Interactive Steppers */}
        <div className="rounded-xl border border-line/60 bg-paper/60 p-4 flex flex-col items-center gap-3">
          {/* Period Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-ink text-xs font-semibold border border-line/60 shadow-xs">
            <span>{period.icon}</span>
            <span>Waktu {period.label}</span>
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-4 my-1">
            {/* Hour Block */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementHour}
                className="flex h-11 w-14 items-center justify-center rounded-t-xl bg-surface hover:bg-paper border border-line/60 text-ink font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus transition-colors active:scale-95 shadow-xs"
                aria-label="Tambah 1 jam"
              >
                +
              </button>
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center bg-surface border-x border-line/60 font-mono text-3xl sm:text-4xl font-bold text-primary">
                {pad2(hour)}
              </div>
              <button
                type="button"
                onClick={decrementHour}
                className="flex h-11 w-14 items-center justify-center rounded-b-xl bg-surface hover:bg-paper border border-line/60 text-ink font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus transition-colors active:scale-95 shadow-xs"
                aria-label="Kurangi 1 jam"
              >
                &minus;
              </button>
              <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mt-1.5">
                Jam (00-23)
              </span>
            </div>

            {/* Colon Separator */}
            <div className="text-3xl sm:text-4xl font-bold text-ink-soft pb-6 font-mono select-none">
              :
            </div>

            {/* Minute Block */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={incrementMinute}
                className="flex h-11 w-14 items-center justify-center rounded-t-xl bg-surface hover:bg-paper border border-line/60 text-ink font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus transition-colors active:scale-95 shadow-xs"
                aria-label="Tambah 5 menit"
              >
                +
              </button>
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center bg-surface border-x border-line/60 font-mono text-3xl sm:text-4xl font-bold text-primary">
                {pad2(minute)}
              </div>
              <button
                type="button"
                onClick={decrementMinute}
                className="flex h-11 w-14 items-center justify-center rounded-b-xl bg-surface hover:bg-paper border border-line/60 text-ink font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus transition-colors active:scale-95 shadow-xs"
                aria-label="Kurangi 5 menit"
              >
                &minus;
              </button>
              <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mt-1.5">
                Menit (00-59)
              </span>
            </div>
          </div>

          {/* Native HTML Time Input for direct typing / accessibility */}
          <div className="flex items-center gap-2 pt-1">
            <label htmlFor="native-time-input" className="text-xs text-ink-soft">
              Atau ketik langsung:
            </label>
            <input
              id="native-time-input"
              type="time"
              value={`${pad2(hour)}:${pad2(minute)}`}
              onChange={(e) => {
                if (e.target.value) {
                  const { hour: h, minute: m } = parseTimeToParts(e.target.value);
                  setHour(h);
                  setMinute(m);
                }
              }}
              className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-mono font-semibold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>
        </div>

        {/* Quick Presets */}
        {presets.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-ink-soft block">
              Pilihan Cepat Waktu:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const normP = p.replace(":", ".");
                const isCurrent = `${pad2(hour)}.${pad2(minute)}` === normP;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-colors border min-h-[36px] ${
                      isCurrent
                        ? "bg-primary text-white border-primary font-bold shadow-xs"
                        : "bg-surface hover:bg-paper border-line text-ink"
                    }`}
                  >
                    {normP}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full border-line/60 text-ink min-h-[44px] px-4 font-semibold"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            className="rounded-full bg-primary text-white font-bold min-h-[44px] px-5 gap-1.5 shadow-xs"
          >
            <CheckIcon size={16} />
            <span>Simpan ({formattedDisplay} WIB)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
