import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ScheduleSetupProps {
  onFinish: (schedules: typeof DEFAULT_ITEMS) => void;
  onBack?: () => void;
}

const DEFAULT_ITEMS = [
  { id: "pagi", label: "Pagi", time: "07.00", enabled: true },
  { id: "siang", label: "Siang", time: "12.30", enabled: true },
  { id: "malam", label: "Malam", time: "19.00", enabled: true },
];

export function ScheduleSetup({ onFinish, onBack }: ScheduleSetupProps) {
  const [items, setItems] = useState(DEFAULT_ITEMS);

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  }

  return (
    <div className="flex flex-col min-h-screen justify-between p-6 max-w-md mx-auto text-ink">
      <div className="space-y-6">
        {onBack && (
          <button
            type="button"
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
            Boleh kami mengingatkan Ibu/Bapak?
          </h1>
          <p className="text-lg text-ink-soft">
            Pengingat santai agar pemeriksaan gejala tidak terlewatkan.
          </p>
        </div>

        {/* Daftar Jadwal */}
        <Card className="p-0 border-2 border-line bg-surface rounded-2xl overflow-hidden divide-y divide-line">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 flex items-center justify-between gap-4"
            >
              <div>
                <span className="font-serif text-2xl font-bold text-ink block">
                  {item.label}
                </span>
                <span className="text-xl text-ink font-mono font-medium">
                  Pukul {item.time}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`w-16 h-10 rounded-full p-1 transition-colors flex items-center ${
                  item.enabled ? "bg-primary justify-end" : "bg-line/60 justify-start"
                }`}
                aria-label={`Toggle pengingat ${item.label}`}
              >
                <span className="w-8 h-8 rounded-full bg-white shadow-sm block" />
              </button>
            </div>
          ))}
        </Card>

        <p className="text-sm text-ink-soft leading-relaxed">
          Pengingat hanya mengajak Anda melakukan pemeriksaan di aplikasi. Anda dapat mengubah jadwal kapan saja di menu Pengaturan.
        </p>
      </div>

      <div className="pt-6 pb-2">
        <Button
          onClick={() => onFinish(items)}
          size="senior"
          className="w-full text-xl font-bold rounded-2xl"
        >
          Selesai & Buka Beranda
        </Button>
      </div>
    </div>
  );
}
