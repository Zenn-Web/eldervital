"use client";

import React, { useState } from "react";
import { TimePicker } from "@/components/ui/time-picker";

interface ScheduleItem {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
}

const DEFAULT_ITEMS: ScheduleItem[] = [
  { id: "pagi", label: "Pagi", time: "07.00", enabled: true },
  { id: "siang", label: "Siang", time: "12.30", enabled: true },
  { id: "malam", label: "Malam", time: "19.00", enabled: false },
];

const PRESETS_BY_ID: Record<string, string[]> = {
  pagi: ["06.00", "06.30", "07.00", "07.30", "08.00"],
  siang: ["11.30", "12.00", "12.30", "13.00", "13.30"],
  malam: ["18.30", "19.00", "19.30", "20.00", "20.30"],
};

interface ScheduleSetupProps {
  displayName?: string;
  onFinish: (schedules: ScheduleItem[]) => void;
  onBack?: () => void;
}

export function ScheduleSetup({
  displayName,
  onFinish,
}: ScheduleSetupProps) {
  const [items, setItems] = useState<ScheduleItem[]>(DEFAULT_ITEMS);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  }

  function handleSaveTime(newTime: string) {
    if (!editingItemId) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingItemId
          ? { ...item, time: newTime, enabled: true }
          : item
      )
    );
    setEditingItemId(null);
  }

  const activeEditingItem = items.find((it) => it.id === editingItemId);

  // Extract salutation from displayName e.g. "Bu Sari" -> "Ibu", "Pak Budi" -> "Bapak"
  const salutation = displayName?.startsWith("Pak")
    ? "Bapak"
    : displayName?.startsWith("Bu")
      ? "Ibu"
      : "Ibu";

  return (
    <div className="flex flex-col min-h-full flex-1 bg-paper text-ink select-none overflow-y-auto">
      {/* Scrollable content area */}
      <div className="flex-1 flex flex-col p-5 sm:p-6 gap-4 sm:gap-5">
        {/* Title */}
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight pt-1">
          Boleh kami mengingatkan{" "}
          <span className="whitespace-nowrap">{salutation}?</span>
        </h1>

        {/* Schedule card */}
        <div className="rounded-2xl border border-line/60 bg-surface overflow-hidden divide-y divide-line/40 shadow-xs">
          {items.map((item) => (
            <div
              key={item.id}
              className="px-5 py-4 flex items-center justify-between gap-3"
            >
              {/* Label + time (clickable to edit) */}
              <button
                type="button"
                onClick={() => setEditingItemId(item.id)}
                className="flex flex-col gap-0.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg p-1 -m-1"
                aria-label={`Ubah jam pengingat ${item.label}, saat ini ${item.time}`}
              >
                <span className="font-serif text-lg font-bold text-ink leading-snug group-hover:text-primary transition-colors">
                  {item.label}
                </span>
                <span className="font-mono text-base text-ink-soft leading-none group-hover:underline">
                  {item.time} WIB
                </span>
              </button>

              {/* "Ubah" + Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItemId(item.id)}
                  className="text-sm font-semibold text-primary hover:underline px-2 py-1 rounded-md transition-colors min-h-[36px]"
                >
                  Ubah
                </button>

                {/* iOS-style toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={item.enabled}
                  aria-label={`Pengingat ${item.label} pukul ${item.time}`}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    backgroundColor: item.enabled ? "#2B3A6B" : "#DDD2BF",
                  }}
                  className="relative inline-flex h-[32px] w-[54px] shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus shadow-xs"
                >
                  <span
                    aria-hidden="true"
                    style={{
                      transform: item.enabled ? "translateX(22px)" : "translateX(0px)",
                    }}
                    className="pointer-events-none inline-block h-[26px] w-[26px] rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info box */}
        <div className="rounded-2xl border border-sogan/30 bg-sogan/10 p-4 flex flex-col gap-1.5">
          <p className="font-serif font-bold text-sm text-ink leading-snug">
            Ini pengingat, bukan anjuran periksa tiga kali sehari.
          </p>
          <p className="text-sm text-sogan-strong leading-relaxed">
            Cukup periksa saat {salutation} ingin atau merasa ada keluhan.
          </p>
        </div>
      </div>

      {/* Bottom CTA — sticky with safe padding */}
      <div className="px-5 sm:px-6 pb-6 pt-2 flex flex-col gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => onFinish(items)}
          className="w-full min-h-[54px] rounded-full bg-primary text-white text-base sm:text-lg font-bold hover:bg-primary-strong active:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all shadow-sm"
        >
          Izinkan notifikasi
        </button>

        <button
          type="button"
          onClick={() => onFinish(items)}
          className="w-full min-h-[42px] text-sm sm:text-base font-bold text-ink hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-full transition-colors text-center"
        >
          Nanti saja
        </button>
      </div>

      {/* Time Picker Modal */}
      {activeEditingItem && (
        <TimePicker
          isOpen={Boolean(editingItemId)}
          onClose={() => setEditingItemId(null)}
          onSave={handleSaveTime}
          initialTime={activeEditingItem.time}
          title={`Ubah Jam Pengingat ${activeEditingItem.label}`}
          subtitle={`Atur jam pengingat harian untuk ${salutation}`}
          presets={PRESETS_BY_ID[activeEditingItem.id] || []}
        />
      )}
    </div>
  );
}
