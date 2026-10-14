import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "@/components/shared/Icons";

interface CaregiverAuthFormProps {
  onSuccess: (user: { name: string; email: string }) => void;
  onBack: () => void;
}

export function CaregiverAuthForm({
  onSuccess,
  onBack,
}: CaregiverAuthFormProps) {
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState("Rina Lestari");
  const [email, setEmail] = useState("rina.lestari@email.com");
  const [password, setPassword] = useState("password123");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    onSuccess({
      name: isRegister ? name.trim() : "Caregiver Demo",
      email: email.trim(),
    });
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
              {isRegister ? "Daftar Akun Caregiver" : "Masuk ke Akun"}
            </h1>
            <p className="text-base text-ink-soft">
              {isRegister
                ? "Daftar untuk memantau perubahan kondisi lansia dan menerima pemberitahuan alert."
                : "Selamat datang kembali. Masuk untuk melihat dashboard keluarga."}
            </p>
          </div>

          {/* Tab Switcher Semantik */}
          <div
            role="tablist"
            aria-label="Mode akun caregiver"
            className="flex p-1 bg-paper rounded-xl border border-line"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-center font-bold text-base rounded-lg transition-colors ${
                isRegister
                  ? "bg-surface text-primary shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Daftar Baru
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 text-center font-bold text-base rounded-lg transition-colors ${
                !isRegister
                  ? "bg-surface text-primary shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Sudah Punya Akun
            </button>
          </div>

          {/* Form Input Fields */}
          <div className="space-y-4 pt-2">
            {isRegister && (
              <div className="space-y-1.5">
                <label
                  htmlFor="caregiver-name"
                  className="block text-base font-bold text-ink"
                >
                  Nama Lengkap
                </label>
                <input
                  id="caregiver-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  required
                  autoComplete="name"
                  className="w-full min-h-[3.25rem] px-4 py-3 rounded-xl border-2 border-line bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus font-sans text-base"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="caregiver-email"
                className="block text-base font-bold text-ink"
              >
                Alamat Email
              </label>
              <input
                id="caregiver-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                autoComplete="email"
                className="w-full min-h-[3.25rem] px-4 py-3 rounded-xl border-2 border-line bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus font-sans text-base"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="caregiver-pw"
                className="block text-base font-bold text-ink"
              >
                Kata Sandi
              </label>
              <input
                id="caregiver-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="w-full min-h-[3.25rem] px-4 py-3 rounded-xl border-2 border-line bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus font-sans text-base"
              />
            </div>
          </div>
        </div>

        {/* Tombol Submit di dalam <form> */}
        <div className="space-y-3 pt-6 pb-2">
          <Button
            type="submit"
            size="lg"
            className="w-full text-lg font-bold rounded-2xl"
          >
            {isRegister ? "Daftar & Hubungkan Lansia" : "Masuk ke Dashboard"}
          </Button>
        </div>
      </form>
    </div>
  );
}
