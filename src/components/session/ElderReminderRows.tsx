"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useElderSession } from "./ElderSession";
import {
  ensureDefaultReminders,
  formatTime,
  commitStoredReminders,
  getStoredReminders,
  saveStoredReminders,
  type StoredReminder,
} from "@/lib/reminders";
import { TimePicker } from "@/components/ui/time-picker";
import {
  SunIcon,
  SunsetIcon,
  MoonIcon,
  ClockIcon,
  CheckIcon,
} from "@/components/shared/Icons";

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
      badgeBg: "bg-amber-100/80 border-amber-200/80 text-amber-800",
      iconBg: "bg-amber-500/15 text-amber-800",
      label: "Pagi",
    };
  }
  if (key.includes("siang")) {
    return {
      Icon: SunsetIcon,
      badgeBg: "bg-orange-100/80 border-orange-200/80 text-orange-800",
      iconBg: "bg-orange-500/15 text-orange-800",
      label: "Siang",
    };
  }
  if (key.includes("malam")) {
    return {
      Icon: MoonIcon,
      badgeBg: "bg-indigo-100/80 border-indigo-200/80 text-primary-strong",
      iconBg: "bg-primary/10 text-primary",
      label: "Malam",
    };
  }
  return {
    Icon: ClockIcon,
    badgeBg: "bg-paper border-line text-ink",
    iconBg: "bg-paper text-ink-soft",
    label: "Jadwal",
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
 * Baris jadwal pengingat di beranda lansia:
 * Interaktif dan dapat langsung diatur dengan menyentuh baris atau tombol ubah.
 */
export default function ElderReminderRows() {
  const { profile } = useElderSession();
  const rawReminders = useSyncExternalStore(
    subscribeToReminders,
    getRemindersSnapshot,
    getServerSnapshot,
  );
  const reminders: StoredReminder[] = JSON.parse(rawReminders);

  const [editingReminder, setEditingReminder] = useState<StoredReminder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKind, setToastKind] = useState<"ok" | "error">("ok");

  // Jika tersambung dengan database, sinkronkan jadwal dari database saat pertama dibuka
  useEffect(() => {
    if (!profile) return;
    let alive = true;
    ensureDefaultReminders(profile.id)
      .then((list) => {
        if (!alive) return;
        const mapped: StoredReminder[] = list.map((r) => ({
          id: r.id,
          label: r.label,
          time: formatTime(r.time),
          enabled: r.enabled,
        }));
        saveStoredReminders(mapped);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [profile]);

  async function handleSaveTime(newTime: string) {
    if (!editingReminder) return;

    const updated = reminders.map((r) =>
      r.id === editingReminder.id ? { ...r, time: newTime, enabled: true } : r,
    );
    const label = editingReminder.label;
    setEditingReminder(null);

    // Tersambung: tunggu database. Bila gagal, perubahan dibatalkan dan pesannya ditampilkan.
    const res = await commitStoredReminders(profile?.id ?? null, reminders, updated);
    setToastKind(res.ok ? "ok" : "error");
    setToastMessage(
      res.ok
        ? `Jadwal pengingat ${label} diubah ke ${newTime}`
        : `Jadwal ${label} belum tersimpan, jadi tidak diubah. ${res.message}`,
    );
    setTimeout(() => {
      setToastMessage(null);
    }, res.ok ? 3500 : 6000);
  }

  const shown = reminders.filter((r) => r.enabled);

  return (
    <>
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`${
            toastKind === "ok"
              ? "px-5 py-2.5 bg-ok-bg text-ok-ink text-sm font-bold flex items-center gap-2 border-b border-ok-mark/30"
              : "px-5 py-2.5 bg-alert-bg text-alert-ink text-sm font-bold flex items-center gap-2 border-b border-alert-mark/30"
          } animate-in fade-in duration-200`}
        >
          {toastKind === "ok" && <CheckIcon size={16} className="text-ok-mark shrink-0" />}
          <span>{toastMessage}</span>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="px-5 py-4 text-base text-ink-soft">
          Semua pengingat sedang dinonaktifkan.
        </p>
      ) : (
        shown.map((r) => {
          const theme = getPeriodTheme(r.id, r.label);
          const PeriodIcon = theme.Icon;

          return (
            <div
              key={r.id}
              className="px-5 py-3.5 flex justify-between items-center gap-3 hover:bg-paper/40 transition-colors"
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
                    {r.label}
                  </span>
                  <span className="text-xs text-ink-soft block mt-0.5">
                    Pengingat rutin
                  </span>
                </div>
              </div>

              {/* Tombol Interaktif untuk Mengatur Jam */}
              <button
                type="button"
                onClick={() => setEditingReminder(r)}
                aria-label={`Ubah jam pengingat ${r.label}, saat ini pukul ${r.time}`}
                className="group px-3.5 py-1.5 min-h-[44px] rounded-full border border-primary/25 bg-paper hover:bg-primary hover:text-white active:bg-primary-strong text-primary transition-all flex items-center gap-2 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
              >
                <span className="text-sm font-bold text-ink group-hover:text-white transition-colors">
                  Pukul {r.time}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary group-hover:bg-white/20 group-hover:text-white transition-colors">
                  Ubah
                </span>
              </button>
            </div>
          );
        })
      )}

      {/* Modal TimePicker Saat Tombol Ubah Ditekan */}
      {editingReminder && (
        <TimePicker
          isOpen={Boolean(editingReminder)}
          onClose={() => setEditingReminder(null)}
          onSave={handleSaveTime}
          initialTime={editingReminder.time}
          title={`Ubah Pengingat ${editingReminder.label}`}
          subtitle={`Pilih waktu atau gunakan pilihan cepat di bawah`}
          presets={
            PRESETS_BY_ID[editingReminder.id.toLowerCase()] ??
            PRESETS_BY_ID.pagi
          }
        />
      )}
    </>
  );
}
