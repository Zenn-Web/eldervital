import { useState } from "react";
import type { FollowUpAction, FollowUpType } from "../types";
import { Button } from "@/components/ui/button";
import { CloseIcon, CalendarIcon, ClockIcon } from "@/components/shared/Icons";
import { DatePicker, formatReadableDateID } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

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
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("09.00");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOption = ACTION_OPTIONS.find((opt) => opt.type === selectedType);
    let finalDate = scheduledDate;
    if (selectedType === "visit" && !finalDate) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      finalDate = d.toISOString().slice(0, 10);
    }

    onSave({
      elderId: "elder-sari-01",
      type: selectedType,
      typeLabel: selectedOption?.label || "Tindak Lanjut",
      note: note.trim(),
      caregiverName: "Hanafi (Caregiver)",
      scheduledDate: selectedType === "visit" ? finalDate : undefined,
      scheduledTime:
        selectedType === "visit" || selectedType === "recheck" || selectedType === "medicine"
          ? scheduledTime
          : undefined,
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
        className="w-full max-w-lg rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3">
          <div>
            <h2 id="dialog-title" className="text-xl font-bold text-ink font-serif">
              Catat Tindak Lanjut
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft">
              Respons pendampingan untuk <strong className="text-ink">{elderName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus transition-colors"
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
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedType === opt.type
                      ? "border-primary bg-primary/5 text-ink"
                      : "border-line/60 bg-paper/50 hover:bg-paper text-ink"
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

          {/* Scheduling box for Faskes Visit */}
          {selectedType === "visit" && (
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-primary block">
                Jadwal Kunjungan Faskes / Dokter:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Tanggal Kunjungan */}
                <div>
                  <label className="text-[11px] font-semibold text-ink-soft block mb-1">
                    Tanggal Kunjungan:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(true)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface border border-line text-xs font-medium text-ink hover:bg-paper transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-primary" />
                      <span>{formatReadableDateID(scheduledDate || "2026-10-16")}</span>
                    </span>
                    <span className="text-primary text-[11px] font-semibold">Ubah</span>
                  </button>
                </div>

                {/* Jam Kunjungan */}
                <div>
                  <label className="text-[11px] font-semibold text-ink-soft block mb-1">
                    Jam Kunjungan:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTimePickerOpen(true)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface border border-line text-xs font-medium text-ink hover:bg-paper transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <ClockIcon size={14} className="text-primary" />
                      <span>{scheduledTime} WIB</span>
                    </span>
                    <span className="text-primary text-[11px] font-semibold">Ubah</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scheduling box for Recheck / Medicine */}
          {(selectedType === "recheck" || selectedType === "medicine") && (
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-primary block">
                {selectedType === "recheck"
                  ? "Waktu Rencana Check-in Ulang:"
                  : "Waktu Pengingat Minum Obat:"}
              </span>
              <button
                type="button"
                onClick={() => setIsTimePickerOpen(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface border border-line text-xs font-medium text-ink hover:bg-paper transition-colors min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus shadow-xs"
              >
                <span className="flex items-center gap-2 font-mono font-bold text-sm text-primary">
                  <ClockIcon size={16} />
                  <span>{scheduledTime} WIB</span>
                </span>
                <span className="text-primary text-xs font-semibold">Ubah Jam</span>
              </button>
            </div>
          )}

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
              className="w-full rounded-xl border border-line/60 bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-line/60 text-ink rounded-full"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-primary text-white rounded-full font-bold"
            >
              Simpan Tindak Lanjut
            </Button>
          </div>
        </form>
      </div>

      {/* DatePicker Modal */}
      <DatePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelect={(iso) => setScheduledDate(iso)}
        selectedDate={scheduledDate || "2026-10-16"}
        title="Pilih Tanggal Kunjungan"
        subtitle={`Rencana periksa faskes untuk ${elderName}`}
      />

      {/* TimePicker Modal */}
      <TimePicker
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        onSave={(time) => setScheduledTime(time)}
        initialTime={scheduledTime}
        title="Pilih Waktu Tindak Lanjut"
        subtitle="Tentukan jam rencana respons pendampingan"
        presets={
          selectedType === "visit"
            ? ["08.00", "09.00", "10.00", "14.00"]
            : selectedType === "recheck"
            ? ["15.00", "16.30", "19.00", "20.00"]
            : ["07.00", "12.30", "18.30", "21.00"]
        }
      />
    </div>
  );
}
