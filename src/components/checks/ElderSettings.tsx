"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useElderSession } from "@/components/session/ElderSession";
import { AGE_RANGES, deleteElderProfile, updateElderProfile, type AgeRange } from "@/lib/auth/elder";
import { errorMessage } from "@/lib/supabase/errors";

const FIELD =
  "w-full min-h-[60px] px-4 text-lg rounded-2xl border border-line/80 bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus";
const PRIMARY =
  "w-full min-h-[60px] rounded-2xl bg-primary text-white text-lg font-bold hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:opacity-70";
const SECONDARY =
  "w-full min-h-[60px] rounded-2xl border-2 border-ink/70 bg-surface text-ink text-lg font-bold hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:opacity-70 flex items-center justify-center";

/**
 * Pengaturan sederhana lansia (spesifikasi 11.1): nama dan usia, caregiver terhubung, dan
 * keluar dari profil. Karena lansia tidak punya akun, keluar = menghapus profil beserta
 * seluruh datanya, jadi konfirmasinya dibuat tegas.
 */
export default function ElderSettings() {
  const router = useRouter();
  const { configured, profile, setProfile } = useElderSession();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [age, setAge] = useState<AgeRange | "">(profile?.ageRange ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!configured || !profile) {
    return (
      <section className="space-y-4 max-w-md mx-auto py-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Pengaturan</h1>
        <p className="rounded-xl bg-warn-bg text-warn-ink px-3 py-2 text-sm font-bold">
          Simulasi: pengaturan profil membutuhkan database yang belum tersambung.
        </p>
      </section>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      setProfile(await updateElderProfile(profile, { displayName: name, ageRange: age || null }));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      await deleteElderProfile(profile);
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 max-w-md mx-auto pb-12">
      <h1 className="font-serif text-3xl font-bold text-ink">Pengaturan</h1>

      {error && (
        <p role="alert" className="rounded-2xl bg-alert-bg text-alert-ink px-4 py-3 text-base font-bold">
          {error}
        </p>
      )}

      <form onSubmit={save} className="space-y-4" aria-labelledby="profil-saya">
        <h2 id="profil-saya" className="font-serif text-xl font-bold text-ink">
          Profil saya
        </h2>
        <div className="space-y-2">
          <label htmlFor="nama" className="block text-base font-bold text-ink">
            Nama panggilan
          </label>
          <input id="nama" className={FIELD} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="usia" className="block text-base font-bold text-ink">
            Usia (boleh dilewati)
          </label>
          <select id="usia" className={FIELD} value={age} onChange={(e) => setAge(e.target.value as AgeRange | "")}>
            <option value="">Tidak diisi</option>
            {AGE_RANGES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        {saved && (
          <p role="status" className="text-base font-bold text-ok-ink">
            Profil tersimpan.
          </p>
        )}
        <button type="submit" disabled={busy || name.trim() === ""} className={PRIMARY}>
          {busy ? "Menyimpan..." : "Simpan profil"}
        </button>
      </form>

      <section className="space-y-3" aria-labelledby="caregiver-saya">
        <h2 id="caregiver-saya" className="font-serif text-xl font-bold text-ink">
          Caregiver
        </h2>
        <Link href="/lansia/hubungkan" className={SECONDARY}>
          Hubungkan atau atur caregiver
        </Link>
      </section>

      <section className="space-y-3" aria-labelledby="keluar">
        <h2 id="keluar" className="font-serif text-xl font-bold text-ink">
          Keluar dari profil
        </h2>
        {confirmDelete ? (
          <div className="space-y-3 rounded-2xl border-2 border-alert-mark bg-alert-bg/40 p-4" role="group" aria-labelledby="yakin">
            <p id="yakin" className="text-base font-bold text-alert-ink">
              Semua riwayat pemeriksaan, jadwal, dan hubungan dengan caregiver akan terhapus dan tidak bisa
              dikembalikan. Lanjutkan?
            </p>
            <button type="button" disabled={busy} onClick={remove} className={SECONDARY}>
              {busy ? "Menghapus..." : "Ya, hapus profil saya"}
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className={SECONDARY}>
              Batal
            </button>
          </div>
        ) : (
          <>
            <p className="text-base text-ink-soft">
              Profil ini tidak memakai akun. Keluar berarti menghapus profil dari perangkat ini beserta seluruh datanya.
            </p>
            <button type="button" onClick={() => setConfirmDelete(true)} className={SECONDARY}>
              Keluar dan hapus profil
            </button>
          </>
        )}
      </section>
    </div>
  );
}
