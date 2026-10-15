"use client";

import React, { useState } from "react";
import {
  CalendarIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@/components/shared/Icons";
import { Button } from "./button";

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatReadableDateID(isoStr: string): string {
  if (!isoStr) return "";
  const [yStr, mStr, dStr] = isoStr.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  const d = parseInt(dStr, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return isoStr;
  return `${d} ${MONTH_NAMES_ID[m]?.slice(0, 3) || ""} ${y}`;
}

function parseIsoToParts(isoStr?: string): { year: number; month: number; day: number; formatted: string } {
  if (isoStr && /^\d{4}-\d{2}-\d{2}$/.test(isoStr)) {
    const [y, m, d] = isoStr.split("-").map(Number);
    return { year: y, month: m - 1, day: d, formatted: isoStr };
  }
  return { year: 2026, month: 9, day: 15, formatted: "2026-10-15" };
}

/* =========================================================================
   SINGLE DATE PICKER (Untuk Kunjungan, Jadwal Kontrol, dsb)
   ========================================================================= */

export interface DatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (isoDate: string) => void;
  selectedDate?: string; // "YYYY-MM-DD"
  minDate?: string;
  maxDate?: string;
  title?: string;
  subtitle?: string;
}

export function DatePicker(props: DatePickerProps) {
  if (!props.isOpen) return null;
  return <DatePickerModal {...props} />;
}

function DatePickerModal({
  onClose,
  onSelect,
  selectedDate,
  minDate,
  maxDate,
  title = "Pilih Tanggal",
  subtitle = "Pilih tanggal yang sesuai",
}: DatePickerProps) {
  const initial = parseIsoToParts(selectedDate);
  const [currentYear, setCurrentYear] = useState(initial.year);
  const [currentMonth, setCurrentMonth] = useState(initial.month);
  const [picked, setPicked] = useState<string>(initial.formatted);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handleSelectDay = (day: number) => {
    const iso = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    setPicked(iso);
  };

  const handleApply = () => {
    onSelect(picked);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="date-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h2 id="date-picker-title" className="text-lg font-bold text-ink font-serif leading-tight">
                {title}
              </h2>
              {subtitle && <p className="text-xs text-ink-soft">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label="Tutup pemilih tanggal"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line/60 bg-surface hover:bg-paper text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus shadow-xs"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeftIcon size={16} />
          </button>

          <span className="font-serif font-bold text-base text-ink">
            {MONTH_NAMES_ID[currentMonth]} {currentYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line/60 bg-surface hover:bg-paper text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus shadow-xs"
            aria-label="Bulan berikutnya"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-xl border border-line/60 bg-paper/50 p-2.5">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-soft pb-1 border-b border-line/40">
            {DAY_NAMES_ID.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 pt-1.5 text-center text-sm">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 w-9" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const iso = `${currentYear}-${(currentMonth + 1)
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
              const isSelected = picked === iso;
              const isDisabled = Boolean(
                (minDate && iso < minDate) || (maxDate && iso > maxDate)
              );

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center font-medium transition-all text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                    isSelected
                      ? "bg-primary text-white font-bold shadow-xs scale-105"
                      : isDisabled
                      ? "text-ink-soft/40 cursor-not-allowed"
                      : "text-ink hover:bg-surface border border-transparent hover:border-line/60"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Summary & Direct Fallback */}
        <div className="flex items-center justify-between text-xs text-ink-soft bg-paper/60 px-3 py-2 rounded-xl border border-line/60">
          <span>Tanggal Terpilih:</span>
          <strong className="text-primary font-bold">{formatReadableDateID(picked)}</strong>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line/60">
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
            onClick={handleApply}
            className="rounded-full bg-primary text-white font-bold min-h-[44px] px-5 gap-1.5 shadow-xs"
          >
            <CheckIcon size={16} />
            <span>Pilih Tanggal</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   DATE RANGE PICKER (Untuk Riwayat Pemeriksaan, Filter Periode, dsb)
   ========================================================================= */

export interface DateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (startIso: string, endIso: string) => void;
  initialStart?: string; // "YYYY-MM-DD"
  initialEnd?: string; // "YYYY-MM-DD"
  title?: string;
}

export function DateRangePicker(props: DateRangePickerProps) {
  if (!props.isOpen) return null;
  return <DateRangePickerModal {...props} />;
}

function DateRangePickerModal({
  onClose,
  onApply,
  initialStart = "",
  initialEnd = "",
  title = "Pilih Rentang Periode",
}: DateRangePickerProps) {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);

  // Preset Handlers
  const handlePreset = (type: "today" | "7days" | "30days" | "month") => {
    const today = new Date();
    const endStr = formatIsoDate(today);

    if (type === "today") {
      setStart(endStr);
      setEnd(endStr);
      return;
    }

    if (type === "7days") {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setStart(formatIsoDate(past));
      setEnd(endStr);
      return;
    }

    if (type === "30days") {
      const past = new Date();
      past.setDate(past.getDate() - 29);
      setStart(formatIsoDate(past));
      setEnd(endStr);
      return;
    }

    if (type === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStart(formatIsoDate(firstDay));
      setEnd(endStr);
      return;
    }
  };

  const handleApply = () => {
    if (start && end && start > end) {
      // Auto flip if start > end
      onApply(end, start);
    } else {
      onApply(start, end);
    }
    onClose();
  };

  const handleReset = () => {
    setStart("");
    setEnd("");
    onApply("", "");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="range-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarIcon size={18} />
            </div>
            <div>
              <h2 id="range-picker-title" className="text-lg font-bold text-ink font-serif leading-tight">
                {title}
              </h2>
              <p className="text-xs text-ink-soft">
                Tentukan rentang tanggal pemeriksaan yang ingin ditampilkan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            aria-label="Tutup pemilih rentang tanggal"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-ink-soft block">
            Pilihan Periode Populer:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handlePreset("today")}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold border border-line/60 bg-surface hover:bg-paper text-ink transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handlePreset("7days")}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold border border-line/60 bg-surface hover:bg-paper text-ink transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => handlePreset("30days")}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold border border-line/60 bg-surface hover:bg-paper text-ink transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              30 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => handlePreset("month")}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold border border-line/60 bg-surface hover:bg-paper text-ink transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Bulan Ini
            </button>
          </div>
        </div>

        {/* Dual Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-line/60 bg-paper/50">
          <div className="space-y-1.5">
            <label htmlFor="range-start-date" className="block text-xs font-bold text-ink">
              Mulai Tanggal:
            </label>
            <input
              id="range-start-date"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs sm:text-sm font-mono text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus shadow-xs"
            />
            {start && (
              <span className="text-[11px] text-ink-soft block font-medium">
                {formatReadableDateID(start)}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="range-end-date" className="block text-xs font-bold text-ink">
              Sampai Tanggal:
            </label>
            <input
              id="range-end-date"
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs sm:text-sm font-mono text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus shadow-xs"
            />
            {end && (
              <span className="text-[11px] text-ink-soft block font-medium">
                {formatReadableDateID(end)}
              </span>
            )}
          </div>
        </div>

        {/* Period Summary Indicator */}
        {start && end && (
          <div className="text-xs text-ink-soft bg-primary/5 border border-primary/20 px-3.5 py-2 rounded-xl flex items-center justify-between">
            <span>Rentang Aktif:</span>
            <strong className="text-primary font-bold">
              {formatReadableDateID(start)} &ndash; {formatReadableDateID(end)}
            </strong>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-line/60">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-ink-soft hover:text-alert-ink underline font-medium px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-md"
          >
            Reset Semua Waktu
          </button>

          <div className="flex items-center gap-2">
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
              onClick={handleApply}
              disabled={!start && !end}
              className="rounded-full bg-primary text-white font-bold min-h-[44px] px-5 gap-1.5 shadow-xs disabled:opacity-50"
            >
              <CheckIcon size={16} />
              <span>Terapkan Periode</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
