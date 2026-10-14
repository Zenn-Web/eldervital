"use client";

import { useState } from "react";
import type { SignalDayData } from "../types";
import type { ResultStatus } from "@/lib/screening";
import StatusMark from "@/components/StatusMark";
import { cn } from "@/lib/utils";

interface SignalGridProps {
  days: SignalDayData[];
}

interface MetricRow {
  key: "energy" | "sleep" | "symptoms" | "activity";
  label: string;
  desc: string;
}

const METRICS: MetricRow[] = [
  { key: "energy", label: "Energi & Vitalitas", desc: "Kebugaran umum dan stamina" },
  { key: "sleep", label: "Kualitas Tidur", desc: "Keluhan terbangun atau tidur terganggu" },
  { key: "symptoms", label: "Gejala Pernapasan", desc: "Batuk, dahak, atau sesak" },
  { key: "activity", label: "Nafsu Makan & Gerak", desc: "Aktivitas fisik ringan dan makan" },
];

function MiniStatusMark({ status, title }: { status: ResultStatus; title: string }) {
  switch (status) {
    case "green":
      return (
        <span
          title={title}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ok-bg border-2 border-ok-mark text-ok-mark shrink-0"
          aria-label={title}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <circle cx="10" cy="10" r="7" />
          </svg>
        </span>
      );
    case "yellow":
      return (
        <span
          title={title}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-warn-bg border-2 border-warn-mark text-warn-mark shrink-0"
          aria-label={title}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2L18 17H2L10 2Z" />
          </svg>
        </span>
      );
    case "red":
      return (
        <span
          title={title}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-alert-bg border-2 border-alert-mark text-alert-mark shrink-0"
          aria-label={title}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <polygon points="6,2 14,2 18,6 18,14 14,18 6,18 2,14 2,6" />
          </svg>
        </span>
      );
    default:
      return (
        <span
          title={title}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-ink-soft/40 text-ink-soft shrink-0"
          aria-label={title}
        >
          <span className="h-2 w-2 rounded-full bg-ink-soft/40" />
        </span>
      );
  }
}

export default function SignalGrid({ days }: SignalGridProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    days[days.length - 1]?.date || ""
  );

  const selectedDay = days.find((d) => d.date === selectedDate) || days[days.length - 1];

  return (
    <section
      aria-labelledby="signal-grid-title"
      className="rounded-xl border border-line bg-surface p-4 sm:p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 id="signal-grid-title" className="text-lg sm:text-xl font-bold text-ink">
            Tren Sinyal Kesehatan (7 Hari)
          </h2>
          <p className="text-xs sm:text-sm text-ink-soft">
            Pemantauan multi-sinyal harian. Klik hari pada tabel untuk rincian catatan.
          </p>
        </div>

        {selectedDay && (
          <div className="text-xs text-ink-soft bg-paper px-3 py-1.5 rounded-lg border border-line self-start sm:self-auto">
            Menampilkan: <strong className="text-ink font-semibold">{selectedDay.dayName}</strong>
          </div>
        )}
      </div>

      {/* Grid Matriks Responsif */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <table className="w-full min-w-[540px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-2.5 px-3 font-semibold text-ink text-xs uppercase tracking-wider w-1/3">
                Sinyal / Parameter
              </th>
              {days.map((day) => {
                const isSelected = day.date === selectedDate;
                return (
                  <th
                    key={day.date}
                    scope="col"
                    onClick={() => setSelectedDate(day.date)}
                    className={cn(
                      "py-2 px-1 text-center font-medium cursor-pointer transition-colors rounded-t-lg",
                      isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-ink-soft hover:bg-paper"
                    )}
                  >
                    <div className="text-xs">{day.dayShort}</div>
                    {day.isToday && (
                      <span className="inline-block mt-0.5 text-[10px] bg-primary text-white px-1.5 py-0.2 rounded font-semibold">
                        Kini
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {METRICS.map((metric) => (
              <tr key={metric.key} className="hover:bg-paper/40 transition-colors">
                <th scope="row" className="py-3 px-3 font-medium text-ink">
                  <div className="text-sm font-semibold">{metric.label}</div>
                  <div className="text-xs text-ink-soft font-normal hidden sm:block">
                    {metric.desc}
                  </div>
                </th>
                {days.map((day) => {
                  const status = day[metric.key];
                  const isSelected = day.date === selectedDate;
                  const label = `${metric.label} pada ${day.dayName}: ${status}`;
                  return (
                    <td
                      key={day.date}
                      className={cn(
                        "py-1 px-1 text-center transition-colors",
                        isSelected ? "bg-primary/5" : ""
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDate(day.date)}
                        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-1 rounded-lg hover:bg-paper/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        aria-label={label}
                      >
                        <MiniStatusMark status={status} title={label} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kartu Detail Hari Terpilih */}
      {selectedDay && (
        <div className="rounded-lg border border-line bg-paper/60 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <StatusMark status={selectedDay.overall} size="sm" />
              <h3 className="text-sm font-bold text-ink">
                Rangkuman {selectedDay.dayName}
              </h3>
            </div>
            <span className="text-xs text-ink-soft font-medium">
              Status Keseluruhan:{" "}
              <strong className="text-ink">
                {selectedDay.overall === "green"
                  ? "Stabil"
                  : selectedDay.overall === "yellow"
                  ? "Perlu Pemantauan"
                  : selectedDay.overall === "red"
                  ? "Tanda Bahaya"
                  : "Data Belum Lengkap"}
              </strong>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-ink-soft">
            {selectedDay.notes || "Belum ada catatan khusus pada tanggal ini."}
          </p>
        </div>
      )}

      {/* Legenda Bentuk + Warna */}
      <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-soft">
        <span className="font-semibold text-ink">Panduan Simbol Geometris:</span>
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-ok-mark" aria-hidden="true" />
            Lingkaran: Stabil / Normal
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rotate-45 bg-warn-mark" aria-hidden="true" />
            Belah Ketupat: Perlu Pemantauan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-alert-mark" aria-hidden="true" />
            Segi Delapan: Perhatian Segera
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border border-dashed border-ink-soft" aria-hidden="true" />
            Titik: Belum Ada Data
          </span>
        </div>
      </div>
    </section>
  );
}
