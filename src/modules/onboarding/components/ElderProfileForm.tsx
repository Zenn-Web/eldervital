import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, CheckIcon } from "@/components/shared/Icons";
import { AGE_RANGES, createElderProfile, type AgeRange } from "@/lib/auth/elder";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/supabase/errors";

interface ElderProfileFormProps {
  onSaved: (data: { displayName: string; ageRange: string }) => void;
  onBack: () => void;
}

export function ElderProfileForm({ onSaved, onBack }: ElderProfileFormProps) {
  const [salutation, setSalutation] = useState<"Bapak" | "Ibu">("Ibu");
  const [nickname, setNickname] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format sapaan dinamis (contoh: "Bu Sari" atau "Pak Budi")
  const prefix = salutation === "Ibu" ? "Bu" : "Pak";
  const cleanName = nickname.trim();
  const formattedDisplayName = cleanName.toLowerCase().startsWith(prefix.toLowerCase())
    ? cleanName
    : `${prefix} ${cleanName || (salutation === "Ibu" ? "Sari" : "Budi")}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    const data = { displayName: formattedDisplayName.slice(0, 60), ageRange: ageRange || "" };
    // Tanpa database: alur demo berjalan seperti sebelumnya (simulasi).
    if (!isSupabaseConfigured()) {
      onSaved(data);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Masuk anonim (bila belum) lalu membuat profil; aman diulang bila jaringan putus.
      await createElderProfile(data.displayName, ageRange || null);
      onSaved(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full flex-1 bg-paper text-ink p-6 select-none overflow-y-auto">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Tombol Back Sirkular Putih */}
          <div>
            <button
              type="button"
              onClick={onBack}
              className="w-11 h-11 rounded-full border border-line/60 bg-surface flex items-center justify-center hover:bg-paper/80 shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus text-ink transition-colors"
              aria-label="Kembali ke pemilihan peran"
            >
              <ChevronLeftIcon size={22} />
            </button>
          </div>

          {/* Judul & Penjelasan */}
          <div className="space-y-1">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
              Bapak/Ibu ingin dipanggil siapa?
            </h1>
            <p className="text-sm sm:text-base text-ink-soft">
              Tidak perlu email atau password.
            </p>
          </div>

          {/* Bagian Pilihan Sapaan (Bapak / Ibu) */}
          <div className="space-y-2 pt-1">
            <label className="block text-sm sm:text-base font-bold text-ink">
              Sapaan
            </label>
            <div
              className="flex items-center gap-3"
              role="radiogroup"
              aria-label="Pilih sapaan kehormatan"
            >
              <button
                type="button"
                role="radio"
                aria-checked={salutation === "Bapak"}
                onClick={() => setSalutation("Bapak")}
                className={`flex-1 min-h-[48px] rounded-full font-bold text-base border-2 transition-colors focus-visible:outline-none cursor-pointer ${
                  salutation === "Bapak"
                    ? "bg-primary border-primary text-white shadow-xs"
                    : "bg-surface border-line/80 text-ink hover:bg-paper hover:border-line"
                }`}
              >
                Bapak
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={salutation === "Ibu"}
                onClick={() => setSalutation("Ibu")}
                className={`flex-1 min-h-[48px] rounded-full font-bold text-base border-2 transition-colors focus-visible:outline-none cursor-pointer ${
                  salutation === "Ibu"
                    ? "bg-primary border-primary text-white shadow-xs"
                    : "bg-surface border-line/80 text-ink hover:bg-paper hover:border-line"
                }`}
              >
                Ibu
              </button>
            </div>
          </div>

          {/* Input Nama Panggilan */}
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="elder-nickname"
              className="block text-sm sm:text-base font-bold text-ink"
            >
              Nama panggilan
            </label>
            <input
              id="elder-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="contoh: Sari"
              required
              autoComplete="name"
              className="w-full min-h-[52px] px-4 py-3 text-base sm:text-lg font-medium rounded-xl border border-line/80 bg-surface text-ink placeholder:text-ink-soft/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus shadow-xs"
            />
            <p className="text-xs sm:text-sm text-ink-soft">
              Akan tampil sebagai &ldquo;{formattedDisplayName}&rdquo;.
            </p>
          </div>

          {/* Rentang Usia (Pilihan Kartu Angka yang Rapi & Proporsional) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-sm sm:text-base font-bold text-ink">
                Rentang usia <span className="text-xs sm:text-sm font-normal text-ink-soft">(boleh dilewati)</span>
              </label>
              {ageRange && (
                <button
                  type="button"
                  onClick={() => setAgeRange("")}
                  className="text-xs font-semibold text-primary hover:underline transition-colors focus-visible:outline-none"
                >
                  ✕ Batal pilih
                </button>
              )}
            </div>

            <div
              className="grid grid-cols-2 gap-2.5"
              role="radiogroup"
              aria-label="Pilih rentang usia lansia"
            >
              {[
                { value: "50-54" as AgeRange, range: "50 – 54", unit: "tahun", fullLabel: "50 sampai 54 tahun" },
                { value: "55-59" as AgeRange, range: "55 – 59", unit: "tahun", fullLabel: "55 sampai 59 tahun" },
                { value: "60-65" as AgeRange, range: "60 – 65", unit: "tahun", fullLabel: "60 sampai 65 tahun" },
                { value: "lebih-65" as AgeRange, range: "> 65", unit: "tahun", fullLabel: "Lebih dari 65 tahun" },
              ].map((item) => {
                const isSelected = ageRange === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={item.fullLabel}
                    onClick={() => setAgeRange(isSelected ? "" : item.value)}
                    className={`relative border-2 h-[68px] rounded-2xl transition-colors flex flex-col items-center justify-center cursor-pointer select-none focus-visible:outline-none ${
                      isSelected
                        ? "bg-primary border-primary text-white shadow-xs"
                        : "bg-surface border-line/80 text-ink hover:bg-paper hover:border-line active:bg-paper/80"
                    }`}
                  >
                    {/* Indikator centang di pojok kanan atas yang tidak menggeser posisi teks */}
                    {isSelected && (
                      <span className="absolute top-2 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-white">
                        <CheckIcon size={12} strokeWidth={2.5} />
                      </span>
                    )}
                    <span className="text-lg font-bold tracking-tight leading-tight">
                      {item.range}
                    </span>
                    <span
                      className={`text-xs font-medium mt-0.5 ${
                        isSelected ? "text-white/85" : "text-ink-soft"
                      }`}
                    >
                      {item.unit}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-ink-soft">
              {ageRange
                ? `Pilihan aktif: ${AGE_RANGES.find((a) => a.value === ageRange)?.label}`
                : "Opsional. Membantu penyesuaian saran pemantauan kesehatan lansia."}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-ink-soft">
            Profil disimpan untuk perangkat dan browser ini saja. Bila data browser dihapus atau
            ganti ponsel, profil tidak bisa dipulihkan sendiri dan perlu dibuat serta dihubungkan ulang.
          </p>
        </div>

        {/* Tombol Utama Buat Profil */}
        <div className="pt-8 pb-2 space-y-3">
          {error && (
            <p role="alert" className="rounded-2xl bg-alert-bg text-alert-ink px-4 py-3 text-sm font-bold">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={busy}
            size="senior"
            className="w-full min-h-[56px] text-lg font-bold rounded-full bg-primary hover:bg-primary-strong text-white shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all"
          >
            {busy ? "Membuat profil..." : "Buat profil"}
          </Button>
        </div>
      </form>
    </div>
  );
}
