import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "@/components/shared/Icons";

interface ElderProfileFormProps {
  onSaved: (data: { displayName: string; ageRange: string }) => void;
  onBack: () => void;
}

const AGE_RANGES = [
  { id: "50-54", label: "50 – 54 tahun" },
  { id: "55-59", label: "55 – 59 tahun" },
  { id: "60-65", label: "60 – 65 tahun" },
  { id: "lebih-65", label: "Lebih dari 65 tahun" },
] as const;

export function ElderProfileForm({ onSaved, onBack }: ElderProfileFormProps) {
  const [name, setName] = useState("Bu Sari");
  const [ageRange, setAgeRange] = useState("60-65");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSaved({ displayName: name.trim(), ageRange });
  }

  return (
    <div className="flex flex-col min-h-screen justify-between p-6 max-w-md mx-auto text-ink">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <button
            type="button"
            onClick={onBack}
            className="w-12 h-12 rounded-full border border-line bg-surface flex items-center justify-center hover:bg-paper focus-visible:ring-4 focus-visible:ring-focus text-ink transition-colors"
            aria-label="Kembali ke pemilihan peran"
          >
            <ChevronLeftIcon size={24} />
          </button>

          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-ink leading-tight">
              Profil Anda
            </h1>
            <p className="text-lg text-ink-soft">
              Tidak perlu kata sandi. Cukup nama panggilan dan rentang usia agar sapaan lebih nyaman.
            </p>
          </div>

          {/* Input Nama Panggilan */}
          <div className="space-y-2">
            <label htmlFor="elder-name" className="block text-xl font-bold text-ink">
              Nama panggilan
            </label>
            <input
              id="elder-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Bu Sari atau Pak Budi"
              required
              autoComplete="name"
              className="w-full min-h-[3.75rem] px-4 py-3 text-xl rounded-xl border-2 border-line bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus font-sans"
            />
          </div>

          {/* Pilihan Usia Semantik (Fieldset + Radiogroup) */}
          <fieldset className="space-y-3 pt-2">
            <legend className="text-xl font-bold text-ink">
              Rentang usia
            </legend>
            <div
              role="radiogroup"
              aria-label="Pilihan rentang usia lansia"
              className="grid grid-cols-1 gap-2.5"
            >
              {AGE_RANGES.map((r) => {
                const selected = ageRange === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAgeRange(r.id)}
                    className={`w-full min-h-[3.75rem] px-5 py-3 rounded-xl border-2 text-left font-bold text-lg flex items-center justify-between transition-colors focus-visible:ring-4 focus-visible:ring-focus focus-visible:outline-none cursor-pointer ${
                      selected
                        ? "border-primary bg-primary text-white"
                        : "border-line bg-surface text-ink hover:border-ink hover:bg-paper"
                    }`}
                  >
                    <span>{r.label}</span>
                    <span
                      aria-hidden="true"
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected ? "border-white bg-white text-primary" : "border-line"
                      }`}
                    >
                      {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Tombol Simpan di dalam <form> */}
        <div className="space-y-3 pt-6 pb-2">
          <Button
            type="submit"
            size="senior"
            className="w-full text-xl font-bold rounded-2xl"
          >
            Lanjut: Hubungkan Keluarga
          </Button>
        </div>
      </form>
    </div>
  );
}
