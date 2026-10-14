import React, { useState } from "react";
import { Button } from "@/components/ui/button";

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
      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="w-full min-h-[3.75rem] px-4 py-3 text-xl rounded-xl border-2 border-line bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus font-sans"
          />
        </div>

        {/* Pilihan Usia */}
        <div className="space-y-3 pt-2">
          <span className="block text-xl font-bold text-ink">
            Rentang usia
          </span>
          <div className="grid grid-cols-1 gap-2.5">
            {AGE_RANGES.map((r) => {
              const selected = ageRange === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setAgeRange(r.id)}
                  className={`w-full min-h-[3.25rem] px-5 py-3 rounded-xl border-2 text-left font-bold text-lg flex items-center justify-between transition-colors ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface text-ink hover:border-ink hover:bg-paper"
                  }`}
                >
                  <span>{r.label}</span>
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selected ? "border-white bg-white text-primary" : "border-line"
                    }`}
                  >
                    {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </form>

      <div className="pt-6 pb-2">
        <Button
          type="button"
          onClick={handleSubmit}
          size="senior"
          className="w-full text-xl font-bold rounded-2xl"
        >
          Lanjut ke Kode QR
        </Button>
      </div>
    </div>
  );
}
