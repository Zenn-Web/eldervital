import React, { useState } from "react";
import { ChevronLeftIcon } from "@/components/shared/Icons";
import {
  signInCaregiver,
  signInCaregiverWithGoogle,
  signUpCaregiver,
} from "@/lib/auth/caregiver";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/supabase/errors";

interface CaregiverAuthFormProps {
  onSuccess: (user: { name: string; email: string }) => void;
  onBack: () => void;
}

export function CaregiverAuthForm({
  onSuccess,
  onBack,
}: CaregiverAuthFormProps) {
  const [isRegister, setIsRegister] = useState(true);
  // Kosong: formulir login tidak boleh terisi kredensial contoh.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    // Tanpa database: alur demo berjalan seperti sebelumnya (simulasi).
    if (!isSupabaseConfigured()) {
      onSuccess({ name: isRegister ? name.trim() : "Caregiver Demo", email: email.trim() });
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (isRegister) {
        const { needsConfirmation } = await signUpCaregiver(name.trim(), email.trim(), password);
        if (needsConfirmation) {
          setInfo("Akun dibuat. Buka email konfirmasi dari Supabase, lalu kembali ke sini dan masuk.");
          setIsRegister(false);
          return;
        }
      } else {
        await signInCaregiver(email.trim(), password);
      }
      onSuccess({ name: name.trim(), email: email.trim() });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!isSupabaseConfigured()) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await signInCaregiverWithGoogle();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full flex-1 bg-paper text-ink p-6 select-none justify-between overflow-y-auto">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 rounded-full border border-line/60 bg-surface flex items-center justify-center hover:bg-paper focus-visible:ring-4 focus-visible:ring-focus text-ink transition-colors shadow-xs"
            aria-label="Kembali ke pemilihan peran"
          >
            <ChevronLeftIcon size={22} />
          </button>

          <div className="space-y-1.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
              {isRegister ? "Daftar Akun Caregiver" : "Masuk ke Akun"}
            </h1>
            <p className="text-sm text-ink-soft">
              {isRegister
                ? "Daftar untuk memantau kondisi lansia dan menerima sinyal peringatan."
                : "Selamat datang kembali. Masuk untuk melihat dashboard keluarga."}
            </p>
          </div>

          {/* Tab Switcher Semantik */}
          <div
            role="tablist"
            aria-label="Mode akun caregiver"
            className="flex p-1 bg-surface rounded-full border border-line/60"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 text-center font-bold text-sm sm:text-base rounded-full transition-colors ${
                isRegister
                  ? "bg-primary text-white shadow-sm"
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
              className={`flex-1 py-2 text-center font-bold text-sm sm:text-base rounded-full transition-colors ${
                !isRegister
                  ? "bg-primary text-white shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Sudah Punya Akun
            </button>
          </div>

          {/* Form Input Fields */}
          <div className="space-y-4 pt-1">
            {isRegister && (
              <div className="space-y-1.5">
                <label
                  htmlFor="caregiver-name"
                  className="block text-sm font-bold text-ink"
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
                  className="w-full min-h-[52px] px-4 py-3 rounded-2xl border border-line/60 bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus font-sans text-base shadow-xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="caregiver-email"
                className="block text-sm font-bold text-ink"
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
                className="w-full min-h-[52px] px-4 py-3 rounded-2xl border border-line/60 bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus font-sans text-base shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="caregiver-pw"
                className="block text-sm font-bold text-ink"
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
                className="w-full min-h-[52px] px-4 py-3 rounded-2xl border border-line/60 bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus font-sans text-base shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Tombol Submit */}
        <div className="pt-6 pb-2 space-y-3">
          {error && (
            <p role="alert" className="rounded-2xl bg-alert-bg text-alert-ink px-4 py-3 text-sm font-bold">
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="rounded-2xl bg-surface border border-line/60 px-4 py-3 text-sm text-ink">
              {info}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[56px] rounded-full bg-primary text-white text-base sm:text-lg font-bold hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all shadow-sm disabled:opacity-70"
          >
            {busy ? "Memproses..." : isRegister ? "Daftar & Hubungkan Lansia" : "Masuk ke Dashboard"}
          </button>
          {isSupabaseConfigured() && (
            <>
              <div className="flex items-center gap-3 text-xs font-bold text-ink-soft" aria-hidden="true">
                <span className="h-px flex-1 bg-line/60" />
                <span>atau</span>
                <span className="h-px flex-1 bg-line/60" />
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={busy}
                className="w-full min-h-[56px] rounded-full border border-line/60 bg-surface text-ink text-base sm:text-lg font-bold hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all shadow-xs disabled:opacity-70 flex items-center justify-center gap-3"
              >
                <span aria-hidden="true" className="font-sans text-xl font-black text-[#4285F4]">
                  G
                </span>
                {busy ? "Menghubungkan..." : "Lanjutkan dengan Google"}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
