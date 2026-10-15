"use client";

import { useEffect, useState } from "react";
import { useElderSession } from "./ElderSession";
import { DEFAULT_REMINDERS } from "@/lib/schedule";
import { ensureDefaultReminders, formatTime } from "@/lib/reminders";

interface Row {
  id: string;
  label: string;
  time: string;
}

/**
 * Baris jadwal pengingat di beranda lansia: dari reminder_schedules bila tersambung (jadwal
 * bawaan dibuat sekali bila belum ada), atau jadwal bawaan selama simulasi.
 */
export default function ElderReminderRows() {
  const { profile } = useElderSession();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    ensureDefaultReminders(profile.id)
      .then((list) => {
        if (!alive) return;
        setRows(list.filter((r) => r.enabled).map((r) => ({ id: r.id, label: r.label, time: formatTime(r.time) })));
      })
      .catch(() => alive && setRows(null)); // offline: tampilkan jadwal bawaan
    return () => {
      alive = false;
    };
  }, [profile]);

  const shown: readonly Row[] = rows ?? DEFAULT_REMINDERS;
  if (shown.length === 0) {
    return <p className="px-5 py-3.5 text-base text-ink-soft">Semua pengingat sedang dimatikan.</p>;
  }
  return (
    <>
      {shown.map((r) => (
        <div key={r.id} className="px-5 py-3.5 flex justify-between items-center">
          <span className="font-bold text-ink text-base">{r.label}</span>
          <span className="font-mono text-sm text-ink-soft">Pukul {r.time}</span>
        </div>
      ))}
    </>
  );
}
