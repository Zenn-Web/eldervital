"use client";

import { useState } from "react";
import type { FollowUpAction, FollowUpType } from "../types";
import { Button } from "@/components/ui/button";
import { CloseIcon } from "@/components/shared/Icons";

interface FollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (action: Omit<FollowUpAction, "id" | "recordedAt">) => void;
  elderName: string;
}

const ACTION_OPTIONS: Array<{
  type: FollowUpType;
  label: string;
  desc: string;
}> = [
  {
    type: "call",
    label: "Sudah menelepon / menghubungi lansia",
    desc: "Menanyakan langsung kondisi fisik, keluhan, dan memastikan lansia merasa aman.",
  },
  {
    type: "medicine",
    label: "Ingatkan minum obat rutin & anjurkan istirahat",
    desc: "Memastikan jadwal obat harian tidak terlewat dan asupan cairan hangat cukup.",
  },
  {
    type: "visit",
    label: "Jadwalkan kunjungan / periksa ke faskes",
    desc: "Rencana mengantar lansia ke Puskesmas terdekat atau memanggil bidan/dokter keluarga.",
  },
  {
    type: "recheck",
    label: "Minta lansia check-in ulang sore/malam nanti",
    desc: "Pemeriksaan gejala berkala untuk memastikan batuk atau keluhan tidak memburuk.",
  },
  {
    type: "other",
    label: "Tindakan lainnya",
    desc: "Catatan khusus atau koordinasi dengan anggota keluarga lainnya.",
  },
];

export default function FollowUpDialog({
  isOpen,
  onClose,
  onSave,
  elderName,
}: FollowUpDialogProps) {
  const [selectedType, setSelectedType] = useState<FollowUpType>("call");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOption = ACTION_OPTIONS.find((opt) => opt.type === selectedType);
    onSave({
      elderId: "elder-sari-01",
      type: selectedType,
      typeLabel: selectedOption?.label || "Tindak Lanjut",
      note: note.trim(),
      caregiverName: "Hanafi (Caregiver)",
    });
    setNote("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 id="dialog-title" className="text-xl font-bold text-ink">
              Catat Tindak Lanjut
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft">
              Respons pendampingan untuk <strong className="text-ink">{elderName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-soft hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus transition-colors"
            aria-label="Tutup dialog"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink">
              Pilih Jenis Tindakan Respons:
            </legend>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {ACTION_OPTIONS.map((opt) => (
                <label
                  key={opt.type}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedType === opt.type
                      ? "border-primary bg-primary/5 text-ink"
                      : "border-line bg-paper/50 hover:bg-paper text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="actionType"
                    value={opt.type}
                    checked={selectedType === opt.type}
                    onChange={() => setSelectedType(opt.type)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="text-sm font-bold leading-tight">{opt.label}</div>
                    <div className="text-xs text-ink-soft mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="followup-note" className="block text-sm font-semibold text-ink">
              Catatan Tambahan (Opsional):
            </label>
            <textarea
              id="followup-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Ibu mengatakan dahak mulai encer setelah minum air jahe hangat..."
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-line text-ink"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-primary text-white"
            >
              Simpan Tindak Lanjut
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
