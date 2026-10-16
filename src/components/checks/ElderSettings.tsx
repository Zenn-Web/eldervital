"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useElderSession } from "@/components/session/ElderSession";
import {
  CheckIcon,
  SunIcon,
  SunsetIcon,
  MoonIcon,
  ClockIcon,
} from "@/components/shared/Icons";
import {
  deleteElderProfile,
  updateElderProfile,
  type AgeRange,
} from "@/lib/auth/elder";
import {
  getStoredReminders,
  commitStoredReminders,
  type StoredReminder,
} from "@/lib/reminders";
import { TimePicker } from "@/components/ui/time-picker";
import { errorMessage } from "@/lib/supabase/errors";

const FIELD =
  "w-full min-h-[60px] px-4 text-lg rounded-2xl border border-line/80 bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus";
const PRIMARY =
  "w-full min-h-[60px] rounded-2xl bg-primary text-white text-lg font-bold hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:opacity-70 transition-colors flex items-center justify-center";
const SECONDARY =
  "w-full min-h-[60px] rounded-2xl border-2 border-ink/70 bg-surface text-ink text-lg font-bold hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:opacity-70 flex items-center justify-center transition-colors";
const DANGER =
  "w-full min-h-[60px] rounded-2xl bg-alert-mark text-white text-lg font-bold hover:bg-alert-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:opacity-70 flex items-center justify-center transition-colors shadow-xs";
const OUTLINE_DANGER =
  "w-full min-h-[60px] rounded-2xl border-2 border-alert-mark/50 bg-surface text-alert-ink text-lg font-bold hover:bg-alert-bg/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:opacity-70 flex items-center justify-center transition-colors";

const PRESETS_BY_ID: Record<string, string[]> = {
  pagi: ["06.30", "07.00", "07.30", "08.00"],
  siang: ["12.00", "12.30", "13.00", "13.30"],
  malam: ["19.00", "19.30", "20.00", "20.30"],
};

function getPeriodTheme(id: string, label: string) {
  const key = (id + " " + label).toLowerCase();
  if (key.includes("pagi")) {
    return {
      Icon: SunIcon,
      iconBg: "bg-amber-500/15 text-amber-800",
    };
  }
  if (key.includes("siang")) {
    return {
      Icon: SunsetIcon,
      iconBg: "bg-orange-500/15 text-orange-800",
    };
  }
  if (key.includes("malam")) {
    return {
      Icon: MoonIcon,
      iconBg: "bg-primary/10 text-primary",
    };
  }
  return {
    Icon: ClockIcon,
    iconBg: "bg-paper text-ink-soft",
  };
}

function subscribeToReminders(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("eldervital:reminders-updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("eldervital:reminders-updated", callback);
    window.removeEventListener("storage", callback);
  };
}

function getRemindersSnapshot() {
  return JSON.stringify(getStoredReminders());
}

function getServerSnapshot() {
  return JSON.stringify(getStoredReminders());
}

/**
 * Pengaturan sederhana lansia: nama, usia, jadwal pengingat, caregiver terhubung,
 * dan keluar dari profil. Bekerja baik dalam mode simulasi lokal maupun saat terhubung database.
 */
export default function ElderSettings() {
  const router = useRouter();
  const { configured, profile, setProfile } = useElderSession();

  const isDemo = !configured || !profile;

  const [name, setName] = useState(() => {
    if (profile?.displayName) return profile.displayName;
    if (typeof window !== "undefined") {
      return localStorage.getItem("eldervital_demo_name") || "Bu Sari";
    }
    return "Bu Sari";
  });

  const [age, setAge] = useState<AgeRange | "">(() => {
    if (profile?.ageRange) return profile.ageRange;
    if (typeof window !== "undefined") {
      return (localStorage.getItem("eldervital_demo_age") as AgeRange) || "60-65";
    }
    return "60-65";
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Jadwal pengingat
  const rawReminders = useSyncExternalStore(
    subscribeToReminders,
    getRemindersSnapshot,
    getServerSnapshot,
  );
  const reminders: StoredReminder[] = JSON.parse(rawReminders);
  const [editingReminder, setEditingReminder] = useState<StoredReminder | null>(null);
  const [scheduleToast, setScheduleToast] = useState<string | null>(null);
  const [scheduleToastKind, setScheduleToastKind] = useState<"ok" | "error">("ok");

  /** Simpan perubahan jadwal dan tampilkan hasil yang sebenarnya (berhasil atau dibatalkan). */
  async function commitSchedule(updated: StoredReminder[], okText: string | null) {
    const res = await commitStoredReminders(profile?.id ?? null, reminders, updated);
    if (res.ok && !okText) return;
    setScheduleToastKind(res.ok ? "ok" : "error");
    setScheduleToast(res.ok ? okText : `Jadwal belum tersimpan, jadi tidak diubah. ${res.message}`);
    setTimeout(() => setScheduleToast(null), res.ok ? 3000 : 6000);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      if (isDemo) {
        localStorage.setItem("eldervital_demo_name", name);
        if (age) localStorage.setItem("eldervital_demo_age", age);
        else localStorage.removeItem("eldervital_demo_age");
        window.dispatchEvent(new Event("eldervital:profile-updated"));
        setSaved(true);
      } else if (profile) {
        setProfile(
          await updateElderProfile(profile, {
            displayName: name,
            ageRange: age || null,
          }),
        );
        setSaved(true);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function toggleReminder(id: string) {
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r,
    );
    // Berhasil: sakelar sudah berubah, tidak perlu pesan. Gagal: sakelar kembali dan pesan tampil.
    commitSchedule(updated, null);
  }

  function handleSaveReminderTime(newTime: string) {
    if (!editingReminder) return;

    const updated = reminders.map((r) =>
      r.id === editingReminder.id ? { ...r, time: newTime, enabled: true } : r,
    );
    const label = editingReminder.label;
    setEditingReminder(null);
    commitSchedule(updated, `Jadwal ${label} diubah ke ${newTime}`);
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      if (profile) {
        await deleteElderProfile(profile);
      } else {
        localStorage.removeItem("eldervital_demo_name");
        localStorage.removeItem("eldervital_demo_age");
        localStorage.removeItem("eldervital_reminder_schedules");
      }
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 max-w-md mx-auto pb-12">
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold text-ink">Pengaturan</h1>
        {isDemo && (
          <span className="inline-block px-3 py-1 rounded-full bg-warn-bg text-warn-ink text-xs font-bold">
            Simulasi: Perubahan tersimpan pada perangkat ini
          </span>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-alert-bg text-alert-ink px-4 py-3 text-base font-bold"
        >
          {error}
        </p>
      )}

      {/* 1. Pengaturan Jadwal Pengingat */}
      <section
        className="space-y-3 pt-2"
        aria-labelledby="jadwal-saya"
        id="jadwal"
      >
        <div className="flex items-center justify-between">
          <h2
            id="jadwal-saya"
            className="font-serif text-xl font-bold text-ink"
          >
            Jadwal Pengingat
          </h2>
          <span className="text-xs text-ink-soft">Sentuh jam untuk ubah</span>
        </div>
        <p className="text-sm text-ink-soft leading-relaxed">
          Atur jam pengingat harian atau matikan bila tidak ingin diingatkan.
        </p>

        {scheduleToast && (
          <div
            role="status"
            aria-live="polite"
            className={`px-4 py-2.5 text-sm font-bold flex items-center gap-2 rounded-xl border animate-in fade-in duration-200 ${
              scheduleToastKind === "ok"
                ? "bg-ok-bg text-ok-ink border-ok-mark/30"
                : "bg-alert-bg text-alert-ink border-alert-mark/30"
            }`}
          >
            {scheduleToastKind === "ok" && <CheckIcon size={16} className="text-ok-mark shrink-0" />}
            <span>{scheduleToast}</span>
          </div>
        )}

        <div className="rounded-2xl border border-line/60 bg-surface divide-y divide-line/40 overflow-hidden shadow-xs">
          {reminders.map((item) => {
            const theme = getPeriodTheme(item.id, item.label);
            const PeriodIcon = theme.Icon;
            return (
              <div
                key={item.id}
                className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-paper/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${theme.iconBg}`}
                    aria-hidden="true"
                  >
                    <PeriodIcon size={20} />
                  </span>
                  <div>
                    <span className="font-bold text-ink text-base block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-xs text-ink-soft block mt-0.5">
                      {item.enabled ? "Pengingat aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tombol Ubah Jam */}
                  <button
                    type="button"
                    onClick={() => setEditingReminder(item)}
                    aria-label={`Ubah jam pengingat ${item.label}, saat ini ${item.time}`}
                    className="px-3 py-1.5 min-h-[38px] rounded-full border border-primary/25 bg-paper hover:bg-primary hover:text-white text-primary text-sm font-bold transition-all shadow-xs"
                  >
                    {item.time}
                  </button>

                  {/* Toggle Sakelar On/Off */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.enabled}
                    aria-label={`Aktifkan pengingat ${item.label}`}
                    onClick={() => toggleReminder(item.id)}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                      item.enabled ? "bg-primary" : "bg-line/80"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-1 left-1 ${
                        item.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Profil Saya */}
      <form onSubmit={saveProfile} className="space-y-4 pt-4 border-t border-line/40" aria-labelledby="profil-saya">
        <h2 id="profil-saya" className="font-serif text-xl font-bold text-ink">
          Profil saya
        </h2>
        <div className="space-y-2">
          <label htmlFor="nama" className="block text-base font-bold text-ink">
            Nama panggilan
          </label>
          <input
            id="nama"
            className={FIELD}
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-base font-bold text-ink">
              Rentang usia{" "}
              <span className="text-xs sm:text-sm font-normal text-ink-soft">
                (boleh dilewati)
              </span>
            </label>
            {age && (
              <button
                type="button"
                onClick={() => setAge("")}
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
              >
                ✕ Batal pilih
              </button>
            )}
          </div>
          <div
            className="grid grid-cols-2 gap-2.5"
            role="radiogroup"
            aria-label="Pilih rentang usia"
          >
            {[
              {
                value: "50-54" as AgeRange,
                range: "50 – 54",
                unit: "tahun",
                fullLabel: "50 sampai 54 tahun",
              },
              {
                value: "55-59" as AgeRange,
                range: "55 – 59",
                unit: "tahun",
                fullLabel: "55 sampai 59 tahun",
              },
              {
                value: "60-65" as AgeRange,
                range: "60 – 65",
                unit: "tahun",
                fullLabel: "60 sampai 65 tahun",
              },
              {
                value: "lebih-65" as AgeRange,
                range: "> 65",
                unit: "tahun",
                fullLabel: "Lebih dari 65 tahun",
              },
            ].map((item) => {
              const isSelected = age === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={item.fullLabel}
                  onClick={() => setAge(isSelected ? "" : item.value)}
                  className={`relative border-2 h-[68px] rounded-2xl transition-colors flex flex-col items-center justify-center cursor-pointer select-none focus-visible:outline-none ${
                    isSelected
                      ? "bg-primary border-primary text-white shadow-xs"
                      : "bg-surface border-line/80 text-ink hover:bg-paper hover:border-line active:bg-paper/80"
                  }`}
                >
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
        </div>
        {saved && (
          <p role="status" className="text-base font-bold text-ok-ink">
            Profil tersimpan.
          </p>
        )}
        <button
          type="submit"
          disabled={busy || name.trim() === ""}
          className={PRIMARY}
        >
          {busy ? "Menyimpan..." : "Simpan profil"}
        </button>
      </form>

      {/* 3. Caregiver */}
      <section className="space-y-3 pt-4 border-t border-line/40" aria-labelledby="caregiver-saya">
        <h2 id="caregiver-saya" className="font-serif text-xl font-bold text-ink">
          Caregiver
        </h2>
        <Link href="/lansia/hubungkan" className={SECONDARY}>
          Hubungkan atau atur caregiver
        </Link>
      </section>

      {/* 4. Keluar dari profil */}
      <section className="space-y-3 pt-4 border-t border-line/40" aria-labelledby="keluar">
        <h2 id="keluar" className="font-serif text-xl font-bold text-ink">
          Keluar dari profil
        </h2>
        {confirmDelete ? (
          <div
            className="space-y-4 rounded-2xl border-2 border-alert-mark bg-alert-bg/40 p-5"
            role="group"
            aria-labelledby="yakin"
          >
            <p id="yakin" className="text-base font-bold text-alert-ink leading-relaxed">
              Semua riwayat pemeriksaan, jadwal, dan hubungan dengan caregiver akan terhapus dan tidak bisa
              dikembalikan. Lanjutkan?
            </p>
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={remove}
                className={DANGER}
              >
                {busy ? "Menghapus..." : "Ya, hapus profil saya"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(false)}
                className={SECONDARY}
              >
                Batal, tetap gunakan profil
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-base text-ink-soft leading-relaxed">
              Profil ini tidak memakai akun. Keluar berarti menghapus profil dari perangkat ini beserta seluruh datanya.
            </p>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={OUTLINE_DANGER}
            >
              Keluar dan hapus profil
            </button>
          </>
        )}
      </section>

      {/* Modal TimePicker Pengaturan Jadwal */}
      {editingReminder && (
        <TimePicker
          isOpen={Boolean(editingReminder)}
          onClose={() => setEditingReminder(null)}
          onSave={handleSaveReminderTime}
          initialTime={editingReminder.time}
          title={`Ubah Pengingat ${editingReminder.label}`}
          subtitle={`Atur jam pengingat harian untuk ${editingReminder.label.toLowerCase()}`}
          presets={
            PRESETS_BY_ID[editingReminder.id.toLowerCase()] ??
            PRESETS_BY_ID.pagi
          }
        />
      )}
    </div>
  );
}
